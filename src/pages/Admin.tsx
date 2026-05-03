import {
  useState,
  useEffect,
  useCallback,
  type FC,
  type FormEvent,
  type ChangeEvent,
  type CSSProperties,
  type JSX,
} from "react";

// ─── CSS ANIMATIONS FOR LOADING BAR ─────────────────────
const loadingBarStyles = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes loadingBar {
  0% { width: 20%; }
  50% { width: 60%; }
  100% { width: 20%; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

// Inject styles into document head
if (typeof document !== "undefined") {
  const styleId = "yoko-loading-animations";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = loadingBarStyles;
    document.head.appendChild(style);
  }
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8080/api";

const api = async <T = unknown,>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const token =
    localStorage.getItem("yoko_admin_token") ||
    localStorage.getItem("yoko_token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  // Algunos endpoints devuelven 204 sin body
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TabId = "overview" | "users" | "docs";
// type DocStatus = "vectorizado" | "procesando" | "error" | "subiendo";
type UserStatus = "activo" | "inactivo";
type SectorType =
  | "educacion"
  | "hospitalidad"
  | "corporativo"
  | "ventas"
  | "salud"
  | "manufactura"
  | "otro";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  career: string;
  currentSemester: number;
  sector?: SectorType;
  organizationSector?: string;
  organizationName?: string;
  organizationId?: string | null;
}
interface AuthResponse {
  token: string;
  user: UserData;
  role?: string;
}
interface TopQuestion {
  question: string;
  count: number;
}
interface Stats {
  totalUsers: number;
  activeSessions: number;
  totalMessages: number;
  totalDocuments: number;
  messagesLastWeek: number[];
  topQuestions: TopQuestion[];
}
interface User {
  id: string;
  name: string;
  email: string;
  sessionCount: number;
  messageCount: number;
  lastActive: string;
  status: UserStatus;
}

// ── Tipos del Knowledge Base (API real) ──────────────────────────────────────
interface KBDoc {
  id: string;
  titulo: string;
  categoria: string;
  subcategoria?: string | null;
  fuente?: string | null;
}
interface KBDocDetail extends KBDoc {
  content: string;
}
interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // página actual (0-indexed)
}
interface DataEntryRequest {
  content: string;
  titulo: string;
  categoria: string;
  subcategoria: string;
}

// ─── CATEGORÍAS DINÁMICAS POR SECTOR ─────────────────────────────────────────
const CATEGORIAS_POR_SECTOR: Record<SectorType, Record<string, string[]>> = {
  educacion: {
    reglamento: ["general", "pasantias", "inscripcion", "disciplina", "grado"],
    pensum: ["informatica", "civil", "industrial", "ambiental", "electronica"],
    calendario: ["academico", "administrativo"],
    informacion_general: [
      "historia",
      "mision_vision",
      "autoridades",
      "contacto",
    ],
    tramites: ["constancias", "retiro", "equivalencias", "cambio_carrera"],
    horario: ["semestre_8"],
  },
  hospitalidad: {
    reservas: ["confirmacion", "cancelacion", "modificacion"],
    habitaciones: ["tipos", "precios", "disponibilidad"],
    servicios: ["restaurante", "spa", "piscina", "gimnasio"],
    informacion_general: ["historia", "ubicacion", "contacto"],
    politicas: ["check_in_out", "mascotas", "fumadores"],
  },
  corporativo: {
    recursos_humanos: ["contratacion", "nomina", "beneficios", "vacaciones"],
    procesos: ["ventas", "marketing", "soporte"],
    informacion_general: ["historia", "mision_vision", "contacto"],
    politicas: ["codigo_etica", "seguridad", "remoto"],
  },
  ventas: {
    productos: ["catalogo", "precios", "inventario"],
    clientes: ["registro", "segmentacion", "historial"],
    informacion_general: ["historia", "mision_vision", "contacto"],
    politicas: ["devoluciones", "garantias", "envios"],
  },
  salud: {
    pacientes: ["registro", "historial", "citas"],
    procedimientos: ["consultas", "cirugias", "laboratorio"],
    informacion_general: ["historia", "mision_vision", "contacto"],
    politicas: ["privacidad", "urgencias", "visitas"],
  },
  manufactura: {
    produccion: ["planificacion", "control_calidad", "mantenimiento"],
    inventario: ["materias_primas", "producto_terminado", "almacen"],
    informacion_general: ["historia", "mision_vision", "contacto"],
    seguridad: ["normas", "epp", "emergencias"],
  },
  otro: {
    informacion_general: ["historia", "mision_vision", "contacto"],
    servicios: ["general", "consultas"],
    politicas: ["general"],
  },
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  reglamento: { bg: "#6366f118", text: "#6366f1" },
  pensum: { bg: "#0ea5e918", text: "#0ea5e9" },
  calendario: { bg: "#f59e0b18", text: "#f59e0b" },
  informacion_general: { bg: "#22c55e18", text: "#22c55e" },
  tramites: { bg: "#ec489918", text: "#ec4899" },
  horario: { bg: "#f97316" + "18", text: "#f97316" },
  reservas: { bg: "#6366f118", text: "#6366f1" },
  habitaciones: { bg: "#0ea5e918", text: "#0ea5e9" },
  servicios: { bg: "#22c55e18", text: "#22c55e" },
  politicas: { bg: "#ec489918", text: "#ec4899" },
  recursos_humanos: { bg: "#6366f118", text: "#6366f1" },
  procesos: { bg: "#0ea5e918", text: "#0ea5e9" },
  normativas: { bg: "#f59e0b18", text: "#f59e0b" },
  productos: { bg: "#6366f118", text: "#6366f1" },
  clientes: { bg: "#0ea5e918", text: "#0ea5e9" },
  pacientes: { bg: "#22c55e18", text: "#22c55e" },
  procedimientos: { bg: "#ec489918", text: "#ec4899" },
  produccion: { bg: "#f97316" + "18", text: "#f97316" },
  inventario: { bg: "#6366f118", text: "#6366f1" },
  seguridad: { bg: "#0ea5e918", text: "#0ea5e9" },
};

const getCategorias = (sector: SectorType): Record<string, string[]> =>
  CATEGORIAS_POR_SECTOR[sector] ?? CATEGORIAS_POR_SECTOR.otro;

const DOC_TITLE_PLACEHOLDERS: Record<SectorType, string> = {
  educacion: "Ej: Reglamento de Pasantías 2024, Pensum de Ingeniería...",
  hospitalidad: "Ej: Políticas de Check-in, Tarifas de Habitaciones...",
  corporativo: "Ej: Manual de Recursos Humanos, Políticas de Seguridad...",
  ventas: "Ej: Catálogo de Productos 2024, Políticas de Devoluciones...",
  salud: "Ej: Protocolo de Atención al Paciente, Procedimientos...",
  manufactura: "Ej: Manual de Producción, Normas de Seguridad Industrial...",
  otro: "Ej: Manual de Procedimientos, Información General...",
};

// ─── API HOOKS ────────────────────────────────────────────────────────────────
const formatLabel = (raw: string): string =>
  raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
function useStats(): { data: Stats | null; loading: boolean } {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Stats>("/admin/stats")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

function useUsers(): { data: User[]; loading: boolean } {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const fetchUsers = async () => {
      try {
        const res = await api<User[]>("/admin/users");
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, []);
  return { data, loading };
}

// Hook para listar documentos del knowledge base con paginación real
function useKBDocs(page: number, refreshSignal: number) {
  const [data, setData] = useState<KBDoc[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchDocs = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api<PageResponse<KBDoc>>(
          `/admin/docs?page=${page}&size=10`,
        );
        if (!cancelled) {
          setData(res.content ?? []);
          setTotalPages(res.totalPages ?? 0);
          setTotalElements(res.totalElements ?? 0);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Error al cargar documentos.",
          );
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDocs();
    return () => {
      cancelled = true;
    };
  }, [page, refreshSignal]);

  return { data, totalPages, totalElements, loading, error };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
// const statusColor = (s: DocStatus): string =>
//   ({
//     vectorizado: "#22c55e",
//     procesando: "#f59e0b",
//     error: "#ef4444",
//     subiendo: "#60a5fa",
//   })[s] ?? "#60a5fa";

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon: FC<{ d: string; size?: number }> = ({ d, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const Icons: Record<string, string> = {
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  messages: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  docs: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  sessions: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  x: "M18 6L6 18M6 6l12 12",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  bot: "M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM5 14v1a7 7 0 0 0 14 0v-1M8.5 17.5v1M15.5 17.5v1",
  check: "M20 6L9 17l-5-5",
  refresh:
    "M4 4v5h.582M20 20v-5h-.581M4.582 9A8 8 0 0 1 20 15M19.419 15A8 8 0 0 1 4 9",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  chevLeft: "M15 18l-6-6 6-6",
  chevRight: "M9 18l6-6-6-6",
  brain:
    "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.73A3 3 0 0 1 4.5 9.5a3 3 0 0 1 .5-1.67 2.5 2.5 0 0 1 4.5-3.83M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.73A3 3 0 0 0 19.5 9.5a3 3 0 0 0-.5-1.67 2.5 2.5 0 0 0-4.5-3.83",
};

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
const Sparkline: FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const max = Math.max(...data),
    min = Math.min(...data);
  const h = 40,
    w = 120;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={color}
        fillOpacity="0.12"
        stroke="none"
      />
    </svg>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard: FC<{
  label: string;
  value: number;
  icon: string;
  color: string;
  sparkData?: number[];
}> = ({ label, value, icon, color, sparkData }) => (
  <div
    style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginBottom: 4,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "var(--text)",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "-1px",
          }}
        >
          {value.toLocaleString()}
        </div>
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
        }}
      >
        <Icon d={Icons[icon]} size={20} />
      </div>
    </div>
    {sparkData && <Sparkline data={sparkData} color={color} />}
  </div>
);

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const LoginPage: FC<{ onLogin: (data: AuthResponse) => void }> = ({
  onLogin,
}) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pass }),
      });
      if (data.user?.role !== "ADMIN") {
        setError("Acceso denegado: No tienes permisos de administrador.");
        return;
      }
      onLogin(data);
    } catch {
      if (pass === "admin") {
        localStorage.setItem("yoko_admin_token", "demo-token");
        onLogin({
          token: "demo-token",
          user: {
            id: "1",
            name: "Admin",
            email: "admin@uneg.edu.ve",
            role: "ADMIN",
            career: "",
            currentSemester: 0,
            sector: "educacion",
          },
        });
      } else {
        setError("Credenciales incorrectas o error de servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inp: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          width: 380,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "40px 36px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <Icon d={Icons.bot} size={20} />
          </div>
          <div>
            <div
              style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}
            >
              Yoko Admin
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Panel de administración
            </div>
          </div>
        </div>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div>
            <label
              style={{
                fontSize: 12,
                color: "var(--muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Correo
            </label>
            <input
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              placeholder="admin@uneg.edu.ve"
              type="email"
              required
              style={inp}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                color: "var(--muted)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Contraseña
            </label>
            <input
              value={pass}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPass(e.target.value)
              }
              placeholder="••••••••"
              type="password"
              required
              style={inp}
            />
          </div>
          {error && (
            <div
              style={{
                fontSize: 13,
                color: "var(--danger)",
                background: "var(--danger)18",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              padding: "11px",
              borderRadius: 10,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Iniciando..." : "Entrar"}
          </button>
        </form>
        <p
          style={{
            fontSize: 11,
            color: "var(--muted)",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Demo: admin@uneg.edu.ve / admin
        </p>
      </div>
    </div>
  );
};

interface EditDocModalProps {
  doc: KBDoc;
  sector: SectorType;
  onClose: () => void;
  onSuccess: () => void;
}

const EditDocModal: FC<EditDocModalProps> = ({
  doc,
  sector,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<UpdateDocRequest>({
    titulo: doc.titulo || "",
    categoria: doc.categoria || "",
    subcategoria: doc.subcategoria || "",
    content: "",
    fuente: doc.fuente || "",
  });
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);

  // Cargar el contenido completo del documento
  useEffect(() => {
    api<KBDocDetail>(`/admin/docs/${doc.id}`)
      .then((detail) => {
        setForm((prev) => ({ ...prev, content: detail.content || "" }));
        setCharCount((detail.content || "").length);
      })
      .catch(() => setErrorMsg("No se pudo cargar el contenido del documento."))
      .finally(() => setLoadingDetail(false));
  }, [doc.id]);

  const categorias = getCategorias(sector);
  const subcats = form.categoria ? (categorias[form.categoria] ?? []) : [];

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "categoria") {
      setForm((prev) => ({ ...prev, categoria: value, subcategoria: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "content") setCharCount(value.length);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.titulo || !form.categoria || !form.content.trim()) {
      setErrorMsg("Título, categoría y contenido son obligatorios.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await api(`/admin/docs/${doc.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          subcategoria: form.subcategoria || "general",
          fuente: doc.fuente ?? "",
        }),
      });
      setStatus("success");
      onSuccess();
      setTimeout(() => onClose(), 1500);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Error al actualizar el documento.",
      );
      setStatus("error");
    }
  };

  const isLoading = status === "loading" || loadingDetail;
  const canSubmit =
    !isLoading &&
    form.titulo !== "" &&
    form.categoria !== "" &&
    form.content.trim() !== "";

  const inp: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
    marginBottom: 12,
    transition: "border-color 0.2s",
  };
  const selectStyle: CSSProperties = {
    ...inp,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
  };
  const lbl: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--muted)",
    display: "block",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#00000075",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
      onClick={() => !isLoading && onClose()}
    >
      {/* Drawer desde la derecha */}
      <div
        style={{
          width: 520,
          height: "100%",
          background: "var(--card)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del drawer */}
        <div
          style={{
            padding: "22px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "var(--accent)18",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <Icon d={Icons.edit} size={16} />
            </div>
            <div>
              <div
                style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}
              >
                Editar documento
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  fontFamily: "'DM Mono', monospace",
                  marginTop: 2,
                }}
              >
                {doc.id?.slice(0, 8)}…
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--muted)",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon d={Icons.x} size={14} />
          </button>
        </div>

        {/* Aviso de re-vectorización */}
        <div
          style={{
            margin: "16px 24px 0",
            padding: "10px 14px",
            borderRadius: 10,
            background: "#f59e0b12",
            border: "1px solid #f59e0b30",
            color: "#f59e0b",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon d={Icons.refresh} size={13} />
          Guardar re-vectorizará el documento. Los chunks anteriores serán
          reemplazados.
        </div>

        {/* Skeleton mientras carga el detalle */}
        {loadingDetail ? (
          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {[100, 60, 60, 200].map((h, i) => (
              <div
                key={i}
                style={{
                  height: h,
                  borderRadius: 10,
                  background: "var(--border)",
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <label style={lbl}>
              Título <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              disabled={status === "loading"}
              placeholder={DOC_TITLE_PLACEHOLDERS[sector]}
              style={inp}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label style={lbl}>
                  Categoría <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  disabled={status === "loading"}
                  style={selectStyle}
                >
                  <option value="">Seleccionar…</option>
                  {Object.keys(categorias).map((c) => (
                    <option key={c} value={c}>
                      {formatLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>
                  Subcategoría{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                    (opcional)
                  </span>
                </label>
                <select
                  name="subcategoria"
                  value={form.subcategoria}
                  onChange={handleChange}
                  disabled={status === "loading" || subcats.length === 0}
                  style={{
                    ...selectStyle,
                    opacity: subcats.length === 0 ? 0.5 : 1,
                  }}
                >
                  <option value="">General</option>
                  {subcats.map((s) => (
                    <option key={s} value={s}>
                      {formatLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 5,
              }}
            >
              <label style={{ ...lbl, marginBottom: 0 }}>
                Contenido <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <span
                style={{
                  fontSize: 11,
                  color: charCount > 50000 ? "var(--danger)" : "var(--muted)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {charCount.toLocaleString()} chars
              </span>
            </div>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              disabled={status === "loading"}
              rows={14}
              style={{
                ...inp,
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.6,
                marginBottom: 16,
                flex: 1,
              }}
            />

            {status === "success" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#22c55e14",
                  border: "1px solid #22c55e30",
                  color: "#22c55e",
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                <Icon d={Icons.check} size={14} /> Documento actualizado y
                re-vectorizado.
              </div>
            )}
            {status === "error" && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "var(--danger)12",
                  border: "1px solid var(--danger)30",
                  color: "var(--danger)",
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={status === "loading"}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  flex: 2,
                  padding: "11px",
                  borderRadius: 10,
                  border: "none",
                  background: canSubmit ? "var(--accent)" : "var(--border)",
                  color: canSubmit ? "#fff" : "var(--muted)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s",
                }}
              >
                {status === "loading" ? (
                  <>
                    <svg
                      style={{
                        width: 15,
                        height: 15,
                        animation: "spin 1s linear infinite",
                      }}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Vectorizando…
                  </>
                ) : (
                  <>
                    <Icon d={Icons.edit} size={15} /> Guardar cambios
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
// ─── DOCUMENT TABLE (API real con paginación) ─────────────────────────────────
interface DocumentTableProps {
  refreshSignal: number;
  theme: Record<string, string>;
  onRefresh: () => void;
  sector: SectorType;
}

const DocumentTable: FC<DocumentTableProps> = ({
  refreshSignal,
  onRefresh,
  sector,
}) => {
  const [page, setPage] = useState(0);
  const {
    data: docs,
    totalPages,
    totalElements,
    loading,
    error,
  } = useKBDocs(page, refreshSignal);

  const [deleteTarget, setDeleteTarget] = useState<KBDoc | null>(null);
  const [editTarget, setEditTarget] = useState<KBDoc | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api(`/admin/docs/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      onRefresh();
      // Si era el único doc de la página, retrocede
      if (docs.length === 1 && page > 0) setPage((p) => p - 1);
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Error al eliminar el documento.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const tdStyle: CSSProperties = {
    padding: "12px 14px",
    fontSize: 13,
    color: "var(--text)",
    borderBottom: "1px solid var(--border)",
  };
  const thStyle: CSSProperties = {
    padding: "10px 14px",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    textAlign: "left" as const,
    borderBottom: "1px solid var(--border)",
    background: "var(--bg)",
  };

  return (
    <>
      {editTarget && (
        <EditDocModal
          doc={editTarget}
          sector={sector}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            onRefresh();
            setEditTarget(null);
          }}
        />
      )}
      {/* ── Modal de confirmación ── */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#00000070",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "28px 32px",
              width: 420,
              boxShadow: "0 20px 60px #0008",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#ef444418",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                  flexShrink: 0,
                }}
              >
                <Icon d={Icons.trash} size={18} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Eliminar documento
                </div>
                <div
                  style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}
                >
                  Esta acción eliminará el documento y todos sus chunks del
                  vector store.
                </div>
              </div>
            </div>

            <div
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--text)",
                marginBottom: 20,
                fontWeight: 500,
              }}
            >
              {deleteTarget.titulo || "Sin título"}
            </div>

            {deleteError && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#ef444412",
                  border: "1px solid #ef444430",
                  color: "#ef4444",
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {deleteError}
              </div>
            )}

            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                disabled={deleting}
                style={{
                  padding: "9px 18px",
                  borderRadius: 9,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "9px 18px",
                  borderRadius: 9,
                  border: "none",
                  background: deleting ? "#ef444460" : "#ef4444",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                {deleting ? (
                  <>
                    <svg
                      style={{
                        width: 13,
                        height: 13,
                        animation: "spin 1s linear infinite",
                      }}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Eliminando…
                  </>
                ) : (
                  <>
                    <Icon d={Icons.trash} size={13} /> Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--accent)18",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <Icon d={Icons.docs} size={15} />
            </div>
            <div>
              <div
                style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}
              >
                Documentos indexados
              </div>
              <div
                style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}
              >
                {loading
                  ? "Cargando…"
                  : `${totalElements.toLocaleString()} documento${totalElements !== 1 ? "s" : ""} en el knowledge base`}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              margin: "16px 20px",
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--danger)12",
              border: "1px solid var(--danger)30",
              color: "var(--danger)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Título</th>
                <th style={thStyle}>Categoría</th>
                <th style={thStyle}>Subcategoría</th>
                <th style={thStyle}>Fuente</th>
                <th style={{ ...thStyle, width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[70, 30, 30, 25, 5].map((w, j) => (
                      <td key={j} style={{ ...tdStyle }}>
                        <div
                          style={{
                            height: 12,
                            borderRadius: 4,
                            background: "var(--border)",
                            width: `${w}%`,
                            animation: "pulse 1.5s infinite",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : docs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: "48px 24px", textAlign: "center" }}
                  >
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      <Icon d={Icons.brain} size={32} />
                      <div style={{ marginTop: 12, fontWeight: 500 }}>
                        No hay documentos todavía
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        Usa el formulario de arriba para subir tu primer
                        documento al knowledge base.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                docs.map((doc) => {
                  const catColor = CATEGORY_COLORS[doc.categoria] || {
                    bg: "var(--border)",
                    text: "var(--muted)",
                  };
                  return (
                    <tr
                      key={doc.id}
                      style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--bg)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>
                          {doc.titulo || "Sin título"}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--muted)",
                            fontFamily: "'DM Mono', monospace",
                            marginTop: 2,
                          }}
                        >
                          {doc.id?.slice(0, 8)}…
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "3px 9px",
                            borderRadius: 20,
                            background: catColor.bg,
                            color: catColor.text,
                            fontWeight: 600,
                          }}
                        >
                          {formatLabel(doc.categoria) || "—"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: "var(--muted)" }}>
                        {doc.subcategoria ? formatLabel(doc.subcategoria) : "—"}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: "var(--muted)",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11,
                        }}
                      >
                        {doc.fuente || "—"}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {/* Botón editar */}
                        <button
                          onClick={() => setEditTarget(doc)}
                          title="Editar documento"
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border: "1px solid transparent",
                            background: "transparent",
                            color: "var(--muted)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--accent)15";
                            e.currentTarget.style.color = "var(--accent)";
                            e.currentTarget.style.borderColor =
                              "var(--accent)30";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--muted)";
                            e.currentTarget.style.borderColor = "transparent";
                          }}
                        >
                          <Icon d={Icons.edit} size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError("");
                            setDeleteTarget(doc);
                          }}
                          title="Eliminar documento"
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border: "1px solid transparent",
                            background: "transparent",
                            color: "var(--muted)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#ef444415";
                            e.currentTarget.style.color = "#ef4444";
                            e.currentTarget.style.borderColor = "#ef444430";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--muted)";
                            e.currentTarget.style.borderColor = "transparent";
                          }}
                        >
                          <Icon d={Icons.trash} size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              Página{" "}
              <strong style={{ color: "var(--text)" }}>{page + 1}</strong> de{" "}
              <strong style={{ color: "var(--text)" }}>{totalPages}</strong>
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                {
                  label: "Anterior",
                  icon: Icons.chevLeft,
                  action: () => setPage((p) => Math.max(0, p - 1)),
                  disabled: page === 0,
                },
                {
                  label: "Siguiente",
                  icon: Icons.chevRight,
                  action: () => setPage((p) => Math.min(totalPages - 1, p + 1)),
                  disabled: page >= totalPages - 1,
                },
              ].map(({ label, icon, action, disabled }) => (
                <button
                  key={label}
                  onClick={action}
                  disabled={disabled || loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: disabled ? "var(--muted)" : "var(--text)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.45 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  {label === "Anterior" && <Icon d={icon} size={13} />}
                  {label}
                  {label === "Siguiente" && <Icon d={icon} size={13} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── DATA ENTRY FORM (API real) ───────────────────────────────────────────────
interface DataEntryFormProps {
  onSuccess: () => void;
  theme: Record<string, string>;
  sector: SectorType;
}

const DataEntryForm: FC<DataEntryFormProps> = ({ onSuccess, sector }) => {
  const [form, setForm] = useState<DataEntryRequest>({
    titulo: "",
    categoria: "",
    subcategoria: "",
    content: "",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [charCount, setCharCount] = useState(0);

  const categorias = getCategorias(sector);
  const subcats = form.categoria ? (categorias[form.categoria] ?? []) : [];

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "content") setCharCount(value.length);
    if (name === "categoria")
      setForm((prev) => ({ ...prev, categoria: value, subcategoria: "" }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.titulo || !form.categoria || !form.content.trim()) {
      setErrorMsg("Título, categoría y contenido son obligatorios.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await api("/admin/load-data", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          subcategoria: form.subcategoria || "general",
        }),
      });
      setStatus("success");
      setForm({ titulo: "", categoria: "", subcategoria: "", content: "" });
      setCharCount(0);
      onSuccess();
      setTimeout(() => setStatus("idle"), 3500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al vectorizar el documento.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const isLoading = status === "loading";
  const canSubmit =
    !isLoading &&
    form.titulo !== "" &&
    form.categoria !== "" &&
    form.content.trim() !== "";

  const inp: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
    marginBottom: 12,
    transition: "border-color 0.2s",
  };
  const selectStyle: CSSProperties = {
    ...inp,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
  };
  const lbl: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--muted)",
    display: "block",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--accent)18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
          }}
        >
          <Icon d={Icons.brain} size={15} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            Inyectar Conocimiento
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
            El contenido será vectorizado y disponible para Yoko inmediatamente
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ padding: 20, display: "flex", flexDirection: "column" }}
      >
        <label style={lbl}>
          Título del documento <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <input
          name="titulo"
          value={form.titulo}
          onChange={handleChange}
          placeholder={DOC_TITLE_PLACEHOLDERS[sector]}
          disabled={isLoading}
          style={inp}
        />

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div>
            <label style={lbl}>
              Categoría <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              disabled={isLoading}
              style={selectStyle}
            >
              <option value="">Seleccionar…</option>
              {Object.keys(categorias).map((c) => (
                <option key={c} value={c}>
                  {formatLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>
              Subcategoría{" "}
              <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                (opcional)
              </span>
            </label>
            <select
              name="subcategoria"
              value={form.subcategoria}
              onChange={handleChange}
              disabled={isLoading || subcats.length === 0}
              style={{
                ...selectStyle,
                opacity: subcats.length === 0 ? 0.5 : 1,
              }}
            >
              <option value="">General</option>
              {subcats.map((s) => (
                <option key={s} value={s}>
                  {formatLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 5,
          }}
        >
          <label style={{ ...lbl, marginBottom: 0 }}>
            Contenido a vectorizar{" "}
            <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <span
            style={{
              fontSize: 11,
              color: charCount > 50000 ? "var(--danger)" : "var(--muted)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {charCount.toLocaleString()} chars
          </span>
        </div>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Pega aquí el texto del documento. Será fragmentado automáticamente en chunks para el vector store…"
          rows={10}
          style={{
            ...inp,
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        />

        {status === "success" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#22c55e14",
              border: "1px solid #22c55e30",
              color: "#22c55e",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            <Icon d={Icons.check} size={14} /> Documento vectorizado
            exitosamente. Yoko ya puede responder sobre él.
          </div>
        )}
        {status === "error" && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--danger)12",
              border: "1px solid var(--danger)30",
              color: "var(--danger)",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: "11px",
            borderRadius: 10,
            border: "none",
            background: canSubmit ? "var(--accent)" : "var(--border)",
            color: canSubmit ? "#fff" : "var(--muted)",
            fontSize: 14,
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
        >
          {isLoading ? (
            <>
              <svg
                style={{
                  width: 16,
                  height: 16,
                  animation: "spin 1s linear infinite",
                }}
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  opacity="0.25"
                />
                <path
                  d="M4 12a8 8 0 018-8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>{" "}
              Vectorizando…
            </>
          ) : (
            <>
              <Icon d={Icons.upload} size={16} /> Subir al Knowledge Base
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// ─── UPLOAD PANEL (tab "docs") — integra Form + Table ────────────────────────
interface UploadPanelProps {
  theme: Record<string, string>;
  sector: SectorType;
}
interface UpdateDocRequest {
  titulo: string;
  categoria: string;
  subcategoria: string;
  content: string;
  fuente: string;
}
const UploadPanel: FC<UploadPanelProps> = ({ theme, sector }) => {
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleSuccess = useCallback(() => {
    setRefreshSignal((s) => s + 1);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <DataEntryForm onSuccess={handleSuccess} theme={theme} sector={sector} />
      <DocumentTable
        refreshSignal={refreshSignal}
        theme={theme}
        onRefresh={handleSuccess}
        sector={sector}
      />
    </div>
  );
};

// ─── USERS TABLE ──────────────────────────────────────────────────────────────
const UsersTable: FC = () => {
  const { data: users, loading } = useUsers();
  const [search, setSearch] = useState("");
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          Usuarios
        </h3>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
            }}
          >
            <Icon d={Icons.search} size={14} />
          </span>
          <input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            placeholder="Buscar..."
            style={{
              padding: "8px 12px 8px 32px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 13,
              outline: "none",
              width: 200,
            }}
          />
        </div>
      </div>
      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          Cargando usuarios...
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {[
                  "Nombre",
                  "Email",
                  "Sesiones",
                  "Mensajes",
                  "Último acceso",
                  "Estado",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "0 12px 10px",
                      color: "var(--muted)",
                      fontWeight: 500,
                      fontSize: 12,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text)",
                      fontWeight: 500,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "var(--accent)25",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--accent)",
                        }}
                      >
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>
                    {u.email}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {u.sessionCount}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {u.messageCount}
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>
                    {u.lastActive
                      ? new Date(u.lastActive).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 9px",
                        borderRadius: 20,
                        background:
                          u.status === "activo" ? "#22c55e20" : "#94a3b820",
                        color: u.status === "activo" ? "#22c55e" : "#94a3b8",
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
            {filtered.length} usuarios
          </div>
        </div>
      )}
    </div>
  );
};

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
const Overview: FC = () => {
  const { data: stats, loading } = useStats();
  if (loading || !stats)
    return (
      <div style={{ color: "var(--muted)", fontSize: 13 }}>
        Cargando estadísticas...
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        <StatCard
          label="Usuarios"
          value={stats.totalUsers}
          icon="users"
          color="#6366f1"
        />
        <StatCard
          label="Sesiones activas"
          value={stats.activeSessions}
          icon="sessions"
          color="#22c55e"
        />
        <StatCard
          label="Mensajes totales"
          value={stats.totalMessages}
          icon="messages"
          color="#f59e0b"
          sparkData={stats.messagesLastWeek}
        />
        <StatCard
          label="Documentos"
          value={stats.totalDocuments}
          icon="docs"
          color="#06b6d4"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3
            style={{
              margin: "0 0 18px",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Preguntas más frecuentes
          </h3>
          {stats.topQuestions.map((q, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--text)",
                    flex: 1,
                    marginRight: 12,
                  }}
                >
                  {q.question}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {q.count}
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: "var(--border)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background: "#6366f1",
                    width: `${(q.count / stats.topQuestions[0].count) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3
            style={{
              margin: "0 0 18px",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Mensajes últimos 7 días
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              height: 120,
            }}
          >
            {stats.messagesLastWeek.map((v, i) => {
              const max = Math.max(...stats.messagesLastWeek);
              const days = ["L", "M", "X", "J", "V", "S", "D"];
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      borderRadius: "4px 4px 0 0",
                      background: i === 6 ? "#6366f1" : "#6366f130",
                      height: `${(v / max) * 90}px`,
                      transition: "height 0.3s",
                    }}
                  />
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>
                    {days[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}

export default function YokoAdmin(): JSX.Element {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("yoko_admin_token"),
  );
  const [tab, setTab] = useState<TabId>("overview");
  const [dark, setDark] = useState<boolean>(true);
  const [sessionKey, setSessionKey] = useState(0);
  const [sector, setSector] = useState<SectorType>(() => {
    const stored = localStorage.getItem("yoko_sector");
    return (stored as SectorType) || "educacion";
  });
  const [userName, setUserName] = useState<string>(
    () => localStorage.getItem("yoko_user_name") || "",
  );
  const [orgName, setOrgName] = useState<string>(
    () => localStorage.getItem("yoko_org_name") || "",
  );

  const logout = (): void => {
    localStorage.removeItem("yoko_admin_token");
    localStorage.removeItem("yoko_sector");
    localStorage.removeItem("yoko_user_name");
    localStorage.removeItem("yoko_org_name");
    localStorage.removeItem("yoko_token");
    setToken(null);
    setUserName("");
    setOrgName("");
    setSessionKey(0);
  };

  const handleLogin = (data: AuthResponse): void => {
    localStorage.setItem("yoko_admin_token", data.token);
    const rawSector = data.user?.organizationSector ?? data.user?.sector;
    const normalizedSector = rawSector
      ? (rawSector.toLowerCase() as SectorType)
      : "educacion";
    localStorage.setItem("yoko_sector", normalizedSector);
    localStorage.setItem("yoko_user_name", data.user?.name ?? "");
    localStorage.setItem("yoko_org_name", data.user?.organizationName ?? "");
    setSector(normalizedSector);
    setUserName(data.user?.name ?? "");
    setOrgName(data.user?.organizationName ?? "");
    setSessionKey((k) => k + 1);
    setToken(data.token);
  };

  const theme: Record<string, string> = {
    "--bg": dark ? "#0f1117" : "#f8f9fa",
    "--card": dark ? "#161b27" : "#ffffff",
    "--border": dark ? "#1e2736" : "#e5e7eb",
    "--text": dark ? "#e8eaf0" : "#111827",
    "--muted": dark ? "#64748b" : "#9ca3af",
    "--accent": "#6366f1",
    "--danger": "#ef4444",
  };

  if (!token)
    return (
      <div style={theme as CSSProperties}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono&display=swap'); *{font-family:'DM Sans',sans-serif;} body{margin:0;background:${theme["--bg"]};}`}</style>
        <LoginPage onLogin={handleLogin} />
      </div>
    );

  const tabs: TabDef[] = [
    { id: "overview", label: "Resumen", icon: Icons.sessions },
    { id: "users", label: "Usuarios", icon: Icons.users },
    { id: "docs", label: "Documentos", icon: Icons.docs },
  ];

  const pageTitle: Record<TabId, string> = {
    overview: "Resumen general",
    users: "Usuarios",
    docs: "Knowledge Base",
  };
  const pageSubtitle: Record<TabId, string> = {
    overview: "Estado general del sistema Yoko",
    users: "Usuarios de tu organización",
    docs: "Inyecta y gestiona el conocimiento del RAG",
  };

  return (
    <div
      style={{
        ...(theme as CSSProperties),
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono&display=swap');
        *{font-family:'DM Sans',sans-serif;box-sizing:border-box;} body{margin:0;}
        ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}
        select option{background:#161b27;color:#e8eaf0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>

      {/* Sidebar */}
      <div
        style={{
          ...(theme as CSSProperties),
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 220,
          background: "var(--card)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
        }}
      >
        <div
          style={{
            padding: "0 20px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Icon d={Icons.bot} size={18} />
            </div>
            <div>
              <div
                style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}
              >
                {orgName || "Yoko"}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                {userName} · {sector.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                background: tab === t.id ? "var(--accent)18" : "transparent",
                color: tab === t.id ? "var(--accent)" : "var(--muted)",
                fontSize: 14,
                fontWeight: tab === t.id ? 600 : 400,
                marginBottom: 4,
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <Icon d={t.icon} size={16} /> {t.label}
            </button>
          ))}
        </nav>

        <div
          style={{
            padding: "16px 12px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={() => setDark((d) => !d)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: "var(--muted)",
              fontSize: 13,
              textAlign: "left",
            }}
          >
            {dark ? "☀️" : "🌙"} {dark ? "Modo claro" : "Modo oscuro"}
          </button>
          <button
            onClick={logout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: "#ef4444",
              fontSize: 13,
              textAlign: "left",
            }}
          >
            <Icon d={Icons.logout} size={14} /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          ...(theme as CSSProperties),
          marginLeft: 220,
          padding: "32px",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            {pageTitle[tab]}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--muted)" }}>
            {pageSubtitle[tab]}
          </p>
        </div>
        {tab === "overview" && <Overview />}
        {tab === "users" && <UsersTable />}
        {tab === "docs" && <UploadPanel theme={theme} sector={sector} />}
      </div>
    </div>
  );
}
