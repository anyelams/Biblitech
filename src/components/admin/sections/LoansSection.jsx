import { useEffect, useState } from "react";
import SearchInput from "../../shared/SearchInput";
import LoadingSpinner from "../../shared/LoadingSpinner";
import EmptyState from "../../shared/EmptyState";
import useModal from "../../../hooks/useModal";
import useForm from "../../../hooks/useForm";

export default function LoansSection() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [libros, setLibros] = useState([]);
  const [ejemplares, setEjemplares] = useState([]);
  const [ejemplaresFiltrados, setEjemplaresFiltrados] = useState([]);
  const [activeTab, setActiveTab] = useState("nueva");

  // Estados para transacción
  const [transactionType, setTransactionType] = useState("entrega");
  const [documentoBusqueda, setDocumentoBusqueda] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [codigoEjemplar, setCodigoEjemplar] = useState("");
  const [ejemplarDetalle, setEjemplarDetalle] = useState(null);
  const [libroDetalle, setLibroDetalle] = useState(null);
  const [loadingEjemplar, setLoadingEjemplar] = useState(false);
  const [loadingLibro, setLoadingLibro] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const modal = useModal();
  const form = useForm({
    libro_id: "",
    ejemplar_id: "",
    fecha_solicitud: new Date().toISOString().split("T")[0],
    dias_prestamo: "15",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchLoans(), fetchLibros(), fetchEjemplares()]);
  };

  const fetchLoans = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/prestamos?normalizado=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al obtener préstamos");
      const data = await response.json();
      setLoans(data);
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
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

  // Buscar usuario por documento
  const buscarUsuarioPorDocumento = async (documento) => {
    if (!documento.trim()) return;

    setSearchingUser(true);
    setUsuarioEncontrado(null);

    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch(`/api/v1/usuarios/${documento}/prestamo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarioEncontrado(data);
      } else {
        setUsuarioEncontrado(null);
      }
    } catch (err) {
      setUsuarioEncontrado(null);
    } finally {
      setSearchingUser(false);
    }
  };

  // Buscar ejemplar por código usando el endpoint correcto
  const buscarEjemplarPorCodigo = async (codigo) => {
    if (!codigo.trim()) return;

    setLoadingEjemplar(true);
    setEjemplarDetalle(null);
    setLibroDetalle(null);

    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch(`/api/v1/ejemplares/codigo/${codigo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEjemplarDetalle(data);
        // Si hay libro_id en el ejemplar, buscar detalle del libro
        if (data.id) {
          const ejemplarCompleto = ejemplares.find((e) => e.id === data.id);
          if (ejemplarCompleto?.libro_id) {
            fetchLibroDetalle(ejemplarCompleto.libro_id);
          }
        }
      } else {
        setEjemplarDetalle(null);
      }
    } catch (err) {
      setEjemplarDetalle(null);
    } finally {
      setLoadingEjemplar(false);
    }
  };

  const getEstadoBadgeColor = (estadoNombre) => {
    switch (estadoNombre?.toLowerCase()) {
      case "disponible":
        return "bg-green-100 text-green-800";
      case "prestado":
        return "bg-blue-100 text-blue-800";
      case "reservado":
        return "bg-yellow-100 text-yellow-800";
      case "dañado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Fetch detalle del libro
  const fetchLibroDetalle = async (libroId) => {
    setLoadingLibro(true);
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch(`/api/v1/libros/${libroId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLibroDetalle(data);
      } else {
        setLibroDetalle(null);
      }
    } catch (err) {
      setLibroDetalle(null);
    } finally {
      setLoadingLibro(false);
    }
  };

  // Buscar usuario en tiempo real
  useEffect(() => {
    if (documentoBusqueda.length >= 5) {
      const timer = setTimeout(() => {
        buscarUsuarioPorDocumento(documentoBusqueda);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsuarioEncontrado(null);
    }
  }, [documentoBusqueda]);

  // Buscar ejemplar en tiempo real
  useEffect(() => {
    if (codigoEjemplar.length >= 5) {
      const timer = setTimeout(() => {
        buscarEjemplarPorCodigo(codigoEjemplar);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setEjemplarDetalle(null);
      setLibroDetalle(null);
    }
  }, [codigoEjemplar]);

  const handleLimpiarFormulario = () => {
    setDocumentoBusqueda("");
    setUsuarioEncontrado(null);
    setCodigoEjemplar("");
    setEjemplarDetalle(null);
    setLibroDetalle(null);
    setActionError("");
    setActionSuccess("");
  };

  const handleProcesarTransaccion = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");
    setActionLoading(true);

    try {
      const token = localStorage.getItem("biblitech_access_token");

      if (transactionType === "entrega") {
        const response = await fetch("/api/v1/prestamos/confirmar-entrega", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numero_documento: documentoBusqueda,
            ejemplar_codigo_interno: codigoEjemplar,
          }),
        });

        if (response.ok) {
          setActionSuccess("✓ Entrega confirmada exitosamente");
          handleLimpiarFormulario();
          await fetchLoans();
        } else {
          const errorData = await response.json();
          setActionError(errorData.detail || "Error al confirmar la entrega");
        }
      } else {
        const response = await fetch(
          `/api/v1/prestamos/${codigoEjemplar}/confirmar-devolucion`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          setActionSuccess("✓ Devolución registrada exitosamente");
          handleLimpiarFormulario();
          await fetchLoans();
        } else {
          const errorData = await response.json();
          setActionError(
            errorData.detail || "Error al registrar la devolución"
          );
        }
      }
    } catch (err) {
      setActionError("Error al conectar con el servidor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetForm();
    form.setValues({
      libro_id: "",
      ejemplar_id: "",
      fecha_solicitud: new Date().toISOString().split("T")[0],
      dias_prestamo: "15",
    });
    setEjemplaresFiltrados([]);
    setError("");
    modal.openCreate();
  };

  const handleLibroChange = (e) => {
    const libroId = e.target.value;
    form.handleInputChange(e);

    if (libroId) {
      const disponibles = ejemplares.filter(
        (ej) => ej.libro_id === parseInt(libroId) && ej.estado === "Disponible"
      );
      setEjemplaresFiltrados(disponibles);
      form.setValues({ ...form.formData, libro_id: libroId, ejemplar_id: "" });
    } else {
      setEjemplaresFiltrados([]);
      form.setValues({ ...form.formData, libro_id: "", ejemplar_id: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.formData.libro_id || !form.formData.ejemplar_id) {
      setError("Debes seleccionar un libro y un ejemplar disponible");
      return;
    }

    if (!form.formData.fecha_solicitud) {
      setError("Debes ingresar la fecha de solicitud");
      return;
    }

    if (
      !form.formData.dias_prestamo ||
      parseInt(form.formData.dias_prestamo) <= 0
    ) {
      setError("Los días de préstamo deben ser mayor a 0");
      return;
    }

    try {
      const token = localStorage.getItem("biblitech_access_token");

      const prestamoData = {
        libro_id: parseInt(form.formData.libro_id),
        fecha_solicitud: new Date(form.formData.fecha_solicitud).toISOString(),
        dias_prestamo: parseInt(form.formData.dias_prestamo),
      };

      const response = await fetch("/api/v1/prestamos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prestamoData),
      });

      if (response.ok) {
        modal.closeModal();
        await fetchLoans();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Error al crear préstamo");
      }
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      setError("Error al conectar con el servidor");
    }
  };

  const filteredLoans = loans.filter((loan) => {
    if (!loan) return false;

    const searchLower = searchTerm.toLowerCase();
    const usuarioNombre = loan.usuario_nombre?.toLowerCase() || "";
    const documentoUsuario = loan.documento_usuario?.toLowerCase() || "";
    const libroTitulo = loan.libro_titulo?.toLowerCase() || "";
    const ejemplarCodigo = loan.ejemplar_codigo_interno?.toLowerCase() || "";

    return (
      usuarioNombre.includes(searchLower) ||
      documentoUsuario.includes(searchLower) ||
      libroTitulo.includes(searchLower) ||
      ejemplarCodigo.includes(searchLower)
    );
  });

  const getEstadoBadge = (loan) => {
    if (!loan) return null;

    if (loan.fecha_devuelto) {
      return (
        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Devuelto
        </span>
      );
    }
    if (loan.fecha_entrega) {
      const fechaPrevista = new Date(loan.fecha_prevista_devolucion);
      const hoy = new Date();
      if (hoy > fechaPrevista) {
        return (
          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Vencido
          </span>
        );
      }
      return (
        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          En préstamo
        </span>
      );
    }
    return (
      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
        Pendiente
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestión de Préstamos
        </h2>
        <p className="text-gray-600 mt-1">
          Administra entregas, devoluciones y monitorea el estado de los
          préstamos
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => {
                setActiveTab("nueva");
                handleLimpiarFormulario();
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "nueva"
                  ? "border-[#0071a4] text-[#0071a4]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Nueva Transacción
            </button>
            <button
              onClick={() => {
                setActiveTab("historial");
                handleLimpiarFormulario();
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "historial"
                  ? "border-[#0071a4] text-[#0071a4]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Historial de Préstamos
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Tab: Nueva Transacción */}
          {activeTab === "nueva" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Formulario - Izquierda (3 columnas) */}
              <div className="lg:col-span-3">
                <div className="flex items-start gap-3 mb-6">
                  <svg
                    className="w-6 h-6 text-[#0071a4] mt-1"
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
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Nueva Transacción
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Registra entregas o devoluciones de libros
                    </p>
                  </div>
                </div>

                {actionSuccess && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {actionSuccess}
                  </div>
                )}

                {actionError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {actionError}
                  </div>
                )}

                <form
                  onSubmit={handleProcesarTransaccion}
                  className="space-y-6"
                >
                  {/* Tipo de Acción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Acción
                    </label>
                    <select
                      value={transactionType}
                      onChange={(e) => {
                        setTransactionType(e.target.value);
                        handleLimpiarFormulario();
                      }}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="entrega">Entregar Libro</option>
                      <option value="devolucion">Devolver Libro</option>
                    </select>
                  </div>

                  {/* Documento del Usuario - Solo para entrega */}
                  {transactionType === "entrega" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Documento del Usuario{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={documentoBusqueda}
                        onChange={(e) => setDocumentoBusqueda(e.target.value)}
                        placeholder="Ingresa documento del usuario..."
                        disabled={actionLoading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      />
                      {searchingUser && (
                        <p className="mt-2 text-sm text-gray-500">
                          Buscando usuario...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Código del Ejemplar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código del Ejemplar{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={codigoEjemplar}
                      onChange={(e) => setCodigoEjemplar(e.target.value)}
                      placeholder="Ingresa el código del libro.."
                      disabled={actionLoading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                    {loadingEjemplar && (
                      <p className="mt-2 text-sm text-gray-500">
                        Buscando ejemplar...
                      </p>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleLimpiarFormulario}
                      disabled={actionLoading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Limpiar Formulario
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#0071a4] rounded-lg hover:bg-[#005a85] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      {actionLoading && (
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
                      {actionLoading ? "Procesando..." : "Procesar Transacción"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Información - Derecha (2 columnas) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Información del Usuario */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Información del Usuario
                  </h4>

                  {usuarioEncontrado ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {/* Nombre */}
                      <div>
                        <p className="text-gray-500 mb-1">Nombre</p>
                        <p className="text-gray-900 font-medium">
                          {usuarioEncontrado.nombre_completo}
                        </p>
                      </div>

                      {/* Estado */}
                      <div>
                        <p className="text-gray-500 mb-1">Estado</p>
                        <p
                          className={`font-semibold px-1 ${getEstadoBadgeColor(
                            usuarioEncontrado.estado_id
                          )}`}
                        >
                          {usuarioEncontrado.estado}
                        </p>
                      </div>

                      {/* Documento */}
                      <div>
                        <p className="text-gray-500 mb-1">Documento</p>
                        <p className="text-gray-900 font-medium">
                          {usuarioEncontrado.tipo_documento}:{" "}
                          {usuarioEncontrado.documento}
                        </p>
                      </div>

                      {/* Correo */}
                      <div>
                        <p className="text-gray-500 mb-1">Correo</p>
                        <p className="text-gray-900 font-medium">
                          {usuarioEncontrado.correo}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {transactionType === "entrega"
                        ? "Ingresa un documento para ver los detalles"
                        : "La información del usuario se mostrará al procesar"}
                    </p>
                  )}
                </div>

                {/* Información del Ejemplar */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Información del Ejemplar
                  </h4>

                  {loadingEjemplar || loadingLibro ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0071a4]"></div>
                    </div>
                  ) : ejemplarDetalle ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {/* Código */}
                      <div>
                        <p className="text-gray-500 mb-1">Código</p>
                        <p className="text-gray-900 font-medium font-mono">
                          {ejemplarDetalle.codigo_interno}
                        </p>
                      </div>

                      {/* Estado */}
                      <div>
                        <p className="text-gray-500 mb-1">Estado</p>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(
                            ejemplarDetalle.estado_nombre
                          )}`}
                        >
                          {ejemplarDetalle.estado_nombre}
                        </span>
                      </div>

                      {/* Título */}
                      <div>
                        <p className="text-gray-500 mb-1">Título</p>
                        <p className="text-gray-900 font-medium">
                          {ejemplarDetalle.libro_titulo}
                        </p>
                      </div>

                      {/* Autores */}
                      <div>
                        <p className="text-gray-500 mb-1">Autor(es)</p>
                        <p className="text-gray-900 font-medium">
                          {libroDetalle?.autores
                            ?.map((a) => `${a.nombre} ${a.apellido}`)
                            .join(", ") || "—"}
                        </p>
                      </div>

                      {/* Editorial */}
                      <div>
                        <p className="text-gray-500 mb-1">Editorial</p>
                        <p className="text-gray-900 font-medium">
                          {libroDetalle?.editorial || "—"}
                        </p>
                      </div>

                      {/* Fecha Adquisición */}
                      <div>
                        <p className="text-gray-500 mb-1">Fecha Adquisición</p>
                        <p className="text-gray-900 font-medium">
                          {formatDate(ejemplarDetalle.fecha_adquisicion)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Ingresa un código para ver los detalles
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Historial */}
          {activeTab === "historial" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 max-w-md">
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar por usuario, documento, libro..."
                  />
                </div>
                <button
                  onClick={handleCreate}
                  className="ml-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0071a4] rounded-lg hover:bg-[#005a85] transition"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Nuevo Préstamo
                </button>
              </div>

              {loading ? (
                <LoadingSpinner message="Cargando préstamos..." />
              ) : filteredLoans.length === 0 ? (
                <EmptyState
                  hasSearch={searchTerm.length > 0}
                  searchTerm={searchTerm}
                  message="No hay préstamos registrados"
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
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
                          Fecha Solicitud
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Entrega
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Prevista Dev.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Devuelto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLoans.map((loan, index) => (
                        <tr
                          key={`${loan.documento_usuario}-${loan.ejemplar_codigo_interno}-${index}`}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">
                              {loan.usuario_nombre || "-"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Doc: {loan.documento_usuario || "-"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">
                              {loan.libro_titulo || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono font-medium text-gray-900 text-sm">
                              {loan.ejemplar_codigo_interno || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(loan.fecha_solicitud)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(loan.fecha_entrega)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(loan.fecha_prevista_devolucion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(loan.fecha_devuelto)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getEstadoBadge(loan)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Crear Préstamo */}
      {modal.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Nuevo Préstamo
              </h3>
              <button
                onClick={modal.closeModal}
                disabled={loading}
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

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Libro <span className="text-red-500">*</span>
                </label>
                <select
                  name="libro_id"
                  value={form.formData.libro_id}
                  onChange={handleLibroChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar libro</option>
                  {libros.map((libro) => (
                    <option key={libro.id} value={libro.id}>
                      {libro.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ejemplar Disponible <span className="text-red-500">*</span>
                </label>
                <select
                  name="ejemplar_id"
                  value={form.formData.ejemplar_id}
                  onChange={form.handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!form.formData.libro_id || loading}
                  required
                >
                  <option value="">
                    {!form.formData.libro_id
                      ? "Primero selecciona un libro"
                      : ejemplaresFiltrados.length === 0
                      ? "No hay ejemplares disponibles"
                      : "Seleccionar ejemplar"}
                  </option>
                  {ejemplaresFiltrados.map((ejemplar) => (
                    <option key={ejemplar.id} value={ejemplar.id}>
                      {ejemplar.codigo_interno} - {ejemplar.estado}
                    </option>
                  ))}
                </select>
                {form.formData.libro_id && ejemplaresFiltrados.length === 0 && (
                  <p className="mt-2 text-sm text-red-500">
                    No hay ejemplares disponibles para este libro
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Solicitud <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fecha_solicitud"
                  value={form.formData.fecha_solicitud}
                  onChange={form.handleInputChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Días de Préstamo <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 45, 60, 75, 90].map((dias) => (
                    <button
                      key={dias}
                      onClick={() =>
                        form.setValues({
                          ...form.formData,
                          dias_prestamo: dias.toString(),
                        })
                      }
                      type="button"
                      disabled={loading}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        parseInt(form.formData.dias_prestamo) === dias
                          ? "bg-[#0071a4] text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {dias} días
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={modal.closeModal}
                  disabled={loading}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#0071a4] text-white rounded-lg hover:bg-[#005a85] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && (
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
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
