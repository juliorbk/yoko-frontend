export interface User {
  id: string;
  name: string;
  career: string;
  email: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
}

export interface ChatSession {
  id: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
