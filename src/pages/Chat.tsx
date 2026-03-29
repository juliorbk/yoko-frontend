import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  LogOut,
  User as UserIcon,
  MessageSquare,
  Menu,
  X,
  Loader2,
  GraduationCap,
  Sparkles,
  Bot,
} from "lucide-react";
import api from "../api/axiosConfig";
import { cn } from "../lib/utils";
import type { Message, User, ChatSession } from "../types";

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentChats, setRecentChats] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("yoko_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      createSession(parsedUser.id);
      fetchRecentChats(parsedUser.id);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createSession = async (userId: string) => {
    try {
      const response = await api.post(`/sessions/${userId}`);
      setSession(response.data);
    } catch (err) {
      console.error("Error creating session", err);
    }
  };

  const fetchRecentChats = async (userId: string) => {
    try {
      const response = await api.get(`/sessions/${userId}/chats`);
      // Intentamos buscar .content primero por si es una página de Spring
      const sessionList = response.data.content || response.data || [];
      setRecentChats(sessionList);
    } catch (err) {
      console.error("Error fetching recent chats", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    // ¡AQUÍ ESTÁ LA CLAVE! Extraemos directamente el ID, o lo dejamos null si no existe
    let activeSessionId = session?.id;

    if (!activeSessionId) {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem("yoko_user") || "{}");
        // Llamamos a tu endpoint para crear un nuevo chat
        const newSessionRes = await api.post(`/sessions/${user.id}`);

        activeSessionId = newSessionRes.data.id; // Sacamos el ID para usarlo ahora mismo
        setSession(newSessionRes.data); // Guardamos el OBJETO COMPLETO en el estado de React
      } catch (error) {
        console.error("Error creando sesión nueva:", error);
        alert("Error: No se pudo crear una sesión de chat con el servidor.");
        setLoading(false);
        return;
      }
    }

    // AHORA SÍ, ENVIAMOS EL MENSAJE
    const userMsg = {
      id: Date.now().toString(),
      content: input,
      role: "user", // Lo cambié a minúscula por si tu interfaz de UI depende de eso
      timestamp: new Date().toISOString(),
    };

    console.log("Enviando mensaje a la sesión:", activeSessionId);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Como activeSessionId ahora es un string puro (ej. "1234-5678"), la URL no se rompe
      const res = await api.post(`/sessions/${activeSessionId}/enviar`, {
        content: userMsg.content,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: res.data,
          role: "assistant", // En minúscula para mantener consistencia visual
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content:
            "Error: No me pude comunicar con la base de datos de UNEG. Revisa el backend.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("yoko_token");
    localStorage.removeItem("yoko_user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#f4f4f5] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 w-72 bg-[#1e293b] text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Yoko AI</h2>
            <p className="text-xs text-slate-400">UNEG Académico</p>
          </div>
          <button
            className="lg:hidden ml-auto p-2 hover:bg-slate-700 rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2">
              Historial Reciente
            </p>
            {recentChats.length > 0 ? (
              recentChats.map((chat, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors text-left group"
                >
                  <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                  <span className="text-sm text-slate-300 truncate">
                    {chat.title || "Nueva conversación"}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500">No hay chats recientes</p>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="text-slate-300 w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user?.name || "Estudiante"}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <GraduationCap className="w-3 h-3" />
                <span className="truncate">{user?.career || "Carrera"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 -ml-2 mr-4 hover:bg-slate-100 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Sparkles className="text-primary w-4 h-4" />
            </div>
            <h2 className="font-semibold text-slate-800">Asistente Virtual</h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Sistema Activo
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center animate-bounce duration-[2000ms]">
                <Bot className="text-primary w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">
                  ¡Hola! Soy Yoko AI
                </h3>
                <p className="text-slate-500">
                  Tu asistente académico de la UNEG. ¿En qué puedo ayudarte con
                  tus estudios hoy?
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  "¿Cuándo son las inscripciones?",
                  "¿Cómo pido un récord académico?",
                  "Explícame Cálculo I",
                  "Horarios de biblioteca",
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="p-3 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-primary hover:text-primary transition-all text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full animate-in fade-in slide-in-from-bottom-2",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] lg:max-w-[70%] flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
                      msg.role === "user" ? "bg-slate-200" : "bg-primary",
                    )}
                  >
                    {msg.role === "user" ? (
                      <UserIcon className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                      msg.role === "user"
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200",
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex gap-3 max-w-[85%] lg:max-w-[70%]">
                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4 text-slate-600" />
                </div>
                <div className="bg-slate-100 text-slate-500 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-3 border border-slate-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">
                    Yoko está pensando...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-6 bg-white border-t border-slate-200">
          <form
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta académica aquí..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95",
                (!input.trim() || loading) &&
                  "opacity-50 cursor-not-allowed hover:scale-100",
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-3">
            Yoko AI puede cometer errores. Verifica la información importante
            con tu coordinación académica.
          </p>
        </div>
      </main>
    </div>
  );
};

// Helper for AnimatePresence in Chat
const AnimatePresence = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Chat;
