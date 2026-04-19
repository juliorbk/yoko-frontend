import {
  useState,
  useRef,
  useEffect,
  type FC,
  type FormEvent,
  type DragEvent,
  type ChangeEvent,
  type CSSProperties,
  type JSX,
} from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8080/api";

const api = async <T = unknown,>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = localStorage.getItem("yoko_admin_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TabId = "overview" | "users" | "docs";
type DocStatus = "vectorizado" | "procesando" | "error" | "subiendo";
type UserStatus = "activo" | "inactivo";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  career: string;
  currentSemester: number;
}
interface AuthResponse {
  token: string;
  user: UserData;
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
  sessions: number;
  messages: number;
  lastActive: string;
  status: UserStatus;
}

interface Doc {
  id: string | number;
  name: string;
  file: string;
  chunks: number | string;
  uploadedAt: string;
  status: DocStatus;
}

interface UploadEntry {
  id: number;
  name: string;
  file: string;
  status: DocStatus;
  progress: number;
}

// Espeja exactamente el DataEntryRequest del backend
interface DataEntryRequest {
  content: string;
  titulo: string;
  categoria: string;
  subcategoria: string;
}

interface Theme extends Record<string, string> {
  "--bg": string;
  "--card": string;
  "--border": string;
  "--text": string;
  "--muted": string;
  "--accent": string;
  "--danger": string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// const MOCK_STATS: Stats = {
//   totalUsers: 348,
//   activeSessions: 12,
//   totalMessages: 5821,
//   totalDocuments: 23,
//   messagesLastWeek: [42, 87, 63, 110, 95, 78, 134],
//   topQuestions: [
//     { question: "¿Cómo me inscribo en pasantías?", count: 84 },
//     { question: "¿Cuál es el pensum de Informática?", count: 71 },
//     { question: "¿Fechas de inscripción?", count: 65 },
//     { question: "¿Cómo solicito constancia de estudios?", count: 58 },
//     { question: "¿Requisitos para trabajo de grado?", count: 47 },
//   ],
// };

const MOCK_DOCS: Doc[] = [
  {
    id: "d-1",
    name: "Reglamento Estudiantil",
    file: "reglamento_estudiantil.pdf",
    chunks: 142,
    uploadedAt: "2024-11-10",
    status: "vectorizado",
  },
  {
    id: "d-2",
    name: "Reglamento de Pasantías",
    file: "reglamento_pasantia.pdf",
    chunks: 87,
    uploadedAt: "2024-11-12",
    status: "vectorizado",
  },
  {
    id: "d-3",
    name: "Pensum Ingeniería Informática",
    file: "pensum_informatica.pdf",
    chunks: 53,
    uploadedAt: "2024-12-01",
    status: "vectorizado",
  },
  {
    id: "d-4",
    name: "Calendario Académico 2025",
    file: "calendario_2025.pdf",
    chunks: 31,
    uploadedAt: "2025-01-15",
    status: "vectorizado",
  },
  {
    id: "d-5",
    name: "Normas de Trabajo de Grado",
    file: "normas_teg.pdf",
    chunks: 0,
    uploadedAt: "2025-03-22",
    status: "procesando",
  },
];

// ─── API HOOKS ────────────────────────────────────────────────────────────────
// Para conectar al backend real: comenta la línea MOCK y descomenta la línea REAL

function useStats(): { data: Stats | null; loading: boolean } {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Stats>("/admin/stats")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

function useUsers(): { data: User[]; loading: boolean } {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<User[]>("/admin/users")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

function useDocs(): { data: Doc[]; loading: boolean; reload: () => void } {
  const [data, setData] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const reload = () => setTick((t) => t + 1);
  useEffect(() => {
    setLoading(true);
    // REAL: api<Doc[]>("/admin/documents").then(setData).finally(() => setLoading(false));
    // MOCK:
    setTimeout(() => {
      setData(MOCK_DOCS);
      setLoading(false);
    }, 400);
  }, [tick]);
  return { data, loading, reload };
}

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────
// Ajusta estos valores para que coincidan con los que usa tu backend
const CATEGORIAS: Record<string, string[]> = {
  reglamento: ["general", "pasantias", "inscripcion", "disciplina", "grado"],
  pensum: ["informatica", "civil", "industrial", "ambiental", "electronica"],
  calendario: ["academico", "administrativo"],
  informacion_general: ["historia", "mision_vision", "autoridades", "contacto"],
  tramites: ["constancias", "retiro", "equivalencias", "cambio_carrera"],
  horario: ["semestre 8"], //modificar según las subcategorías que maneje tu backend
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const statusColor = (s: DocStatus): string =>
  ({
    vectorizado: "#22c55e",
    procesando: "#f59e0b",
    error: "#ef4444",
    subiendo: "#60a5fa",
  })[s] ?? "#60a5fa";

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13,
  boxSizing: "border-box",
  marginBottom: 12,
  outline: "none",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
};

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

// Asegúrate de que tu interfaz incluya el rol (ajústalo a cómo lo envíe tu backend)
interface AuthResponse {
  token: string;
  role: string; // o quizas data.user.role
}

const LoginPage: FC<{ onLogin: (token: string) => void }> = ({ onLogin }) => {
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

      // ─── VALIDACIÓN DE ROL AQUÍ ───
      // Ajusta "ADMIN" al texto exacto que devuelva tu Spring Boot (ej: "ROLE_ADMIN")
      if (data.user.role !== "ADMIN") {
        setError("Acceso denegado: No tienes permisos de administrador.");
        return; // Detenemos la ejecución, no guardamos token ni logueamos el usuario
      }

      // Si pasa la validación, lo dejamos entrar
      localStorage.setItem("yoko_admin_token", data.token);
      onLogin(data.token);
    } catch (err) {
      // Tu fallback de demostración
      if (pass === "admin") {
        localStorage.setItem("yoko_admin_token", "demo-token");
        onLogin("demo-token");
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

// ─── UPLOAD PANEL ─────────────────────────────────────────────────────────────
const UploadPanel: FC = () => {
  const { data: remoteDocs, loading: docsLoading, reload } = useDocs();

  // Estado del formulario — espeja DataEntryRequest del backend
  const [content, setContent] = useState("");
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // Estado del file upload (stub para el feat de PDF)
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const subcats = categoria ? (CATEGORIAS[categoria] ?? []) : [];

  const handleCategoria = (val: string) => {
    setCategoria(val);
    setSubcategoria("");
  };

  // ── Envía texto al endpoint ───────────────────────────────────────────────
  const submitText = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!content.trim() || !titulo.trim() || !categoria) return;
    setSubmitting(true);
    setFormError("");
    setSuccess(false);

    const body: DataEntryRequest = {
      content,
      titulo,
      categoria,
      subcategoria: subcategoria || "general",
    };
    console.log("Enviando al backend:", body);
    try {
      await api("/admin/load-data", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setSuccess(true);
      setContent("");
      setTitulo("");
      setCategoria("");
      setSubcategoria("");
      reload();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al vectorizar.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── File upload (para cuando implementes chunking de PDF) ─────────────────
  const addFiles = (newFiles: FileList | null): void => {
    if (!newFiles) return;
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    setFiles((prev) => [
      ...prev,
      ...Array.from(newFiles).filter((f) => allowed.includes(f.type)),
    ]);
  };

  const submitFile = async (): Promise<void> => {
    if (!files.length || !titulo || !categoria) return;
    const entry: UploadEntry = {
      id: Date.now(),
      name: titulo,
      file: files[0].name,
      status: "subiendo",
      progress: 0,
    };
    setUploads((prev) => [entry, ...prev]);
    setFiles([]);

    for (let p = 0; p <= 90; p += 15) {
      await new Promise<void>((r) => setTimeout(r, 180));
      setUploads((prev) =>
        prev.map((u) => (u.id === entry.id ? { ...u, progress: p } : u)),
      );
    }
    try {
      const form = new FormData();
      form.append("file", files[0]);
      form.append("titulo", titulo);
      form.append("categoria", categoria);
      form.append("subcategoria", subcategoria || "general");
      await fetch(`${API_BASE}/admin/data-entry/file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("yoko_admin_token") ?? ""}`,
        },
        body: form,
      });
      setUploads((prev) =>
        prev.map((u) =>
          u.id === entry.id
            ? { ...u, status: "vectorizado", progress: 100 }
            : u,
        ),
      );
      reload();
    } catch {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === entry.id ? { ...u, status: "error", progress: 100 } : u,
        ),
      );
    }
  };

  const allDocs: Doc[] = [
    ...remoteDocs,
    ...uploads.map((u) => ({
      id: u.id,
      name: u.name,
      file: u.file,
      chunks: "—" as const,
      uploadedAt: "hoy",
      status: u.status,
    })),
  ];

  const lbl: CSSProperties = {
    fontSize: 12,
    color: "var(--muted)",
    display: "block",
    marginBottom: 5,
  };
  const inp: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: 13,
    boxSizing: "border-box",
    marginBottom: 12,
    outline: "none",
  };
  const canSubmit =
    !submitting && content.trim() !== "" && titulo !== "" && categoria !== "";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* ── Formulario ────────────────────────────────────────────────────── */}
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
            margin: "0 0 20px",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          Cargar conocimiento
        </h3>

