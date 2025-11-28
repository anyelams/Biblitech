import { useAuth } from "../../context/AuthContext";
import Avatar from "../Avatar";
import { useState, useEffect } from "react";
import DashboardHeader from "../shared/DashboardHeader";

// Importar secciones reutilizables del admin
import DashboardSection from "../admin/sections/DashboardSection";
import AuthorsSection from "../admin/sections/AuthorsSection";
import CategoriesSection from "../admin/sections/CategoriesSection";
import BooksSection from "../admin/sections/BooksSection";
import CopiesSection from "../admin/sections/CopiesSection";

import LoansSection from "../admin/sections/LoansSection";

function PasswordRequirement({ valid, text }) {
  return (
    <div className="flex items-center text-sm">
      <span className={valid ? "text-green-800" : "text-red-600"}>
        {valid ? "✓" : "✗"}
      </span>
      <span className={valid ? "text-green-800 ml-2" : "text-red-700 ml-2"}>
        {text}
      </span>
    </div>
  );
}

export default function DashboardBibliotecario() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("biblitech_sidebar_collapsed");
    return saved === "true";
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
    fecha_nacimiento: "",
  });

  // Password modal state
  const [passwordFormData, setPasswordFormData] = useState({
    contrasena_actual: "",
    contrasena_nueva: "",
    confirmar_contrasena: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  function renderActiveSection() {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "prestamos":
        return <LoansSection />;
      case "autores":
        return <AuthorsSection />;
      case "categorias":
        return <CategoriesSection />;
      case "libros":
        return <BooksSection />;
      case "ejemplares":
        return <CopiesSection />;
      default:
        return <DashboardSection />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } bg-white border-r border-gray-200 flex flex-col transition-all duration-300 sticky top-0 h-screen`}
      >
        {/* Logo */}
        <div
          className="border-b border-gray-200 flex items-center justify-between px-6 transition-all duration-300"
          style={{ height: "76px" }}
        >
          <img
            src={sidebarCollapsed ? "/bibli.png" : "/biblitech.png"}
            alt="Biblitech"
            className={`${
              sidebarCollapsed ? "h-8" : "h-12"
            } transition-all duration-300`}
          />
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Botón expandir cuando está colapsado */}
        {sidebarCollapsed && (
          <div className="px-4 mb-4 mt-4">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Navigation */}
        {/* Navigation */}
        <nav className="px-4 py-6 space-y-2 flex-1 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => setActiveSection("dashboard")}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center px-3" : "gap-3 px-4"
            } py-3 rounded-xl text-sm transition-all duration-300 ${
              activeSection === "dashboard"
                ? "bg-[#0071a4]/10 text-[#0071a4] font-semibold"
                : "text-gray-700 hover:bg-gray-100/60"
            }`}
            title={sidebarCollapsed ? "Panel" : ""}
          >
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {!sidebarCollapsed && "Panel"}
          </button>

          {/* Préstamos*/}

          <button
            onClick={() => setActiveSection("prestamos")}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center px-3" : "gap-3 px-4"
            } py-3 rounded-lg text-sm transition ${
              activeSection === "prestamos"
                ? "bg-[#0071a4]/10 text-[#0071a4] font-semibold"
                : "text-gray-700 hover:bg-gray-50 font-medium"
            }`}
            title={sidebarCollapsed ? "Préstamos" : ""}
          >
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            {!sidebarCollapsed && "Préstamos"}
          </button>

          {/* Separador visual (opcional) */}
          <div className="h-px bg-gray-200 my-2"></div>

          {/* Autores */}
          <button
            onClick={() => setActiveSection("autores")}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center px-3" : "gap-3 px-4"
            } py-3 rounded-xl text-sm transition-all duration-300 ${
              activeSection === "autores"
                ? "bg-[#0071a4]/10 text-[#0071a4] font-semibold"
                : "text-gray-700 hover:bg-gray-100/60"
            }`}
            title={sidebarCollapsed ? "Autores" : ""}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {!sidebarCollapsed && "Autores"}
          </button>

          {/* Libros */}
          <button
            onClick={() => setActiveSection("libros")}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center px-3" : "gap-3 px-4"
            } py-3 rounded-xl text-sm transition-all duration-300 ${
              activeSection === "libros"
                ? "bg-[#0071a4]/10 text-[#0071a4] font-semibold"
                : "text-gray-700 hover:bg-gray-100/60"
            }`}
            title={sidebarCollapsed ? "Libros" : ""}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            {!sidebarCollapsed && "Libros"}
          </button>

          {/* Ejemplares */}
          <button
            onClick={() => setActiveSection("ejemplares")}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center px-3" : "gap-3 px-4"
            } py-3 rounded-xl text-sm transition-all duration-300 ${
              activeSection === "ejemplares"
                ? "bg-[#0071a4]/10 text-[#0071a4] font-semibold"
                : "text-gray-700 hover:bg-gray-100/60"
            }`}
            title={sidebarCollapsed ? "Ejemplares" : ""}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
            {!sidebarCollapsed && "Ejemplares"}
          </button>

          {/* Categorías */}
          <button
            onClick={() => setActiveSection("categorias")}
            className={`w-full flex items-center ${
              sidebarCollapsed ? "justify-center px-3" : "gap-3 px-4"
            } py-3 rounded-xl text-sm transition-all duration-300 ${
              activeSection === "categorias"
                ? "bg-[#0071a4]/10 text-[#0071a4] font-semibold"
                : "text-gray-700 hover:bg-gray-100/60"
            }`}
            title={sidebarCollapsed ? "Categorías" : ""}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            {!sidebarCollapsed && "Categorías"}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Nuevo header reutilizable */}
        <DashboardHeader
          user={user}
          onLogout={logout}
          onShowProfile={() => {
            setProfileFormData({
              nombre: user.nombre || "",
              apellido: user.apellido || "",
              telefono: user.telefono || "",
              direccion: user.direccion || "",
              fecha_nacimiento: user.fecha_nacimiento || "",
            });
            setShowProfileModal(true);
          }}
          onShowPassword={() => setShowPasswordModal(true)}
        />
        {/* Content Area */}
        <main className="flex-1 p-8 overflow-auto">
          {renderActiveSection()}
        </main>
      </div>

      {/* Modal de Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Cambiar Contraseña
              </h3>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPasswordError("");

                // Validar que las contraseñas coincidan
                if (
                  passwordFormData.contrasena_nueva !==
                  passwordFormData.confirmar_contrasena
                ) {
                  setPasswordError("Las contraseñas nuevas no coinciden");
                  return;
                }

                // ✨ Validar requisitos de seguridad de la contraseña
                const pw = passwordFormData.contrasena_nueva;
                if (
                  pw.length < 8 ||
                  !/[A-Z]/.test(pw) ||
                  !/\d/.test(pw) ||
                  /\s/.test(pw)
                ) {
                  setPasswordError(
                    "La contraseña no cumple con todos los requisitos de seguridad"
                  );
                  return;
                }

                setLoading(true);
                try {
                  const token = localStorage.getItem("biblitech_access_token");
                  // Solo enviamos los 2 campos que espera el backend
                  const payload = {
                    contrasena_actual: passwordFormData.contrasena_actual,
                    contrasena_nueva: passwordFormData.contrasena_nueva,
                  };

                  const response = await fetch(
                    `/api/v1/usuarios/${user.id}/contrasena`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(payload),
                    }
                  );

                  if (response.ok) {
                    const data = await response.json();
                    setShowPasswordModal(false);
                    setPasswordFormData({
                      contrasena_actual: "",
                      contrasena_nueva: "",
                      confirmar_contrasena: "",
                    });
                    setShowPasswords({
                      actual: false,
                      nueva: false,
                      confirmar: false,
                    });
                    alert(
                      data.message || "Contraseña actualizada exitosamente"
                    );
                  } else {
                    let errorMsg = "Error al cambiar la contrase\u00f1a";
                    try {
                      const contentType = response.headers.get("content-type");
                      if (
                        contentType &&
                        contentType.includes("application/json")
                      ) {
                        const data = await response.json();
                        if (typeof data.detail === "string") {
                          errorMsg = data.detail;
                        } else if (
                          Array.isArray(data.detail) &&
                          data.detail.length > 0
                        ) {
                          errorMsg = data.detail
                            .map((err) => err.msg)
                            .join(", ");
                        } else if (data.detail?.msg) {
                          errorMsg = data.detail.msg;
                        }
                      } else {
                        errorMsg = `Error del servidor (${response.status})`;
                      }
                    } catch (parseError) {
                      errorMsg = `Error del servidor (${response.status})`;
                    }
                    setPasswordError(errorMsg);
                  }
                } catch (err) {
                  setPasswordError("Error al conectar con el servidor");
                } finally {
                  setLoading(false);
                }
              }}
              className="p-6 space-y-4"
            >
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.actual ? "text" : "password"}
                    required
                    value={passwordFormData.contrasena_actual}
                    onChange={(e) =>
                      setPasswordFormData({
                        ...passwordFormData,
                        contrasena_actual: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        actual: !showPasswords.actual,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.actual ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {/* Campo: Nueva Contraseña con Checklist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.nueva ? "text" : "password"}
                    required
                    value={passwordFormData.contrasena_nueva}
                    onChange={(e) =>
                      setPasswordFormData({
                        ...passwordFormData,
                        contrasena_nueva: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        nueva: !showPasswords.nueva,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.nueva ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Checklist de requisitos */}
                {passwordFormData.contrasena_nueva && (
                  <div className="mt-3 space-y-1">
                    <PasswordRequirement
                      valid={passwordFormData.contrasena_nueva.length >= 8}
                      text="Al menos 8 caracteres"
                    />
                    <PasswordRequirement
                      valid={/[A-Z]/.test(passwordFormData.contrasena_nueva)}
                      text="Al menos una letra mayúscula"
                    />
                    <PasswordRequirement
                      valid={/\d/.test(passwordFormData.contrasena_nueva)}
                      text="Al menos un número"
                    />
                    <PasswordRequirement
                      valid={!/\s/.test(passwordFormData.contrasena_nueva)}
                      text="Sin espacios"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirmar ? "text" : "password"}
                    required
                    minLength={8}
                    value={passwordFormData.confirmar_contrasena}
                    onChange={(e) =>
                      setPasswordFormData({
                        ...passwordFormData,
                        confirmar_contrasena: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        confirmar: !showPasswords.confirmar,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirmar ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordFormData({
                      contrasena_actual: "",
                      contrasena_nueva: "",
                      confirmar_contrasena: "",
                    });
                    setPasswordError("");
                    setShowPasswords({
                      actual: false,
                      nueva: false,
                      confirmar: false,
                    });
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#0071a4] text-white rounded-lg font-medium hover:bg-[#005a85] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Mi Perfil */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Mi Perfil</h3>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const token = localStorage.getItem("biblitech_access_token");
                  const payload = {
                    nombre: profileFormData.nombre,
                    apellido: profileFormData.apellido,
                    telefono: profileFormData.telefono,
                    direccion: profileFormData.direccion,
                    fecha_nacimiento: profileFormData.fecha_nacimiento,
                  };

                  const response = await fetch(
                    `/api/v1/usuarios/${user.id}/perfil`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(payload),
                    }
                  );

                  if (response.ok || response.status === 500) {
                    setShowProfileModal(false);
                    setProfileError("");
                    window.location.reload();
                  } else {
                    const data = await response.json();
                    setProfileError(
                      data.detail || "Error al actualizar perfil"
                    );
                  }
                } catch (err) {
                  setProfileError("Error al conectar con el servidor");
                } finally {
                  setLoading(false);
                }
              }}
              className="p-6"
            >
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <Avatar user={user} size="lg" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {user.nombre} {user.apellido}
                  </h4>
                  <p className="text-sm text-gray-500">{user.correo}</p>
                </div>
              </div>

              {profileError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {profileError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFormData.nombre}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        nombre: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFormData.apellido}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        apellido: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    value={profileFormData.telefono}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        telefono: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={profileFormData.fecha_nacimiento}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        fecha_nacimiento: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFormData.direccion}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        direccion: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setProfileError("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#0071a4] text-white rounded-lg font-medium hover:bg-[#005a85] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
