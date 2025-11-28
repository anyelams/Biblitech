import { useState, useEffect, useRef } from "react";
import useCRUD from "../../../hooks/useCRUD";
import useFiltering from "../../../hooks/useFiltering";
import useModal from "../../../hooks/useModal";
import SearchInput from "../../shared/SearchInput";
import LoadingSpinner from "../../shared/LoadingSpinner";
import EmptyState from "../../shared/EmptyState";
import ErrorMessage from "../../shared/ErrorMessage";
import SectionHeader from "../../shared/SectionHeader";

export default function PrestamosSection() {
  const crud = useCRUD("/api/v1/prestamos");
  const modal = useModal();

  // Estados para usuarios y ejemplares
  const [usuarios, setUsuarios] = useState([]);
  const [ejemplares, setEjemplares] = useState([]);
  const [libros, setLibros] = useState([]);

  // Autocomplete de usuario
  const [usuarioSearchInput, setUsuarioSearchInput] = useState("");
  const [showUsuarioSuggestions, setShowUsuarioSuggestions] = useState(false);
  const [selectedUsuarioIndex, setSelectedUsuarioIndex] = useState(-1);
  const usuarioInputRef = useRef(null);

  // Autocomplete de ejemplar
  const [ejemplarSearchInput, setEjemplarSearchInput] = useState("");
  const [showEjemplarSuggestions, setShowEjemplarSuggestions] = useState(false);
  const [selectedEjemplarIndex, setSelectedEjemplarIndex] = useState(-1);
  const ejemplarInputRef = useRef(null);

  // Formulario
  const [formData, setFormData] = useState({
    usuario_id: "",
    ejemplar_id: "",
    fecha_prestamo: new Date().toISOString().split("T")[0],
    fecha_devolucion_esperada: "",
  });

  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);

  // Filtering
  const filtering = useFiltering(crud.data, {
    searchFields: ["usuario_nombre", "libro_titulo"],
  });

  useEffect(() => {
    crud.fetchAll();
    fetchUsuarios();
    fetchEjemplares();
    fetchLibros();
  }, []);

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
        // Filtrar solo ejemplares disponibles (estado_id = 3)
        setEjemplares(data.filter((ej) => ej.estado_id === 3));
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

  // Autocomplete Usuario
  const getFilteredUsuarios = () => {
    if (!usuarioSearchInput.trim()) return usuarios;
    return usuarios.filter((usuario) =>
      `${usuario.nombre} ${usuario.apellido} ${usuario.correo}`
        .toLowerCase()
        .includes(usuarioSearchInput.toLowerCase())
    );
  };

  const handleUsuarioSelect = (usuario) => {
    setFormData({ ...formData, usuario_id: usuario.id });
    setUsuarioSearchInput(`${usuario.nombre} ${usuario.apellido}`);
    setShowUsuarioSuggestions(false);
    setSelectedUsuarioIndex(-1);
  };

  const handleUsuarioInputChange = (value) => {
    setUsuarioSearchInput(value);
    setShowUsuarioSuggestions(true);
    setSelectedUsuarioIndex(-1);
    if (!value.trim()) {
      setFormData({ ...formData, usuario_id: "" });
    }
  };

  const handleUsuarioKeyDown = (e) => {
    const filteredUsuarios = getFilteredUsuarios();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedUsuarioIndex((prev) =>
        prev < filteredUsuarios.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedUsuarioIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedUsuarioIndex >= 0 && filteredUsuarios[selectedUsuarioIndex]) {
        handleUsuarioSelect(filteredUsuarios[selectedUsuarioIndex]);
      }
    } else if (e.key === "Escape") {
      setShowUsuarioSuggestions(false);
      setSelectedUsuarioIndex(-1);
    }
  };

  // Autocomplete Ejemplar
  const getFilteredEjemplares = () => {
    if (!ejemplarSearchInput.trim()) return ejemplares;
    return ejemplares.filter((ejemplar) => {
      const libro = libros.find((l) => l.id === ejemplar.libro_id);
      return (
        ejemplar.codigo_interno
          .toLowerCase()
          .includes(ejemplarSearchInput.toLowerCase()) ||
        (libro &&
          libro.titulo
            .toLowerCase()
            .includes(ejemplarSearchInput.toLowerCase()))
      );
    });
  };

  const handleEjemplarSelect = (ejemplar) => {
    setFormData({ ...formData, ejemplar_id: ejemplar.id });
    const libro = libros.find((l) => l.id === ejemplar.libro_id);
    setEjemplarSearchInput(
      libro
        ? `${libro.titulo} (${ejemplar.codigo_interno})`
        : ejemplar.codigo_interno
    );
    setShowEjemplarSuggestions(false);
    setSelectedEjemplarIndex(-1);
  };

  const handleEjemplarInputChange = (value) => {
    setEjemplarSearchInput(value);
    setShowEjemplarSuggestions(true);
    setSelectedEjemplarIndex(-1);
    if (!value.trim()) {
      setFormData({ ...formData, ejemplar_id: "" });
    }
  };

  const handleEjemplarKeyDown = (e) => {
    const filteredEjemplares = getFilteredEjemplares();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedEjemplarIndex((prev) =>
        prev < filteredEjemplares.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedEjemplarIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        selectedEjemplarIndex >= 0 &&
        filteredEjemplares[selectedEjemplarIndex]
      ) {
        handleEjemplarSelect(filteredEjemplares[selectedEjemplarIndex]);
      }
    } else if (e.key === "Escape") {
      setShowEjemplarSuggestions(false);
      setSelectedEjemplarIndex(-1);
    }
  };

  // CRUD Handlers
  const handleCreate = () => {
    modal.openCreate();
    setFormData({
      usuario_id: "",
      ejemplar_id: "",
      fecha_prestamo: new Date().toISOString().split("T")[0],
      fecha_devolucion_esperada: getDefaultReturnDate(),
    });
    setUsuarioSearchInput("");
    setEjemplarSearchInput("");
  };

  const getDefaultReturnDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14); // 14 días por defecto
    return date.toISOString().split("T")[0];
  };

  const handleView = async (id) => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch(`/api/v1/prestamos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setViewData(data);
        setShowViewModal(true);
      }
    } catch (err) {
      crud.setError("Error al cargar detalles del préstamo");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    crud.setError("");

    const prestamoData = {
      usuario_id: parseInt(formData.usuario_id),
      ejemplar_id: parseInt(formData.ejemplar_id),
      fecha_prestamo: formData.fecha_prestamo,
      fecha_devolucion_esperada: formData.fecha_devolucion_esperada,
    };

    const result = await crud.create(prestamoData);
    if (result.success) {
      modal.closeModal();
      crud.fetchAll();
      fetchEjemplares(); // Actualizar lista de ejemplares disponibles
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

  const getEstadoBadge = (prestamo) => {
    const hoy = new Date();
    const fechaDevolucion = new Date(prestamo.fecha_devolucion_esperada);

    if (prestamo.fecha_devolucion_real) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Devuelto
        </span>
      );
    } else if (fechaDevolucion < hoy) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Vencido
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Activo
        </span>
      );
    }
  };

  if (crud.loading && crud.data.length === 0) {
    return <LoadingSpinner message="Cargando préstamos..." />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gestión de Préstamos"
        description="Registra y administra los préstamos de libros a usuarios"
        buttonText="Nuevo Préstamo"
        onButtonClick={handleCreate}
      />

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
            itemName="préstamos"
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
                    Fecha Préstamo
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
                  <tr key={prestamo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getUsuarioNombre(prestamo.usuario_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getLibroTitulo(prestamo.ejemplar_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(prestamo.fecha_prestamo).toLocaleDateString(
                        "es-ES"
                      )}
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
                        onClick={() => handleView(prestamo.id)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create */}
      {modal.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Nuevo Préstamo
              </h3>
              <button
                onClick={modal.closeModal}
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Autocomplete Usuario */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario <span className="text-red-500">*</span>
                </label>
                <input
                  ref={usuarioInputRef}
                  type="text"
                  value={usuarioSearchInput}
                  onChange={(e) => handleUsuarioInputChange(e.target.value)}
                  onKeyDown={handleUsuarioKeyDown}
                  onFocus={() => {
                    setShowUsuarioSuggestions(true);
                    setSelectedUsuarioIndex(-1);
                  }}
                  onBlur={() =>
                    setTimeout(() => {
                      setShowUsuarioSuggestions(false);
                      setSelectedUsuarioIndex(-1);
                    }, 200)
                  }
                  placeholder="Buscar usuario..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4]"
                  required
                />
                {showUsuarioSuggestions && getFilteredUsuarios().length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {getFilteredUsuarios().map((usuario, index) => (
                      <button
                        key={usuario.id}
                        type="button"
                        onClick={() => handleUsuarioSelect(usuario)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0 ${
                          selectedUsuarioIndex === index
                            ? "bg-blue-50 text-blue-900"
                            : formData.usuario_id === usuario.id
                            ? "bg-blue-50 text-blue-900"
                            : "text-gray-900"
                        }`}
                      >
                        <div className="font-medium">
                          {usuario.nombre} {usuario.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {usuario.correo}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <input type="hidden" value={formData.usuario_id} required />
              </div>

              {/* Autocomplete Ejemplar */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ejemplar Disponible <span className="text-red-500">*</span>
                </label>
                <input
                  ref={ejemplarInputRef}
                  type="text"
                  value={ejemplarSearchInput}
                  onChange={(e) => handleEjemplarInputChange(e.target.value)}
                  onKeyDown={handleEjemplarKeyDown}
                  onFocus={() => {
                    setShowEjemplarSuggestions(true);
                    setSelectedEjemplarIndex(-1);
                  }}
                  onBlur={() =>
                    setTimeout(() => {
                      setShowEjemplarSuggestions(false);
                      setSelectedEjemplarIndex(-1);
                    }, 200)
                  }
                  placeholder="Buscar por título o código..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4]"
                  required
                />
                {showEjemplarSuggestions &&
                  getFilteredEjemplares().length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredEjemplares().map((ejemplar, index) => {
                        const libro = libros.find(
                          (l) => l.id === ejemplar.libro_id
                        );
                        return (
                          <button
                            key={ejemplar.id}
                            type="button"
                            onClick={() => handleEjemplarSelect(ejemplar)}
                            className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0 ${
                              selectedEjemplarIndex === index
                                ? "bg-blue-50 text-blue-900"
                                : formData.ejemplar_id === ejemplar.id
                                ? "bg-blue-50 text-blue-900"
                                : "text-gray-900"
                            }`}
                          >
                            <div className="font-medium">
                              {libro ? libro.titulo : "Libro desconocido"}
                            </div>
                            <div className="text-sm text-gray-500">
                              Código: {ejemplar.codigo_interno}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                <input type="hidden" value={formData.ejemplar_id} required />
                {ejemplares.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No hay ejemplares disponibles actualmente
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Préstamo <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.fecha_prestamo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fecha_prestamo: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Devolución Esperada{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.fecha_devolucion_esperada}
                  min={formData.fecha_prestamo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fecha_devolucion_esperada: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4]"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Período recomendado: 14 días
                </p>
              </div>

              {crud.error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {crud.error}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={modal.closeModal}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crud.loading || ejemplares.length === 0}
                  className="px-6 py-2.5 bg-[#0071a4] text-white rounded-lg hover:bg-[#005a85] transition disabled:opacity-50"
                >
                  {crud.loading ? "Creando..." : "Crear Préstamo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Details */}
      {showViewModal && viewData && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalles del Préstamo
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
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
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Usuario
                  </label>
                  <p className="text-sm text-gray-900">
                    {getUsuarioNombre(viewData.usuario_id)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Libro
                  </label>
                  <p className="text-sm text-gray-900">
                    {getLibroTitulo(viewData.ejemplar_id)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Fecha Préstamo
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(viewData.fecha_prestamo).toLocaleDateString(
                      "es-ES"
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Fecha Devolución Esperada
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(
                      viewData.fecha_devolucion_esperada
                    ).toLocaleDateString("es-ES")}
                  </p>
                </div>
                {viewData.fecha_devolucion_real && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Fecha Devolución Real
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(
                        viewData.fecha_devolucion_real
                      ).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Estado
                  </label>
                  {getEstadoBadge(viewData)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
