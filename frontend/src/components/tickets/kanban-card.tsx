"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TicketPriorityBadge } from "@/components/tickets/ticket-status-badge";
import type { Ticket } from "@/lib/types";

interface Props {
  ticket: Ticket;
  onSelect: (id: number) => void;
}

export function KanbanCard({ ticket, onSelect }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: ticket.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(ticket.id)}
      className="bg-white border rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-slate-400 transition-colors"
    >
      <div className="flex justify-between items-start gap-2 mb-1">
        <span className="font-medium text-sm">{ticket.title}</span>
        <TicketPriorityBadge priority={ticket.priority} />
      </div>
      <div className="text-xs text-slate-500">
        #{ticket.id} ·{" "}
        {ticket.assignee ? ticket.assignee.name : "Sin asignar"}
      </div>
    </div>
  );
}