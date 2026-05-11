"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewTicketDialog } from "@/components/tickets/new-ticket-dialog";
import type { ViewMode } from "@/app/tickets/page";
import type { TicketsFilters } from "@/lib/hooks";

interface Props {
  filters: TicketsFilters;
  onFiltersChange: (f: TicketsFilters) => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
}

export function TicketsToolbar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Tickets</h2>
        <div className="flex gap-2 items-center">
          <div className="flex border rounded-md p-0.5 bg-white">
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
              onClick={() => onViewModeChange("list")}
              className={viewMode === "list" ? "bg-red-600 text-white" : ""}
            >
              Lista
            </Button>
            <Button
              size="sm"
              variant={viewMode === "kanban" ? "default" : "ghost"}
              onClick={() => onViewModeChange("kanban")}
              className={viewMode === "kanban" ? "bg-red-600 text-white" : ""}
            >
              Kanban
            </Button>
          </div>
          <NewTicketDialog />
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Buscar por título o descripción..."
          value={filters.q ?? ""}
          onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
          className="max-w-sm"
        />
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => onFiltersChange({ ...filters, status: v })}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="open">Abierto</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="in_review">En revisión</SelectItem>
            <SelectItem value="closed">Cerrado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.priority ?? "all"}
          onValueChange={(v) => onFiltersChange({ ...filters, priority: v })}
        >
          <SelectTrigger className="w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}