import httpx
from datetime import datetime
from fastapi import APIRouter, Header, HTTPException, Depends
from sqlmodel import Session, select
from app.db.database import get_session
from app.models.models import Team, TokenUsage, ModelCatalog, PolicyViolation, User, TeamMember, SystemSettings
from app.services.redactor import Redactor

router = APIRouter(prefix="/proxy", tags=["AI Proxy"])

# --- PROVIDER ADAPTER CONFIGURATION ---
PROVIDER_CONFIGS = {
    "openai": {
        "url": lambda model, key: "https://api.openai.com/v1/chat/completions",
        "headers": lambda key: {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        "transform_payload": lambda p: p,
        "extract_usage": lambda data: (
            data.get("usage", {}).get("prompt_tokens", 0),
            data.get("usage", {}).get("completion_tokens", 0),
            data.get("usage", {}).get("total_tokens", 0)
        )
    },
    "gemini": {
        "url": lambda model, key: f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}",
        "headers": lambda key: {"Content-Type": "application/json"},
        "transform_payload": lambda p: {
            "contents": [{"parts": [{"text": m["content"]}] for m in p.get("messages", [])}]
        },
        "extract_usage": lambda data: (
            data.get("usageMetadata", {}).get("promptTokenCount", 0),
            data.get("usageMetadata", {}).get("candidatesTokenCount", 0),
            data.get("usageMetadata", {}).get("totalTokenCount", 0)
        )
    }
}

@router.post("/chat")
async def ai_proxy(
    payload: dict,
    x_team_key: str = Header(...),
    x_user_email: str = Header(...),
    db: Session = Depends(get_session)
):
    # 1. IAM & GOVERNANCE
    team = db.exec(select(Team).where(Team.ingestion_key == x_team_key)).first()
    if not team: raise HTTPException(status_code=401, detail="Invalid Team Key")

    user = db.exec(select(User).where(User.email == x_user_email.lower().strip())).first()
    if not user: raise HTTPException(status_code=403, detail="User Identity Unknown")

    membership = db.exec(select(TeamMember).where(TeamMember.user_id == user.id, TeamMember.team_id == team.id)).first()
    if not membership: raise HTTPException(status_code=403, detail="Not a team member")

    # 2. DYNAMIC MODEL RESOLUTION (The "Bypass" Logic)
    # Check if user provided a model, otherwise fallback to Admin's assigned_model
    resolved_model = payload.get("model") or team.assigned_model
    
    if not resolved_model:
        raise HTTPException(
            status_code=400, 
            detail="No model specified in request and no default model assigned to team."
        )

    # Look up the resolved model in our Unified Catalog
    catalog_entry = db.exec(select(ModelCatalog).where(
        ModelCatalog.model_id == resolved_model, 
        ModelCatalog.is_active == True
    )).first()

    if not catalog_entry:
        raise HTTPException(
            status_code=404, 
            detail=f"Model '{resolved_model}' is not registered or active in the catalog."
        )

    # 3. PROVIDER MAPPING
    provider_map = {
        "google": "gemini",
        "gemini": "gemini",
        "openai": "openai"
    }
    
    raw_provider = catalog_entry.provider.lower().strip()
    adapter_key = provider_map.get(raw_provider, raw_provider)
    adapter = PROVIDER_CONFIGS.get(adapter_key)

    if not adapter: 
        raise HTTPException(status_code=400, detail=f"Provider '{raw_provider}' is not supported.")

    # 4. BUDGET & FX CHECK
    settings = db.exec(select(SystemSettings)).first()
    fx_rate = settings.usd_to_inr if settings else 83.50

    if (team.current_spend_usd or 0) >= (team.token_budget_usd or 0):
        raise HTTPException(status_code=402, detail="Budget Exhausted")

    # 5. PII SCANNING & REDACTION
    if "messages" in payload:
        for msg in payload["messages"]:
            violations = Redactor.scan_for_violations(msg["content"])
            if violations:
                for v in violations:
                    db.add(PolicyViolation(team_id=team.id, user_id=user.id, violation_type=v, original_snippet="[REDACTED]"))
                db.commit()
            msg["content"] = Redactor.redact(msg["content"])

    # 6. EXECUTION USING DEDICATED KEY FROM CATALOG
    # We use resolved_model here to ensure the correct URL is built
    target_url = adapter["url"](resolved_model, catalog_entry.api_key)
    headers = adapter["headers"](catalog_entry.api_key)
    
    # Prepare the actual payload for the AI provider
    # We inject the model ID back into the payload in case the provider requires it
    api_payload = adapter["transform_payload"](payload)
    if "model" in api_payload or adapter_key == "openai":
        api_payload["model"] = resolved_model

    async with httpx.AsyncClient() as client:
        response = await client.post(target_url, headers=headers, json=api_payload, timeout=60.0)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        ai_data = response.json()

    # 7. AUDIT LOGGING WITH MANUAL PRICING
    try:
        p_tokens, c_tokens, t_tokens = adapter["extract_usage"](ai_data)
        
        cost_usd = ((p_tokens / 1_000_000) * catalog_entry.input_price_per_1m) + \
                   ((c_tokens / 1_000_000) * catalog_entry.output_price_per_1m)
        
        cost_inr = cost_usd * fx_rate
        team.current_spend_usd = (team.current_spend_usd or 0) + cost_usd
        
        usage = TokenUsage(
            team_id=team.id, 
            enterprise_id=team.enterprise_id, 
            user_id=user.id,
            model_id=resolved_model, # Log the model we actually used
            prompt_tokens=p_tokens, 
            completion_tokens=c_tokens,
            total_tokens=t_tokens, 
            cost_usd=cost_usd, 
            cost_inr=cost_inr
        )
        db.add(team); db.add(usage); db.commit()
        print(f"💰 {user.full_name}: ₹{cost_inr:.2f} (USD ${cost_usd:.5f}) | {resolved_model}")
        
    except Exception as e:
        print(f"❌ AUDIT ERROR: {e}"); db.rollback()

    return ai_data