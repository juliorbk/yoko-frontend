export interface User {
  id: string;
  name: string;
  career: string;
  email: string;
}

export interface Message {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT";
  timestamp: string;
}

export interface ChatSession {
  id: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Widget interfaces
export interface WidgetMessage {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT";
  timestamp: number;
}

export interface WidgetConfig {
  organizationSlug: string;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  greeting?: string;
  apiUrl?: string;
}

export interface Message {
  id: string;
  content: string;
  role: "USER" | "assistant";
  timestamp: string;
}

export interface ChatSession {
  id: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
