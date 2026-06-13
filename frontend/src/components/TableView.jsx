import { useEffect, useState, useRef } from 'react';
import { X, Building2, Users, RefreshCw, CheckCircle, Clock, Coffee } from 'lucide-react';
import { usePOS } from '../context/POSContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Individual table card ─────────────────────────────────────────
function TableCard({ table, floorName, isSelected, isOccupied, onSelect }) {
  const state = isSelected ? 'selected' : isOccupied ? 'occupied' : 'vacant';

  const styles = {
    selected: 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200 scale-105',
    occupied: 'bg-amber-50  border-amber-400  text-amber-800 hover:border-amber-500 hover:shadow-md',
    vacant:   'bg-white     border-gray-200   text-gray-700  hover:border-emerald-400 hover:shadow-md hover:bg-emerald-50',
  };

  const badgeStyles = {
    selected: 'bg-indigo-500 text-indigo-100',
    occupied: 'bg-amber-400  text-amber-900',
    vacant:   'bg-emerald-100 text-emerald-700',
  };

  const badgeLabel = {
    selected: 'Selected',
    occupied: 'In Use',
    vacant:   'Open',
  };

  return (
    <button
      onClick={() => onSelect({ _id: table._id, number: table.tableNumber, floor: floorName })}
      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 aspect-square transition-all duration-150 ${styles[state]}`}
    >
      {/* Top-right status icon */}
      <div className="absolute top-2 right-2">
        {state === 'selected' && <CheckCircle size={13} className="text-indigo-200" />}
        {state === 'occupied' && <Clock size={13} className="text-amber-500" />}
        {state === 'vacant'   && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
      </div>

      {/* Table number */}
      <span className="text-base font-bold leading-none">{table.tableNumber}</span>

      {/* Seats */}
      <span className={`flex items-center gap-0.5 text-xs font-medium
        ${state === 'selected' ? 'text-indigo-200' : state === 'occupied' ? 'text-amber-600' : 'text-gray-400'}`}>
        <Users size={11} /> {table.seats}
      </span>

      {/* State badge */}
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeStyles[state]}`}>
        {badgeLabel[state]}
      </span>
    </button>
  );
}

// ── Main Modal ────────────────────────────────────────────────────
export default function TableSelectorModal() {
  const { currentTable, selectTable, closeTableModal, activeTables } = usePOS();
  const [floors,       setFloors]       = useState([]);
  const [activeFloor,  setActiveFloor]  = useState(null); // floor._id
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const overlayRef = useRef(null);

  const fetchFloors = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/floors-with-tables`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFloors(data);
      // Default to first floor tab
      if (data.length > 0) setActiveFloor((prev) => prev ?? data[0]._id);
    } catch {
      setError('Could not load floor plan. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFloors(); }, []);

  // Close on backdrop click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) closeTableModal();
  };

  const currentFloorData = floors.find((f) => f._id === activeFloor);
  const tables = currentFloorData?.tables ?? [];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Coffee size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Select a Table</h2>
              <p className="text-xs text-gray-400">
                {currentTable
                  ? `Active: Table ${currentTable.number} · ${currentTable.floor}`
                  : 'No table selected · choose one to start an order'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchFloors}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw size={14} />
            </button>
            <button onClick={closeTableModal}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Floor Tabs ── */}
        {!loading && !error && floors.length > 0 && (
          <div className="flex items-center gap-1 px-6 pt-4 pb-0 overflow-x-auto shrink-0">
            {floors.map((floor) => (
              <button
                key={floor._id}
                onClick={() => setActiveFloor(floor._id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                  ${activeFloor === floor._id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
              >
                <Building2 size={13} />
                {floor.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${activeFloor === floor._id ? 'bg-indigo-500 text-indigo-100' : 'bg-gray-200 text-gray-500'}`}>
                  {floor.tables?.length ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Legend ── */}
        {!loading && !error && (
          <div className="flex items-center gap-4 px-6 py-3 shrink-0">
            {[
              { color: 'bg-emerald-400', label: 'Available' },
              { color: 'bg-amber-400',   label: 'In Use' },
              { color: 'bg-indigo-600',  label: 'Selected' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Table Grid ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading && (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Loading floor plan...
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={fetchFloors}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {!loading && !error && floors.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
              <Building2 size={36} className="opacity-30" />
              <p className="text-sm text-center">No floors configured.<br />Ask your admin to set up the floor plan.</p>
            </div>
          )}

          {!loading && !error && floors.length > 0 && tables.length === 0 && (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              No active tables on this floor.
            </div>
          )}

          {!loading && !error && tables.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pt-1">
              {tables.map((table) => (
                <TableCard
                  key={table._id}
                  table={table}
                  floorName={currentFloorData.name}
                  isSelected={currentTable?._id === table._id}
                  isOccupied={activeTables.has(table._id)}
                  onSelect={selectTable}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400">
            {tables.length} table{tables.length !== 1 ? 's' : ''} on this floor
          </span>
          <button onClick={closeTableModal}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-xl hover:bg-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
