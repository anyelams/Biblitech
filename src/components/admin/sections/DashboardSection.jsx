import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function DashboardSection() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalLibros: 0,
    prestamosActivos: 0,
    prestamosVencidos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const headers = { Authorization: `Bearer ${token}` };

      // Obtener usuarios
      const usersResponse = await fetch("/api/v1/usuarios", { headers });
      const usersData = await usersResponse.json();

      // Obtener libros
      const librosResponse = await fetch("/api/v1/libros", { headers });
      const librosData = await librosResponse.json();

      // Obtener préstamos
      const prestamosResponse = await fetch(
        "/api/v1/prestamos?normalizado=true",
        { headers }
      );
      const prestamosData = await prestamosResponse.json();

      // Calcular préstamos activos (sin fecha de devolución)
      const prestamosActivos = prestamosData.filter(
        (p) => !p.fecha_devuelto
      ).length;

      // Calcular préstamos vencidos (fecha prevista pasada y no devueltos)
      const hoy = new Date();
      const prestamosVencidos = prestamosData.filter((p) => {
        if (p.fecha_devuelto) return false;
        const fechaPrevista = new Date(p.fecha_prevista_devolucion);
        return fechaPrevista < hoy;
      }).length;

      setStats({
        totalUsuarios: usersData.length || 0,
        totalLibros: librosData.length || 0,
        prestamosActivos,
        prestamosVencidos,
      });
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0071a4]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenido, {user?.nombre || "Administrador"}
        </h2>
        <p className="text-gray-600">
          Panel de control y estadísticas del sistema BiblioTech
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Usuarios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalUsuarios}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Libros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Libros</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalLibros}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
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
            </div>
          </div>
        </div>

        {/* Préstamos Activos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Préstamos Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.prestamosActivos}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Préstamos Vencidos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Préstamos Vencidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.prestamosVencidos}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
