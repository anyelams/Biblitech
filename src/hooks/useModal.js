import { useState } from "react";

/**
 * Hook para manejar modales
 * @returns {Object} - Estados y funciones para modales
 */
export default function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("create"); // "create" | "edit" | "view"
  const [selectedItem, setSelectedItem] = useState(null);

  const openModal = (modalMode = "create", item = null) => {
    setMode(modalMode);
    setSelectedItem(item);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setMode("create");
    setSelectedItem(null);
  };

  const openCreate = () => openModal("create");
  const openEdit = (item) => openModal("edit", item);
  const openView = (item) => openModal("view", item);

  return {
    isOpen,
    mode,
    selectedItem,
    openModal,
    closeModal,
    openCreate,
    openEdit,
    openView,
  };
}
