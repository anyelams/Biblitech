import { useState, useEffect } from "react";
import LoadingSpinner from "../../shared/LoadingSpinner";
import ErrorMessage from "../../shared/ErrorMessage";
import SectionHeader from "../../shared/SectionHeader";

export default function AuditSection() {
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filtros
  const [filtros, setFiltros] = useState({
    tabla: "",
    operacion: "",
    usuario_app: "",
    operacion_app: "",
    desde_fecha: "",
    hasta_fecha: "",
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const registrosPorPagina = 15;

  // Sort
  const [sortOrder, setSortOrder] = useState("desc");

  // Details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchAuditorias();
  }, [paginaActual, filtros]);

  const fetchAuditorias = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const params = new URLSearchParams({
        page: paginaActual.toString(),
        page_size: registrosPorPagina.toString(),
      });

      if (filtros.tabla) params.append("tabla", filtros.tabla);
      if (filtros.operacion) params.append("operacion", filtros.operacion);
      if (filtros.usuario_app)
        params.append("usuario_app", filtros.usuario_app);
      if (filtros.operacion_app)
        params.append("operacion_app", filtros.operacion_app);
      if (filtros.desde_fecha)
        params.append("desde_fecha", filtros.desde_fecha);
      if (filtros.hasta_fecha)
        params.append("hasta_fecha", filtros.hasta_fecha);

      const response = await fetch(`/api/v1/auditorias?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuditorias(data.items || data);
        if (data.total) {
          setTotalPaginas(Math.ceil(data.total / registrosPorPagina));
        }
      } else {
        setError("Error al cargar auditorías");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch(`/api/v1/auditorias/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDetails(data);
        setShowDetailsModal(true);
      }
    } catch (err) {
      console.error("Error al cargar detalles de auditoría:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleClearFilters = () => {
    setFiltros({
      tabla: "",
      operacion: "",
      usuario_app: "",
      operacion_app: "",
      desde_fecha: "",
      hasta_fecha: "",
    });
    setPaginaActual(1);
  };

  const getOperacionBadgeColor = (operacion) => {
    switch (operacion?.toLowerCase()) {
      case "insert":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-900";
    }
  };

  const sortedAuditorias = [...auditorias].sort((a, b) =>
    sortOrder === "asc" ? a.id - b.id : b.id - a.id
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Auditorías del Sistema"
        description="Consulta el registro de operaciones realizadas en la base de datos y monitorea la actividad del sistema"
      />

      <ErrorMessage message={error} />

      {/* Filtros Avanzados */}
      <div className="rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Filtro Tabla */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tabla
            </label>
            <select
              value={filtros.tabla}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  tabla: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent transition-shadow"
            >
              <option value="">Todas las tablas</option>
              <option value="usuario">Usuario</option>
              <option value="ejemplar">Ejemplar</option>
              <option value="prestamo">Préstamo</option>
            </select>
          </div>

          {/* Filtro Operación SQL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operación SQL
            </label>
            <select
              value={filtros.operacion}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  operacion: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent transition-shadow"
            >
              <option value="">Todas las operaciones</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          {/* Filtro Usuario App */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              placeholder="Buscar por usuario..."
              value={filtros.usuario_app}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  usuario_app: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent transition-shadow placeholder:text-gray-400"
            />
          </div>

          {/* Filtro Operación App */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operación App
            </label>
            <input
              type="text"
              placeholder="Buscar por operación..."
              value={filtros.operacion_app}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  operacion_app: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent transition-shadow placeholder:text-gray-400"
            />
          </div>

          {/* Filtro Desde Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={filtros.desde_fecha}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  desde_fecha: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent transition-shadow"
            />
          </div>

          {/* Filtro Hasta Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={filtros.hasta_fecha}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  hasta_fecha: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        {/* Botón Limpiar Filtros */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Tabla de Auditorías */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Cargando auditorías..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      <button
                        onClick={() =>
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        }
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        ID
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {sortOrder === "asc" ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          )}
                        </svg>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Tabla
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Operación SQL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Usuario App
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Operación App
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditorias.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No se encontraron registros de auditoría
                      </td>
                    </tr>
                  ) : (
                    sortedAuditorias.map((audit) => (
                      <tr key={audit.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {audit.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {audit.tabla}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${getOperacionBadgeColor(
                              audit.operacion
                            )}`}
                          >
                            {audit.operacion?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {audit.usuario_app || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {audit.operacion_app || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {audit.ip || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(audit.fecha_operacion).toLocaleString(
                            "es-ES"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => fetchAuditDetails(audit.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Ver detalles"
                          >
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
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Página {paginaActual} de {totalPaginas}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPaginaActual(Math.max(1, paginaActual - 1))
                    }
                    disabled={paginaActual === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      setPaginaActual(Math.min(totalPaginas, paginaActual + 1))
                    }
                    disabled={paginaActual === totalPaginas}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Detalles de Auditoría */}
      {showDetailsModal && details && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalles de Auditoría #{details.id}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Información General */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                  Información General
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Tabla
                    </label>
                    <p className="text-sm text-gray-900 font-medium">
                      {details.tabla}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Operación SQL
                    </label>
                    <p className="text-sm">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getOperacionBadgeColor(
                          details.operacion
                        )}`}
                      >
                        {details.operacion?.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Usuario DB
                    </label>
                    <p className="text-sm text-gray-900">
                      {details.usuario_db || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Usuario App
                    </label>
                    <p className="text-sm text-gray-900">
                      {details.usuario_app || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Operación App
                    </label>
                    <p className="text-sm text-gray-900">
                      {details.operacion_app || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      IP
                    </label>
                    <p className="text-sm text-gray-900 font-mono">
                      {details.ip || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Host
                    </label>
                    <p className="text-sm text-gray-900 font-mono">
                      {details.host || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Fecha de Operación
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(details.fecha_operacion).toLocaleString(
                        "es-ES"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Datos Anteriores */}
              {details.datos_anteriores && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Datos Anteriores
                  </h4>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <pre className="text-xs text-gray-900 overflow-x-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(details.datos_anteriores, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Datos Nuevos */}
              {details.datos_nuevos && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Datos Nuevos
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <pre className="text-xs text-gray-900 overflow-x-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(details.datos_nuevos, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {!details.datos_anteriores && !details.datos_nuevos && (
                <div className="text-center py-8 text-gray-500">
                  No hay datos adicionales para mostrar
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
