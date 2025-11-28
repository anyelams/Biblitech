import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login({
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) {
  const { login } = useAuth();

  const MAX_ATTEMPTS = 5;
  const LOCK_TIME_MINUTES = 5;

  const savedEmail = localStorage.getItem("biblitech_remember_email");
  const storedAttempts = parseInt(
    localStorage.getItem("login_attempts") || "0"
  );
  const storedLockTime = localStorage.getItem("login_lock_time");
  const lockedEmail = localStorage.getItem("login_locked_email");

  const [formData, setFormData] = useState({
    username: savedEmail || "",
    password: "",
  });

  const [attempts, setAttempts] = useState(storedAttempts);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedEmail);

  const calculateRemainingTime = (lockTime) => {
    const lockedAt = new Date(lockTime);
    const now = new Date();
    const diffMs = LOCK_TIME_MINUTES * 60 * 1000 - (now - lockedAt);
    if (diffMs <= 0) return "00:00";

    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const checkLockStatus = () => {
    if (!storedLockTime || formData.username !== lockedEmail) return false;

    const lockedAt = new Date(storedLockTime);
    const now = new Date();
    const diffMinutes = (now - lockedAt) / (1000 * 60);

    if (diffMinutes < LOCK_TIME_MINUTES) {
      setIsLocked(true);
      setRemainingTime(calculateRemainingTime(storedLockTime));
      return true;
    } else {
      localStorage.removeItem("login_lock_time");
      localStorage.removeItem("login_locked_email");
      localStorage.setItem("login_attempts", "0");
      setIsLocked(false);
      setAttempts(0);
      setRemainingTime("");
      return false;
    }
  };

  useEffect(() => {
    checkLockStatus();
  }, []);

  useEffect(() => {
    if (!isLocked) return;

    const interval = setInterval(() => {
      const lockTime = localStorage.getItem("login_lock_time");
      const remaining = calculateRemainingTime(lockTime);
      setRemainingTime(remaining);

      if (remaining === "00:00") {
        localStorage.removeItem("login_lock_time");
        localStorage.removeItem("login_locked_email");
        localStorage.setItem("login_attempts", "0");

        setIsLocked(false);
        setAttempts(0);
        setRemainingTime("");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked]);

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);

    if (e.target.name === "username") {
      if (updated.username !== lockedEmail) {
        setIsLocked(false);
        setRemainingTime("");
        localStorage.setItem("login_attempts", "0");
        setAttempts(0);
        return;
      }

      if (updated.username === lockedEmail) {
        checkLockStatus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (checkLockStatus()) {
      setError("Cuenta bloqueada temporalmente. Intente nuevamente más tarde.");
      return;
    }

    if (!formData.username || !formData.password) {
      setError("Por favor, completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.append("username", formData.username);
      body.append("password", formData.password);

      const response = await fetch("/api/v1/auth/inicio-sesion", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("login_attempts", "0");
        localStorage.removeItem("login_lock_time");
        localStorage.removeItem("login_locked_email");
        setAttempts(0);

        if (rememberMe) {
          localStorage.setItem("biblitech_remember_email", formData.username);
        } else {
          localStorage.removeItem("biblitech_remember_email");
        }

        localStorage.setItem("biblitech_refresh_token", data.refresh_token);
        await login(data.access_token);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem("login_attempts", newAttempts.toString());

        if (newAttempts >= MAX_ATTEMPTS) {
          const now = new Date();
          localStorage.setItem("login_lock_time", now.toISOString());
          localStorage.setItem("login_locked_email", formData.username);

          setIsLocked(true);
          setRemainingTime(calculateRemainingTime(now.toISOString()));

          setError(
            "Cuenta bloqueada temporalmente. Intente nuevamente más tarde."
          );
        } else {
          setError(data.message || "Credenciales incorrectas");
        }
      }
    } catch {
      setError("Error al conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <img src="/biblitech.png" alt="Biblitech" className="h-12 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Inicia sesión en tu cuenta
            </h2>
            <p className="text-sm text-gray-600">
              Bienvenido de nuevo a Biblitech
            </p>
          </div>

          {isLocked && formData.username === lockedEmail && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm mb-4">
              <p className="font-medium">Cuenta bloqueada temporalmente.</p>
              <p>
                Intente nuevamente en <strong>{remainingTime}</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Correo electrónico*
              </label>
              <input
                type="email"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071a4]"
                placeholder="Ingresa tu correo electrónico"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Contraseña*
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0071a4]"
                  placeholder="Ingresa tu contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👀"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#0071a4]"
                  disabled={isLocked}
                />
                <span className="text-sm text-gray-600">Recuérdame</span>
              </label>

              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm text-[#0071a4] hover:underline"
                disabled={isLocked}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full bg-[#0071a4] text-white py-3 rounded-full font-medium hover:bg-[#005a85] transition disabled:opacity-50"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿No tienes una cuenta?{" "}
            <button
              onClick={onSwitchToRegister}
              className="text-[#0071a4] font-semibold hover:underline"
              disabled={isLocked}
            >
              Regístrate
            </button>
          </p>

          <p className="mt-8 text-xs text-center text-gray-500">
            Al iniciar sesión, aceptas nuestros{" "}
            <a href="#" className="underline hover:text-gray-700">
              términos de uso
            </a>
            .
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-4">
        <img
          src="/library.jpg"
          alt="Biblioteca"
          className="w-full h-full object-cover rounded-2xl shadow-lg"
        />
      </div>
    </div>
  );
}
