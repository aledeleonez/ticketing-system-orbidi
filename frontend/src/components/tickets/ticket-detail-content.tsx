"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  TicketStatusBadge,
  TicketPriorityBadge,
} from "@/components/tickets/ticket-status-badge";
import {
  useUpdateTicket,
  useUsers,
  useComments,
  useCreateComment,
} from "@/lib/hooks";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/types";

const UNASSIGNED = "__unassigned__";

interface Props {
  ticket: Ticket;
}

export function TicketDetailContent({ ticket }: Props) {
  const updateTicket = useUpdateTicket();
  const { data: users = [] } = useUsers();
  const { data: comments = [] } = useComments(ticket.id);
  const createComment = useCreateComment(ticket.id);
  const [newComment, setNewComment] = useState("");

  const handleStatusChange = (status: TicketStatus) => {
    updateTicket.mutate(
      { id: ticket.id, data: { status } },
      { onError: () => toast.error("Error al actualizar el estado") }
    );
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    updateTicket.mutate(
      { id: ticket.id, data: { priority } },
      { onError: () => toast.error("Error al actualizar la prioridad") }
    );
  };

  const handleAssigneeChange = (value: string) => {
    const assignee_id = value === UNASSIGNED ? null : Number(value);
    updateTicket.mutate(
      { id: ticket.id, data: { assignee_id } },
      {
        onSuccess: () => toast.success("Reasignado correctamente"),
        onError: () => toast.error("Error al reasignar"),
      }
    );
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    createComment.mutate(
      { body: newComment },
      {
        onSuccess: () => setNewComment(""),
        onError: () => toast.error("Error al enviar el comentario"),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Metadatos */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">
            Estado
          </label>
          <Select value={ticket.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Abierto</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="in_review">En revisión</SelectItem>
              <SelectItem value="closed">Cerrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">
            Prioridad
          </label>
          <Select value={ticket.priority} onValueChange={handlePriorityChange}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">
            Asignado
          </label>
          <Select
            value={ticket.assignee?.id?.toString() ?? UNASSIGNED}
            onValueChange={handleAssigneeChange}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">
            Autor
          </label>
          <p className="mt-2 text-sm">{ticket.author.name}</p>
        </div>
      </div>

      {/* Descripción */}
      {ticket.description && (
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">
            Descripción
          </label>
          <p className="mt-1 text-sm whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>
      )}

      {/* Fechas */}
      <div className="text-xs text-slate-500 flex gap-4">
        <span>
          Creado: {format(new Date(ticket.created_at), "dd MMM yyyy HH:mm")}
        </span>
        <span>
          Actualizado:{" "}
          {format(new Date(ticket.updated_at), "dd MMM yyyy HH:mm")}
        </span>
      </div>

      <hr />

      {/* Comentarios */}
      <div>
        <h3 className="font-semibold mb-3">Comentarios ({comments.length})</h3>

        <div className="space-y-3 mb-4">
          {comments.length === 0 && (
            <p className="text-sm text-slate-500">Aún no hay comentarios.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8 mt-0.5">
                {c.author.avatar_url && (
                  <AvatarImage src={c.author.avatar_url} alt={c.author.name} />
                )}
                <AvatarFallback>
                  {c.author.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-slate-50 rounded-md p-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-sm">{c.author.name}</span>
                  <span className="text-xs text-slate-500">
                    {format(new Date(c.created_at), "dd MMM yyyy HH:mm")}
                  </span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Nuevo comentario */}
        <div className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddComment}
              disabled={createComment.isPending || !newComment.trim()}
            >
              {createComment.isPending ? "Enviando..." : "Comentar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}