import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Register({ onSwitchToLogin }) {
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    document: "",
    typeDocument: 1,
    cellphone: "",
    address: "",
    birthDate: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setSuccess("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  // Función para validar solo texto
  const handleTextInput = (e) => {
    const { name, value } = e.target;
    const textValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    setFormData({ ...formData, [name]: textValue });
  };

  // Función para validar solo números
  const handleNumericInput = (e) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/\D/g, "");
    setFormData({ ...formData, [name]: numericValue });
  };

  /* ------------------------- VALIDACIONES ------------------------- */

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = "El nombre es requerido";
    if (!formData.lastname) newErrors.lastname = "El apellido es requerido";
    if (!formData.document) newErrors.document = "El documento es requerido";

    if (!formData.cellphone) {
      newErrors.cellphone = "El teléfono es requerido";
    } else if (!/^\d+$/.test(formData.cellphone)) {
      newErrors.cellphone = "El teléfono solo debe contener números";
    }

    if (!formData.address) newErrors.address = "La dirección es requerida";

    if (!formData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida";
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();

      if (birthDate >= today) {
        newErrors.birthDate = "La fecha no puede ser futura";
      }
    }

    setErrors(newErrors);
    setTouched({
      name: true,
      lastname: true,
      document: true,
      cellphone: true,
      address: true,
      birthDate: true,
    });
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    // Correo
    if (!formData.email) {
      newErrors.email = "El correo es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El correo no es válido";
    }

    // Contraseña
    const pw = formData.password;
    const pwErrors = [];

    if (pw.length < 8) pwErrors.push("min_length");
    if (!/[A-Z]/.test(pw)) pwErrors.push("uppercase");
    if (!/\d/.test(pw)) pwErrors.push("number");
    if (/\s/.test(pw)) pwErrors.push("spaces");

    if (pwErrors.length > 0) {
      newErrors.password = "La contraseña no cumple los requisitos.";
    }

    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return Object.keys(newErrors).length === 0;
  };

  /* --------------------------- HANDLERS --------------------------- */

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      setErrors({});
      setTouched({});
    }
  };

  const handleBack = () => {
    setErrors({});
    setSuccess("");
    setTouched({});
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setLoading(true);
    setSuccess("");

    try {
      const response = await fetch("/api/v1/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: formData.email,
          nombre: formData.name,
          apellido: formData.lastname,
          documento: formData.document,
          tipo_documento_id: formData.typeDocument,
          telefono: formData.cellphone,
          direccion: formData.address,
          fecha_nacimiento: formData.birthDate,
          contrasena: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Registro exitoso");

        setTimeout(() => {
          onSwitchToLogin();
        }, 1500);

        return;
      }

      setErrors({
        submit: data?.message || "No fue posible completar el registro.",
      });
    } catch {
      setErrors({
        submit: "Error al conectar con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Validación en tiempo real para mostrar errores solo en campos tocados
  const getFieldError = (fieldName) => {
    if (!touched[fieldName]) return "";

    if (fieldName === "name" && !formData.name) return "El nombre es requerido";
    if (fieldName === "lastname" && !formData.lastname)
      return "El apellido es requerido";
    if (fieldName === "document" && !formData.document)
      return "El documento es requerido";

    if (fieldName === "cellphone") {
      if (!formData.cellphone) return "El teléfono es requerido";
      if (!/^\d+$/.test(formData.cellphone))
        return "El teléfono solo debe contener números";
    }

    if (fieldName === "address" && !formData.address)
      return "La dirección es requerida";

    if (fieldName === "birthDate") {
      if (!formData.birthDate) return "La fecha de nacimiento es requerida";
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate >= today) return "La fecha no puede ser futura";
    }

    if (fieldName === "email") {
      if (!formData.email) return "El correo es requerido";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        return "El correo no es válido";
    }

    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* LEFT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8 animate-fadeIn">
          <div className="mb-8">
            <img src="/biblitech.png" alt="Biblitech" className="h-12 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Crea tu cuenta gratis
            </h2>
            <p className="text-sm text-gray-600">
              Paso {step} de 2 –{" "}
              {step === 1 ? "Información personal" : "Credenciales de acceso"}
            </p>
          </div>

          {/* ---------------- STEP 1 ---------------- */}
          {step === 1 && (
            <form
              onSubmit={handleNext}
              className="space-y-5 transition-all duration-300 animate-slideUp"
            >
              <div className="grid grid-cols-2 gap-5">
                <Input
                  label="Nombre*"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={getFieldError("name")}
                />
                <Input
                  label="Apellido*"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={getFieldError("lastname")}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Select
                  label="Tipo de documento*"
                  name="typeDocument"
                  value={formData.typeDocument}
                  onChange={handleChange}
                >
                  <option value={1}>Cédula de Ciudadanía</option>
                  <option value={2}>Tarjeta de Identidad</option>
                </Select>

                <Input
                  label="Número de documento*"
                  name="document"
                  type="number"
                  value={formData.document}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={getFieldError("document")}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Input
                  label="Teléfono*"
                  name="cellphone"
                  value={formData.cellphone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={getFieldError("cellphone")}
                />
                <Input
                  label="Fecha de nacimiento*"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={getFieldError("birthDate")}
                />
              </div>

              <Input
                label="Dirección*"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                error={getFieldError("address")}
              />

              <Button type="submit">Continuar</Button>
            </form>
          )}

          {/* ---------------- STEP 2 ---------------- */}
          {step === 2 && (
            <form
              onSubmit={handleSubmit}
              className="space-y-5 transition-all duration-300 animate-slideUp"
            >
              <Input
                label="Correo electrónico*"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                error={getFieldError("email")}
              />

              <PasswordInput
                label="Contraseña*"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                show={showPassword}
                setShow={setShowPassword}
                disabled={loading}
              />

              {errors.submit && <Alert type="error">{errors.submit}</Alert>}
              {success && <Alert type="success">{success}</Alert>}

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleBack}
                  outline
                  disabled={loading}
                >
                  Atrás
                </Button>

                <Button type="submit" disabled={loading} loading={loading}>
                  Registrarse
                </Button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tienes una cuenta?{" "}
            <button
              onClick={onSwitchToLogin}
              className="text-[#0071a4] font-semibold hover:underline"
            >
              Inicia sesión
            </button>
          </p>

          <p className="mt-8 text-xs text-center text-gray-500">
            Al crear una cuenta, aceptas nuestros{" "}
            <a className="underline hover:text-gray-700" href="#">
              términos de uso
            </a>
            .
          </p>
        </div>
      </div>

      {/* RIGHT */}
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

/* ---------------------- Reusable Components ---------------------- */

function Input({ label, error, onBlur, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label}
      </label>
      <input
        {...props}
        onBlur={onBlur}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm 
        focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent 
        transition ${error ? "border-red-500" : "border-gray-300"}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label}
      </label>
      <select
        {...props}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm 
        focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent 
        transition"
      >
        {children}
      </select>
    </div>
  );
}

/* ---------------------- PASSWORD INPUT + CHECKLIST ---------------------- */

function PasswordInput({
  label,
  show,
  setShow,
  value,
  onChange,
  onBlur,
  disabled,
}) {
  const password = value || "";

  const checks = [
    { label: "Al menos 8 caracteres", valid: password.length >= 8 },
    { label: "Al menos una letra mayúscula", valid: /[A-Z]/.test(password) },
    { label: "Al menos un número", valid: /\d/.test(password) },
    { label: "Sin espacios", valid: !/\s/.test(password) },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name="password"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg text-sm 
                     focus:outline-none focus:ring-2 focus:ring-[#0071a4] focus:border-transparent 
                     transition"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          tabIndex={-1}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>

      {/* Checklist */}
      <div className="mt-3 space-y-1">
        {checks.map((item, idx) => (
          <div key={idx} className="flex items-center text-sm">
            <span className={item.valid ? "text-green-800" : "text-red-600"}>
              {item.valid ? "✓" : "✗"}
            </span>
            <span
              className={
                item.valid ? "text-green-800 ml-2" : "text-red-700 ml-2"
              }
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- BUTTON ------------------------- */

function Button({ children, outline, loading, ...props }) {
  return (
    <button
      {...props}
      className={`w-full py-3 rounded-full font-medium transition 
      ${
        outline
          ? "bg-[#0071a4]/10 text-[#0071a4] hover:bg-[#0071a4]/20"
          : "bg-[#0071a4] text-white hover:bg-[#005a85] disabled:opacity-50 disabled:cursor-not-allowed"
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 12 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          Procesando...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/* ------------------------- ALERT ------------------------- */

function Alert({ type, children }) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-600",
    success: "bg-green-50 border-green-200 text-green-700",
  };

  return (
    <div className={`px-4 py-2.5 border rounded-lg text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}
