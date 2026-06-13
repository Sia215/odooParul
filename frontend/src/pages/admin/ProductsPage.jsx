import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import ProductForm from '../../components/admin/ProductForm';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EMOJI_MAP = [
  { keys: ['coffee','cafe','cappuccino','latte','espresso','mocha'], emoji: '\u2615' },
  { keys: ['tea','chai'], emoji: '\ud83c\udf75' },
  { keys: ['pizza'], emoji: '\ud83c\udf55' },
  { keys: ['burger','sandwich'], emoji: '\ud83c\udf54' },
  { keys: ['pasta','noodle','spaghetti'], emoji: '\ud83c\udf5d' },
  { keys: ['rice','biryani','pulao'], emoji: '\ud83c\udf5a' },
  { keys: ['roti','rotali','chapati','naan','bread'], emoji: '\ud83e\uded3' },
  { keys: ['sprite','soda','cold drink','cola','pepsi','coke','juice','drink'], emoji: '\ud83e\udd64' },
  { keys: ['cake','dessert','sweet','ice cream'], emoji: '\ud83c\udf70' },
  { keys: ['fries','chips','snack'], emoji: '\ud83c\udf5f' },
  { keys: ['salad'], emoji: '\ud83e\udd57' },
  { keys: ['soup'], emoji: '\ud83c\udf5c' },
  { keys: ['chicken','tikka'], emoji: '\ud83c\udf57' },
  { keys: ['milk','shake','lassi','smoothie'], emoji: '\ud83e\udd5b' },
];

function getEmoji(name) {
  const lower = name.toLowerCase();
  for (const { keys, emoji } of EMOJI_MAP) {
    if (keys.some(k => lower.includes(k))) return emoji;
  }
  return '\ud83c\udf7d\ufe0f';
}

async function fetchFoodImage(name) {
  try {
    const terms = [name, name.split(' ')[0], name.split(' ').pop()];
    for (const term of [...new Set(terms)]) {
      const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.meals?.[0]?.strMealThumb) return data.meals[0].strMealThumb;
    }
  } catch (_) {}
  return null;
}

function ProductImage({ name }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { fetchFoodImage(name).then(setSrc); }, [name]);
  const emoji = getEmoji(name);
  if (!src) return (
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center shrink-0 text-xl">
      {emoji}
    </div>
  );
  return <img src={src} alt={name} className="w-10 h-10 rounded-lg object-cover shrink-0" />;
}

export default function ProductsPage({ readOnly = false }) {
  const [products, setProducts] = useState([]);
  const [editing, setEditing]   = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const res  = await fetch(`${API}/products`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`${API}/products/${id}`, { method: 'DELETE' });
    setProducts((p) => p.filter((x) => x._id !== id));
  };

  const handleSaved = (saved) => {
    setProducts((prev) =>
      editing && editing._id
        ? prev.map((p) => (p._id === saved._id ? saved : p))
        : [...prev, saved]
    );
    setEditing(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} items</p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium"
          >
            <Plus size={15} /> Add Product
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400 text-sm">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">No products yet. Add one!</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Image', 'Name', 'Category', 'Price', 'Unit', 'Tax', ...(!readOnly ? ['Actions'] : [])].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <ProductImage name={p.name} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: p.category?.color || '#6366f1' }}
                    >
                      {p.category?.name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">₹{Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                  <td className="px-4 py-3 text-gray-500">{p.tax}%</td>
                  {!readOnly && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!readOnly && editing !== null && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/20" onClick={() => setEditing(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">
                {editing ? 'Edit Product' : 'New Product'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <ProductForm
                product={editing || null}
                onSaved={handleSaved}
                onCancel={() => setEditing(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
