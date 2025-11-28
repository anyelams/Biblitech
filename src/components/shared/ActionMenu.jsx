import { useEffect, useRef } from "react";

export default function ActionMenu({
  isOpen,
  onClose,
  actions = [],
}) {
  const menuRef = useRef(null);

  // Cerrar al hacer clic fuera del menú
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
    >
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => {
            action.onClick();
            onClose();
          }}
          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition ${
            action.className || "text-gray-700"
          }`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}
