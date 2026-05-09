from typing import Sequence
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, selectinload

from app.models.ticket import Ticket
from app.models.user import User
from app.models.enums import TicketStatus, TicketPriority
from app.schemas.ticket import TicketCreate, TicketUpdate
from app.models.enums import TicketStatus, TicketPriority, NotificationType
from app.services import notifications as notifications_service

SORTABLE_FIELDS = {
    "created_at": Ticket.created_at,
    "updated_at": Ticket.updated_at,
    "priority": Ticket.priority,
    "status": Ticket.status,
    "title": Ticket.title,
}

class TicketNotFound(Exception):
    pass

class AssigneeNotFound(Exception):
    pass

def _assert_assignee_exists(db: Session, assignee_id: int | None) -> None:
    if assignee_id is None:
        return
    if not db.get(User, assignee_id):
        raise AssigneeNotFound(f"User {assignee_id} not found")
    
def _base_query():
    return select(Ticket).options(
        selectinload(Ticket.author),
        selectinload(Ticket.assignee)
    )

def list_tickets(
    db: Session,
    *,
    status: TicketStatus | None = None,
    priority: TicketPriority | None = None,
    assignee_id: int | None = None,
    author_id: int | None = None,
    q: str | None = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = 1,
    page_size: int = 20,
) -> tuple[Sequence[Ticket], int]:
    filters = []
    if status is not None:
        filters.append(Ticket.status == status)
    if priority is not None:
        filters.append(Ticket.priority == priority)
    if assignee_id is not None:
        filters.append(Ticket.assignee_id == assignee_id)
    if author_id is not None:
        filters.append(Ticket.author_id == author_id)
    if q:
        like = f"%{q.lower()}%"
        filters.append(
            func.lower(Ticket.title).like(like)
            | func.lower(Ticket.description).like(like)
        )

    where = and_(*filters) if filters else None

    count_stmt = select(func.count(Ticket.id))
    if where is not None:
        count_stmt = count_stmt.where(where)
    total = db.execute(count_stmt).scalar_one()

    sort_col = SORTABLE_FIELDS.get(sort, Ticket.created_at)
    direction = sort_col.desc() if order.lower() == "desc" else sort_col.asc()

    stmt = _base_query()
    if where is not None:
        stmt = stmt.where(where)
    stmt = stmt.order_by(direction).offset((page - 1) * page_size).limit(page_size)

    items = db.execute(stmt).scalars().all()
    return items, total


def get_ticket(db: Session, ticket_id: int) -> Ticket:
    stmt = _base_query().where(Ticket.id == ticket_id)
    ticket = db.execute(stmt).scalar_one_or_none()
    if not ticket:
        raise TicketNotFound(f"Ticket {ticket_id} not found")
    return ticket


def create_ticket(db: Session, *, payload: TicketCreate, author: User) -> Ticket:
    _assert_assignee_exists(db, payload.assignee_id)
    ticket = Ticket(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        assignee_id=payload.assignee_id,
        author_id=author.id,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    if ticket.assignee_id and ticket.assignee_id != author.id:
        notifications_service.create_notification(
            db,
            user_id=ticket.assignee_id,
            type=NotificationType.ASSIGNED,
            ticket_id=ticket.id,
            payload={"ticket_title": ticket.title, "by": author.name},
        )

    return get_ticket(db, ticket.id)


def update_ticket(
    db: Session, *, ticket_id: int, payload: TicketUpdate, actor: User
) -> Ticket:
    ticket = get_ticket(db, ticket_id)
    data = payload.model_dump(exclude_unset=True)

    if "assignee_id" in data:
        _assert_assignee_exists(db, data["assignee_id"])

    old_status = ticket.status
    old_assignee_id = ticket.assignee_id

    for field, value in data.items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)

    notify_users: set[int] = set()

    if "assignee_id" in data and ticket.assignee_id != old_assignee_id:
        if ticket.assignee_id and ticket.assignee_id != actor.id:
            notifications_service.create_notification(
                db,
                user_id=ticket.assignee_id,
                type=NotificationType.ASSIGNED,
                ticket_id=ticket.id,
                payload={"ticket_title": ticket.title, "by": actor.name},
            )

    if "status" in data and ticket.status != old_status:
        for uid in (ticket.author_id, ticket.assignee_id):
            if uid and uid != actor.id:
                notify_users.add(uid)
        for uid in notify_users:
            notifications_service.create_notification(
                db,
                user_id=uid,
                type=NotificationType.STATUS_CHANGED,
                ticket_id=ticket.id,
                payload={
                    "ticket_title": ticket.title,
                    "from": old_status.value if hasattr(old_status, "value") else str(old_status),
                    "to": ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status),
                    "by": actor.name,
                },
            )

    return get_ticket(db, ticket.id)
