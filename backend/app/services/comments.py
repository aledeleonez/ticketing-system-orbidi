from typing import Sequence
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.comment import Comment
from app.models.user import User
from app.services.tickets import get_ticket


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
    get_ticket(db, ticket_id)  # valida ticket
    comment = Comment(ticket_id=ticket_id, author_id=author.id, body=body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    stmt = (
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment.id)
    )
    return db.execute(stmt).scalar_one()