        <form
          onSubmit={submitText}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <label style={lbl}>Título institucional</label>
          <input
            value={titulo}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTitulo(e.target.value)
            }
            placeholder="ej: Reglamento Estudiantil"
            required
            style={inp}
          />

          <label style={lbl}>Categoría</label>
          <select
            value={categoria}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              handleCategoria(e.target.value)
            }
            required
            style={selectStyle}
          >
            <option value="">Selecciona una categoría</option>
            {Object.keys(CATEGORIAS).map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          {subcats.length > 0 && (
            <>
              <label style={lbl}>
                Subcategoría{" "}
                <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                  (opcional)
                </span>
              </label>
              <select
                value={subcategoria}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setSubcategoria(e.target.value)
                }
                style={selectStyle}
              >
                <option value="">General</option>
                {subcats.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </>
          )}

          <label style={lbl}>Contenido a vectorizar</label>
          <textarea
            value={content}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setContent(e.target.value)
            }
            placeholder="Pega aquí el texto del documento..."
            required
            rows={9}
            style={{
              ...inp,
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
          />

          {formError && (
            <div
              style={{
                fontSize: 13,
                color: "var(--danger)",
                background: "var(--danger)18",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
              }}
            >
              {formError}
            </div>
          )}
          {success && (
            <div
              style={{
                fontSize: 13,
                color: "#22c55e",
                background: "#22c55e18",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon d={Icons.check} size={14} /> Documento vectorizado
              correctamente
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
            }}
          >
            <Icon d={Icons.upload} size={16} />
            {submitting ? "Vectorizando..." : "Vectorizar y guardar"}
          </button>
        </form>

        {/* ── File upload stub ──────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Subir archivo (PDF / chunking)</span>
            <span
              style={{
                background: "var(--border)",
                padding: "2px 8px",
                borderRadius: 20,
                fontSize: 11,
              }}
            >
              próximamente
            </span>
          </div>
          <div
            onDragOver={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 12,
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
              background: dragging ? "var(--accent)08" : "var(--bg)",
              transition: "all 0.2s",
            }}
          >
            <Icon d={Icons.upload} size={22} />
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text)" }}>
              {files.length
                ? `${files.length} archivo(s) seleccionado(s)`
                : "Arrastra o haz clic"}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
              PDF, TXT, DOCX
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.txt,.docx"
              style={{ display: "none" }}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                addFiles(e.target.files)
              }
            />
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "7px 10px",
                    background: "var(--bg)",
                    borderRadius: 8,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--text)" }}>
                    {f.name}
                  </span>
                  <button
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                      padding: 2,
                    }}
                  >
                    <Icon d={Icons.x} size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={submitFile}
                disabled={!titulo || !categoria}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "9px",
                  borderRadius: 10,
                  border: "none",
                  background: titulo && categoria ? "#0ea5e9" : "var(--border)",
                  color: titulo && categoria ? "#fff" : "var(--muted)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: titulo && categoria ? "pointer" : "not-allowed",
                }}
              >
                Subir archivo
              </button>
            </div>
          )}

          {uploads.map((u) => (
            <div key={u.id} style={{ marginTop: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span style={{ color: "var(--text)" }}>{u.name}</span>
                <span style={{ color: statusColor(u.status) }}>{u.status}</span>
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
                    background: statusColor(u.status),
                    width: `${u.progress}%`,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lista de documentos ────────────────────────────────────────────── */}
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
            margin: "0 0 20px",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          Documentos cargados
        </h3>
        {docsLoading ? (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Cargando...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {allDocs.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  background: "var(--bg)",
                  borderRadius: 10,
                }}
              >
                <div style={{ color: "var(--accent)", flexShrink: 0 }}>
                  <Icon d={Icons.docs} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {doc.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {doc.chunks} chunks · {doc.uploadedAt}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: `${statusColor(doc.status)}20`,
                    color: statusColor(doc.status),
                    flexShrink: 0,
                  }}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
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
                    {u.sessions}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {u.messages}
                  </td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>
                    {u.lastActive}
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

  const logout = (): void => {
    localStorage.removeItem("yoko_admin_token");
    setToken(null);
  };

  const theme: Theme = {
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
        <LoginPage onLogin={setToken} />
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
    docs: "Documentos",
  };
  const pageSubtitle: Record<TabId, string> = {
    overview: "Estado general del sistema Yoko",
    users: "Estudiantes registrados en la plataforma",
    docs: "Gestión de conocimiento vectorizado",
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
                Yoko
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Admin Panel
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
        {tab === "docs" && <UploadPanel />}
      </div>
    </div>
  );
}
