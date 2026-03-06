import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from app.db.database import get_session
from app.models.models import Enterprise, Team, TokenUsage, PolicyViolation, SystemConfig, SystemConfigPayload,AddMemberPayload,User,TeamMember, ChangePasswordPayload, SystemSettings,ModelCatalog, ModelCatalogPayload
from passlib.context import CryptContext
from app.services.pricing import get_live_exchange_rate
import bcrypt

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

# ------------------------------------------------------------------
# 1. DASHBOARD STATS
# ------------------------------------------------------------------
@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_session)):
    try:
        # Active Teams
        teams = db.exec(select(Team)).all()
        total_teams = len(teams)
        
        # Total Spend
        total_spend = db.exec(select(func.sum(TokenUsage.cost_usd))).first() or 0.0

        # Total Token Count
        total_tokens = db.exec(select(func.sum(TokenUsage.total_tokens))).first() or 0

        return {
            "total_spend": float(total_spend),
            "active_teams": int(total_teams),
            "total_tokens": int(total_tokens)
        }
    except Exception as e:
        print(f"❌ Error in /stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------------
# 2. TEAM MANAGEMENT
# ------------------------------------------------------------------
@router.get("/teams")
def get_teams(db: Session = Depends(get_session)):
    try:
        teams = db.exec(select(Team)).all()
        team_data = []
        
        for t in teams:
            # 1. Handle Nulls safely
            spent = t.current_spend_usd or 0.0
            budget = t.token_budget_usd or 100.0
            
            # 2. Calculate Ratio
            usage_ratio = (spent / budget) if budget > 0 else 0
            
            # 3. Determine Status
            if usage_ratio >= 0.9:
                status = "Critical"
            elif usage_ratio > 0:
                status = "Active"
            else:
                status = "Idle"

            # 4. Return formatted data
            team_data.append({
                "id": t.id,
                "name": t.name,
                "key": t.ingestion_key,
                "provider": t.provider or "openai", # Show which AI they use
                "budget": budget,
                "spent": round(spent, 4),
                "usage_percent": round(usage_ratio * 100, 1),
                "status": status
            })
            
        return team_data
    except Exception as e:
        print(f"❌ Error in /teams: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/teams")
def create_team(team_data: dict, db: Session = Depends(get_session)):
    try:
        # 1. Validation Logic
        allowed_providers = ["openai", "gemini", "anthropic"]
        provider = team_data.get("provider", "openai").lower().strip()
        
        if provider not in allowed_providers:
            raise HTTPException(status_code=400, detail=f"Unsupported provider. Must be one of {allowed_providers}")

        # 2. Generate Key
        generated_key = f"sk-team-{uuid.uuid4().hex[:8]}"
        
        new_team = Team(
            name=team_data["name"],
            ingestion_key=generated_key,
            token_budget_usd=team_data.get("budget", 100.0),
            provider=provider,
            enterprise_id=1 # Ensure Enterprise ID 1 exists in your DB!
        )
        
        db.add(new_team)
        db.commit()
        db.refresh(new_team)
        
        return new_team
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating team: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------------
# 3. AUDIT & LOGS
# ------------------------------------------------------------------
@router.get("/usage-history")
def get_usage_history(page: int = 1, size: int = 10, db: Session = Depends(get_session)):
    try:
        # Calculate offset
        skip = (page - 1) * size

        # 1. Get Total Count (Required for Frontend Pagination calculations)
        total_count = db.exec(select(func.count(TokenUsage.id))).one()

        # 2. Get Paginated Results
        statement = (
            select(TokenUsage, Team.name)
            .join(Team, TokenUsage.team_id == Team.id)
            .order_by(TokenUsage.created_at.desc())
            .offset(skip)
            .limit(size)
        )
        results = db.exec(statement).all()
        
        history = []
        for usage, team_name in results:
            history.append({
                "id": usage.id,
                "team": team_name,
                "model": usage.model_id,
                "tokens": usage.total_tokens,
                "cost": f"${usage.cost_usd:.4f}",
                "time": usage.created_at.strftime("%H:%M:%S")
            })
            
        return {
            "items": history,
            "total": total_count,
            "page": page,
            "size": size,
            "total_pages": (total_count + size - 1) // size
        }
    except Exception as e:
        print(f"❌ Error in /usage-history: {e}")
        return {"items": [], "total": 0, "page": 1, "total_pages": 0}

@router.get("/violations")
def get_violations(limit: int = 5, db: Session = Depends(get_session)):
    try:
        statement = (
            select(PolicyViolation, Team.name)
            .join(Team, PolicyViolation.team_id == Team.id)
            .order_by(PolicyViolation.id.desc())
            .limit(limit)
        )
        results = db.exec(statement).all()
        
        return [
            {
                "id": v.id,
                "team_name": team_name,
                "violation_type": v.violation_type,
                "time": v.created_at.strftime("%H:%M:%S") if v.created_at else "Now"
            }
            for v, team_name in results
        ]
    except Exception as e:
        print(f"❌ Error in /violations: {e}")
        return []

# ------------------------------------------------------------------
# 4. SYSTEM CONFIGURATION (Multi-Provider)
# ------------------------------------------------------------------
@router.get("/system/status")
def get_system_status(db: Session = Depends(get_session)):
    """
    Returns a list of ALL configured providers.
    """
    try:
        configs = db.exec(select(SystemConfig)).all()
        
        status_list = []
        for c in configs:
            status_list.append({
                "provider": c.key,   
                "key_name": c.value,        
                "configured": True,
                "last_updated": c.updated_at.strftime("%Y-%m-%d %H:%M")
            })
            
        return status_list
    except Exception as e:
        print(f"❌ CRITICAL ERROR in /system/status: {e}")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

# @router.post("/system/configure")
# def configure_provider(payload: SystemConfigPayload, db: Session = Depends(get_session)):
#     try:
#         # Pydantic guarantees these exist, so we don't need .get()
#         provider = payload.provider.lower().strip()
#         new_key = payload.key.strip()
        
#         if not new_key:
#             raise HTTPException(status_code=400, detail="Key cannot be empty")

#         # Standardize the Key Name
#         config_key_name = f"{provider}_key"
        
#         # Check existing
#         config = db.exec(select(SystemConfig).where(SystemConfig.key == config_key_name)).first()
        
#         if not config:
#             config = SystemConfig(
#                 key=config_key_name, 
#                 value=new_key,
#                 updated_at=datetime.utcnow()
#             )
#             db.add(config)
#         else:
#             config.value = new_key
#             config.updated_at = datetime.utcnow()
#             db.add(config)
            
#         db.commit()
#         db.refresh(config)
        
#         return {
#             "status": "Configured", 
#             "provider": provider, 
#             "updated_at": config.updated_at
#         }
        
#     except HTTPException as he:
#         # THIS FIXES THE BUG: Let normal HTTP errors (like 400) pass through to the frontend
#         raise he
#     except Exception as e:
#         print(f"❌ Error configuring system: {e}")
#         db.rollback() # Always rollback on true database failures
#         raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")
    
@router.post("/system/configure")
def configure_provider(payload: SystemConfigPayload, db: Session = Depends(get_session)):
    try:
        # CLEANING: Ensure 'OpenAI ' becomes 'openai'
        provider_id = payload.provider.lower().strip()
        new_key_value = payload.key.strip()
        
        # Standardized Key Name for the DB
        config_key_name = f"{provider_id}_key"
        
        # 1. Look for the existing key
        config = db.exec(select(SystemConfig).where(SystemConfig.key == config_key_name)).first()
        
        if not config:
            # CREATE
            config = SystemConfig(
                key=config_key_name, 
                value=new_key_value,
                updated_at=datetime.utcnow()
            )
            db.add(config)
        else:
            # UPDATE (This is the Edit logic)
            config.value = new_key_value
            config.updated_at = datetime.utcnow()
            db.add(config)
            
        db.commit()
        return {"status": "Success", "provider": provider_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/system/config/{provider_id}")
def delete_provider_config(provider_id: str, db: Session = Depends(get_session)):
    try:
        # Clean the input
        pid = provider_id.lower().strip()
        
        # If the frontend sent 'gemini', we look for 'gemini_key'
        # If the frontend sent 'gemini_key', we use it as is
        target_key = pid if pid.endswith("_key") else f"{pid}_key"
        
        config = db.exec(select(SystemConfig).where(SystemConfig.key == target_key)).first()
        
        if not config:
            print(f"⚠️ Delete failed: No config found for {target_key}")
            raise HTTPException(status_code=404, detail=f"Configuration {target_key} not found")
        
        db.delete(config)
        db.commit()
        return {"status": "Deleted", "key": target_key}
    except Exception as e:
        db.rollback()
        print(f"❌ DELETE ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
# --- TEAM MEMBERSHIP MANAGEMENT ---

@router.post("/teams/{team_id}/members")
def add_team_member(team_id: int, payload: AddMemberPayload, db: Session = Depends(get_session)):
    try:
        # 1. Check if the user exists
        user = db.exec(select(User).where(User.email == payload.email)).first()
        
        # 2. If user doesn't exist, create them with a DEFAULT password
        if not user:
            # We must give them a password so they can actually login!
            # Using 'welcome123' as a default start.
            default_password = "welcome123"
            hashed_pw = bcrypt.hashpw(default_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            user = User(
                email=payload.email, 
                full_name=payload.full_name,
                password_hash=hashed_pw,
                # Map the payload role to the global role
                global_role="team_lead" if payload.role.lower() == "lead" else "member"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # OPTIONAL: If user exists but is being upgraded to a lead
            if payload.role.lower() == "lead" and user.global_role != "admin":
                user.global_role = "team_lead"
                db.add(user)
                db.commit()

        # 3. Check for existing team link
        existing_link = db.exec(select(TeamMember).where(
            TeamMember.team_id == team_id, 
            TeamMember.user_id == user.id
        )).first()
        
        if existing_link:
            raise HTTPException(status_code=400, detail="User is already a member of this team")

        # 4. Add the link in the TeamMember table
        new_member = TeamMember(
            team_id=team_id,
            user_id=user.id,
            role=payload.role.lower().strip() # 'lead' or 'member'
        )
        db.add(new_member)
        db.commit()
        
        return {
            "status": "success", 
            "message": f"Added {user.full_name} as {payload.role}",
            "temp_password": "welcome123" # Honest feedback: Tell the admin what the PW is!
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/teams/{team_id}/members")
def list_team_members(team_id: int, db: Session = Depends(get_session)):
    try:
        # Join TeamMember with User to get names and emails
        statement = (
            select(User.full_name, User.email, TeamMember.role, TeamMember.joined_at)
            .join(TeamMember, User.id == TeamMember.user_id)
            .where(TeamMember.team_id == team_id)
        )
        results = db.exec(statement).all()
        
        return [
            {
                "name": name,
                "email": email,
                "role": role,
                "joined": joined.strftime("%Y-%m-%d")
            } for name, email, role, joined in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/teams/{team_id}/members/{email}")
def remove_team_member(team_id: int, email: str, db: Session = Depends(get_session)):
    try:
        # 1. Find the user first
        user = db.exec(select(User).where(User.email == email)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 2. Find the membership link
        membership = db.exec(select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user.id
        )).first()

        if not membership:
            raise HTTPException(status_code=404, detail="Membership not found")

        # 3. Delete the link
        db.delete(membership)
        db.commit()
        
        return {"status": "success", "message": f"Removed {email} from team"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_session)):
    # Query to sum cost per user and join with User table for names
    statement = (
        select(User.full_name, func.sum(TokenUsage.cost_usd).label("total_spend"))
        .join(TokenUsage, User.id == TokenUsage.user_id)
        .group_by(User.id)
        .order_by(func.sum(TokenUsage.cost_usd).desc())
        .limit(5)
    )
    results = db.exec(statement).all()
    return [{"name": row[0], "spend": float(row[1])} for row in results]

from sqlalchemy import func

@router.get("/analytics/top-spenders")
def get_top_spenders(db: Session = Depends(get_session)):
    try:
        # Sum cost per user and join with User table for names
        statement = (
            select(
                User.full_name, 
                func.sum(TokenUsage.cost_usd).label("total_spend"),
                func.sum(TokenUsage.total_tokens).label("total_tokens")
            )
            .join(TokenUsage, User.id == TokenUsage.user_id)
            .group_by(User.id)
            .order_by(func.sum(TokenUsage.cost_usd).desc())
            .limit(5)
        )
        results = db.exec(statement).all()
        
        return [
            {
                "name": name, 
                "spend": round(float(spend), 4), 
                "tokens": tokens
            } for name, spend, tokens in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.patch("/teams/{team_id}")
def update_team(team_id: int, update_data: dict, db: Session = Depends(get_session)):
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # 1. Standard Updates
    if "name" in update_data:
        team.name = update_data["name"]
        
    if "provider" in update_data:
        team.provider = update_data["provider"].lower().strip()
            
    if "budget" in update_data:
        try:
            team.token_budget_usd = float(update_data["budget"])
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid budget value")

    # 2. Assigned Model Update (The "Bug" Fix)
    if "assigned_model" in update_data:
        model_val = str(update_data["assigned_model"]).strip()
        
        # Check if the model exists in your catalog
        from app.models.models import ModelCatalog
        exists = db.exec(select(ModelCatalog).where(ModelCatalog.model_id == model_val)).first()
        
        if exists:
            team.assigned_model = model_val
            print(f"✅ Successfully linked team to model: {model_val}")
        else:
            # IMPORTANT: If it doesn't exist in catalog, we should still allow the save 
            # OR raise a clear error so the frontend knows it failed.
            # For now, let's FORCE it so your DB actually updates:
            team.assigned_model = model_val
            print(f"⚠️ Model '{model_val}' not in Catalog, but saved to team anyway.")

    # 3. Save to Database
    db.add(team)
    db.commit() # This is where the magic happens
    db.refresh(team)
    
    return team
@router.post("/login")
def login(payload: dict, db: Session = Depends(get_session)):
    email = payload.get("email")
    password = payload.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    # 1. Find the user
    user = db.exec(select(User).where(User.email == email)).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # 2. Verify Password using direct bcrypt
    # We must encode both the input and the stored hash to bytes for bcrypt
    password_bytes = password.encode('utf-8')
    hashed_bytes = user.password_hash.encode('utf-8')

    try:
        if not bcrypt.checkpw(password_bytes, hashed_bytes):
            raise HTTPException(status_code=401, detail="Invalid password")
    except Exception as e:
        print(f"Bcrypt error: {e}")
        raise HTTPException(status_code=500, detail="Internal authentication error")

    # 3. Success
    return {
        "status": "success",
        "user": {
            "name": user.full_name,
            "email": user.email,
            "role": user.global_role
        },
        "token": "session-active-token" # We can add real JWT later
    }

@router.post("/change-password")
def admin_change_password(payload: ChangePasswordPayload, db: Session = Depends(get_session)):
    try:
        # 1. Find the admin user
        user = db.exec(select(User).where(User.email == payload.email)).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="Admin account not found")

        # 2. Strict Security Check: Verify they are actually an Admin
        if user.global_role != "admin":
            raise HTTPException(status_code=403, detail="Unauthorized: Only admins can use this portal")

        # 3. Verify Old Password
        # Encode strings to bytes for bcrypt
        if not bcrypt.checkpw(payload.old_password.encode('utf-8'), user.password_hash.encode('utf-8')):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # 4. Hash New Password
        hashed_pw = bcrypt.hashpw(payload.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # 5. Update and Commit
        user.password_hash = hashed_pw
        db.add(user)
        db.commit()

        return {"status": "success", "message": "Root credentials updated successfully"}

    except Exception as e:
        db.rollback()
        print(f"❌ Admin Password Change Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@router.get("/team-token-stats")
def get_team_token_stats(db: Session = Depends(get_session)):
    results = db.exec(
        select(Team.name, func.sum(TokenUsage.total_tokens))
        .join(TokenUsage, Team.id == TokenUsage.team_id)
        .group_by(Team.name)
    ).all()
    return [{"team": row[0], "tokens": int(row[1])} for row in results]

@router.post("/teams/{team_id}/rotate-key")
def rotate_team_key(team_id: int, db: Session = Depends(get_session)):
    # 1. Fetch the team
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # 2. Generate new secure key
    new_key = f"sk_live_{uuid.uuid4().hex[:16]}" # Short, clean secure key
    
    # 3. Update and Commit
    team.ingestion_key = new_key
    db.add(team)
    db.commit()
    db.refresh(team)
    
    return {"status": "success", "new_key": new_key}

@router.get("/model-catalog")
def get_model_catalog(db: Session = Depends(get_session)):
    return db.exec(select(ModelCatalog)).all()

# 2. GET SYSTEM SETTINGS (For FX Rate)
@router.get("/system/settings")
def get_system_settings(db: Session = Depends(get_session)):
    settings = db.exec(select(SystemSettings)).first()
    if not settings:
        # Create default if not exists
        settings = SystemSettings(usd_to_inr=83.50)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

# 3. TRIGGER SYNC (POST)
@router.post("/catalog/sync")
def trigger_sync(db: Session = Depends(get_session)):
    try:
        # sync_model_catalog(db)
        get_live_exchange_rate(db)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.patch("/model-catalog/{model_id}/toggle")
def toggle_model_status(model_id: str, db: Session = Depends(get_session)):
    model = db.exec(select(ModelCatalog).where(ModelCatalog.model_id == model_id)).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    model.is_active = not model.is_active
    db.add(model)
    db.commit()
    return {"model_id": model_id, "new_status": model.is_active}

@router.post("/model-catalog/add")
def add_manual_model(payload: ModelCatalogPayload, db: Session = Depends(get_session)):
    # Check if model_id already exists to prevent integrity errors
    existing = db.exec(select(ModelCatalog).where(ModelCatalog.model_id == payload.model_id)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Model '{payload.model_id}' is already registered.")

    # Create the new unified entry
    new_model = ModelCatalog(
        model_id=payload.model_id,
        friendly_name=payload.friendly_name,
        provider=payload.provider,
        api_key=payload.api_key,
        input_price_per_1m=payload.input_price_per_1m,
        output_price_per_1m=payload.output_price_per_1m,
        is_active=True
    )
    
    db.add(new_model)
    db.commit()
    db.refresh(new_model)
    return {"status": "success", "message": f"Model {payload.model_id} registered and active."}

# --- 2. GET ALL REGISTERED MODELS (For Table) ---
@router.get("/model-catalog")
def get_registered_models(db: Session = Depends(get_session)):
    # We fetch only the manual list (usually 3-10 models now)
    return db.exec(select(ModelCatalog)).all()

# --- 3. GET SYSTEM SETTINGS (For FX Rate) ---
@router.get("/system/settings")
def get_settings(db: Session = Depends(get_session)):
    settings = db.exec(select(SystemSettings)).first()
    if not settings:
        # Create default if missing
        settings = SystemSettings(usd_to_inr=83.50)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("/active-models/list")
def get_active_model_names(db: Session = Depends(get_session)):
    # Fetch only the model_id of active models
    models = db.exec(select(ModelCatalog.model_id).where(ModelCatalog.is_active == True)).all()
    return models

@router.patch("/teams/{team_id}/assign-model")
def assign_model_to_team(team_id: int, payload: dict, db: Session = Depends(get_session)):
    # 1. Fetch the team from database
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # 2. Extract and Validate the new model ID
    new_model_id = payload.get("model_id")
    if not new_model_id:
        raise HTTPException(status_code=400, detail="model_id is required")
        
    # Optional: Verify if the model actually exists in the catalog
    model_exists = db.exec(select(ModelCatalog).where(ModelCatalog.model_id == new_model_id)).first()
    if not model_exists:
        raise HTTPException(status_code=400, detail="Model ID not found in Catalog")

    # 3. Update and Commit
    team.assigned_model = new_model_id
    db.add(team)
    db.commit()
    db.refresh(team)
    
    return {"status": "success", "message": f"Team {team.name} assigned to {new_model_id}"}

@router.put("/catalog/{model_id}")
def update_catalog_model(model_id: str, update_data: dict, db: Session = Depends(get_session)):
    model_entry = db.exec(select(ModelCatalog).where(ModelCatalog.model_id == model_id)).first()
    
    if not model_entry:
        raise HTTPException(status_code=404, detail="Model not found in catalog")

    # Update only the provided fields
    if "friendly_name" in update_data:
        model_entry.friendly_name = update_data["friendly_name"]
    if "input_price_per_1m" in update_data:
        model_entry.input_price_per_1m = float(update_data["input_price_per_1m"])
    if "output_price_per_1m" in update_data:
        model_entry.output_price_per_1m = float(update_data["output_price_per_1m"])
    if "is_active" in update_data:
        model_entry.is_active = bool(update_data["is_active"])

    db.add(model_entry)
    db.commit()
    db.refresh(model_entry)
    return {"status": "success", "message": f"Model {model_id} updated"}

# --- DELETE MODEL FROM CATALOG ---
@router.delete("/catalog/{model_id}")
def delete_catalog_model(model_id: str, db: Session = Depends(get_session)):
    model_entry = db.exec(select(ModelCatalog).where(ModelCatalog.model_id == model_id)).first()
    
    if not model_entry:
        raise HTTPException(status_code=404, detail="Model not found")

    db.delete(model_entry)
    db.commit()
    return {"status": "success", "message": f"Model {model_id} permanently removed"}