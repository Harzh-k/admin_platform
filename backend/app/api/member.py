from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from app.db.database import get_session
from app.models.models import Team, User, TokenUsage, TeamMember, ChangePasswordPayload
import bcrypt

router = APIRouter(prefix="/member", tags=["Member Dashboard"])

@router.get("/stats")
def get_member_stats(email: str, page: int = 1, size: int = 10, db: Session = Depends(get_session)):
    # 1. Identity Check
    user = db.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Get Team Details
    team_data = db.exec(
        select(Team.name, Team.ingestion_key)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .where(TeamMember.user_id == user.id)
    ).first()

    # 3. Stats (Personal)
    total_spent = db.exec(select(func.sum(TokenUsage.cost_usd)).where(TokenUsage.user_id == user.id)).first() or 0.0
    total_tokens = db.exec(select(func.sum(TokenUsage.total_tokens)).where(TokenUsage.user_id == user.id)).first() or 0

    # 4. Pagination Logic for History
    skip = (page - 1) * size
    total_history_count = db.exec(
        select(func.count(TokenUsage.id)).where(TokenUsage.user_id == user.id)
    ).one()

    history_statement = (
        select(TokenUsage, Team.name)
        .join(Team, TokenUsage.team_id == Team.id)
        .where(TokenUsage.user_id == user.id)
        .order_by(TokenUsage.created_at.desc())
        .offset(skip).limit(size)
    )
    results = db.exec(history_statement).all()

    return {
        "full_name": user.full_name,
        "email": user.email,
        "team_name": team_data[0] if team_data else "Individual / No Team",
        "ingestion_key": team_data[1] if team_data else "NO_KEY_ASSIGNED",
        "total_spent": float(total_spent),
        "total_tokens": int(total_tokens),
        "history": {
            "items": [{
                "id": u.id,
                "team": t_name,
                "model": u.model_id,
                "tokens": u.total_tokens,
                "cost": f"${u.cost_usd:.4f}",
                "time": u.created_at.strftime("%H:%M:%S")
            } for u, t_name in results],
            "total": total_history_count,
            "page": page,
            "total_pages": (total_history_count + size - 1) // size
        }
    }

@router.post("/change-password")
def change_password(payload: ChangePasswordPayload, db: Session = Depends(get_session)):
    # 1. Find user
    user = db.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Verify Old Password
    if not bcrypt.checkpw(payload.old_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # 3. Hash and Save New Password
    hashed_pw = bcrypt.hashpw(payload.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password_hash = hashed_pw
    
    db.add(user)
    db.commit()

    return {"status": "success", "message": "Password updated successfully"}