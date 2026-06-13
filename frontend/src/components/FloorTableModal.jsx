import { useEffect, useState } from 'react';
import { X, Users, Building2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

// Visual seat dots — shows up to 8 dots, then shows count
function SeatVisual({ seats }) {
  const display = Math.min(seats, 8);
  return (
    <div className="flex flex-wrap gap-0.5 justify-center mt-1.5">
      {Array.from({ length: display }).map((_, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
      ))}
      {seats > 8 && <span className="text-xs opacity-60">+{seats - 8}</span>}
    </div>
  );
}

// Single table card
function TableCard({ table, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(table)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all aspect-square
        ${selected
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50'
        }`}
    >
      <span className="text-sm font-bold leading-tight">{table.tableNumber}</span>
      <div className="flex items-center gap-0.5 mt-1 text-xs opacity-70">
        <Users size={10} /> {table.seats}
      </div>
      <SeatVisual seats={table.seats} />
    </button>
  );
}

// Main POS floor/table modal
export default function FloorTableModal({ onSelect, onClose, selectedTable }) {
  const [floors, setFloors]       = useState([]);
  const [activeFloor, setActiveFloor] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch(`${API}/floors-with-tables`)
      .then((r) => r.json())
      .then((data) => {
        setFloors(data);
        if (data.length > 0) setActiveFloor(data[0]._id);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const currentFloor = floors.find((f) => f._id === activeFloor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-800">Select Table</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-12">
            Loading floors...
          </div>
        ) : floors.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-12">
            No floors configured. Ask admin to set up floors.
          </div>
        ) : (
          <>
            {/* Floor tabs */}
            <div className="flex gap-1 px-4 pt-3 pb-0 overflow-x-auto border-b border-gray-100">
              {floors.map((floor) => (
                <button
                  key={floor._id}
                  onClick={() => setActiveFloor(floor._id)}
                  className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
                    ${activeFloor === floor._id
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50/60'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {floor.name}
                  <span className="ml-1.5 text-xs opacity-60">({floor.tables.length})</span>
                </button>
              ))}
            </div>

            {/* Tables grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {!currentFloor || currentFloor.tables.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  No active tables on this floor.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                  {currentFloor.tables.map((table) => (
                    <TableCard
                      key={table._id}
                      table={table}
                      selected={selectedTable?._id === table._id}
                      onSelect={(t) => { onSelect(t); onClose(); }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Selected table info bar */}
            {selectedTable && (
              <div className="px-5 py-3 border-t border-gray-100 bg-indigo-50 rounded-b-2xl flex justify-between items-center">
                <span className="text-sm text-indigo-700">
                  Selected: <strong>{selectedTable.tableNumber}</strong>
                </span>
                <span className="text-xs text-indigo-500 flex items-center gap-1">
                  <Users size={11} /> {selectedTable.seats} seats
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
