"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TicketStatusBadge,
  TicketPriorityBadge,
} from "@/components/tickets/ticket-status-badge";
import type { Ticket } from "@/lib/types";

interface Props {
  tickets: Ticket[];
  isLoading: boolean;
  onSelect: (id: number) => void;
}

export function TicketsListView({ tickets, isLoading, onSelect }: Props) {
  return (
    <div className="bg-white border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Asignado</TableHead>
            <TableHead>Autor</TableHead>
            <TableHead>Actualizado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                Cargando...
              </TableCell>
            </TableRow>
          ) : tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                No hay tickets que coincidan con los filtros.
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onSelect(ticket.id)}
              >
                <TableCell className="text-slate-500">#{ticket.id}</TableCell>
                <TableCell className="font-medium">{ticket.title}</TableCell>
                <TableCell>
                  <TicketStatusBadge status={ticket.status} />
                </TableCell>
                <TableCell>
                  <TicketPriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell>{ticket.assignee?.name ?? "—"}</TableCell>
                <TableCell>{ticket.author.name}</TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {format(new Date(ticket.updated_at), "dd MMM yyyy HH:mm")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}