import React from "react";
import Avatar from "../Avatar";

export default function DashboardHeader({
  user,
  onLogout,
  onShowProfile,
  onShowPassword,
}) {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  return (
    <header
      className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-end transition-all duration-300"
      style={{ height: "76px" }}
    >
      <div className="relative">
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition"
        >
          <div className="text-right">
            {/* Nombre */}
            <p className="text-[15px] font-medium tracking-wide text-gray-900 leading-tight">
              {user?.nombre} {user?.apellido}
            </p>

            {/* Rol (ya en font-size sm) */}
            <p className="text-sm text-gray-500 tracking-wide leading-tight">
              {user?.rol?.charAt(0).toUpperCase() +
                user?.rol?.slice(1).toLowerCase()}
            </p>
          </div>

          <Avatar user={user} size="md" />

          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              showUserDropdown ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showUserDropdown && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <button
              onClick={() => {
                onShowProfile();
                setShowUserDropdown(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition"
            >
              <svg
                className="w-5 h-5 text-gray-400"
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
              Mi perfil
            </button>

            <button
              onClick={() => {
                onShowPassword();
                setShowUserDropdown(false);
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition"
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              Cambiar contraseña
            </button>

            <button
              onClick={onLogout}
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition"
            >
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
