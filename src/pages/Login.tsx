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

      navigate("/chat");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Credenciales inválidas. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    //Contendor principal
    <div className="fondo-lr">
      <div className="w-full max-w-md lr-form rounded-2xl shadow-xl p-8 border border-primary/50">
        <div className="text-center mb-8">
          <div className="image-container">
            <img src="/yoko.svg" className="brightness-115 p-0" />
          </div>
          <h1 className="text-2xl font-bold  text-azulUneg">
            ¡BIENVENIDO A YOKO!
          </h1>
        </div>
        {/**Formulario */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="absolute top-4 left-1/48 bg-white border border-azulUnegDark text-azulUnegDark px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {/**Input correo */}
          <div id="entrada1" className="space-y-2 group">
            <label className="lr-label">Correo Institucional</label>
            <div className="relative">
              <Mail className="input-icon" />
              <input
                id="itEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lr-input"
                placeholder=""
              />
            </div>
          </div>
          {/**Input contrasenna */}
          <div id="entrada2" className="space-y-2 group">
            <label className="lr-label">Contraseña</label>
            <div className="relative">
              <Lock className="input-icon" />
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
                id="itPass"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="lr-input"
                placeholder=" "
              />
            </div>
          </div>
          {/**Boton iniciar sesión */}
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
        {/**rediccion a register */}
        <div className="mt-8 text-center">
          <p className="text-azulUneg text-sm">
            ¿No tienes una cuenta?{" "}
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

export default Login;
