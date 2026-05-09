"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  TicketStatusBadge,
  TicketPriorityBadge,
} from "@/components/tickets/ticket-status-badge";
import { KanbanColumn } from "@/components/tickets/kanban-column";
import type { Ticket, TicketStatus, TicketListResponse } from "@/lib/types";

interface Props {
  tickets: Ticket[];
  isLoading: boolean;
  onSelect: (id: number) => void;
}

const COLUMNS: { id: TicketStatus; title: string }[] = [
  { id: "open", title: "Abierto" },
  { id: "in_progress", title: "En progreso" },
  { id: "in_review", title: "En revisión" },
  { id: "closed", title: "Cerrado" },
];

export function TicketsKanbanView({ tickets, isLoading, onSelect }: Props) {
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const qc = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const ticketsByStatus = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = tickets.filter((t) => t.status === col.id);
      return acc;
    },
    {} as Record<TicketStatus, Ticket[]>
  );

  const handleDragStart = (e: DragStartEvent) => {
    const id = Number(e.active.id);
    setActiveTicket(tickets.find((t) => t.id === id) ?? null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = e;
    if (!over) return;

    const ticketId = Number(active.id);
    const newStatus = over.id as TicketStatus;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    // Optimistic update: actualiza la caché de TanStack Query antes de la respuesta
    const previousQueries = qc.getQueriesData<TicketListResponse>({
      queryKey: ["tickets"],
    });
    previousQueries.forEach(([key, value]) => {
      if (!value) return;
      qc.setQueryData<TicketListResponse>(key, {
        ...value,
        items: value.items.map((t) =>
          t.id === ticketId ? { ...t, status: newStatus } : t
        ),
      });
    });

    try {
      await api.patch(`/api/v1/tickets/${ticketId}`, { status: newStatus });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    } catch {
      // Rollback en caso de error
      previousQueries.forEach(([key, value]) => {
        if (value) qc.setQueryData(key, value);
      });
      toast.error("No se pudo cambiar el estado del ticket");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">Cargando...</div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tickets={ticketsByStatus[col.id]}
            onSelect={onSelect}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket && (
          <div className="bg-white border rounded-md p-3 shadow-lg cursor-grabbing">
            <div className="flex justify-between items-start gap-2">
              <span className="font-medium text-sm">{activeTicket.title}</span>
              <TicketPriorityBadge priority={activeTicket.priority} />
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}