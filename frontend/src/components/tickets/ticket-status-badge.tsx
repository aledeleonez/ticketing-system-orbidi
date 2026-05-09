import { Badge } from "@/components/ui/badge";
import type { TicketStatus, TicketPriority } from "@/lib/types";

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  in_review: "bg-purple-100 text-purple-700",
  closed: "bg-green-100 text-green-700",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Abierto",
  in_progress: "En progreso",
  in_review: "En revisión",
  closed: "Cerrado",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>;
}

const priorityStyles: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge className={priorityStyles[priority]}>{priorityLabels[priority]}</Badge>
  );
}