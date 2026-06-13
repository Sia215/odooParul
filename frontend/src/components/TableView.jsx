import { useEffect, useState, useRef } from 'react';
import { X, Building2, Users, RefreshCw, CheckCircle, Clock, Coffee } from 'lucide-react';
import { usePOS } from '../context/POSContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function TableCard({ table, floorName, isSelected, onSelect }) {
  const state = isSelected ? 'selected' : table.occupied ? 'occupied' : 'vacant';

  const baseStyle = {
    selected: { background: '#9A3412', border: '2px solid #9A3412', color: 'white', boxShadow: '0 6px 20px rgba(154,52,18,0.28)', transform: 'scale(1.05)' },
    occupied: { background: '#FFFBEB', border: '2px solid #FDE68A', color: '#92400E' },
    vacant:   { background: 'white',   border: '1.5px solid #D6D3D1', color: '#2E1A12' },
  };

  const badgeStyle = {
    selected: { background: '#7C2D12', color: 'white' },
    occupied: { background: '#FEF3C7', color: '#92400E' },
    vacant:   { background: '#FFF0EB', color: '#9A3412' },
  };

  const badgeLabel = { selected: 'Selected', occupied: 'In Use', vacant: 'Open' };

  return (
    <button onClick={() => onSelect({ _id: table._id, number: table.tableNumber, floor: floorName })}
      className="relative flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 aspect-square transition-all duration-150 active:scale-95"
      style={baseStyle[state]}
      onMouseEnter={e => { if (state === 'vacant') { e.currentTarget.style.border = '2px solid rgba(154,52,18,0.4)'; e.currentTarget.style.background = '#FFF0EB'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(154,52,18,0.12)'; } }}
      onMouseLeave={e => { if (state === 'vacant') { e.currentTarget.style.border = '1.5px solid #D6D3D1'; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = 'none'; } }}>
      <div className="absolute top-2 right-2">
        {state === 'selected' && <CheckCircle size={13} style={{ color: 'rgba(255,240,235,0.85)' }} />}
        {state === 'occupied' && <Clock size={13} style={{ color: '#D97706' }} />}
        {state === 'vacant'   && <div className="w-2 h-2 rounded-full" style={{ background: '#9A3412', opacity: 0.4 }} />}
      </div>
      <span className="text-base font-bold leading-none">{table.tableNumber}</span>
      <span className="flex items-center gap-0.5 text-xs font-medium"
        style={{ color: state === 'selected' ? 'rgba(255,240,235,0.85)' : state === 'occupied' ? '#D97706' : '#A8A29E' }}>
        <Users size={11} /> {table.seats}
      </span>
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={badgeStyle[state]}>{badgeLabel[state]}</span>
    </button>
  );
}

export default function TableSelectorModal() {
  const { currentTable, selectTable, closeTableModal } = usePOS();
  const [floors,      setFloors]      = useState([]);
  const [activeFloor, setActiveFloor] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const overlayRef = useRef(null);

  const fetchFloors = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/floors-with-tables`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFloors(data);
      if (data.length > 0) setActiveFloor(prev => prev ?? data[0]._id);
    } catch { setError('Could not load floor plan. Check server connection.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFloors(); }, []);

  useEffect(() => {
    let active = true;
    const ws = new WebSocket(`ws://${window.location.hostname}:5000`);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'TABLE_UPDATE') {
          setFloors(prev => prev.map(floor => ({
            ...floor,
            tables: floor.tables.map(t => t._id === msg.table._id ? { ...t, occupied: msg.table.occupied } : t),
          })));
        }
      } catch (_) {}
    };
    ws.onerror = () => { if (active) ws.close(); };
    return () => { active = false; ws.close(); };
  }, []);

  const handleOverlayClick = (e) => { if (e.target === overlayRef.current) closeTableModal(); };
  const currentFloorData = floors.find(f => f._id === activeFloor);
  const tables = currentFloorData?.tables ?? [];

  return (
    <div ref={overlayRef} onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(46,26,18,0.55)', backdropFilter: 'blur(6px)' }}>
      <div className="rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-pop-in"
        style={{ background: '#FAFAF6', border: '1.5px solid #D6D3D1' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #F4F4ED' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#9A3412' }}>
              <Coffee size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#2E1A12' }}>Select a Table</h2>
              <p className="text-xs" style={{ color: '#78716C' }}>
                {currentTable ? `Active: Table ${currentTable.number} · ${currentTable.floor}` : 'No table selected · choose one to start an order'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchFloors} className="p-1.5 rounded-lg transition-all hover:scale-105" style={{ background: '#F4F4ED', color: '#78716C' }}><RefreshCw size={14} /></button>
            <button onClick={closeTableModal} className="p-1.5 rounded-lg transition-all hover:scale-105" style={{ background: '#F4F4ED', color: '#78716C' }}><X size={18} /></button>
          </div>
        </div>

        {/* Floor Tabs */}
        {!loading && !error && floors.length > 0 && (
          <div className="flex items-center gap-1 px-6 pt-4 pb-0 overflow-x-auto shrink-0">
            {floors.map(floor => (
              <button key={floor._id} onClick={() => setActiveFloor(floor._id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                style={activeFloor === floor._id
                  ? { background: '#9A3412', color: 'white', boxShadow: '0 2px 8px rgba(154,52,18,0.25)' }
                  : { background: '#F4F4ED', color: '#78716C' }}
                onMouseEnter={e => { if (activeFloor !== floor._id) e.currentTarget.style.background = '#E8E5DE'; }}
                onMouseLeave={e => { if (activeFloor !== floor._id) e.currentTarget.style.background = '#F4F4ED'; }}>
                <Building2 size={13} />{floor.name}
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={activeFloor === floor._id ? { background: '#7C2D12', color: 'white' } : { background: '#D6D3D1', color: '#78716C' }}>
                  {floor.tables?.length ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
        {!loading && !error && (
          <div className="flex items-center gap-4 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #F4F4ED' }}>
            {[{ color: '#9A3412', label: 'Available', opacity: '0.4' }, { color: '#D97706', label: 'In Use' }, { color: '#9A3412', label: 'Selected' }].map(({ color, label, opacity }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, opacity: opacity || 1 }} />
                <span className="text-xs" style={{ color: '#78716C' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Table Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading && <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#A8A29E' }}>Loading floor plan...</div>}
          {error && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <p className="text-sm" style={{ color: '#9A3412' }}>{error}</p>
              <button onClick={fetchFloors} className="flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: '#9A3412' }}><RefreshCw size={13} /> Retry</button>
            </div>
          )}
          {!loading && !error && floors.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: '#A8A29E' }}>
              <Building2 size={36} className="opacity-30" />
              <p className="text-sm text-center">No floors configured.<br />Ask your admin to set up the floor plan.</p>
            </div>
          )}
          {!loading && !error && floors.length > 0 && tables.length === 0 && (
            <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#A8A29E' }}>No active tables on this floor.</div>
          )}
          {!loading && !error && tables.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pt-4">
              {tables.map(table => (
                <TableCard key={table._id} table={table} floorName={currentFloorData.name}
                  isSelected={currentTable?._id === table._id} onSelect={selectTable} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between shrink-0" style={{ borderTop: '1px solid #F4F4ED', background: '#F4F4ED' }}>
          <span className="text-xs" style={{ color: '#78716C' }}>{tables.length} table{tables.length !== 1 ? 's' : ''} on this floor</span>
          <button onClick={closeTableModal} className="px-4 py-2 text-sm font-semibold rounded-xl transition-all hover:scale-105"
            style={{ color: '#9A3412', background: 'white', border: '1px solid #D6D3D1' }}>Close</button>
        </div>
      </div>
    </div>
  );
}
