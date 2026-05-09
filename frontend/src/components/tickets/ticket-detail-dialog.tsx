"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTicket } from "@/lib/hooks";
import { TicketDetailContent } from "@/components/tickets/ticket-detail-content";

interface Props {
  ticketId: number | null;
  onClose: () => void;
}

export function TicketDetailDialog({ ticketId, onClose }: Props) {
  const { data: ticket, isLoading } = useTicket(ticketId);

  return (
    <Dialog open={ticketId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ticket ? `#${ticket.id} · ${ticket.title}` : "Cargando..."}
          </DialogTitle>
          <DialogDescription>
            Detalle del ticket: estado, asignado, comentarios.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !ticket ? (
          <div className="py-8 text-center text-slate-500">Cargando...</div>
        ) : (
          <TicketDetailContent ticket={ticket} />
        )}
      </DialogContent>
    </Dialog>
  );
}