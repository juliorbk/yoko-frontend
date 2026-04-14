import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  GraduationCap,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import api from "../api/axiosConfig";
import { cn } from "../lib/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const Register = () => {
  // 1. Alinear los nombres exactamente con el DTO de Spring Boot
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    career: "", // Cambiado de 'major' a 'career'
    currentSemester: "", // Agregado el semestre
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 2. Preparamos el payload convirtiendo el semestre a número
      const payload = {
        name: formData.name,
        email: formData.email,
        career: formData.career,
        password: formData.password,
        currentSemester: parseInt(formData.currentSemester), // <-- Spring exige un Integer
      };
      await api.post("/auth/register", payload);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al registrarse. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-100/20">
            <CheckCircle2 className="text-green-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            ¡Registro Exitoso!
          </h1>
          <p className="text-slate-500 mt-2">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fondo-lr">
      <div className="w-full max-w-md rounded-2xl shadow-xl p-8 border border-primary/50">
        <div className="text-center mb-8">
          <div className="image-container">
            <img src="/public/yoko.svg" className="brightness-115 p-0" />
          </div>
          <h1 className="text-2xl font-bold text-azulUnegDark">
            Únete a Yoko AI
          </h1>
          <p className="text-slate-500 mt-2">
            Crea tu cuenta de estudiante UNEG
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-azulUnegDark">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-azulUnegDark w-5 h-5" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="lr-input"
                placeholder="Juan Pérez"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-azulUnegDark">
              Correo Institucional
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-azulUnegDark w-5 h-5" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="lr-input"
                placeholder="estudiante@uneg.edu.ve"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-azulUnegDark">
              Carrera
            </label>
            <div className="lr-input pl-0! pr-0! relative">
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-azulUnegDark w-5 h-5" />
              <select
                name="career" // <-- CAMBIADO DE 'major' a 'career'
                required
                value={formData.career}
                onChange={handleChange}
                className="w-full bg-slate-50 pl-12 pr-4 focus:outline-none  transition-all appearance-none"
              >
                <option value="" disabled>
                  Selecciona tu carrera
                </option>
                <option value="Ingeniería Informática">
                  Ingeniería Informática
                </option>
                <option value="Ingeniería Industrial">
                  Ingeniería Industrial
                </option>
                <option value="Administración de Empresas">
                  Administración de Empresas
                </option>
                <option value="Contaduría Pública">Contaduría Pública</option>
                <option value="Educación">Educación</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-azulUnegDark ml-1">
              Semestre Actual
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-azulUnegDark w-5 h-5" />
              <input
                type="number"
                name="currentSemester"
                required
                min="1"
                max="10"
                value={formData.currentSemester}
                onChange={handleChange}
                className="lr-input"
                placeholder="Ej. 7"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-azulUnegDark ml-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-azulUnegDark w-5 h-5" />
              <button
                id="eye-password"
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
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="lr-input"
                placeholder="*********"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full bg-azulUneg hover:bg-azulUnegDark hover:text-on-primary text-primary font-semibold py-3 rounded-4xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4",
              loading && "opacity-70 cursor-not-allowed",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "REGISTRARSE"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-azulUneg text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link
              to="/login"
              className="text-azulUnegDark font-semibold hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
