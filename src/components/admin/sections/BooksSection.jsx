import { useEffect, useState } from "react";
import useCRUD from "../../../hooks/useCRUD";
import useFiltering from "../../../hooks/useFiltering";
import useModal from "../../../hooks/useModal";
import useForm from "../../../hooks/useForm";
import SectionHeader from "../../shared/SectionHeader";
import SearchInput from "../../shared/SearchInput";
import FilterSelect from "../../shared/FilterSelect";
import LoadingSpinner from "../../shared/LoadingSpinner";
import EmptyState from "../../shared/EmptyState";
import ActionMenu from "../../shared/ActionMenu";
import DeleteConfirmModal from "../../shared/DeleteConfirmModal";

export default function BooksSection() {
  const crud = useCRUD("/api/v1/libros");
  const filtering = useFiltering(crud.data, {
    searchFields: ["titulo", "editorial"],
    defaultSortBy: "id",
    defaultSortOrder: "asc",
  });

  const modal = useModal();
  const deleteModal = useModal();
  const viewModal = useModal();
  const form = useForm({
    titulo: "",
    descripcion: "",
    categoria_id: "",
    editorial: "",
    fecha_publicacion: "",
    autor_id: "",
  });

  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [autores, setAutores] = useState([]);
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([crud.fetchAll(), fetchCategorias(), fetchAutores()]);
  };

  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/categorias", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };

  const fetchAutores = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/autores", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAutores(data);
      }
    } catch (err) {
      console.error("Error al cargar autores:", err);
    }
  };

  const handleCreate = () => {
    form.resetForm();
    setImagen(null);
    setImagenPreview(null);
    crud.setError("");
    modal.openCreate();
  };

  const handleEdit = (libro) => {
    form.setValues({
      titulo: libro.titulo,
      descripcion: libro.descripcion || "",
      categoria_id: libro.categoria_id,
      editorial: libro.editorial || "",
      fecha_publicacion: libro.fecha_publicacion || "",
      autor_id: libro.autores?.[0]?.id || "",
    });
    setImagen(null);
    setImagenPreview(libro.imagen_url || null);
    crud.setError("");
    modal.openEdit(libro);
  };

  const handleView = async (id) => {
    const result = await crud.fetchOneSilent(id);
    if (result.success) {
      setViewData(result.data);
      viewModal.openView(result.data);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    crud.setError("");

    const camposFaltantes = [];

    if (!form.formData.titulo.trim()) {
      camposFaltantes.push("Título");
    }
    if (!form.formData.categoria_id) {
      camposFaltantes.push("Categoría");
    }
    if (!form.formData.editorial.trim()) {
      camposFaltantes.push("Editorial");
    }
    if (!form.formData.fecha_publicacion) {
      camposFaltantes.push("Fecha de Publicación");
    }
    if (!form.formData.descripcion.trim()) {
      camposFaltantes.push("Descripción");
    }
    if (!form.formData.autor_id) {
      camposFaltantes.push("Autor");
    }
    if (modal.mode === "create" && !imagen) {
      camposFaltantes.push("Portada del libro");
    }

    if (camposFaltantes.length > 0) {
      crud.setError("Faltan completar los campos obligatorios");
      return;
    }

    try {
      const token = localStorage.getItem("biblitech_access_token");

      if (modal.mode === "create") {
        const formData = new FormData();

        const libroData = {
          titulo: form.formData.titulo,
          descripcion: form.formData.descripcion,
          categoria_id: parseInt(form.formData.categoria_id),
          editorial: form.formData.editorial,
          fecha_publicacion: form.formData.fecha_publicacion,
          autores_ids: [parseInt(form.formData.autor_id)],
        };

        formData.append("libro", JSON.stringify(libroData));

        if (imagen) {
          formData.append("file", imagen);
        }

        const response = await fetch("/api/v1/libros", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          modal.closeModal();
          await crud.fetchAll();
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            crud.setError(errorData.detail || "Error al crear libro");
          } else {
            const errorText = await response.text();
            console.error("Error response:", errorText);
            crud.setError("Error al crear libro");
          }
        }
      } else {
        const libroJson = {
          titulo: form.formData.titulo,
          descripcion: form.formData.descripcion,
          categoria_id: parseInt(form.formData.categoria_id),
          editorial: form.formData.editorial,
          fecha_publicacion: form.formData.fecha_publicacion,
          imagen_url: modal.selectedItem.imagen_url || "",
          autores_ids: [parseInt(form.formData.autor_id)],
        };

        const response = await fetch(
          `/api/v1/libros/${modal.selectedItem.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(libroJson),
          }
        );

        if (response.ok) {
          if (imagen) {
            const formData = new FormData();
            formData.append("file", imagen);

            const imagenResponse = await fetch(
              `/api/v1/libros/${modal.selectedItem.id}/imagen`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: formData,
              }
            );

            if (!imagenResponse.ok) {
              const contentType = imagenResponse.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const errorData = await imagenResponse.json();
                crud.setError(errorData.detail || "Error al actualizar imagen");
              } else {
                crud.setError("Error al actualizar imagen");
              }
              return;
            }
          }

          modal.closeModal();
          await crud.fetchAll();
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            crud.setError(errorData.detail || "Error al actualizar libro");
          } else {
            const errorText = await response.text();
            console.error("Error response:", errorText);
            crud.setError("Error al actualizar libro");
          }
        }
      }
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      crud.setError("Error al conectar con el servidor");
    }
  };

  const handleDelete = async () => {
    const result = await crud.remove(deleteModal.selectedItem.id);
    if (result.success) {
      deleteModal.closeModal();
      await crud.fetchAll();
    }
  };

  const getCategoriaName = (categoriaId) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria ? categoria.nombre : "Sin categoría";
  };

  const getAutoresNames = (autores) => {
    if (!autores || autores.length === 0) return "Desconocido";
    return autores.map((a) => `${a.nombre} ${a.apellido}`).join(", ");
  };

  const getEstadoBadge = (libro) => {
    if (libro.ejemplares_disponibles > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Disponible
        </span>
      );
    } else if (libro.ejemplares_count > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          Prestado
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          Sin ejemplares
        </span>
      );
    }
  };

  return (
    <>
      <SectionHeader
        title="Gestión de Libros"
        description="Administra el catálogo de libros, agrega nuevos títulos y actualiza su información"
        buttonLabel="Nuevo Libro"
        onButtonClick={handleCreate}
      />

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <SearchInput
          value={filtering.searchTerm}
          onChange={filtering.setSearchTerm}
          placeholder="Buscar por título, descripción o editorial..."
        />

        <FilterSelect
          value={filtering.filters.categoria_id || ""}
          onChange={(value) => filtering.updateFilter("categoria_id", value)}
          placeholder="Todas las categorías"
          options={categorias.map((cat) => ({
            value: cat.id.toString(),
            label: cat.nombre,
          }))}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {crud.loading ? (
          <LoadingSpinner message="Cargando libros..." />
        ) : filtering.filteredData.length === 0 ? (
          <EmptyState
            hasSearch={true}
            searchTerm={filtering.searchTerm}
            message="No hay libros registrados"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition w-16"
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
                          viewBox="0 0 24 24"
                          stroke="currentColor"
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Portada
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Autor(es)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Editorial
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Año
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    Disponibles
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtering.filteredData.map((libro) => (
                  <tr key={libro.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                      {libro.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-12 h-16 rounded overflow-hidden shadow-sm bg-gray-100">
                        {libro.imagen_url ? (
                          <img
                            src={libro.imagen_url}
                            alt={libro.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                            <svg
                              className="w-6 h-6 text-gray-400"
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
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {libro.titulo}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">
                        {getAutoresNames(libro.autores)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">
                        {libro.editorial || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="text-sm text-gray-900">
                        {libro.fecha_publicacion
                          ? new Date(libro.fecha_publicacion).getFullYear()
                          : "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getEstadoBadge(libro)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="text-sm font-semibold text-gray-900">
                        {libro.ejemplares_disponibles || 0} /{" "}
                        {libro.ejemplares_count || 0}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative flex justify-center">
                        <button
                          onClick={() =>
                            setActionMenuOpen(
                              actionMenuOpen === libro.id ? null : libro.id
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
                          isOpen={actionMenuOpen === libro.id}
                          onClose={() => setActionMenuOpen(null)}
                          actions={[
                            {
                              label: "Ver detalles",
                              onClick: () => handleView(libro.id),
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
                              onClick: () => handleEdit(libro),
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
                              onClick: () => deleteModal.openView(libro),
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
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {modal.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {modal.mode === "create" ? "Nuevo Libro" : "Editar Libro"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {crud.error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {crud.error}
                </div>
              )}
              <div className="flex gap-6">
                {/* Columna izquierda: Portada */}
                <div className="shrink-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portada del Libro{" "}
                    {modal.mode === "create" && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <label
                      htmlFor="libro-imagen-upload"
                      className={`block w-64 h-80 border-2 border-dashed border-gray-300 rounded-lg ${
                        crud.loading
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:border-[#0071a4]"
                      } transition bg-gray-50 overflow-hidden`}
                    >
                      {imagenPreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={imagenPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          {!crud.loading && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                              <div className="text-white text-center">
                                <svg
                                  className="w-8 h-8 mx-auto mb-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <p className="text-sm font-medium">
                                  Cambiar imagen
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full px-6 text-gray-500">
                          <svg
                            className="w-12 h-12 mb-3 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Click para subir portada
                          </p>
                          <p className="text-xs text-gray-500 text-center">
                            JPG, PNG hasta 2MB
                          </p>
                        </div>
                      )}
                    </label>
                    <input
                      id="libro-imagen-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={crud.loading}
                    />
                    {imagenPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagen(null);
                          setImagenPreview(null);
                          document.getElementById("libro-imagen-upload").value =
                            "";
                        }}
                        disabled={crud.loading}
                        className="mt-2 w-full px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
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
                        Eliminar imagen
                      </button>
                    )}
                  </div>
                </div>

                {/* Columna derecha: Formulario */}
                <div className="flex-1 space-y-4">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      required
                      value={form.formData.titulo}
                      onChange={form.handleInputChange}
                      disabled={crud.loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Categoría y Editorial */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="categoria_id"
                        value={form.formData.categoria_id}
                        onChange={form.handleInputChange}
                        disabled={crud.loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccionar categoría</option>
                        {categorias.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Editorial <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="editorial"
                        value={form.formData.editorial}
                        onChange={form.handleInputChange}
                        disabled={crud.loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Fecha de Publicación y Autor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Publicación{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="fecha_publicacion"
                        value={form.formData.fecha_publicacion}
                        onChange={form.handleInputChange}
                        disabled={crud.loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Autor <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="autor_id"
                        value={form.formData.autor_id}
                        onChange={form.handleInputChange}
                        disabled={crud.loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccionar autor</option>
                        {autores.map((autor) => (
                          <option key={autor.id} value={autor.id}>
                            {`${autor.nombre} ${autor.apellido}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      name="descripcion"
                      value={form.formData.descripcion}
                      onChange={form.handleInputChange}
                      disabled={crud.loading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Descripción del libro"
                    />
                  </div>
                </div>
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
                    ? "Crear Libro"
                    : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {viewModal.isOpen && viewData && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header minimalista */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h3 className="text-base font-semibold text-slate-900">
                Detalles del Libro
              </h3>
              <button
                onClick={viewModal.closeModal}
                className="text-slate-400 hover:text-slate-600 transition p-1.5 hover:bg-slate-100 rounded-lg"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto">
              {/* Hero Section simplificado */}
              <div className="p-6">
                <div className="flex gap-6 items-start">
                  {/* Imagen más pequeña */}
                  {viewData.imagen_url && (
                    <div className="shrink-0">
                      <img
                        src={viewData.imagen_url}
                        alt={viewData.titulo}
                        className="w-32 h-44 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  )}

                  {/* Info Principal */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-900 mb-2">
                      {viewData.titulo}
                    </h1>

                    {/* Autores compacto */}
                    {viewData.autores && viewData.autores.length > 0 && (
                      <p className="text-sm text-slate-600 mb-3">
                        {viewData.autores
                          .map((autor) => `${autor.nombre} ${autor.apellido}`)
                          .join(", ")}
                      </p>
                    )}

                    {/* Meta info grid simple */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <p className="text-slate-500 mb-0.5">Categoría</p>
                        <p className="text-slate-900 font-medium">
                          {getCategoriaName(viewData.categoria_id)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Disponibilidad</p>
                        <p
                          className={`font-medium ${
                            viewData.ejemplares_disponibles > 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {viewData.ejemplares_disponibles > 0
                            ? `${viewData.ejemplares_disponibles} disponibles`
                            : "No disponible"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Editorial</p>
                        <p className="text-slate-900 font-medium">
                          {viewData.editorial || "Sin editorial"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Publicación</p>
                        <p className="text-slate-900 font-medium">
                          {viewData.fecha_publicacion
                            ? new Date(viewData.fecha_publicacion).getFullYear()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripción más compacta */}
              {viewData.descripcion && (
                <div className="px-6 pb-6 border-b border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {viewData.descripcion}
                  </p>
                </div>
              )}

              {/* Estadísticas rediseñadas - más compactas */}
              <div className="px-6 py-5 bg-slate-50/50">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Disponibilidad
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  <div className="bg-white rounded-lg p-3 text-center border border-slate-200/60">
                    <p className="text-xl font-bold text-slate-900">
                      {viewData.ejemplares_count || 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">
                      Total
                    </p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                    <p className="text-xl font-bold text-emerald-600">
                      {viewData.ejemplares_disponibles || 0}
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5 uppercase tracking-wide">
                      Disponibles
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                    <p className="text-xl font-bold text-blue-600">
                      {viewData.ejemplares_reservados || 0}
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5 uppercase tracking-wide">
                      Reservados
                    </p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
                    <p className="text-xl font-bold text-amber-600">
                      {viewData.ejemplares_prestados || 0}
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5 uppercase tracking-wide">
                      Prestados
                    </p>
                  </div>

                  <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
                    <p className="text-xl font-bold text-red-600">
                      {viewData.ejemplares_danados || 0}
                    </p>
                    <p className="text-xs text-red-700 mt-0.5 uppercase tracking-wide">
                      Dañados
                    </p>
                  </div>
                </div>

                {/* Alerta compacta */}
                {viewData.ejemplares_danados > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-3">
                    <svg
                      className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        {viewData.ejemplares_danados}{" "}
                        {viewData.ejemplares_danados === 1
                          ? "ejemplar dañado"
                          : "ejemplares dañados"}
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        No disponibles para préstamo
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Información de registro compacta */}
              <div className="px-6 py-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>
                    Registrado:{" "}
                    {new Date(viewData.creado_en).toLocaleDateString("es-ES")}
                  </span>
                  <span>
                    Actualizado:{" "}
                    {new Date(viewData.actualizado_en).toLocaleDateString(
                      "es-ES"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer simplificado */}
            <div className="border-t border-slate-200 px-6 py-3 bg-white flex items-center justify-end gap-3">
              <button
                onClick={viewModal.closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
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
        title="Eliminar Libro"
        message="¿Estás seguro de que deseas eliminar este libro? Esta acción no se puede deshacer."
        itemName={deleteModal.selectedItem?.titulo}
        isDeleting={crud.loading}
      />
    </>
  );
}
