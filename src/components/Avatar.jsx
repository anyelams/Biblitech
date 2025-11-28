// Genera un color consistente basado en un string
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    "bg-[#0071a4]",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];

  return colors[Math.abs(hash) % colors.length];
};

// Obtiene las iniciales del nombre
const getInitials = (nombre, apellido) => {
  const firstInitial = nombre?.charAt(0)?.toUpperCase() || "";
  const lastInitial = apellido?.charAt(0)?.toUpperCase() || "";
  return `${firstInitial}${lastInitial}`;
};

export default function Avatar({ user, size = "md" }) {
  const initials = getInitials(user.nombre, user.apellido);
  const colorClass = stringToColor(`${user.nombre}${user.apellido}`);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold`}
    >
      {initials}
    </div>
  );
}
