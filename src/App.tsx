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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/register-organization"
          element={<RegisterOrganization />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<Chat />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
