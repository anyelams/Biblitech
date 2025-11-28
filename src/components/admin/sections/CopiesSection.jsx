import { useEffect, useState, useRef } from "react";
import useCRUD from "../../../hooks/useCRUD";
import useFiltering from "../../../hooks/useFiltering";
import useModal from "../../../hooks/useModal";
import SectionHeader from "../../shared/SectionHeader";
import SearchInput from "../../shared/SearchInput";
import FilterSelect from "../../shared/FilterSelect";
import LoadingSpinner from "../../shared/LoadingSpinner";
import EmptyState from "../../shared/EmptyState";
import ErrorMessage from "../../shared/ErrorMessage";
import ActionMenu from "../../shared/ActionMenu";
import DeleteConfirmModal from "../../shared/DeleteConfirmModal";

export default function CopiesSection() {
  const [viewLoading, setViewLoading] = useState(false);
  const crud = useCRUD("/api/v1/ejemplares");
  const filtering = useFiltering(crud.data, {
    searchFields: ["codigo_interno"],
    defaultSortBy: "id",
    defaultSortOrder: "asc",
  });

  const modal = useModal();
  const deleteModal = useModal();
  const viewModal = useModal();

  // Formulario
  const [formData, setFormData] = useState({
    libro_id: "",
    estado_id: "",
    fecha_adquisicion: new Date().toISOString().split("T")[0],
  });
  const [libros, setLibros] = useState([]);
  const [estadosEjemplar, setEstadosEjemplar] = useState([]);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [ejemplarToChangeEstado, setEjemplarToChangeEstado] = useState(null);
  const [nuevoEstadoId, setNuevoEstadoId] = useState("");

  useEffect(() => {
    fetchLibros();
    fetchEstadosEjemplar();
    crud.fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const fetchEstadosEjemplar = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/estados/tipo?type=ejemplar", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEstadosEjemplar(data);
      }
    } catch (err) {
      console.error("Error al cargar estados:", err);
    }
  };

  const handleCreate = () => {
    setFormData({
      libro_id: "",
      estado_id: "",
      fecha_adquisicion: new Date().toISOString().split("T")[0],
    });
    modal.openCreate();
  };

  const handleEdit = (ejemplar) => {
    setFormData({
      libro_id: ejemplar.libro_id,
      estado_id: ejemplar.estado_id,
      fecha_adquisicion: ejemplar.fecha_adquisicion,
    });
    modal.openEdit(ejemplar);
  };

  const handleView = async (id) => {
    setViewLoading(true);
    const result = await crud.fetchOneSilent(id);
    if (result.success) {
      setViewData(result.data);
      viewModal.openView(result.data);
    }
    setViewLoading(false);
  };

  const handleDelete = async () => {
    const result = await crud.remove(deleteModal.selectedItem.id);
    if (result.success) {
      deleteModal.closeModal();
      await crud.fetchAll();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    crud.setError("");
    const ejemplarData = {
      libro_id: parseInt(formData.libro_id),
      estado_id: parseInt(formData.estado_id),
      fecha_adquisicion: formData.fecha_adquisicion,
    };
    if (modal.mode === "edit") {
      ejemplarData.codigo_interno = modal.selectedItem.codigo_interno;
    }
    const result =
      modal.mode === "create"
        ? await crud.create(ejemplarData)
        : await crud.update(modal.selectedItem.id, ejemplarData);
    if (result.success) {
      modal.closeModal();
      await crud.fetchAll();
    }
  };

  // Estado
  const handleChangeEstado = (ejemplar) => {
    setEjemplarToChangeEstado(ejemplar);
    setNuevoEstadoId(ejemplar.estado_id?.toString() || "");
    setShowEstadoModal(true);
  };

  const handleSubmitEstadoEjemplar = async (e) => {
    e.preventDefault();
    if (!ejemplarToChangeEstado) return;
    crud.setLoading(true);
    crud.setError("");
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch(
        `/api/v1/ejemplares/${ejemplarToChangeEstado.id}/estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado_id: parseInt(nuevoEstadoId),
            actualizado_en: new Date().toISOString(),
          }),
        }
      );
      if (response.ok) {
        setShowEstadoModal(false);
        setEjemplarToChangeEstado(null);
        await crud.fetchAll();
      } else {
        const errorData = await response.json();
        crud.setError(errorData.detail || "Error al actualizar estado");
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setTimeout(() => crud.fetchAll(), 2000);
    } finally {
      crud.setLoading(false);
    }
  };

  const getLibroTitulo = (libroId) => {
    const libro = libros.find((l) => l.id === libroId);
    return libro ? libro.titulo : "-";
  };
  const getEstadoNombre = (estadoId) => {
    const estado = estadosEjemplar.find((e) => e.id === estadoId);
    return estado ? estado.nombre : "-";
  };
  const getEstadoBadgeColor = (estadoId) => {
    switch (estadoId) {
      case 3:
        return "bg-green-100 text-green-800";
      case 4:
        return "bg-blue-100 text-blue-800";
      case 5:
        return "bg-yellow-100 text-yellow-800";
      case 6:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <SectionHeader
        title="Gestión de Ejemplares"
        description="Administra los ejemplares físicos de los libros"
        buttonLabel="Nuevo Ejemplar"
        onButtonClick={handleCreate}
      />

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <SearchInput
          value={filtering.searchTerm}
          onChange={filtering.setSearchTerm}
          placeholder="Buscar por código interno..."
        />
        <FilterSelect
          value={filtering.filters.estado_id || ""}
          onChange={(value) => filtering.updateFilter("estado_id", value)}
          placeholder="Todos los estados"
          options={estadosEjemplar.map((estado) => ({
            value: estado.id.toString(),
            label: estado.nombre,
          }))}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {crud.loading ? (
          <LoadingSpinner message="Cargando ejemplares..." />
        ) : filtering.filteredData.length === 0 ? (
          <EmptyState
            hasSearch={true}
            searchTerm={filtering.searchTerm}
            message="No hay ejemplares registrados"
          />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition w-16"
                  onClick={() => filtering.toggleSort("id")}
                >
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código Interno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Libro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Adquisición
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtering.filteredData.map((ejemplar) => (
                <tr key={ejemplar.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {ejemplar.id}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-medium text-gray-900">
                      {ejemplar.codigo_interno}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {getLibroTitulo(ejemplar.libro_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getEstadoBadgeColor(
                        ejemplar.estado_id
                      )}`}
                    >
                      {getEstadoNombre(ejemplar.estado_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ejemplar.fecha_adquisicion
                      ? new Date(ejemplar.fecha_adquisicion).toLocaleDateString(
                          "es-ES"
                        )
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="relative flex justify-center">
                      <button
                        onClick={() =>
                          setActionMenuOpen(
                            actionMenuOpen === ejemplar.id ? null : ejemplar.id
                          )
                        }
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        title="Más opciones"
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
                            d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                          />
                        </svg>
                      </button>
                      <ActionMenu
                        isOpen={actionMenuOpen === ejemplar.id}
                        onClose={() => setActionMenuOpen(null)}
                        actions={[
                          {
                            label: "Ver detalles",
                            onClick: () => handleView(ejemplar.id),
                            icon: (
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
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
                            ),
                          },
                          {
                            label: "Cambiar estado",
                            onClick: () => handleChangeEstado(ejemplar),
                            icon: (
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            ),
                          },
                          {
                            label: "Editar",
                            onClick: () => handleEdit(ejemplar),
                            icon: (
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            ),
                          },
                          {
                            label: "Eliminar",
                            onClick: () => deleteModal.openView(ejemplar),
                            className: "text-red-600",
                            icon: (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            ),
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {modal.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {modal.mode === "create" ? "Nuevo Ejemplar" : "Editar Ejemplar"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {crud.error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {crud.error}
                </div>
              )}
              {modal.mode === "edit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    value={modal.selectedItem?.codigo_interno || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono font-normal"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El código interno se genera automáticamente
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Libro <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.libro_id}
                  onChange={(e) =>
                    setFormData({ ...formData, libro_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={crud.loading}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.estado_id}
                  onChange={(e) =>
                    setFormData({ ...formData, estado_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={crud.loading}
                >
                  <option value="">Seleccionar estado</option>
                  {estadosEjemplar.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Adquisición <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.fecha_adquisicion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fecha_adquisicion: e.target.value,
                    })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={crud.loading}
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={modal.closeModal}
                  disabled={crud.loading}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crud.loading}
                  className="px-6 py-2.5 bg-[#0071a4] text-white rounded-lg hover:bg-[#005a85] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {crud.loading && (
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
                  {crud.loading
                    ? "Guardando..."
                    : modal.mode === "create"
                    ? "Crear"
                    : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Estado */}
      {showEstadoModal && ejemplarToChangeEstado && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Cambiar Estado del Ejemplar
              </h3>
            </div>
            <form
              onSubmit={handleSubmitEstadoEjemplar}
              className="p-6 space-y-4"
            >
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Ejemplar:{" "}
                  <span className="font-mono font-semibold text-gray-900">
                    {ejemplarToChangeEstado.codigo_interno}
                  </span>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nuevo Estado <span className="text-red-500">*</span>
                </label>
                <select
                  value={nuevoEstadoId}
                  onChange={(e) => setNuevoEstadoId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={crud.loading}
                >
                  <option value="">Seleccionar estado</option>
                  {estadosEjemplar.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {crud.error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {crud.error}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowEstadoModal(false)}
                  disabled={crud.loading}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crud.loading}
                  className="px-6 py-2.5 bg-[#0071a4] text-white rounded-lg hover:bg-[#005a85] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {crud.loading && (
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
                  {crud.loading ? "Actualizando..." : "Actualizar Estado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={handleDelete}
        title="Eliminar Ejemplar"
        message="¿Estás seguro de que deseas eliminar este ejemplar? Esta acción no se puede deshacer."
        itemName={deleteModal.selectedItem?.codigo_interno}
        isDeleting={crud.loading}
      />

      {/* Modal Ver Detalles */}
      {viewModal.isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex items-center justify-center">
            {viewLoading ? (
              <LoadingSpinner message="Cargando detalles..." />
            ) : viewData ? (
              <div style={{ width: "100%" }}>
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Detalles del Ejemplar
                  </h3>
                  <button
                    onClick={viewModal.closeModal}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Código Interno
                      </label>
                      <p className="text-base text-gray-900 font-mono font-medium">
                        {viewData.codigo_interno}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Estado
                      </label>
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full tracking-wider ${getEstadoBadgeColor(
                          viewData.estado_id
                        )}`}
                      >
                        {getEstadoNombre(viewData.estado_id)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Libro
                      </label>
                      <p className="text-sm text-gray-900">
                        {getLibroTitulo(viewData.libro_id)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Fecha de Adquisición
                      </label>
                      <p className="text-sm text-gray-900">
                        {viewData.fecha_adquisicion
                          ? new Date(
                              viewData.fecha_adquisicion
                            ).toLocaleDateString("es-ES")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-4"></div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        ID
                      </label>
                      <p className="text-sm text-gray-600">{viewData.id}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Creado
                      </label>
                      <p className="text-sm text-gray-600">
                        {viewData.creado_en
                          ? new Date(viewData.creado_en).toLocaleDateString(
                              "es-ES"
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Actualizado
                      </label>
                      <p className="text-sm text-gray-600">
                        {viewData.actualizado_en
                          ? new Date(
                              viewData.actualizado_en
                            ).toLocaleDateString("es-ES")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
