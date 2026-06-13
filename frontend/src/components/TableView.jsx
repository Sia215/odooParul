import { useEffect, useState } from 'react';
import { Building2, Users, CheckCircle, RefreshCw } from 'lucide-react';
import { usePOS } from '../context/POSContext';

const API = import.meta.env.VITE_API_URL;

export default function TableView() {
  const { currentTable, selectTable, clearTable } = usePOS();
  const [floors, setFloors]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchFloors = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/floors-with-tables`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFloors(data);
    } catch (err) {
      setError('Failed to load floor plan. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFloors(); }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Loading floor plan...
    </div>
  );

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <p className="text-sm text-red-500">{error}</p>
      <button onClick={fetchFloors}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  if (floors.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
      <Building2 size={40} className="opacity-30" />
      <p className="text-sm">No floors configured. Ask your admin to set up the floor plan.</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Floor Plan</h2>
          <p className="text-xs text-gray-400">{floors.length} floor{floors.length > 1 ? 's' : ''} · tap a table to select</p>
        </div>
        <div className="flex items-center gap-2">
          {currentTable && (
            <button onClick={clearTable}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
              Clear Table
            </button>
          )}
          <button onClick={fetchFloors}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Floors */}
      <div className="flex flex-col gap-6">
        {floors.map((floor) => (
          <div key={floor._id}>
            {/* Floor label */}
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={14} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-700">{floor.name}</span>
              <span className="text-xs text-gray-400">({floor.tables?.length || 0} tables)</span>
            </div>

            {/* Tables grid */}
            {floor.tables?.length === 0 ? (
              <p className="text-xs text-gray-400 pl-5">No active tables on this floor.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {floor.tables.map((table) => {
                  const isSelected = currentTable?._id === table._id;
                  return (
                    <button
                      key={table._id}
                      onClick={() => selectTable({ _id: table._id, number: table.tableNumber, floor: floor.name })}
                      className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 aspect-square transition-all
                        ${isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:shadow-md'
                        }`}
                    >
                      {isSelected && (
                        <CheckCircle size={12} className="absolute top-1.5 right-1.5 text-indigo-200" />
                      )}
                      <span className="text-sm font-bold leading-tight">{table.tableNumber}</span>
                      <span className={`flex items-center gap-0.5 text-xs ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                        <Users size={10} /> {table.seats}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
