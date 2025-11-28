import { useEffect, useState } from "react";
import useCRUD from "../../../hooks/useCRUD";
import useFiltering from "../../../hooks/useFiltering";
import useModal from "../../../hooks/useModal";
import useForm from "../../../hooks/useForm";
import SectionHeader from "../../shared/SectionHeader";
import SearchInput from "../../shared/SearchInput";
import LoadingSpinner from "../../shared/LoadingSpinner";
import EmptyState from "../../shared/EmptyState";
import ErrorMessage from "../../shared/ErrorMessage";
import ActionMenu from "../../shared/ActionMenu";
import DeleteConfirmModal from "../../shared/DeleteConfirmModal";

export default function AuthorsSection() {
  const crud = useCRUD("/api/v1/autores");
  const filtering = useFiltering(crud.data, {
    searchFields: ["nombre", "apellido", "nacionalidad"],
    defaultSortBy: "id",
    defaultSortOrder: "asc",
  });
  const modal = useModal();
  const deleteModal = useModal();
  const viewModal = useModal();
  const form = useForm({
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    nacionalidad: "",
  });

  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [viewData, setViewData] = useState(null);

  useEffect(() => {
    crud.fetchAll();
  }, []);

  const handleCreate = () => {
    form.resetForm();
    modal.openCreate();
  };

  const handleEdit = (autor) => {
    form.setValues({
      nombre: autor.nombre,
      apellido: autor.apellido,
      fecha_nacimiento: autor.fecha_nacimiento,
      nacionalidad: autor.nacionalidad,
    });
    modal.openEdit(autor);
  };

  const handleView = async (id) => {
    const result = await crud.fetchOneSilent(id);
    if (result.success) {
      setViewData(result.data);
      viewModal.openView(result.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    crud.setError("");

    const result =
      modal.mode === "create"
        ? await crud.create(form.formData)
        : await crud.update(modal.selectedItem.id, form.formData);

    if (result.success) {
      modal.closeModal();
      await crud.fetchAll();
    }
  };

  const handleDelete = async () => {
    const result = await crud.remove(deleteModal.selectedItem.id);
    if (result.success) {
      deleteModal.closeModal();
      await crud.fetchAll();
    }
  };

  return (
    <>
      <SectionHeader
        title="Gestión de Autores"
        description="Administra el catálogo de autores, agrega nuevos escritores y actualiza su información"
        buttonLabel="Nuevo Autor"
        onButtonClick={handleCreate}
      />

      <div className="mb-6">
        <SearchInput
          value={filtering.searchTerm}
          onChange={filtering.setSearchTerm}
          placeholder="Buscar por nombre, apellido o nacionalidad..."
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {crud.loading ? (
          <LoadingSpinner message="Cargando autores..." />
        ) : filtering.filteredData.length === 0 ? (
          <EmptyState
            hasSearch={true}
            searchTerm={filtering.searchTerm}
            message="No hay autores registrados"
          />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition w-20"
                  onClick={() => filtering.toggleSort("id")}
                >
                  <div className="flex items-center justify-center gap-2">
                    ID
                    {filtering.sortBy === "id" && (
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          filtering.sortOrder === "desc" ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Apellido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                  Nacionalidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Fecha Nacimiento
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filtering.filteredData.map((autor) => (
                <tr
                  key={autor.id}
                  className="hover:bg-gray-50 transition border-b border-gray-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium">
                    {autor.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {autor.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {autor.apellido}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {autor.nacionalidad || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {autor.fecha_nacimiento
                      ? new Date(autor.fecha_nacimiento).toLocaleDateString(
                          "es-ES"
                        )
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="relative flex justify-center">
                      <button
                        onClick={() =>
                          setActionMenuOpen(
                            actionMenuOpen === autor.id ? null : autor.id
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
                        isOpen={actionMenuOpen === autor.id}
                        onClose={() => setActionMenuOpen(null)}
                        actions={[
                          {
                            label: "Ver detalles",
                            onClick: () => handleView(autor.id),
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
                            label: "Editar",
                            onClick: () => handleEdit(autor),
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
                            onClick: () => deleteModal.openView(autor),
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                {modal.mode === "create" ? "Nuevo Autor" : "Editar Autor"}
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

            <form onSubmit={handleSubmit} className="p-6">
              <ErrorMessage message={crud.error} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.formData.nombre}
                    onChange={form.handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={form.formData.apellido}
                    onChange={form.handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    value={form.formData.fecha_nacimiento}
                    onChange={form.handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nacionalidad
                  </label>
                  <input
                    type="text"
                    name="nacionalidad"
                    value={form.formData.nacionalidad}
                    onChange={form.handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4]"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button
                  type="button"
                  onClick={modal.closeModal}
                  disabled={crud.loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crud.loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0071a4] rounded-lg hover:bg-[#005a85] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {crud.loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {viewModal.isOpen && viewData && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalles del Autor
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

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">ID</p>
                  <p className="text-base text-gray-900">{viewData.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nacionalidad
                  </p>
                  <p className="text-base text-gray-900">
                    {viewData.nacionalidad || "-"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nombre Completo
                  </p>
                  <p className="text-base text-gray-900">
                    {viewData.nombre} {viewData.apellido}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Fecha de Nacimiento
                  </p>
                  <p className="text-base text-gray-900">
                    {viewData.fecha_nacimiento
                      ? new Date(viewData.fecha_nacimiento).toLocaleDateString(
                          "es-ES"
                        )
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={viewModal.closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={handleDelete}
        title="Eliminar Autor"
        message="¿Estás seguro de que deseas eliminar este autor? Esta acción no se puede deshacer."
        itemName={
          deleteModal.selectedItem
            ? `${deleteModal.selectedItem.nombre} ${deleteModal.selectedItem.apellido}`
            : ""
        }
        isDeleting={crud.loading}
      />
    </>
  );
}
