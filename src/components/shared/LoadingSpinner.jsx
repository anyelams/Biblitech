export default function LoadingSpinner({ message = "Cargando..." }) {
  return (
    <div className="p-12 text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0071a4]"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}
