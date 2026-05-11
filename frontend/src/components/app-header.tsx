"use client";

import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsPopover } from "@/components/notifications-popover";
import Image from "next/image"; 

export function AppHeader() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const initials = session.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="border-b bg-white">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Image
            src={'/orbidi-logo.png'}
            alt="Orbidi"
            width={28}
            height={28}
            priority
            unoptimized
          />
          <h1 className="text-lg font-semibold">Orbidi Ticketing</h1>
        </div>
        <div className="flex items-center gap-3">        
          <NotificationsPopover />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="h-8 w-8 cursor-pointer">
                {session.user.avatar_url && (
                  <AvatarImage src={session.user.avatar_url} alt={session.user.name} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-55" align="end">
              <DropdownMenuItem disabled>
                <div className="flex flex-col">
                  <span className="font-medium">{session.user.name}</span>
                  <span className="text-xs text-slate-500">{session.user.email}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="cursor-pointer"
              >
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}