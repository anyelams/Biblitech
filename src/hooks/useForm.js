import { useState } from "react";

/**
 * Hook para manejar formularios
 * @param {Object} initialValues - Valores iniciales del formulario
 * @returns {Object} - Estados y funciones para el formulario
 */
export default function useForm(initialValues = {}) {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  // Actualizar un campo del formulario
  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Manejar cambio de input (evento)
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    handleChange(name, type === "checkbox" ? checked : value);
  };

  // Resetear formulario
  const resetForm = (newValues = initialValues) => {
    setFormData(newValues);
    setErrors({});
  };

  // Establecer múltiples valores a la vez
  const setValues = (values) => {
    setFormData((prev) => ({
      ...prev,
      ...values,
    }));
  };

  // Validar formulario
  const validate = (validationRules = {}) => {
    const newErrors = {};

    Object.keys(validationRules).forEach((field) => {
      const rules = validationRules[field];
      const value = formData[field];

      if (rules.required && (!value || value.toString().trim() === "")) {
        newErrors[field] = rules.message || `${field} es requerido`;
      }

      if (rules.minLength && value && value.length < rules.minLength) {
        newErrors[field] = rules.message || `Mínimo ${rules.minLength} caracteres`;
      }

      if (rules.maxLength && value && value.length > rules.maxLength) {
        newErrors[field] = rules.message || `Máximo ${rules.maxLength} caracteres`;
      }

      if (rules.pattern && value && !rules.pattern.test(value)) {
        newErrors[field] = rules.message || "Formato inválido";
      }

      if (rules.custom && typeof rules.custom === "function") {
        const customError = rules.custom(value, formData);
        if (customError) {
          newErrors[field] = customError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    handleChange,
    handleInputChange,
    resetForm,
    setValues,
    validate,
  };
}
