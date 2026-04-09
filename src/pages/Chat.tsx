import React, { useState, useEffect, useRef, useCallback } from "react";
import React, { useState, useEffect, useRef} from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  LogOut,
  User as UserIcon,
  MessageSquare,
  Menu,
  X,
  Moon,
  Sun,
  SquarePen,
  Loader2,
  GraduationCap,
  ToggleLeft,
  ToggleRight,
  Bot,
  Trash2,
  Plus,
  Settings,
} from "lucide-react";
import api from "../api/axiosConfig";
import { cn } from "../lib/utils";
import type { Message, User, ChatSession } from "../types";

const Chat = () => {
  const [theme, setTheme] = useState("light");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen]= useState(false);
  const [containerStyle, setContainerStyle] = useState("container-chat");
  const [sidebarStyle, setSidebarStyle] = useState("");
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [buttonTheme, setButtonTheme] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ─── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem("yoko_user");
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      //createSession(parsedUser.id);
      fetchRecentChats(parsedUser.id);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── API helpers ─────────────────────────────────────────────────────────────

  /** Re-fetches the sidebar chat list */
  const fetchRecentChats = useCallback(async (userId: string) => {
    try {
      const response = await api.get(`/sessions/${userId}/chats`);
      const sessionList: ChatSession[] =
        response.data.content || response.data || [];
      setRecentChats(sessionList);
    } catch (err) {
      console.error("Error fetching recent chats", err);
    }
  }, []);

  /**
   * Loads a past chat by fetching its messages from GET /sessions/{chatId}
   * then sets it as the active session.
   */
  const loadChat = async (chat: ChatSession) => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    setSidebarOpen(false);
    try {
      const response = await api.get(`/sessions/${chat.id}`);
      const history: Message[] = response.data || [];
      setMessages(history);
      setSession(chat);
    } catch (err) {
      console.error("Error loading chat history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  /** Clears the current view to start a brand new conversation */
  const startNewChat = () => {
    setSession(null);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
  };

  /** Deletes a session and refreshes the sidebar */
  const deleteSession = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/sessions/${chatId}`);
      // If we deleted the currently active chat, clear the view
      if (session?.id === chatId) {
        startNewChat();
      }
      // Refresh sidebar immediately
      if (user) fetchRecentChats(user.id);
    } catch (err) {
      console.error("Error deleting session", err);
    }
  };

  // ─── Send message ────────────────────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    let activeSessionId = session?.id;

    // Create a new session on first message if none exists
    if (!activeSessionId) {
      try {
        setLoading(true);
        const storedUser: User = JSON.parse(
          localStorage.getItem("yoko_user") || "{}",
        );
        const newSessionRes = await api.post(`/sessions/${storedUser.id}`);
        activeSessionId = newSessionRes.data.id;
        setSession(newSessionRes.data);
        // Update sidebar right away so the new chat appears
        fetchRecentChats(storedUser.id);
      } catch (error) {
        console.error("Error creating session:", error);
        alert("Error: No se pudo crear una sesión de chat con el servidor.");
        setLoading(false);
        return;
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post(
        `/sessions/${activeSessionId}/messages`,
        JSON.stringify(userMsg.content), // string JSON-encoded: "hola"
        { headers: { "Content-Type": "application/json" } },
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: res.data,
        role: "assistant",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Refresh sidebar after every message so titles/timestamps stay fresh
      if (user) fetchRecentChats(user.id);
    } catch (err) {
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

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={theme==='light'? `${containerStyle} bg-on-primary overflow-hidden`:`${containerStyle} bg-[#181C36] overflow-hidden`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className=
        {theme==="light"?
        cn(
          ` ${sidebarStyle} sidebar inset-y-0 left-0 w-72 bg-linear-to-b from-[#CCE9FF] to-primary/80 text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col`,
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ):
         cn(
          ` ${sidebarStyle} sidebar inset-y-0 left-0 w-72 bg-linear-to-b from-[#02385A] to-[#021C41] text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col`,
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )
      }
      >
        {/* Logo */}
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
        <div className=" w-full p-6 flex items-center gap-3 border-b border-slate-700/50">
            <button 
            className={theme==='light'?"w-full  flex items-center gap-3 p-3 rounded-xl  text-azulUnegDark font-medium hover:bg-[#010064] hover:text-primary transition-colors text-left group cursor-pointer":"w-full  flex items-center gap-3 p-3 rounded-xl font-medium text-primary hover:bg-primary/70 hover:text-azulUneg transition-colors text-left group cursor-pointer"}
            >
              <SquarePen className={theme==='light'?"w-4 h-4 text-slate-500 group-hover:text-primary transition-colors":"w-4 h-4 text-slate-500 group-hover:text-azulUneg transition-colors"} />
              Nuevo Chat
            </button>
        </div>

        {/* New Chat button */}
        <div className="px-4 pt-4">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium border border-primary/20"
          >
            <Plus className="w-4 h-4" />
            Nueva conversación
          </button>
        </div>

        {/* Chat list */}
        {/*Historial de chats*/}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2 mb-2">
              Historial Reciente
            </p>

            {loadingHistory && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
              </div>
            )}

          <div className="space-y-2">
            <h1 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2">
              Chats
            </h1>
            {recentChats.length > 0 ? (
              recentChats.map((chat, idx) => (
                <div
                  key={chat.id || idx}
                  className={cn(
                    "flex items-center rounded-xl transition-colors group cursor-pointer",
                    session?.id === chat.id
                      ? "bg-slate-700"
                      : "hover:bg-slate-800",
                  )}
                >
                  {/* Select chat */}
                  <button
                    onClick={() => loadChat(chat)}
                    className="flex-1 flex items-center gap-3 p-3 text-left overflow-hidden"
                  >
                    <MessageSquare
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        session?.id === chat.id
                          ? "text-primary"
                          : "text-slate-500 group-hover:text-primary",
                      )}
                    />
                    <span className="text-sm text-slate-300 truncate">
                      {(chat as any).title || "Nueva conversación"}
                    </span>
                  </button>

                  {/* Delete chat */}
                  <button
                    onClick={(e) => deleteSession(chat.id, e)}
                    className="p-3 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  key={idx}
                  onClick={()=>{
                    console.log(chat) // Limpia los mensajes actuales para cargar los de la nueva sesión
                    // Aquí podrías agregar una función para cargar los mensajes de esta sesión específica desde el backend si tu API lo soporta
                  }}
                  className={theme==='light'?"w-full  flex items-center gap-3 p-3 rounded-xl  text-primary hover:bg-[#010064] transition-colors text-left group cursor-pointer":"w-full  flex items-center gap-3 p-3 rounded-xl  text-primary hover:bg-primary/70 transition-colors text-left group cursor-pointer"}
                >
                  <MessageSquare className={theme==='light'?"w-4 h-4 text-slate-500 group-hover:text-primary transition-colors":"w-4 h-4 text-slate-500 group-hover:text-azulUneg transition-colors"} />
                  <span className={theme==='light'?"text-sm text-azulUnegDark group-hover:text-primary truncate font-medium":"text-sm text-slate-300 group-hover:text-azulUneg truncate font-medium"}>
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

        {/* User profile */}
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
        {/* User Profile Configuracion */}
        <details
        open={modalOpen}
        className=" w-full flex items-center justify-center gap-3 border-t border-slate-800/80"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setModalOpen(false);
          }
        }}
        >
          <summary
           className={theme==='light'? "list-style:none w-full  flex items-center m-4 gap-3 p-3 rounded-xl font-medium text-azulUnegDark hover:bg-[#010064] hover:text-primary transition-colors text-left group cursor-pointer":"list-style:none w-full  flex items-center m-4 gap-3 p-3 rounded-xl font-medium text-primary hover:bg-primary/70 hover:text-azulUneg transition-colors text-left group cursor-pointer"}
           onClick={(e)=>{
              e.preventDefault();
              setModalOpen(!modalOpen);
            }
           }
          >
            <Settings  className={theme==='light'? "w-4 h-4 text-slate-500 group-hover:text-primary transition-colors":"w-4 h-4 text-slate-500 group-hover:text-azulUneg transition-colors"}/>
            Configuracion
          </summary>
          <div 
          className="absolute -ml-50 -mt-48 gap-3 z-1000 flex flex-col bg-primary border border-azulUnegDark p-4 rounded-2xl transition-all duration-5000 ease-in-out"
          > 
            <button
            className="w-full  flex items-center gap-3 p-3 rounded-xl text-[0.8rem] text-azulUneg hover:text-primary hover:bg-[#010064] transition-colors text-left group"
            onClick={()=>{
              setTheme(buttonTheme? "light" : "dark");
              setButtonTheme(!buttonTheme)
            }}
            >
              
              {buttonTheme?(
                 <p
                 className="w-auto flex flex-row items-center gap-1 cursor-pointer"
                 ><Moon className="w-4 h-4 text-azulUneg group-hover:text-primary transition-colors"/>
                  Tema Oscuro 
                 <ToggleRight className="w-4 h-4 ml-12 text-azulUneg group-hover:text-primary transition-colors" />
                 </p>
              ) : (
                <p
                className="w-auto flex flex-row items-center gap-1 cursor-pointer"
                >
                <Sun className="w-4 h-4 text-azulUneg group-hover:text-primary transition-colors" />
                 Tema Claro 
                <ToggleLeft className="w-4 h-4 ml-15 text-azulUneg group-hover:text-primary transition-colors" />
                </p>
              )
              }

            </button>

            <button
              onClick={handleLogout}
              className="cursor-pointer w-full  flex items-center gap-3 p-3 rounded-xl text-[0.8rem] text-azulUneg hover:text-primary hover:bg-[#010064] transition-colors text-left group"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-azulUneg/50 border border-azulUnegDark/50">
              <div className="w-10 h-10 bg-azulUneg rounded-full flex items-center justify-center shrink-0">
                <UserIcon className="text-on-primary w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.name || "Estudiante"}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-on-primary">
                  <GraduationCap className="w-3 h-3" />
                  <span className="truncate">{user?.career || "Carrera"}</span>
                </div>
              </div>
            </div>

          </div>
        </details>
      </aside>

      {/* ── Main Chat Area ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-30">
      {/* Main Chat Area */}
      <main className="main flex-1 flex flex-col relative min-w-0 ">
        {/* Header */} 
        <header className={theme==='light'?"h-8 bg-white border-b border-slate-200 flex items-center p-6 sticky top-0 z-30":"h-8 bg-[#14172d]/80 border-b border-[#14172d] flex items-center p-6 sticky top-0 z-30"}>
          <button
            className=" p-2 -ml-2 mr-4 hover:bg-primary rounded-lg cursor-pointer"
            onClick={() =>{ 
                if (sidebarOpen) {
                  setSidebarOpen(false);
                  setContainerStyle("container-chat2");
                  setSidebarStyle("size-0 overflow-hidden");
                } else {
                  setSidebarOpen(true);
                  setContainerStyle("container-chat");
                  setSidebarStyle(" ");
                }          
              }}>
            <Menu className="w-6 h-6 text-slate-600" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Sparkles className="text-primary w-4 h-4" />
            </div>
            <h2 className="font-semibold text-slate-800">
              {session
                ? (session as any).title || "Conversación activa"
                : "Asistente Virtual"}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Sistema Activo
            </div>
            <h2 className={theme==='light'?"font-semibold text-slate-800": "font-semibold text-on-primary"}>Yoko AI</h2>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {loadingHistory ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">Cargando historial...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            /* Welcome screen */
        <div id="panel" className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6  mask-b-from-80% mask-b-to-100%">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center">
              <div className={theme==='light'?"w-20 h-20 bg-azulUneg/5 rounded-3xl flex items-center justify-center animate-bounce duration-2000":"w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center animate-bounce duration-2000"}>
                <Bot className="text-primary w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className={theme==='light'?"text-xl font-bold text-slate-800":"text-xl font-bold text-on-primary"}>
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
                    className={theme==='light'?"p-3 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-azulUneg hover:text-azulUneg transition-all text-left":"p-3 text-sm text-azulUneg/60 bg-primary border border-on-primary rounded-xl hover:border-primary hover:text-azulUneg transition-all text-left"}
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
                  "flex w-full",
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
                      "p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-aquaUneg text-white rounded-tr-none"
                        : "bg-primary text-slate-800 rounded-tl-none border border-slate-200",
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%] lg:max-w-[70%]">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
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

        {/* Input */}
        <div className="p-4 lg:p-6 bg-white border-t border-slate-200">
        {/*Fin Messages*/}
      </main>
        {/* Input Area */}
        <div className={theme=='light'? "messageBox p-4  bg-white border-t border-slate-200": "messageBox p-4  bg-[#14172d]/80 border-t border-[#14172d]"}>
          <form
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta académica aquí..."
              disabled={loadingHistory}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 disabled:opacity-50"
              className={theme=='light'?"w-full placeholder:text-[#3F3EB1]/65 placeholder:text-[0.8rem] max-h-full overflow-y-auto bg-primary border border-slate-200 rounded-2xl py-2 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all": "w-full text-on-primary placeholder:text-primary/65 placeholder:text-[0.8rem] max-h-full overflow-y-auto bg-[#1A3D63] border border-azulUnegDark rounded-2xl py-2 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-[#1A3D63]/20 focus:border-[#1A3D63] transition-all"}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || loadingHistory}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95",
                (!input.trim() || loading || loadingHistory) &&
              disabled={!input.trim() || loading}
              className={theme==='light'?cn(
                " cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 size-8 bg-white text-azulUneg rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95",
                (!input.trim() || loading) &&
                  "opacity-50 cursor-not-allowed hover:scale-100",
              ):
              cn(
                "cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 size-8 bg-primary text-azulUneg rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95",
                (!input.trim() || loading) &&
                  "opacity-50 cursor-not-allowed hover:scale-100",
              )
            }
            >
              <Send className="size-4" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-3">
            Yoko AI puede cometer errores. Verifica la información importante
            con tu coordinación académica.
          </p>
        </div>
       
        {/**FIN  input area */}

    </div>
  );
};

export default Chat;
