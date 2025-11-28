export default function EmptyState({ message, hasSearch = false, searchTerm = "" }) {
  const defaultMessage = hasSearch && searchTerm
    ? `No se encontraron resultados que coincidan con "${searchTerm}"`
    : message || "No hay datos disponibles";

  return (
    <div className="p-12 text-center text-gray-500">
      {defaultMessage}
    </div>
  );
}
