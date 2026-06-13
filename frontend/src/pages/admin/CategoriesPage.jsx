import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useCategories } from '../../context/CategoryContext';

const PRESET_COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444',
  '#3b82f6','#ec4899','#8b5cf6','#14b8a6',
];

function ColorDots({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap items-center">
      {PRESET_COLORS.map((c) => (
        <button
          key={c} type="button" onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
          style={{ backgroundColor: c, borderColor: value === c ? '#1e293b' : 'transparent' }}
        />
      ))}
      <input
        type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded-full cursor-pointer border border-gray-300"
      />
    </div>
  );
}

export default function CategoriesPage({ readOnly = false }) {
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
  const [newName, setNewName]   = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [adding, setAdding]     = useState(false);
  const [editId, setEditId]     = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [error, setError]       = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createCategory(newName.trim(), newColor);
      setNewName(''); setNewColor('#6366f1'); setAdding(false);
    } catch (err) { setError(err.message); }
  };

  const startEdit = (cat) => {
    setEditId(cat._id); setEditName(cat.name); setEditColor(cat.color);
  };

  const handleUpdate = async (id) => {
    setError('');
    try {
      await updateCategory(id, { name: editName, color: editColor });
      setEditId(null);
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await deleteCategory(id); }
    catch (err) { setError(err.message); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories</p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium"
          >
            <Plus size={15} /> Add Category
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

      {/* Add form */}
      {!readOnly && adding && (
        <form onSubmit={handleAdd} className="bg-white border border-indigo-200 rounded-2xl p-4 mb-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">New Category</p>
          <input
            autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
            required placeholder="Category name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <ColorDots value={newColor} onChange={setNewColor} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)}
              className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
              Create
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {categories.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <li key={cat._id} className="flex items-center gap-3 px-4 py-3">
                {editId === cat._id ? (
                  <>
                    <input
                      value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                    <ColorDots value={editColor} onChange={setEditColor} />
                    <button onClick={() => handleUpdate(cat._id)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg">
                      <Check size={15} />
                    </button>
                    <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                    <span className="text-xs font-mono text-gray-400">{cat.color}</span>
                    {!readOnly && (
                      <>
                        <button onClick={() => startEdit(cat)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
