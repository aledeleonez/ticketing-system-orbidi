from typing import Sequence
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.comment import Comment
from app.models.user import User
from app.services.tickets import get_ticket
from app.models.enums import NotificationType
from app.services import notifications as notifications_service


def list_comments(db: Session, ticket_id: int) -> Sequence[Comment]:
    get_ticket(db, ticket_id)
    stmt = (
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.ticket_id == ticket_id)
        .order_by(Comment.created_at.asc())
    )
    return db.execute(stmt).scalars().all()




def create_comment(
    db: Session, *, ticket_id: int, body: str, author: User
) -> Comment:
    ticket = get_ticket(db, ticket_id)
    comment = Comment(ticket_id=ticket_id, author_id=author.id, body=body)
    db.add(comment)
    db.commit()
    db.refresh(comment)

    notify_users = set()
    if ticket.author_id != author.id:
        notify_users.add(ticket.author_id)
    if ticket.assignee_id and ticket.assignee_id != author.id:
        notify_users.add(ticket.assignee_id)
    for uid in notify_users:
        notifications_service.create_notification(
            db,
            user_id=uid,
            type=NotificationType.COMMENTED,
            ticket_id=ticket_id,
            payload={
                "ticket_title": ticket.title,
                "by": author.name,
                "preview": body[:80],
            },
        )

    stmt = (
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment.id)
    )
    return db.execute(stmt).scalar_one()