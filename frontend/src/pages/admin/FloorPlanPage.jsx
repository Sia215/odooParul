import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, Users, Building2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

// ── Inline editable row for a table ────────────────────────────
function TableRow({ table, onUpdate, onDelete, onToggle }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ tableNumber: table.tableNumber, seats: table.seats });

  const handleSave = async () => {
    await onUpdate(table._id, form);
    setEditing(false);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
      ${table.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
      {editing ? (
        <>
          <input
            value={form.tableNumber}
            onChange={(e) => setForm((f) => ({ ...f, tableNumber: e.target.value }))}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-28 outline-none focus:border-indigo-500"
            placeholder="Table No."
          />
          <div className="flex items-center gap-1">
            <Users size={13} className="text-gray-400" />
            <input
              type="number" min="1" max="50"
              value={form.seats}
              onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-16 outline-none focus:border-indigo-500"
            />
          </div>
          <button onClick={handleSave} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
            <Check size={14} />
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X size={14} />
          </button>
        </>
      ) : (
        <>
          <span className="text-sm font-semibold text-gray-800 w-28">{table.tableNumber}</span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={12} /> {table.seats} seats
          </span>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium
            ${table.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {table.active ? 'Active' : 'Inactive'}
          </span>
          <button onClick={() => onToggle(table._id)} className={`p-1 rounded-lg transition-colors
            ${table.active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
            {table.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
          <button onClick={() => setEditing(true)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(table._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}

// ── Floor card with its tables ──────────────────────────────────
function FloorCard({ floor, onFloorUpdate, onFloorDelete, onTableCreate, onTableUpdate, onTableDelete, onTableToggle }) {
  const [editingFloor, setEditingFloor] = useState(false);
  const [floorName, setFloorName]       = useState(floor.name);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTable, setNewTable]         = useState({ tableNumber: '', seats: 2 });
  const [error, setError]               = useState('');

  const saveFloor = async () => {
    await onFloorUpdate(floor._id, { name: floorName });
    setEditingFloor(false);
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onTableCreate({ ...newTable, floor: floor._id });
      setNewTable({ tableNumber: '', seats: 2 });
      setShowAddTable(false);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Floor header */}
      <div className="flex items-center gap-2 px-5 py-4 bg-slate-50 border-b border-gray-200">
        <Building2 size={16} className="text-indigo-500" />
        {editingFloor ? (
          <>
            <input
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-500"
            />
            <button onClick={saveFloor} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
              <Check size={14} />
            </button>
            <button onClick={() => setEditingFloor(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm font-semibold text-gray-800">{floor.name}</span>
            <span className="text-xs text-gray-400">{floor.tables?.length || 0} tables</span>
            <button onClick={() => setEditingFloor(true)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg">
              <Pencil size={13} />
            </button>
            <button onClick={() => onFloorDelete(floor._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>

      {/* Tables list */}
      <div className="p-4 flex flex-col gap-2">
        {floor.tables?.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No tables yet.</p>
        )}
        {floor.tables?.map((t) => (
          <TableRow
            key={t._id} table={t}
            onUpdate={onTableUpdate}
            onDelete={onTableDelete}
            onToggle={onTableToggle}
          />
        ))}

        {/* Add table form */}
        {showAddTable ? (
          <form onSubmit={handleAddTable} className="flex items-center gap-2 mt-1 pt-2 border-t border-dashed border-gray-200">
            <input
              autoFocus required
              value={newTable.tableNumber}
              onChange={(e) => setNewTable((f) => ({ ...f, tableNumber: e.target.value }))}
              placeholder="Table No. (e.g. T-01)"
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
            />
            <div className="flex items-center gap-1">
              <Users size={13} className="text-gray-400" />
              <input
                type="number" min="1" max="50" required
                value={newTable.seats}
                onChange={(e) => setNewTable((f) => ({ ...f, seats: Number(e.target.value) }))}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-14 outline-none focus:border-indigo-500"
              />
            </div>
            <button type="submit" className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"><Check size={14} /></button>
            <button type="button" onClick={() => setShowAddTable(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={14} /></button>
          </form>
        ) : (
          <button
            onClick={() => setShowAddTable(true)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 mt-1 pt-2 border-t border-dashed border-gray-200"
          >
            <Plus size={13} /> Add Table
          </button>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function FloorPlanPage() {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [error, setError]         = useState('');

  const fetchFloors = async () => {
    setLoading(true);
    const res  = await fetch(`${API}/floors`);
    const data = await res.json();
    // Fetch tables per floor
    const tablesRes  = await fetch(`${API}/tables`);
    const allTables  = await tablesRes.json();
    const withTables = data.map((f) => ({
      ...f,
      tables: allTables.filter((t) => t.floor?._id === f._id || t.floor === f._id),
    }));
    setFloors(withTables);
    setLoading(false);
  };

  useEffect(() => { fetchFloors(); }, []);

  const handleAddFloor = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res  = await fetch(`${API}/floors`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFloorName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFloors((f) => [...f, { ...data, tables: [] }]);
      setNewFloorName(''); setShowAddFloor(false);
    } catch (err) { setError(err.message); }
  };

  const handleFloorUpdate = async (id, body) => {
    const res  = await fetch(`${API}/floors/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json();
    setFloors((f) => f.map((x) => x._id === id ? { ...x, ...data } : x));
  };

  const handleFloorDelete = async (id) => {
    if (!confirm('Delete this floor and all its tables?')) return;
    await fetch(`${API}/floors/${id}`, { method: 'DELETE' });
    setFloors((f) => f.filter((x) => x._id !== id));
  };

  const handleTableCreate = async (body) => {
    const res  = await fetch(`${API}/tables`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setFloors((f) => f.map((x) =>
      x._id === body.floor ? { ...x, tables: [...x.tables, data] } : x
    ));
  };

  const handleTableUpdate = async (id, body) => {
    const res  = await fetch(`${API}/tables/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json();
    setFloors((f) => f.map((floor) => ({
      ...floor,
      tables: floor.tables.map((t) => t._id === id ? data : t),
    })));
  };

  const handleTableDelete = async (id) => {
    if (!confirm('Delete this table?')) return;
    await fetch(`${API}/tables/${id}`, { method: 'DELETE' });
    setFloors((f) => f.map((floor) => ({
      ...floor, tables: floor.tables.filter((t) => t._id !== id),
    })));
  };

  const handleTableToggle = async (id) => {
    const res  = await fetch(`${API}/tables/${id}/status`, { method: 'PATCH' });
    const data = await res.json();
    setFloors((f) => f.map((floor) => ({
      ...floor, tables: floor.tables.map((t) => t._id === id ? data : t),
    })));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Floor Plan</h1>
          <p className="text-sm text-gray-500">{floors.length} floors configured</p>
        </div>
        <button
          onClick={() => setShowAddFloor(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium"
        >
          <Plus size={15} /> Add Floor
        </button>
      </div>

      {/* Add Floor form */}
      {showAddFloor && (
        <form onSubmit={handleAddFloor} className="flex gap-2 mb-5 bg-white border border-indigo-200 rounded-xl p-4">
          <input
            autoFocus required value={newFloorName}
            onChange={(e) => setNewFloorName(e.target.value)}
            placeholder="Floor name (e.g. Ground Floor)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Create</button>
          <button type="button" onClick={() => setShowAddFloor(false)} className="px-3 py-2 border border-gray-300 text-sm rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
        </form>
      )}
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {loading ? (
        <p className="text-center py-16 text-gray-400 text-sm">Loading...</p>
      ) : floors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No floors yet. Add your first floor!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {floors.map((floor) => (
            <FloorCard
              key={floor._id} floor={floor}
              onFloorUpdate={handleFloorUpdate}
              onFloorDelete={handleFloorDelete}
              onTableCreate={handleTableCreate}
              onTableUpdate={handleTableUpdate}
              onTableDelete={handleTableDelete}
              onTableToggle={handleTableToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
