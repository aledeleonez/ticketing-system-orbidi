from typing import Sequence
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session, selectinload

from app.models.ticket import Ticket
from app.models.user import User
from app.models.enums import TicketStatus, TicketPriority
from app.schemas.ticket import TicketCreate, TicketUpdate

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
    return get_ticket(db, ticket.id)  # recarga con relaciones


def update_ticket(
    db: Session, *, ticket_id: int, payload: TicketUpdate
) -> Ticket:
    ticket = get_ticket(db, ticket_id)
    data = payload.model_dump(exclude_unset=True)

    if "assignee_id" in data:
        _assert_assignee_exists(db, data["assignee_id"])

    for field, value in data.items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)
    return get_ticket(db, ticket.id)
