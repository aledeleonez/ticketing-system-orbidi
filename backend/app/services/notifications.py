from typing import Sequence
from sqlalchemy import select, func, update
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.notification import Notification
from app.models.enums import NotificationType


def create_notification(
    db: Session,
    *,
    user_id: int,
    type: NotificationType,
    ticket_id: int | None = None,
    payload: dict | None = None,
) -> Notification:
    """
    Crea una notificación. Hace commit por separado para no acoplar al
    flujo del caller (evita que falle un ticket porque la notificación falle).
    """
    notif = Notification(
        user_id=user_id,
        type=type,
        ticket_id=ticket_id,
        payload=payload or {},
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def list_notifications(
    db: Session, *, user_id: int, unread_only: bool = False, limit: int = 50
) -> Sequence[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    if unread_only:
        stmt = stmt.where(Notification.read_at.is_(None))
    return db.execute(stmt).scalars().all()


def count_unread(db: Session, *, user_id: int) -> int:
    stmt = (
        select(func.count(Notification.id))
        .where(Notification.user_id == user_id)
        .where(Notification.read_at.is_(None))
    )
    return db.execute(stmt).scalar_one()


def mark_read(db: Session, *, notification_id: int, user_id: int) -> None:
    db.execute(
        update(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.user_id == user_id)
        .values(read_at=datetime.now(timezone.utc))
    )
    db.commit()


def mark_all_read(db: Session, *, user_id: int) -> None:
    db.execute(
        update(Notification)
        .where(Notification.user_id == user_id)
        .where(Notification.read_at.is_(None))
        .values(read_at=datetime.now(timezone.utc))
    )
    db.commit()