export default function SectionHeader({
  title,
  description,
  buttonLabel,
  onButtonClick,
  showButton = true,
}) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
      {showButton && buttonLabel && (
        <button
          onClick={onButtonClick}
          className="px-3.5 py-2 bg-[#0071a4] text-white text-sm font-semibold rounded-lg hover:bg-[#005a85] transition flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
