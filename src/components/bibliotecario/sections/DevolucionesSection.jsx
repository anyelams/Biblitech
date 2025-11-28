import { useState, useEffect } from "react";
import useFiltering from "../../../hooks/useFiltering";
import SearchInput from "../../shared/SearchInput";
import LoadingSpinner from "../../shared/LoadingSpinner";
import EmptyState from "../../shared/EmptyState";
import ErrorMessage from "../../shared/ErrorMessage";
import SectionHeader from "../../shared/SectionHeader";

export default function DevolucionesSection() {
  const [prestamos, setPrestamos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ejemplares, setEjemplares] = useState([]);
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal de procesamiento de devolución
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [fechaDevolucion, setFechaDevolucion] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [multa, setMulta] = useState(0);
  const [processingDevolucion, setProcessingDevolucion] = useState(false);

  // Filtering para préstamos activos
  const filtering = useFiltering(prestamos, {
    searchFields: ["usuario_nombre", "libro_titulo"],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPrestamos(),
        fetchUsuarios(),
        fetchEjemplares(),
        fetchLibros(),
      ]);
    } catch (err) {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrestamos = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/prestamos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Filtrar solo préstamos activos (sin fecha de devolución real)
        setPrestamos(data.filter((p) => !p.fecha_devolucion_real));
      }
    } catch (err) {
      console.error("Error al cargar préstamos:", err);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/usuarios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  const fetchEjemplares = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/ejemplares", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEjemplares(data);
      }
    } catch (err) {
      console.error("Error al cargar ejemplares:", err);
    }
  };

  const fetchLibros = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/libros", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLibros(data);
      }
    } catch (err) {
      console.error("Error al cargar libros:", err);
    }
  };

  // Helper functions
  const getUsuarioNombre = (usuarioId) => {
    const usuario = usuarios.find((u) => u.id === usuarioId);
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : "-";
  };

  const getLibroTitulo = (ejemplarId) => {
    const ejemplar = ejemplares.find((e) => e.id === ejemplarId);
    if (!ejemplar) return "-";
    const libro = libros.find((l) => l.id === ejemplar.libro_id);
    return libro ? libro.titulo : "-";
  };

  const getCodigoInterno = (ejemplarId) => {
    const ejemplar = ejemplares.find((e) => e.id === ejemplarId);
    return ejemplar ? ejemplar.codigo_interno : "-";
  };

  const calcularDiasRetraso = (fechaDevolucionEsperada) => {
    const hoy = new Date();
    const fechaEsperada = new Date(fechaDevolucionEsperada);
    const diffTime = hoy - fechaEsperada;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calcularMulta = (diasRetraso) => {
    // Multa de $500 por día de retraso (puedes ajustar esta lógica)
    const multaPorDia = 500;
    return diasRetraso * multaPorDia;
  };

  const handleProcesarDevolucion = (prestamo) => {
    setPrestamoSeleccionado(prestamo);
    setFechaDevolucion(new Date().toISOString().split("T")[0]);
    const diasRetraso = calcularDiasRetraso(prestamo.fecha_devolucion_esperada);
    setMulta(calcularMulta(diasRetraso));
    setShowDevolucionModal(true);
  };

  const handleSubmitDevolucion = async (e) => {
    e.preventDefault();
    if (!prestamoSeleccionado) return;

    setProcessingDevolucion(true);
    setError("");

    try {
      const token = localStorage.getItem("biblitech_access_token");

      // Actualizar préstamo con fecha de devolución
      const responseP = await fetch(
        `/api/v1/prestamos/${prestamoSeleccionado.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...prestamoSeleccionado,
            fecha_devolucion_real: fechaDevolucion,
          }),
        }
      );

      // Cambiar estado del ejemplar a disponible (estado_id = 3)
      const responseE = await fetch(
        `/api/v1/ejemplares/${prestamoSeleccionado.ejemplar_id}/estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado_id: 3, // Disponible
            actualizado_en: new Date().toISOString(),
          }),
        }
      );

      if (responseP.ok || responseP.status === 500) {
        // Actualización exitosa
        setShowDevolucionModal(false);
        setPrestamoSeleccionado(null);
        fetchData(); // Recargar datos
      } else {
        const data = await responseP.json();
        setError(data.detail || "Error al procesar devolución");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setProcessingDevolucion(false);
    }
  };

  const getEstadoBadge = (prestamo) => {
    const diasRetraso = calcularDiasRetraso(prestamo.fecha_devolucion_esperada);
    if (diasRetraso > 0) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Vencido ({diasRetraso} días)
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
        Activo
      </span>
    );
  };

  if (loading && prestamos.length === 0) {
    return <LoadingSpinner message="Cargando préstamos pendientes..." />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gestión de Devoluciones"
        description="Procesa las devoluciones de libros y gestiona multas por retraso"
      />

      <ErrorMessage message={error} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Préstamos Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {prestamos.length}
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Préstamos Vencidos</p>
              <p className="text-2xl font-bold text-red-600">
                {
                  prestamos.filter(
                    (p) => calcularDiasRetraso(p.fecha_devolucion_esperada) > 0
                  ).length
                }
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Al Día</p>
              <p className="text-2xl font-bold text-green-600">
                {
                  prestamos.filter(
                    (p) =>
                      calcularDiasRetraso(p.fecha_devolucion_esperada) === 0
                  ).length
                }
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <SearchInput
          value={filtering.searchTerm}
          onChange={filtering.setSearchTerm}
          placeholder="Buscar por usuario o libro..."
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtering.filteredData.length === 0 ? (
          <EmptyState
            hasSearch={filtering.searchTerm.length > 0}
            itemName="préstamos pendientes"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Libro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código Ejemplar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Devolución Esperada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtering.filteredData.map((prestamo) => (
                  <tr
                    key={prestamo.id}
                    className={`hover:bg-gray-50 ${
                      calcularDiasRetraso(prestamo.fecha_devolucion_esperada) >
                      0
                        ? "bg-red-50"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getUsuarioNombre(prestamo.usuario_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getLibroTitulo(prestamo.ejemplar_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {getCodigoInterno(prestamo.ejemplar_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(
                        prestamo.fecha_devolucion_esperada
                      ).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(prestamo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleProcesarDevolucion(prestamo)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                      >
                        Procesar Devolución
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Procesar Devolución */}
      {showDevolucionModal && prestamoSeleccionado && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Procesar Devolución
              </h3>
              <button
                onClick={() => setShowDevolucionModal(false)}
                disabled={processingDevolucion}
                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

            <form onSubmit={handleSubmitDevolucion} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Usuario:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {getUsuarioNombre(prestamoSeleccionado.usuario_id)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Libro:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {getLibroTitulo(prestamoSeleccionado.ejemplar_id)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Código:</span>
                  <span className="text-sm font-mono font-medium text-gray-900">
                    {getCodigoInterno(prestamoSeleccionado.ejemplar_id)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fecha Préstamo:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(
                      prestamoSeleccionado.fecha_prestamo
                    ).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Fecha Devolución Esperada:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(
                      prestamoSeleccionado.fecha_devolucion_esperada
                    ).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>

              {calcularDiasRetraso(
                prestamoSeleccionado.fecha_devolucion_esperada
              ) > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-red-600 mt-0.5"
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
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 mb-1">
                        Préstamo Vencido
                      </h4>
                      <p className="text-sm text-red-700">
                        Días de retraso:{" "}
                        <strong>
                          {calcularDiasRetraso(
                            prestamoSeleccionado.fecha_devolucion_esperada
                          )}
                        </strong>
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Multa calculada:{" "}
                        <strong>${multa.toLocaleString("es-CO")}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Devolución Real{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={fechaDevolucion}
                  onChange={(e) => setFechaDevolucion(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  disabled={processingDevolucion}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowDevolucionModal(false)}
                  disabled={processingDevolucion}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processingDevolucion}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processingDevolucion && (
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {processingDevolucion
                    ? "Procesando..."
                    : "Confirmar Devolución"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
