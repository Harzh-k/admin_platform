from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from app.db.database import get_session
from app.models.models import Team, User, TeamMember, TokenUsage

router = APIRouter(prefix="/lead", tags=["lead"])

@router.get("/dashboard-stats")
def get_lead_dashboard(email: str, page: int = 1, size: int = 10, db: Session = Depends(get_session)):
    # 1. Identify User and Team
    user = db.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    membership = db.exec(
        select(TeamMember).where(TeamMember.user_id == user.id, TeamMember.role == 'lead')
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="No team found for this Lead")

    team = db.get(Team, membership.team_id)

    # 2. Aggregated Token Stats
    total_team_tokens = db.exec(
        select(func.sum(TokenUsage.total_tokens)).where(TokenUsage.team_id == team.id)
    ).first() or 0

    personal_tokens = db.exec(
        select(func.sum(TokenUsage.total_tokens)).where(TokenUsage.user_id == user.id)
    ).first() or 0

    # 3. Pagination Logic for History
    skip = (page - 1) * size
    total_history_count = db.exec(
        select(func.count(TokenUsage.id)).where(TokenUsage.team_id == team.id)
    ).one()

    history_results = db.exec(
        select(TokenUsage)
        .where(TokenUsage.team_id == team.id)
        .order_by(TokenUsage.created_at.desc())
        .offset(skip).limit(size)
    ).all()

    # 4. Team Leaderboard (Top 5)
    leaderboard = db.exec(
        select(User.full_name, func.sum(TokenUsage.cost_usd))
        .join(TokenUsage, User.id == TokenUsage.user_id)
        .where(TokenUsage.team_id == team.id)
        .group_by(User.id)
        .order_by(func.sum(TokenUsage.cost_usd).desc())
        .limit(5)
    ).all()

    return {
        "team_name": team.name,
        "lead_email": user.email,
        "budget": team.token_budget_usd,
        "spent": team.current_spend_usd,
        "ingestion_key": team.ingestion_key,
        "total_team_tokens": int(total_team_tokens),
        "personal_tokens": int(personal_tokens),
        "leaderboard": [{"name": row[0], "spend": float(row[1])} for row in leaderboard],
        "history": {
            "items": [{
                "id": h.id,
                "model": h.model_id, 
                "tokens": h.total_tokens, 
                "cost": f"${h.cost_usd:.4f}",
                "time": h.created_at.strftime("%H:%M:%S")
            } for h in history_results],
            "total": total_history_count,
            "page": page,
            "total_pages": (total_history_count + size - 1) // size
        }
    }