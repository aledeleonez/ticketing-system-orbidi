from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import NotificationOut, NotificationsCount
from app.services import notifications as notifications_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    unread: bool = Query(default=False),
):
    items = notifications_service.list_notifications(
        db, user_id=current_user.id, unread_only=unread
    )
    return [NotificationOut.model_validate(n) for n in items]


@router.get("/count", response_model=NotificationsCount)
def count_unread(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return NotificationsCount(
        unread=notifications_service.count_unread(db, user_id=current_user.id)
    )


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications_service.mark_read(
        db, notification_id=notification_id, user_id=current_user.id
    )
    return None


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications_service.mark_all_read(db, user_id=current_user.id)
    return None