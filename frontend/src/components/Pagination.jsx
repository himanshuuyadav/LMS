export default function Pagination({ page, totalPages, onChange }) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <div className="flex space-x-2 mt-4">
      {pages.map(p => (
        <button
          key={p}
          className={`px-3 py-1 rounded ${
            p === page ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
