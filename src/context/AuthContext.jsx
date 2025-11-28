import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener datos del usuario desde el backend
  const fetchUserData = async (token) => {
    try {
      const response = await fetch("/api/v1/auth/yo", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem(
          "biblitech_current_user",
          JSON.stringify(userData)
        );
        return userData;
      } else {
        // Token inválido o expirado
        logout();
        return null;
      }
    } catch (err) {
      console.error("Error al obtener datos del usuario:", err);
      logout();
      return null;
    }
  };

  // Cargar sesión al iniciar
  useEffect(() => {
    const accessToken = localStorage.getItem("biblitech_access_token");

    if (accessToken) {
      // Obtener datos del usuario con el token
      fetchUserData(accessToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (token) => {
    // Guardar token y obtener datos del usuario
    localStorage.setItem("biblitech_access_token", token);
    await fetchUserData(token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("biblitech_current_user");
    localStorage.removeItem("biblitech_access_token");
    localStorage.removeItem("biblitech_refresh_token");
  };

  const getAccessToken = () => {
    return localStorage.getItem("biblitech_access_token");
  };

  const value = {
    user,
    login,
    logout,
    getAccessToken,
    isAuthenticated: !!user,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
