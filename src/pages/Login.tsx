import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import api from "../api/axiosConfig";
import { cn } from "../lib/utils";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      

      localStorage.setItem("yoko_token", token);
      localStorage.setItem("yoko_user", JSON.stringify(user));

      if (user?.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Credenciales inválidas. Inténtalo de nuevo.",
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
            ¡BIENVENIDO A YOKO!
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-white border border-azulUnegDark text-azulUnegDark px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Correo */}
          <div className="relative">
            <Mail className="input-icon" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lr-input"
              placeholder="Correo Electrónico"
            />
          </div>

          {/* Contraseña */}
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="lr-input"
              placeholder="Contraseña"
            />
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
                Iniciando sesión...
              </>
            ) : (
              "INICIAR SESIÓN"
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          <p className="text-azulUneg text-sm">
            ¿No tienes una cuenta?{" "}
            <Link
              to="/register"
              className="text-azulUnegDark font-semibold hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
          <p className="text-azulUneg text-sm">
            ¿Registrar una organización?{" "}
            <Link
              to="/register-organization"
              className="text-azulUnegDark font-semibold hover:underline"
            >
              Click aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
