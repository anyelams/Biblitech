import { useEffect, useState } from "react";
import SectionHeader from "../shared/SectionHeader";
import SearchInput from "../shared/SearchInput";
import FilterSelect from "../shared/FilterSelect";
import LoadingSpinner from "../shared/LoadingSpinner";
import EmptyState from "../shared/EmptyState";

export default function CatalogSection() {
  const [books, setBooks] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanDays, setLoanDays] = useState(15);
  const [processingLoan, setProcessingLoan] = useState(false);
  const [loanSuccess, setLoanSuccess] = useState(false);

  const diasOptions = [15, 30, 45, 60, 75, 90];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchBooks(), fetchCategorias()]);
  };

  const fetchBooks = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/libros", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Error al obtener libros");
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/categorias", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };

  const handleRequestLoan = async () => {
    setProcessingLoan(true);
    try {
      const token = localStorage.getItem("biblitech_access_token");
      const response = await fetch("/api/v1/prestamos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          libro_id: selectedBook.id,
          fecha_solicitud: new Date().toISOString(),
          dias_prestamo: loanDays,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al solicitar préstamo");
      }

      setLoanSuccess(true);
      setTimeout(() => {
        setShowLoanModal(false);
        setShowDetailModal(false);
        setLoanSuccess(false);
        setLoanDays(15);
        fetchBooks();
      }, 2000);
    } catch (err) {
      alert(err.message || "Error al procesar la solicitud");
    } finally {
      setProcessingLoan(false);
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.editorial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.autores?.some((autor) =>
        `${autor.nombre} ${autor.apellido}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      !selectedCategory || book.categoria_id === parseInt(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const getCategoriaName = (categoriaId) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria ? categoria.nombre : "Sin categoría";
  };

  const getAutoresNames = (autores) => {
    if (!autores || autores.length === 0) return "Autor desconocido";
    return autores
      .map((autor) => `${autor.nombre} ${autor.apellido}`)
      .join(", ");
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setShowDetailModal(true);
  };

  const getAvailabilityColor = (book) => {
    if (book.ejemplares_disponibles > 0) return "text-green-600";
    if (book.ejemplares_count === 0) return "text-gray-500";
    return "text-red-600";
  };

  const getAvailabilityText = (book) => {
    if (book.ejemplares_count === 0) return "Sin ejemplares";
    if (book.ejemplares_disponibles > 0)
      return `${book.ejemplares_disponibles} disponible${
        book.ejemplares_disponibles > 1 ? "s" : ""
      }`;
    return "No disponible";
  };

  return (
    <>
      <SectionHeader
        title="Catálogo de Libros"
        description="Explora nuestra colección de libros disponibles"
      />

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por título, autor, editorial..."
          />
        </div>
        <div className="md:w-64">
          <FilterSelect
            value={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="Todas las categorías"
            options={categorias.map((cat) => ({
              value: cat.id.toString(),
              label: cat.nombre,
            }))}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        {loading ? (
          <LoadingSpinner message="Cargando catálogo..." />
        ) : filteredBooks.length === 0 ? (
          <EmptyState
            hasSearch={searchTerm.length > 0 || selectedCategory}
            searchTerm={searchTerm}
            message="No hay libros disponibles"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => handleBookClick(book)}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#0071a4]/30 transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={book.imagen_url || "/book-placeholder.png"}
                    alt={book.titulo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-[10px] font-semibold bg-white/95 backdrop-blur-sm text-[#0071a4] rounded-full shadow-lg">
                      {getCategoriaName(book.categoria_id)}
                    </span>
                  </div>

                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-1 text-[10px] font-bold bg-white/95 backdrop-blur-sm rounded-full shadow-lg ${getAvailabilityColor(
                        book
                      )}`}
                    >
                      {getAvailabilityText(book)}
                    </span>
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#0071a4] transition-colors leading-tight">
                    {book.titulo}
                  </h3>

                  <p className="text-xs text-gray-700 mb-2 line-clamp-1 font-semibold">
                    {getAutoresNames(book.autores)}
                  </p>

                  <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {book.descripcion || "Sin descripción disponible"}
                  </p>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center text-[11px] text-gray-600">
                      <svg
                        className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-[#0071a4]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="truncate font-medium">
                        {book.editorial || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center text-[11px] text-gray-600">
                      <svg
                        className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-[#0071a4]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">
                        {book.fecha_publicacion
                          ? new Date(book.fecha_publicacion).getFullYear()
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <button className="w-full px-3 py-2 bg-gradient-to-r from-[#0071a4] to-[#005a85] text-white text-xs font-semibold rounded-lg hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-auto">
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles del libro */}
      {showDetailModal && selectedBook && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalles del Libro
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBook(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Imagen */}
                <div className="md:w-1/3 flex-shrink-0">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={selectedBook.imagen_url || "/book-placeholder.png"}
                      alt={selectedBook.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Información */}
                <div className="md:w-2/3 space-y-4 flex flex-col">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedBook.titulo}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-block px-3 py-1 text-xs font-semibold bg-[#0071a4]/10 text-[#0071a4] rounded-full">
                        {getCategoriaName(selectedBook.categoria_id)}
                      </span>
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          selectedBook.ejemplares_disponibles > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {selectedBook.ejemplares_disponibles > 0
                          ? `Disponible (${
                              selectedBook.ejemplares_disponibles
                            } ${
                              selectedBook.ejemplares_disponibles === 1
                                ? "copia"
                                : "copias"
                            })`
                          : "No disponible"}
                      </span>
                    </div>
                  </div>

                  {selectedBook.autores && selectedBook.autores.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                        {selectedBook.autores.length > 1 ? "Autores" : "Autor"}
                      </p>
                      <div className="space-y-1">
                        {selectedBook.autores.map((autor) => (
                          <p key={autor.id} className="text-sm text-gray-700">
                            <span className="font-medium">
                              {autor.nombre} {autor.apellido}
                            </span>
                            {autor.nacionalidad && (
                              <span className="text-gray-500 ml-2">
                                • {autor.nacionalidad}
                              </span>
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                      Descripción
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedBook.descripcion ||
                        "No hay descripción disponible para este libro."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        Editorial
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedBook.editorial || "No especificado"}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        Publicación
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedBook.fecha_publicacion
                          ? new Date(
                              selectedBook.fecha_publicacion
                            ).getFullYear()
                          : "N/A"}
                      </p>
                    </div>

                    {selectedBook.ejemplares_danados > 0 && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1">
                          Ejemplares dañados
                        </p>
                        <p className="text-sm font-medium text-amber-900">
                          {selectedBook.ejemplares_danados}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Mensaje de disponibilidad al final */}
                  <div
                    className={`border rounded-lg p-3 mt-auto ${
                      selectedBook.ejemplares_disponibles > 0
                        ? "bg-blue-50 border-blue-200"
                        : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        selectedBook.ejemplares_disponibles > 0
                          ? "text-blue-900"
                          : "text-orange-900"
                      }`}
                    >
                      {selectedBook.ejemplares_disponibles > 0
                        ? "Este libro está disponible para préstamo."
                        : "Todos los ejemplares están prestados actualmente."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBook(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cerrar
              </button>
              {selectedBook.ejemplares_disponibles > 0 && (
                <button
                  onClick={() => setShowLoanModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0071a4] rounded-lg hover:bg-[#005a85] transition"
                >
                  Solicitar Préstamo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de solicitud de préstamo */}
      {showLoanModal && selectedBook && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            {loanSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Préstamo Solicitado!
                </h3>
                <p className="text-sm text-gray-600">
                  Tu solicitud ha sido procesada exitosamente
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200 p-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Solicitar Préstamo
                  </h3>
                  <button
                    onClick={() => {
                      setShowLoanModal(false);
                      setLoanDays(15);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-shrink-0 w-16 h-24 rounded overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                      <img
                        src={selectedBook.imagen_url || "/book-placeholder.png"}
                        alt={selectedBook.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        Libro seleccionado
                      </p>
                      <p className="text-base font-bold text-gray-900 leading-tight mb-1">
                        {selectedBook.titulo}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getAutoresNames(selectedBook.autores)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Duración del préstamo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {diasOptions.map((dias) => (
                        <button
                          key={dias}
                          onClick={() => setLoanDays(dias)}
                          type="button"
                          className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                            loanDays === dias
                              ? "bg-[#0071a4] text-white shadow-sm"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {dias} días
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      El préstamo vence en{" "}
                      <span className="font-semibold">{loanDays} días</span>.
                      Recuerda devolver el libro a tiempo para evitar
                      penalizaciones.
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoanModal(false);
                      setLoanDays(15);
                    }}
                    disabled={processingLoan}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestLoan}
                    disabled={processingLoan}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0071a4] rounded-lg hover:bg-[#005a85] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {processingLoan ? "Procesando..." : "Confirmar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
