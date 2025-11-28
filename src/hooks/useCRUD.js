import { useState } from "react";

export default function useCRUD(endpoint) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("biblitech_access_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // ---------------------------
  // FETCH ALL - obtiene la tabla
  // ---------------------------
  const fetchAll = async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const response = await fetch(url, { headers: getAuthHeaders() });

      if (response.ok) {
        const result = await response.json();
        setData(result);
        return { success: true, data: result };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.detail || errorData.message || "Error al cargar los datos";
        setError(message);
        return { success: false, error: message };
      }
    } catch (err) {
      const message = "Error de conexión al servidor";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // FETCH ONE (normal)
  // Recarga tabla porque usa loading
  // ---------------------------
  const fetchOne = async (id) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.detail ||
          errorData.message ||
          "Error al cargar el registro";
        setError(message);
        return { success: false, error: message };
      }
    } catch (err) {
      const message = "Error de conexión al servidor";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // FETCH ONE SILENT (nuevo)
  // NO usa loading, NO refresca tabla
  // ---------------------------
  const fetchOneSilent = async (id) => {
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.detail ||
          errorData.message ||
          "Error al cargar el registro";
        return { success: false, error: message };
      }
    } catch (err) {
      return { success: false, error: "Error de conexión al servidor" };
    }
  };

  // ---------------------------
  // CREATE
  // ---------------------------
  const create = async (newData, customHeaders = {}) => {
    setLoading(true);
    setError("");
    try {
      const headers = { ...getAuthHeaders(), ...customHeaders };

      const body = customHeaders["Content-Type"]
        ? newData
        : JSON.stringify(newData);

      if (newData instanceof FormData) delete headers["Content-Type"];

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body,
      });

      if (response.ok) {
        const result = await response.json();
        setData((prev) => [...prev, result]);
        return { success: true, data: result };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.detail || errorData.message || "Error al crear el registro";
        setError(message);
        return { success: false, error: message };
      }
    } catch (err) {
      const message = "Error de conexión al servidor";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // UPDATE
  // ---------------------------
  const update = async (id, updatedData, customHeaders = {}) => {
    setLoading(true);
    setError("");
    try {
      const headers = { ...getAuthHeaders(), ...customHeaders };

      const body = customHeaders["Content-Type"]
        ? updatedData
        : JSON.stringify(updatedData);

      if (updatedData instanceof FormData) delete headers["Content-Type"];

      const response = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers,
        body,
      });

      if (response.ok) {
        const result = await response.json();
        setData((prev) => prev.map((item) => (item.id === id ? result : item)));
        return { success: true, data: result };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.detail ||
          errorData.message ||
          "Error al actualizar el registro";
        setError(message);
        return { success: false, error: message };
      }
    } catch (err) {
      const message = "Error de conexión al servidor";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // PATCH
  // ---------------------------
  const patch = async (id, updatedData, customEndpoint = null) => {
    setLoading(true);
    setError("");
    try {
      const headers = getAuthHeaders();
      const url = customEndpoint || `${endpoint}/${id}`;

      if (updatedData instanceof FormData) delete headers["Content-Type"];

      const response = await fetch(url, {
        method: "PATCH",
        headers,
        body:
          updatedData instanceof FormData
            ? updatedData
            : JSON.stringify(updatedData),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.detail ||
          errorData.message ||
          "Error al actualizar el registro";
        setError(message);
        return { success: false, error: message };
      }
    } catch (err) {
      const message = "Error de conexión al servidor";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // DELETE
  // ---------------------------
  const remove = async (id) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setData((prev) => prev.filter((item) => item.id !== id));
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.detail ||
          errorData.message ||
          "Error al eliminar el registro";
        setError(message);
        return { success: false, error: message };
      }
    } catch (err) {
      const message = "Error de conexión al servidor";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    setData,
    loading,
    error,
    setError,
    fetchAll,
    fetchOne,
    fetchOneSilent,
    create,
    update,
    patch,
    remove,
  };
}
