import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { isAdmin, isBibliotecario, isLector } from "./utils/roles";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import DashboardAdmin from "./components/dashboards/DashboardAdmin";
import DashboardBibliotecario from "./components/dashboards/DashboardBibliotecario";
import DashboardLector from "./components/dashboards/DashboardLector";

function App() {
  const { user } = useAuth();
  const [view, setView] = useState("login");

  if (!user) {
    if (view === "login") {
      return (
        <Login
          onSwitchToRegister={() => setView("register")}
          onSwitchToForgotPassword={() => setView("forgot-password")}
        />
      );
    } else if (view === "register") {
      return <Register onSwitchToLogin={() => setView("login")} />;
    } else if (view === "forgot-password") {
      return <ForgotPassword onBackToLogin={() => setView("login")} />;
    }
  }

  // Renderizar dashboard según rol
  if (isAdmin(user)) {
    return <DashboardAdmin />;
  } else if (isBibliotecario(user)) {
    return <DashboardBibliotecario />;
  } else if (isLector(user)) {
    return <DashboardLector />;
  }

  // Fallback si no tiene rol reconocido
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Rol no reconocido
        </h1>
        <p className="text-gray-600 mb-6">
          Tu rol "{user.rol}" no tiene permisos asignados.
        </p>
      </div>
    </div>
  );
}

export default App;
