"use client";

import { useState } from "react";
import { TicketsToolbar } from "@/components/tickets/tickets-toolbar";
import { TicketsListView } from "@/components/tickets/tickets-list-view";
import { TicketsKanbanView } from "@/components/tickets/tickets-kanban-view";
import { TicketDetailDialog } from "@/components/tickets/ticket-detail-dialog";
import { useTickets, type TicketsFilters } from "@/lib/hooks";

export type ViewMode = "list" | "kanban";

export default function TicketsPage() {
  const [filters, setFilters] = useState<TicketsFilters>({
    q: "",
    status: "all",
    priority: "all",
  });
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const { data, isLoading } = useTickets(filters);

  return (
    <div className="space-y-4">
      <TicketsToolbar
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === "list" ? (
        <TicketsListView
          tickets={data?.items ?? []}
          isLoading={isLoading}
          onSelect={(id) => setSelectedTicketId(id)}
        />
      ) : (
        <TicketsKanbanView
          tickets={data?.items ?? []}
          isLoading={isLoading}
          onSelect={(id) => setSelectedTicketId(id)}
        />
      )}

      <TicketDetailDialog
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  );
}