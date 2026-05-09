import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Ticket,
  TicketListResponse,
  TicketUpdateInput,
  Comment,
  CommentCreateInput,
  User,
} from "@/lib/types";

export interface TicketsFilters {
  q?: string;
  status?: string;
  priority?: string;
}

export function useTickets(filters: TicketsFilters) {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: async () => {
      const params: Record<string, string> = { page_size: "100" };
      if (filters.q) params.q = filters.q;
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.priority && filters.priority !== "all")
        params.priority = filters.priority;
      const res = await api.get<TicketListResponse>("/api/v1/tickets", {
        params,
      });
      return res.data;
    },
  });
}

export function useTicket(id: number | null) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const res = await api.get<Ticket>(`/api/v1/tickets/${id}`);
      return res.data;
    },
    enabled: id !== null,
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: TicketUpdateInput;
    }) => {
      const res = await api.patch<Ticket>(`/api/v1/tickets/${id}`, data);
      return res.data;
    },
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      qc.setQueryData(["ticket", ticket.id], ticket);
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<User[]>("/api/v1/users");
      return res.data;
    },
    staleTime: 5 * 60_000, // los usuarios cambian poco
  });
}

export function useComments(ticketId: number | null) {
  return useQuery({
    queryKey: ["comments", ticketId],
    queryFn: async () => {
      const res = await api.get<Comment[]>(
        `/api/v1/tickets/${ticketId}/comments`
      );
      return res.data;
    },
    enabled: ticketId !== null,
  });
}

export function useCreateComment(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CommentCreateInput) => {
      const res = await api.post<Comment>(
        `/api/v1/tickets/${ticketId}/comments`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", ticketId] });
    },
  });
}