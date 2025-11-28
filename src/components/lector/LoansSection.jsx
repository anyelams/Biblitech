import { useEffect, useState } from "react";
import SectionHeader from "../shared/SectionHeader";
import SearchInput from "../shared/SearchInput";
import LoadingSpinner from "../shared/LoadingSpinner";
import EmptyState from "../shared/EmptyState";

export default function LoansSection() {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("activos");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPrestamos();
  }, []);

  const fetchPrestamos = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/prestamos/lector", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Error al obtener préstamos");
      const data = await response.json();
      setPrestamos(data);
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatLongDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusInfo = (prestamo) => {
    // Si está devuelto
    if (prestamo.fecha_devuelto) {
      return {
        type: "devuelto",
        badgeBg: "bg-gray-100",
        badgeText: "text-gray-700",
        label: "Devuelto",
      };
    }

    // Si no tiene fecha de entrega, está en espera
    if (!prestamo.fecha_entrega) {
      return {
        type: "espera",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-700",
        label: "En espera",
      };
    }

    // Si ya fue entregado, calcular días restantes
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaPrevista = new Date(prestamo.fecha_prevista_devolucion);
    fechaPrevista.setHours(0, 0, 0, 0);

    if (fechaPrevista < hoy) {
      const diasRetraso = Math.floor(
        (hoy - fechaPrevista) / (1000 * 60 * 60 * 24)
      );
      return {
        type: "vencido",
        badgeBg: "bg-red-100",
        badgeText: "text-red-700",
        label: `Vencido ${diasRetraso}d`,
      };
    }

    const diasRestantes = Math.ceil(
      (fechaPrevista - hoy) / (1000 * 60 * 60 * 24)
    );

    if (diasRestantes <= 3) {
      return {
        type: "proximo",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-700",
        label: `${diasRestantes} días`,
      };
    }

    return {
      type: "activo",
      badgeBg: "bg-green-100",
      badgeText: "text-green-700",
      label: `${diasRestantes} días`,
    };
  };

  const filteredPrestamos = prestamos
    .filter((prestamo) => {
      if (filterStatus === "activos" && prestamo.fecha_devuelto) return false;
      if (filterStatus === "historial" && !prestamo.fecha_devuelto)
        return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          prestamo.libro_titulo?.toLowerCase().includes(searchLower) ||
          prestamo.ejemplar_codigo_interno?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (!a.fecha_devuelto && b.fecha_devuelto) return -1;
      if (a.fecha_devuelto && !b.fecha_devuelto) return 1;
      return new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud);
    });

  const prestamosActivos = prestamos.filter((p) => !p.fecha_devuelto);
  const prestamosHistorial = prestamos.filter((p) => p.fecha_devuelto);

  return (
    <>
      <SectionHeader
        title="Mis Préstamos"
        description="Consulta tus libros prestados y tu historial"
      />

      {/* Barra de búsqueda y filtros */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por título o código..."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setFilterStatus("activos")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterStatus === "activos"
                ? "bg-[#0071a4] text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Activos ({prestamosActivos.length})
          </button>
          <button
            onClick={() => setFilterStatus("historial")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterStatus === "historial"
                ? "bg-[#0071a4] text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Historial ({prestamosHistorial.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Lista de préstamos */}
      <div>
        {loading ? (
          <LoadingSpinner message="Cargando préstamos..." />
        ) : filteredPrestamos.length === 0 ? (
          <EmptyState
            hasSearch={searchTerm.length > 0}
            searchTerm={searchTerm}
            message={
              filterStatus === "activos"
                ? "No tienes préstamos activos"
                : "No hay préstamos en el historial"
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPrestamos.map((prestamo, index) => {
              const statusInfo = getStatusInfo(prestamo);
              return (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedLoan(prestamo);
                    setShowDetailModal(true);
                  }}
                  className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-xl hover:border-[#0071a4]/30 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-gray-900 flex-1 group-hover:text-[#0071a4] transition-colors line-clamp-2">
                      {prestamo.libro_titulo}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusInfo.badgeBg} ${statusInfo.badgeText}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-[#0071a4] flex-shrink-0"
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
                      <span className="font-mono text-sm">
                        {prestamo.ejemplar_codigo_interno}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-[#0071a4] flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm">
                        Solicitado: {formatDate(prestamo.fecha_solicitud)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-[#0071a4] flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm">
                        {prestamo.fecha_devuelto
                          ? `Devuelto: ${formatDate(prestamo.fecha_devuelto)}`
                          : prestamo.fecha_entrega
                          ? `Vence: ${formatDate(
                              prestamo.fecha_prevista_devolucion
                            )}`
                          : "Pendiente de entrega"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end">
                    <span className="text-sm text-gray-500 group-hover:text-[#0071a4] transition-colors font-medium">
                      Ver detalles
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-[#0071a4] transition-colors ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetailModal && selectedLoan && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalles del Préstamo
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLoan(null);
                }}
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

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Título */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedLoan.libro_titulo}
                  </h2>
                  <p className="text-sm text-gray-600 font-mono">
                    Código: {selectedLoan.ejemplar_codigo_interno}
                  </p>
                </div>

                {/* Estado actual */}
                {!selectedLoan.fecha_devuelto && (
                  <div
                    className={`border rounded-lg p-4 ${
                      getStatusInfo(selectedLoan).type === "espera"
                        ? "border-blue-200 bg-blue-50"
                        : getStatusInfo(selectedLoan).type === "vencido"
                        ? "border-red-200 bg-red-50"
                        : getStatusInfo(selectedLoan).type === "proximo"
                        ? "border-amber-200 bg-amber-50"
                        : "border-green-200 bg-green-50"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        getStatusInfo(selectedLoan).type === "espera"
                          ? "text-blue-600"
                          : getStatusInfo(selectedLoan).type === "vencido"
                          ? "text-red-600"
                          : getStatusInfo(selectedLoan).type === "proximo"
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}
                    >
                      {getStatusInfo(selectedLoan).label}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {getStatusInfo(selectedLoan).type === "espera"
                        ? "Tu préstamo está pendiente de entrega por parte del bibliotecario."
                        : getStatusInfo(selectedLoan).type === "vencido"
                        ? "Por favor devuelve el libro lo antes posible."
                        : getStatusInfo(selectedLoan).type === "proximo"
                        ? "Recuerda devolver el libro a tiempo."
                        : "Disfruta tu lectura."}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Línea de tiempo
                  </h3>

                  <div className="space-y-4">
                    {/* Solicitud */}
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                        {(selectedLoan.fecha_entrega ||
                          selectedLoan.fecha_prevista_devolucion ||
                          selectedLoan.fecha_devuelto) && (
                          <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm text-gray-600">Solicitado</p>
                        <p className="font-medium text-gray-900">
                          {formatLongDate(selectedLoan.fecha_solicitud)}
                        </p>
                      </div>
                    </div>

                    {/* Entrega */}
                    {selectedLoan.fecha_entrega ? (
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                          {(selectedLoan.fecha_prevista_devolucion ||
                            selectedLoan.fecha_devuelto) && (
                            <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                          )}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm text-gray-600">Entregado</p>
                          <p className="font-medium text-gray-900">
                            {formatLongDate(selectedLoan.fecha_entrega)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-3 h-3 bg-blue-300 rounded-full mt-1"></div>
                          <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm text-gray-600">
                            En espera de entrega
                          </p>
                          <p className="font-medium text-gray-500">Pendiente</p>
                        </div>
                      </div>
                    )}

                    {/* Vencimiento */}
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className={`w-3 h-3 rounded-full mt-1 ${
                            selectedLoan.fecha_devuelto
                              ? "bg-gray-300"
                              : !selectedLoan.fecha_entrega
                              ? "bg-gray-300"
                              : getStatusInfo(selectedLoan).type === "vencido"
                              ? "bg-red-500"
                              : getStatusInfo(selectedLoan).type === "proximo"
                              ? "bg-amber-500"
                              : "bg-blue-300"
                          }`}
                        ></div>
                        {selectedLoan.fecha_devuelto && (
                          <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm text-gray-600">
                          {selectedLoan.fecha_devuelto
                            ? "Fecha límite era"
                            : "Fecha límite"}
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatLongDate(
                            selectedLoan.fecha_prevista_devolucion
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Devolución */}
                    {selectedLoan.fecha_devuelto && (
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-3 h-3 bg-gray-500 rounded-full mt-1"></div>
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm text-gray-600">Devuelto</p>
                          <p className="font-medium text-gray-900">
                            {formatLongDate(selectedLoan.fecha_devuelto)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLoan(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0071a4] rounded-lg hover:bg-[#005a85] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
