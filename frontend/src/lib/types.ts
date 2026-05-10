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

export interface Attachment {
  id: number;
  ticket_id: number;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploader_id: number;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  type: "assigned" | "commented" | "status_changed";
  ticket_id: number | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolCallRecord {
  tool: string;
  input: Record<string, unknown>;
  output_summary: string;
  success: boolean;
}

export interface ChatResponse {
  reply: string;
  operations: ToolCallRecord[];
}