"use client";

import type { TicketStatus, TicketPriority } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Filters {
  q: string;
  status: TicketStatus | "all";
  priority: TicketPriority | "all";
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function TicketsFilters({ filters, onChange }: Props) {
  return (
    <div className="flex gap-3 mb-4">
      <Input
        placeholder="Buscar por título o descripción..."
        value={filters.q}
        onChange={(e) => onChange({ ...filters, q: e.target.value })}
        className="max-w-sm"
      />
      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ ...filters, status: v as Filters["status"] })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Estado" />
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
        value={filters.priority}
        onValueChange={(v) => onChange({ ...filters, priority: v as Filters["priority"] })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Prioridad" />
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
  );
}