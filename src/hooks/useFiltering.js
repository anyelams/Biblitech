import { useState, useMemo } from "react";

/**
 * Hook para manejar búsqueda, filtros y ordenamiento
 * @param {Array} data - Datos a filtrar
 * @param {Object} config - Configuración de filtros
 * @returns {Object} - Estados y funciones para filtrado
 */
export default function useFiltering(data = [], config = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState(config.defaultSortBy || "id");
  const [sortOrder, setSortOrder] = useState(config.defaultSortOrder || "asc");

  // Actualizar un filtro específico
  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm("");
    setFilters({});
  };

  // Alternar orden de clasificación
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Función de filtrado genérica
  const filterData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let filtered = [...data];

    // Aplicar búsqueda
    if (searchTerm && config.searchFields) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        config.searchFields.some((field) => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], item);
          return value?.toString().toLowerCase().includes(searchLower);
        })
      );
    }

    // Aplicar filtros adicionales
    Object.keys(filters).forEach((key) => {
      const filterValue = filters[key];
      if (filterValue !== "" && filterValue !== null && filterValue !== undefined) {
        filtered = filtered.filter((item) => {
          const itemValue = item[key];
          // Comparación estricta para IDs
          return itemValue?.toString() === filterValue.toString();
        });
      }
    });

    // Aplicar ordenamiento
    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = sortBy.split('.').reduce((obj, key) => obj?.[key], a);
        const bValue = sortBy.split('.').reduce((obj, key) => obj?.[key], b);

        // Manejar valores nulos/undefined
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortOrder === "asc" ? 1 : -1;
        if (bValue == null) return sortOrder === "asc" ? -1 : 1;

        // Comparar números
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }

        // Comparar strings
        const comparison = aValue.toString().localeCompare(bValue.toString());
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, filters, sortBy, sortOrder, config.searchFields]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSort,
    filteredData: filterData,
  };
}
