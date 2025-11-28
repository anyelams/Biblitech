// Constantes de roles
export const ROLES = {
  ADMIN: ["administrador", "admin"],
  BIBLIOTECARIO: ["bibliotecario", "bibliotec"],
  LECTOR: ["lector"],
};

// Helper para verificar rol
export const hasRole = (user, roles) => {
  if (!user || !user.rol) return false;
  const userRole = user.rol.toLowerCase();
  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.some((role) => userRole === role.toLowerCase());
};

// Helper para verificar si tiene alguno de los roles
export const hasAnyRole = (user, roles) => {
  if (!user || !user.rol) return false;
  return roles.some((role) => hasRole(user, role));
};

// Verificar si es admin
export const isAdmin = (user) => hasRole(user, ROLES.ADMIN);

// Verificar si es bibliotecario
export const isBibliotecario = (user) => hasRole(user, ROLES.BIBLIOTECARIO);

// Verificar si es lector
export const isLector = (user) => hasRole(user, ROLES.LECTOR);
