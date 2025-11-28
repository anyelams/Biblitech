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
import ErrorMessage from "../../shared/ErrorMessage";
import ActionMenu from "../../shared/ActionMenu";
import DeleteConfirmModal from "../../shared/DeleteConfirmModal";

export default function UsersSection() {
  const crud = useCRUD("/api/v1/usuarios");
  const filtering = useFiltering(crud.data, {
    searchFields: ["nombre", "apellido", "documento"],
    defaultSortBy: "id",
    defaultSortOrder: "asc",
  });

  const modal = useModal();
  const deleteModal = useModal();
  const viewModal = useModal();
  const form = useForm({
    nombre: "",
    apellido: "",
    correo: "",
    documento: "",
    tipo_documento_id: 1,
    telefono: "",
    direccion: "",
    fecha_nacimiento: "",
    contrasena: "",
  });

  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [roles, setRoles] = useState([]);
  const [estados, setEstados] = useState([]);

  const [toggleStatusModal, setToggleStatusModal] = useState({
    isOpen: false,
    user: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([crud.fetchAll(), fetchRoles(), fetchEstados()]);
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/roles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (err) {
      console.error("Error al cargar roles:", err);
    }
  };

  const fetchEstados = async () => {
    try {
      const response = await fetch("/api/v1/estados/tipo?type=usuario");
      if (response.ok) {
        const data = await response.json();
        setEstados(data);
      }
    } catch (err) {
      console.error("Error al cargar estados:", err);
    }
  };

  // Función para validar solo números
  const handleNumericInput = (e) => {
    const { name, value } = e.target;
    // Solo permite números
    const numericValue = value.replace(/\D/g, "");
    form.setValues({ ...form.formData, [name]: numericValue });
  };

  const handleTextInput = (e) => {
    const { name, value } = e.target;
    // Solo permite letras y espacios
    const textValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    form.setValues({ ...form.formData, [name]: textValue });
  };

  const handleCreate = () => {
    form.resetForm();
    setCurrentStep(1);
    modal.openCreate();
  };

  const handleEdit = (user) => {
    form.setValues({
      nombre: user.nombre,
      apellido: user.apellido,
      correo: user.correo,
      documento: user.documento,
      tipo_documento_id: user.tipo_documento_id,
      telefono: user.telefono,
      direccion: user.direccion,
      fecha_nacimiento: user.fecha_nacimiento,
      contrasena: "",
      rol_id: user.rol_id,
      estado_id: user.estado_id,
    });
    setCurrentStep(1);
    modal.openEdit(user);
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

    try {
      const token = localStorage.getItem("biblitech_access_token");
      let result;

      if (modal.mode === "create") {
        // POST para crear usuario
        const payload = {
          correo: form.formData.correo,
          nombre: form.formData.nombre,
          apellido: form.formData.apellido,
          documento: form.formData.documento,
          tipo_documento_id: form.formData.tipo_documento_id,
          telefono: form.formData.telefono,
          direccion: form.formData.direccion,
          fecha_nacimiento: form.formData.fecha_nacimiento,
          contrasena: form.formData.contrasena,
        };

        result = await crud.create(payload);
      } else {
        // PUT para actualizar usuario (endpoint admin)
        const payload = {
          nombre: form.formData.nombre,
          apellido: form.formData.apellido,
          telefono: form.formData.telefono,
          direccion: form.formData.direccion,
          fecha_nacimiento: form.formData.fecha_nacimiento,
          rol_id: form.formData.rol_id,
          estado_id: form.formData.estado_id,
        };

        const response = await fetch(
          `/api/v1/usuarios/${modal.selectedItem.id}/admin`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok || response.status === 500) {
          result = { success: true };
          await crud.fetchAll();
        } else {
          let errorMsg = "Error al actualizar usuario";
          try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await response.json();
              if (typeof data.detail === "string") {
                errorMsg = data.detail;
              } else if (Array.isArray(data.detail) && data.detail.length > 0) {
                errorMsg = data.detail.map((err) => err.msg).join(", ");
              } else if (data.detail?.msg) {
                errorMsg = data.detail.msg;
              }
            }
          } catch (parseError) {
            errorMsg = `Error del servidor (${response.status})`;
          }
          crud.setError(errorMsg);
          result = { success: false };
        }
      }

      if (result.success) {
        modal.closeModal();
        setCurrentStep(1);
        await crud.fetchAll();
      }
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      crud.setError("Error al conectar con el servidor");
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch(
        `/api/v1/usuarios/${deleteModal.selectedItem.id}/suave`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        deleteModal.closeModal();
        await crud.fetchAll();
      } else {
        crud.setError("Error al eliminar usuario");
      }
    } catch (err) {
      crud.setError("Error al conectar con el servidor");
    }
  };

  const getRoleName = (rolId) => {
    const rol = roles.find((r) => r.id === rolId);
    if (!rol) return "Desconocido";
    return (
      rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1).toLowerCase()
    );
  };

  const getRoleBadgeColor = (rolId) => {
    const colors = {
      1: "bg-purple-100 text-purple-800", // Administrador
      2: "bg-[#0071a4]/10 text-[#0071a4]", // Bibliotecario
      3: "bg-amber-100 text-amber-800", // Lector
    };
    return colors[rolId] || "bg-gray-100 text-gray-900";
  };

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleToggleStatus = (user) => {
    setToggleStatusModal({ isOpen: true, user });
  };

  const confirmToggleStatus = async () => {
    const user = toggleStatusModal.user;
    if (!user) return;

    try {
      const token = localStorage.getItem("biblitech_access_token");
      const newStatus = user.estado_id === 1 ? 2 : 1; // Toggle: Activo (1) ↔ Inactivo (2)

      const payload = {
        nombre: user.nombre,
        apellido: user.apellido,
        telefono: user.telefono || "",
        direccion: user.direccion || "",
        fecha_nacimiento: user.fecha_nacimiento || "",
        rol_id: user.rol_id,
        estado_id: newStatus,
      };

      const response = await fetch(`/api/v1/usuarios/${user.id}/admin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 500) {
        setToggleStatusModal({ isOpen: false, user: null });
        await crud.fetchAll();
      } else {
        let errorMsg = "Error al cambiar el estado del usuario";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (typeof data.detail === "string") {
              errorMsg = data.detail;
            } else if (Array.isArray(data.detail)) {
              errorMsg = data.detail
                .map((err) => {
                  if (typeof err === "string") return err;
                  if (err.msg) return err.msg;
                  return "Error de validación";
                })
                .join(", ");
            }
          }
        } catch (parseError) {
          errorMsg = `Error del servidor (${response.status})`;
        }
        crud.setError(errorMsg);
        setToggleStatusModal({ isOpen: false, user: null });
      }
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      crud.setError("Error al conectar con el servidor");
      setToggleStatusModal({ isOpen: false, user: null });
    }
  };

  return (
    <>
      <SectionHeader
        title="Gestión de Usuarios"
        description="Administra los usuarios del sistema, crea nuevas cuentas y actualiza información"
        buttonLabel="Nuevo Usuario"
        onButtonClick={handleCreate}
      />

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <SearchInput
          value={filtering.searchTerm}
          onChange={filtering.setSearchTerm}
          placeholder="Buscar por nombre, apellido o documento..."
        />

        <FilterSelect
          value={filtering.filters.rol_id || ""}
          onChange={(value) => filtering.updateFilter("rol_id", value)}
          placeholder="Todos los roles"
          options={roles.map((rol) => ({
            value: rol.id.toString(),
            label:
              rol.nombre.charAt(0).toUpperCase() +
              rol.nombre.slice(1).toLowerCase(),
          }))}
        />

        <FilterSelect
          value={filtering.filters.estado_id || ""}
          onChange={(value) => filtering.updateFilter("estado_id", value)}
          placeholder="Todos los estados"
          options={[
            { value: "1", label: "Activo" },
            { value: "2", label: "Inactivo" },
          ]}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {crud.loading ? (
          <LoadingSpinner message="Cargando usuarios..." />
        ) : filtering.filteredData.length === 0 ? (
          <EmptyState
            hasSearch={true}
            searchTerm={filtering.searchTerm}
            message="No hay usuarios registrados"
          />
        ) : (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 transition w-64">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 transition w-32">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 transition w-32">
                  Fecha Nac.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 transition w-32">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 transition w-48">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 transition w-32">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 transition w-28">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:bg-gray-100 transition w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtering.filteredData.map((usr) => (
                <tr key={usr.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {usr.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {usr.nombre} {usr.apellido}
                      </p>
                      <p className="text-sm text-gray-500">{usr.correo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{usr.documento}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">
                      {usr.fecha_nacimiento
                        ? new Date(usr.fecha_nacimiento).toLocaleDateString(
                            "es-ES"
                          )
                        : "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{usr.telefono}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{usr.direccion}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full tracking-wide ${getRoleBadgeColor(
                        usr.rol_id
                      )}`}
                    >
                      {getRoleName(usr.rol_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full tracking-wide ${
                        usr.estado_id === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {usr.estado_id === 1 ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="relative flex justify-center">
                      <button
                        onClick={() =>
                          setActionMenuOpen(
                            actionMenuOpen === usr.id ? null : usr.id
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
                        isOpen={actionMenuOpen === usr.id}
                        onClose={() => setActionMenuOpen(null)}
                        actions={[
                          {
                            label: "Ver detalles",
                            onClick: () => handleView(usr.id),
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
                            onClick: () => handleEdit(usr),
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
                            label:
                              usr.estado_id === 1 ? "Inhabilitar" : "Habilitar",
                            onClick: () => handleToggleStatus(usr),
                            className:
                              usr.estado_id === 1
                                ? "text-red-600"
                                : "text-green-600",
                            icon:
                              usr.estado_id === 1 ? (
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
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                  />
                                </svg>
                              ) : (
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              ),
                          },
                          {
                            label: "Eliminar",
                            onClick: () => deleteModal.openView(usr),
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

      {/* Modal Crear/Editar en 2 Pasos */}
      {modal.isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                {modal.mode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
              </h3>
              <button
                onClick={modal.closeModal}
                disabled={crud.loading}
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

            {/* Indicador de pasos */}
            {modal.mode === "create" && (
              <div className="px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep >= 1
                          ? "bg-[#0071a4] text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      1
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        currentStep >= 1 ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      Información personal
                    </span>
                  </div>
                  <div className="mx-2 h-1 bg-gray-200 rounded relative w-16">
                    <div
                      className={`absolute left-0 top-0 h-full rounded transition-all ${
                        currentStep >= 2 ? "bg-[#0071a4] w-full" : "w-0"
                      }`}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep >= 2
                          ? "bg-[#0071a4] text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      2
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        currentStep >= 2 ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      Datos de acceso
                    </span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
              <ErrorMessage message={crud.error} />

              {/* Modal de editar usuario */}
              {modal.mode === "edit" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={form.formData.nombre}
                        onChange={handleTextInput}
                        required
                        disabled={crud.loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
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
                        onChange={handleTextInput}
                        required
                        disabled={crud.loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        name="telefono"
                        value={form.formData.telefono}
                        onChange={handleNumericInput}
                        disabled={crud.loading}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
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
                        max={new Date().toISOString().split("T")[0]}
                        disabled={crud.loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="rol_id"
                        value={form.formData.rol_id}
                        onChange={form.handleInputChange}
                        required
                        disabled={crud.loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccionar rol</option>
                        {roles.map((rol) => (
                          <option key={rol.id} value={rol.id}>
                            {rol.nombre.charAt(0).toUpperCase() +
                              rol.nombre.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        name="estado_id"
                        value={form.formData.estado_id}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
                      >
                        {estados.map((estado) => (
                          <option key={estado.id} value={estado.id}>
                            {estado.nombre}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Usa "Habilitar/Inhabilitar" para cambiar el estado
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <textarea
                      name="direccion"
                      value={form.formData.direccion}
                      onChange={form.handleInputChange}
                      rows={3}
                      disabled={crud.loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}
              {/* Paso 1: Datos personales */}
              {modal.mode === "create" && currentStep === 1 && (
                <div className="space-y-4">
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
                        disabled={crud.loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
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
                        disabled={crud.loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Documento{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="tipo_documento_id"
                        value={form.formData.tipo_documento_id}
                        onChange={form.handleInputChange}
                        required
                        disabled={crud.loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="1">Cédula de Ciudadanía</option>
                        <option value="2">Cédula de Extranjería</option>
                        <option value="3">Pasaporte</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Documento{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="documento"
                        value={form.formData.documento}
                        onChange={handleNumericInput}
                        required
                        disabled={crud.loading}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        name="telefono"
                        value={form.formData.telefono}
                        onChange={handleNumericInput}
                        disabled={crud.loading}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
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
                        max={new Date().toISOString().split("T")[0]}
                        disabled={crud.loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <textarea
                      name="direccion"
                      value={form.formData.direccion}
                      onChange={form.handleInputChange}
                      rows={3}
                      disabled={crud.loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {/* Paso 2: Datos de acceso */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="correo"
                      value={form.formData.correo}
                      onChange={form.handleInputChange}
                      required
                      disabled={crud.loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Este correo será utilizado para iniciar sesión
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="contrasena"
                      value={form.formData.contrasena}
                      onChange={form.handleInputChange}
                      required
                      minLength={6}
                      disabled={crud.loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071a4] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Mínimo 6 caracteres
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Credenciales de acceso
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          El usuario podrá iniciar sesión con el correo y
                          contraseña proporcionados.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end mt-8">
                {modal.mode === "create" && currentStep === 2 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={crud.loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                )}

                <button
                  type="button"
                  onClick={modal.closeModal}
                  disabled={crud.loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Cancelar
                </button>

                {modal.mode === "create" && currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={crud.loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0071a4] rounded-lg hover:bg-[#005a85] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={crud.loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0071a4] rounded-lg hover:bg-[#005a85] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
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
                    {crud.loading ? "Guardando..." : "Guardar"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {viewModal.isOpen && viewData && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalles del Usuario
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

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fila 1: Rol y Estado */}
              <div>
                <p className="text-sm font-medium text-gray-500">Rol</p>
                <span
                  className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(
                    viewData.rol_id
                  )}`}
                >
                  {getRoleName(viewData.rol_id)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <span
                  className={`mt-1 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    viewData.estado_id === 1
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {viewData.estado_id === 1 ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* Fila 2: Nombre y Documento */}
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre</p>
                <p className="text-base text-gray-900">
                  {viewData.nombre} {viewData.apellido}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Documento</p>
                <p className="text-base text-gray-900">{viewData.documento}</p>
              </div>

              {/* Fila 3: Fecha de nacimiento y Dirección */}
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
              <div>
                <p className="text-sm font-medium text-gray-500">Dirección</p>
                <p className="text-base text-gray-900">
                  {viewData.direccion || "-"}
                </p>
              </div>

              {/* Fila 4: Correo y Teléfono */}
              <div>
                <p className="text-sm font-medium text-gray-500">Correo</p>
                <p className="text-base text-gray-900">{viewData.correo}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                <p className="text-base text-gray-900">
                  {viewData.telefono || "-"}
                </p>
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
        title="Eliminar Usuario"
        message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        itemName={
          deleteModal.selectedItem
            ? `${deleteModal.selectedItem.nombre} ${deleteModal.selectedItem.apellido}`
            : ""
        }
        isDeleting={crud.loading}
      />
      {/* Modal Habilitar/Inhabilitar */}
      {toggleStatusModal.isOpen && toggleStatusModal.user && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    toggleStatusModal.user.estado_id === 1
                      ? "bg-orange-100"
                      : "bg-green-100"
                  }`}
                >
                  {toggleStatusModal.user.estado_id === 1 ? (
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
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  ) : (
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
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {toggleStatusModal.user.estado_id === 1
                      ? "Inhabilitar Usuario"
                      : "Habilitar Usuario"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {toggleStatusModal.user.nombre}{" "}
                    {toggleStatusModal.user.apellido}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                {toggleStatusModal.user.estado_id === 1
                  ? "¿Está seguro de inhabilitar este usuario? El usuario no podrá acceder al sistema hasta que sea reactivado."
                  : "¿Está seguro de habilitar este usuario? El usuario podrá acceder al sistema nuevamente."}
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setToggleStatusModal({ isOpen: false, user: null })
                  }
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmToggleStatus}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
                    toggleStatusModal.user.estado_id === 1
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {toggleStatusModal.user.estado_id === 1
                    ? "Inhabilitar"
                    : "Habilitar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
