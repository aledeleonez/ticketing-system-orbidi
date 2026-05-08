from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    q: str | None = Query(default=None, max_length=100),
):
    stmt = select(User).order_by(User.name.asc())
    if q:
        like = f"%{q.lower()}%"
        from sqlalchemy import func, or_
        stmt = stmt.where(
            or_(func.lower(User.name).like(like), func.lower(User.email).like(like))
        )
    users = db.execute(stmt).scalars().all()
    return [UserOut.model_validate(u) for u in users]