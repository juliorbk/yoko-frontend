// hooks/useAuth.ts
// Hook para acceder al usuario autenticado desde cualquier componente

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  organizationId?: string;
  organizationName?: string;
}

export function useAuth() {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  const user: AuthUser | null = userRaw ? JSON.parse(userRaw) : null;

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === "ADMIN";
  const isUser = user?.role === "USER";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isUser,
    logout,
  };
}
