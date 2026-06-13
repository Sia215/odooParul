import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useCategories } from '../../context/CategoryContext';
import QuickCategoryModal from '../QuickCategoryModal';

const API   = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const UNITS = ['per piece', 'per kg', 'per litre', 'per dozen', 'per plate'];
const EMPTY = { name: '', category: '', price: '', unit: 'per piece', tax: '0', description: '' };

export default function ProductForm({ product, onSaved, onCancel }) {
  const { categories } = useCategories();
  const [form, setForm]         = useState(EMPTY);
  const [showCatModal, setShowCatModal] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name:        product.name,
        category:    product.category?._id || product.category,
        price:       product.price,
        unit:        product.unit,
        tax:         product.tax,
        description: product.description,
      });
    }
  }, [product]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCategoryCreated = (newCat) => {
    setForm((f) => ({ ...f, category: newCat._id }));
    setShowCatModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category) return setError('Please select or create a category.');
    setLoading(true);
    try {
      const url    = product ? `${API}/products/${product._id}` : `${API}/products`;
      const method = product ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Number(form.price), tax: Number(form.tax) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = categories.find((c) => c._id === form.category);

  return (
    <>
      {showCatModal && (
        <QuickCategoryModal
          onCreated={handleCategoryCreated}
          onClose={() => setShowCatModal(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Product Name</label>
          <input
            type="text" value={form.name} onChange={set('name')} required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="e.g. Cappuccino"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              {selectedCat && (
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
                  style={{ backgroundColor: selectedCat.color }}
                />
              )}
              <select
                value={form.category} onChange={set('category')}
                className="w-full border border-gray-300 rounded-lg py-2 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none"
                style={{ paddingLeft: selectedCat ? '1.75rem' : '0.75rem' }}
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              type="button" onClick={() => setShowCatModal(true)}
              className="flex items-center gap-1 px-3 py-2 text-xs border border-dashed border-indigo-400 text-indigo-600 rounded-lg hover:bg-indigo-50 whitespace-nowrap"
            >
              <Plus size={13} /> New
            </button>
          </div>
        </div>

        {/* Price + Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Price (₹)</label>
            <input
              type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Unit</label>
            <select
              value={form.unit} onChange={set('unit')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Tax */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Tax (%)</label>
          <input
            type="number" min="0" max="100" step="0.01" value={form.tax} onChange={set('tax')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="0"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={3} value={form.description} onChange={set('description')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
            placeholder="Optional description..."
          />
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-60">
            {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </>
  );
}
