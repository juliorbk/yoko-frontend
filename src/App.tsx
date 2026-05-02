import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterOrganization from "./pages/RegisterOrganization";
import SuperAdmin from "./pages/SuperAdmin";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/register-organization"
          element={<RegisterOrganization />}
        />

        {/* Rutas protegidas - usuarios/admins regulares */}
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* Super Admin - maneja su propia autenticación */}
        <Route path="/super" element={<SuperAdmin />} />

        {/* Redirección por defecto (corrige el typo: es <Navigate no <Navigate) */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
export default App;
