export type TicketStatus = "open" | "in_progress" | "in_review" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  author: User;
  assignee: User | null;
  created_at: string;
  updated_at: string;
}

export interface TicketListResponse {
  items: Ticket[];
  total: number;
  page: number;
  page_size: number;
}

export interface TicketCreateInput {
  title: string;
  description?: string;
  priority?: TicketPriority;
  assignee_id?: number | null;
}

export interface TicketUpdateInput {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee_id?: number | null;
}

export interface Comment {
  id: number;
  ticket_id: number;
  body: string;
  author: User;
  created_at: string;
}

export interface CommentCreateInput {
  body: string;
}