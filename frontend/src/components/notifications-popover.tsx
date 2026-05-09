"use client";

import { format } from "date-fns";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useNotificationsCount,
  useMarkAllRead,
} from "@/lib/hooks";
import type { NotificationItem } from "@/lib/types";

function describe(n: NotificationItem) {
  const p = n.payload as { ticket_title?: string; by?: string; from?: string; to?: string; preview?: string };
  switch (n.type) {
    case "assigned":
      return `${p.by ?? "Alguien"} te asignó: ${p.ticket_title ?? "ticket"}`;
    case "commented":
      return `${p.by ?? "Alguien"} comentó en ${p.ticket_title ?? "un ticket"}: ${p.preview ?? ""}`;
    case "status_changed":
      return `${p.by ?? "Alguien"} cambió ${p.ticket_title ?? "un ticket"} de ${p.from} a ${p.to}`;
  }
}

export function NotificationsPopover() {
  const { data: notifications = [] } = useNotifications();
  const { data: unread = 0 } = useNotificationsCount();
  const markAllRead = useMarkAllRead();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="font-semibold text-sm">Notificaciones</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              className="text-xs"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <div>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500 p-4 text-center">
              No tienes notificaciones.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 border-b last:border-b-0 text-sm ${
                  n.read_at === null ? "bg-blue-50" : ""
                }`}
              >
                <p>{describe(n)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {format(new Date(n.created_at), "dd MMM yyyy HH:mm")}
                </p>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}