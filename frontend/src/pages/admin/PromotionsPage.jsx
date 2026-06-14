import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Zap, ToggleLeft, ToggleRight, Search } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const EMPTY = { name: '', triggerType: 'order', productId: '', minQty: '', minOrderAmount: '', discountType: 'percentage', discountValue: '', active: true };

export default function PromotionsPage() {
  const [promos, setPromos]     = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [debSearch, setDebSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 600);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() =>
    debSearch.trim() ? promos.filter(p => p.name.toLowerCase().includes(debSearch.toLowerCase())) : promos
  , [promos, debSearch]);

  useEffect(() => {
    fetch(`${API}/promotions`).then((r) => r.json()).then(setPromos).catch(console.error);
    fetch(`${API}/products`).then((r) => r.json()).then(setProducts).catch(console.error);
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const body = {
        name: form.name, triggerType: form.triggerType,
        discountType: form.discountType, discountValue: Number(form.discountValue),
        active: form.active,
        ...(form.triggerType === 'product'
          ? { productId: form.productId, minQty: Number(form.minQty) }
          : { minOrderAmount: Number(form.minOrderAmount) }),
      };
      const res  = await fetch(`${API}/promotions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPromos((p) => [data, ...p]);
      setForm(EMPTY); setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promotion?')) return;
    await fetch(`${API}/promotions/${id}`, { method: 'DELETE' });
    setPromos((p) => p.filter((x) => x._id !== id));
  };

  const handleToggle = async (promo) => {
    const res  = await fetch(`${API}/promotions/${promo._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !promo.active }),
    });
    const data = await res.json();
    setPromos((p) => p.map((x) => x._id === promo._id ? data : x));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Automated Promotions</h1>
          <p className="text-sm text-gray-500">Auto-apply discounts based on cart triggers</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium">
          <Plus size={15} /> Add Promotion
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search promotions..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white" />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-indigo-200 rounded-2xl p-5 mb-5 grid grid-cols-2 gap-3">
          <div className="col-span-2 text-sm font-semibold text-gray-700">New Automated Promotion</div>

          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Promotion Name</label>
            <input required value={form.name} onChange={set('name')} placeholder="e.g. Happy Hour Deal"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Trigger Type</label>
            <select value={form.triggerType} onChange={set('triggerType')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
              <option value="order">Order Amount</option>
              <option value="product">Product Quantity</option>
            </select>
          </div>

          {form.triggerType === 'product' ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Product</label>
                <select required value={form.productId} onChange={set('productId')}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                  <option value="">Select product...</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Min Quantity</label>
                <input required type="number" min="1" value={form.minQty} onChange={set('minQty')} placeholder="e.g. 3"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Min Order Amount (₹)</label>
              <input required type="number" min="0" value={form.minOrderAmount} onChange={set('minOrderAmount')} placeholder="e.g. 500"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Discount Type</label>
            <select value={form.discountType} onChange={set('discountType')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Value ({form.discountType === 'percentage' ? '%' : '₹'})</label>
            <input required type="number" min="0" value={form.discountValue} onChange={set('discountValue')} placeholder="0"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
          </div>

          {error && <p className="col-span-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium disabled:opacity-60">
              {loading ? 'Creating...' : 'Create Promotion'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }}
              className="flex-1 py-2 border border-gray-300 text-sm rounded-lg text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {promos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Zap size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No automated promotions yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Trigger', 'Discount', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.triggerType === 'product'
                      ? `Product: ${p.productId?.name || '—'} (min qty: ${p.minQty})`
                      : `Order ≥ ₹${p.minOrderAmount}`}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {p.discountType === 'percentage' ? `${p.discountValue}%` : `₹${p.discountValue}`} off
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleToggle(p)} className={`p-1.5 rounded-lg ${p.active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                        {p.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
