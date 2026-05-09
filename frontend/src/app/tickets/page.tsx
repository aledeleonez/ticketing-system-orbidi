"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import type {
  TicketListResponse,
  TicketStatus,
  TicketPriority,
} from "@/lib/types";
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
import { TicketsFilters } from "@/components/tickets/tickets-filters";
import { NewTicketDialog } from "@/components/tickets/new-ticket-dialog";

interface Filters {
  q: string;
  status: TicketStatus | "all";
  priority: TicketPriority | "all";
}

export default function TicketsPage() {
  const [filters, setFilters] = useState<Filters>({
    q: "",
    status: "all",
    priority: "all",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.q) params.q = filters.q;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.priority !== "all") params.priority = filters.priority;
      const res = await api.get<TicketListResponse>("/api/v1/tickets", {
        params,
      });
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Tickets</h2>
        <NewTicketDialog />
      </div>

      <TicketsFilters filters={filters} onChange={setFilters} />

      <div className="bg-white border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
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
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No hay tickets que coincidan con los filtros.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((ticket) => (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-slate-50">
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
    </div>
  );
}