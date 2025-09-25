interface VentasSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function VentasSearch({ searchTerm, onSearchChange }: VentasSearchProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <input
        type="text"
        placeholder="Buscar por cliente..."
        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}