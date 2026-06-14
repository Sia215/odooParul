import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, Search } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const EMPTY = { code: '', discountType: 'percentage', discountValue: '', active: true, expiresAt: '', usageLimit: '' };

export default function CouponsPage({ readOnly = false }) {
  const [coupons, setCoupons]     = useState([]);
  const [form, setForm]           = useState(EMPTY);
  const [showForm, setShowForm]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [debSearch, setDebSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 600);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() =>
    debSearch.trim() ? coupons.filter(c => c.code.toLowerCase().includes(debSearch.toLowerCase())) : coupons
  , [coupons, debSearch]);

  useEffect(() => {
    fetch(`${API}/coupons`).then((r) => r.json()).then(setCoupons).catch(console.error);
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const body = {
        ...form,
        discountValue: Number(form.discountValue),
        usageLimit:    form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt:     form.expiresAt  || null,
      };
      const res  = await fetch(`${API}/coupons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCoupons((c) => [data, ...c]);
      setForm(EMPTY); setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    await fetch(`${API}/coupons/${id}`, { method: 'DELETE' });
    setCoupons((c) => c.filter((x) => x._id !== id));
  };

  const handleToggle = async (coupon) => {
    const res  = await fetch(`${API}/coupons/${coupon._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active }),
    });
    const data = await res.json();
    setCoupons((c) => c.map((x) => x._id === coupon._id ? data : x));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500">{filtered.length} coupon codes</p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium">
            <Plus size={15} /> Add Coupon
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupons..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white" />
      </div>

      {!readOnly && showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-indigo-200 rounded-2xl p-5 mb-5 grid grid-cols-2 gap-3">
          <div className="col-span-2 text-sm font-semibold text-gray-700">New Coupon</div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Code</label>
            <input required value={form.code} onChange={set('code')} placeholder="e.g. SAVE20"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 uppercase" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Discount Type</label>
            <select value={form.discountType} onChange={set('discountType')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Value ({form.discountType === 'percentage' ? '%' : '₹'})
            </label>
            <input required type="number" min="0" value={form.discountValue} onChange={set('discountValue')} placeholder="0"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Usage Limit (blank = unlimited)</label>
            <input type="number" min="1" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Expires At (blank = never)</label>
            <input type="datetime-local" value={form.expiresAt} onChange={set('expiresAt')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
          </div>

          {error && <p className="col-span-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium disabled:opacity-60">
              {loading ? 'Creating...' : 'Create Coupon'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(''); }}
              className="flex-1 py-2 border border-gray-300 text-sm rounded-lg text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {coupons.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Tag size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No coupons yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Code', 'Discount', 'Usage', 'Expires', 'Status', ...(!readOnly ? ['Actions'] : [])].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700">{c.code}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.usageCount}/{c.usageLimit ?? '∞'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleToggle(c)} className={`p-1.5 rounded-lg ${c.active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                          {c.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
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
    </div>
  );
}
