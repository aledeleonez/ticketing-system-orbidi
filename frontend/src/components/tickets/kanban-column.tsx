"use client";

import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "@/components/tickets/kanban-card";
import type { Ticket, TicketStatus } from "@/lib/types";

interface Props {
  id: TicketStatus;
  title: string;
  tickets: Ticket[];
  onSelect: (id: number) => void;
}

export function KanbanColumn({ id, title, tickets, onSelect }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-100 rounded-lg p-3 min-h-[400px] ${
        isOver ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-xs bg-white px-2 py-0.5 rounded-full text-slate-600">
          {tickets.length}
        </span>
      </div>
      <div className="space-y-2">
        {tickets.map((t) => (
          <KanbanCard key={t.id} ticket={t} onSelect={onSelect} />
        ))}
        {tickets.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">Sin tickets</p>
        )}
      </div>
    </div>
  );
}