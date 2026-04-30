import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import api from "../api/axiosConfig";
import { cn } from "../lib/utils";

const SECTORS = [
  { value: "EDUCACION", label: "Educación" },
  { value: "HOSPITALIDAD", label: "Hospitalidad" },
  { value: "CORPORATIVO", label: "Corporativo" },
  { value: "VENTAS", label: "Ventas" },
  { value: "SALUD", label: "Salud" },
  { value: "MANUFACTURA", label: "Manufactura" },
  { value: "OTRO", label: "Otro" },
];

interface OrgRegisterForm {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  sector: string;
}

interface FieldErrors {
  organizationName?: string;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
  sector?: string;
}

const RegisterOrganization = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<OrgRegisterForm>({
    organizationName: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    sector: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!form.organizationName.trim())
      errs.organizationName = "El nombre de la organización es requerido";
    if (!form.sector.trim())
      errs.sector = "El sector de la organización es requerido";
    if (!form.adminName.trim())
      errs.adminName = "El nombre del administrador es requerido";
    if (!form.adminEmail.trim()) errs.adminEmail = "El correo es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail))
      errs.adminEmail = "Formato de correo inválido";
    if (!form.adminPassword.trim())
      errs.adminPassword = "La contraseña es requerida";
    else if (form.adminPassword.length < 6)
      errs.adminPassword = "Mínimo 6 caracteres";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/register-organization", form);
      if (response.status === 401 || response.status === 500) {
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 2000);
      }
      const { token, user } = response.data;

      localStorage.setItem("yoko_token", token);
      localStorage.setItem("yoko_user", JSON.stringify(user));

      navigate("/admin");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al registrar la organización. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fondo-lr">
      <div className="w-full max-w-md lr-form rounded-2xl shadow-xl p-8 border border-primary/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="image-container">
            <img src="/yoko.svg" className="brightness-115 p-0" />
          </div>
          <h1 className="text-2xl font-bold text-azulUneg">
            REGISTRA TU ORGANIZACIÓN
          </h1>
          <p className="text-azulUneg/60 text-sm mt-1">
            Crea tu cuenta empresarial en Yoko AI
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Error global */}
          {error && (
            <div className="bg-white border border-azulUnegDark text-azulUnegDark px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Nombre de la organización */}
          <div>
            <div className="relative">
              <Building2 className="input-icon" />
              <input
                type="text"
                name="organizationName"
                value={form.organizationName}
                onChange={handleChange}
                className="lr-input"
                placeholder="Nombre de la Organización"
              />
            </div>
            {fieldErrors.organizationName && (
              <p className="text-red-500 text-xs mt-1 pl-1">
                {fieldErrors.organizationName}
              </p>
            )}
          </div>

          {/* Nombre del admin */}
          <div>
            <div className="relative">
              <User className="input-icon" />
              <input
                type="text"
                name="adminName"
                value={form.adminName}
                onChange={handleChange}
                className="lr-input"
                placeholder="Nombre del Administrador"
              />
            </div>
            {fieldErrors.adminName && (
              <p className="text-red-500 text-xs mt-1 pl-1">
                {fieldErrors.adminName}
              </p>
            )}
          </div>

          {/* Correo */}
          <div>
            <div className="relative">
              <Mail className="input-icon" />
              <input
                type="email"
                name="adminEmail"
                value={form.adminEmail}
                onChange={handleChange}
                className="lr-input"
                placeholder="Correo Electrónico"
              />
            </div>
            {fieldErrors.adminEmail && (
              <p className="text-red-500 text-xs mt-1 pl-1">
                {fieldErrors.adminEmail}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <div className="relative">
              <Lock className="input-icon" />
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-azulUnegDark/75 w-5 h-5"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FontAwesomeIcon icon={faEyeSlash} />
                ) : (
                  <FontAwesomeIcon icon={faEye} />
                )}
              </button>
              <input
                type={showPassword ? "text" : "password"}
                name="adminPassword"
                value={form.adminPassword}
                onChange={handleChange}
                className="lr-input"
                placeholder="Contraseña"
              />
            </div>
            {fieldErrors.adminPassword && (
              <p className="text-red-500 text-xs mt-1 pl-1">
                {fieldErrors.adminPassword}
              </p>
            )}
          </div>
          {/* Sector de la organización */}
          <div>
            <div className="relative">
              <Building2 className="input-icon" />
              <select
                name="sector"
                value={form.sector}
                onChange={handleChange}
                className="lr-input pr-10 appearance-none"
              >
                <option value="" disabled>
                  Sector de la Organización
                </option>
                {SECTORS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-azulUnegDark/50 pointer-events-none" />
            </div>
            {fieldErrors.sector && (
              <p className="text-red-500 text-xs mt-1 pl-1">
                {fieldErrors.sector}
              </p>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full bg-azulUneg hover:bg-azulUnegDark hover:text-on-primary text-primary font-semibold py-3 rounded-4xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2",
              loading && "opacity-70 cursor-not-allowed",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando organización...
              </>
            ) : (
              "CREAR ORGANIZACIÓN"
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          <p className="text-azulUneg text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to="/login"
              className="text-azulUnegDark font-semibold hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
          <p className="text-azulUneg text-sm">
            ¿Eres estudiante?{" "}
            <Link
              to="/register"
              className="text-azulUnegDark font-semibold hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterOrganization;
