import { useEffect, useState, useMemo, useRef } from 'react';
import { Search, X, Plus, Pencil, Trash2, UserCheck, User, Mail, Phone, CheckCircle2, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePOS }  from '../../context/POSContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Create / Edit Modal ──────────────────────────────────────────
function CustomerModal({ initial, onClose, onSave }) {
  const [form, setForm]   = useState({ name: '', email: '', phone: '', ...initial });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setLoading(true); setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(6px)', background: 'rgba(15,23,42,0.5)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <User size={15} className="text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              {initial ? 'Edit Customer' : 'New Customer'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {[
            { key: 'name',  label: 'Full Name',    icon: User,  type: 'text',  placeholder: 'e.g. Rahul Sharma',       ref: nameRef },
            { key: 'email', label: 'Email',         icon: Mail,  type: 'email', placeholder: 'e.g. rahul@example.com'  },
            { key: 'phone', label: 'Phone Number',  icon: Phone, type: 'tel',   placeholder: 'e.g. +91 9876543210'     },
          ].map(({ key, label, icon: Icon, type, placeholder, ref: r }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</label>
              <div className="relative">
                <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input ref={r} type={type} value={form[key]} onChange={set(key)} placeholder={placeholder}
                  required={key === 'name'}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
            </div>
          ))}

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold transition-colors">
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main View ────────────────────────────────────────────────────
export default function CustomersView() {
  const { authHeader }                          = useAuth();
  const { currentCustomer, linkCustomer, unlinkCustomer, currentTable } = usePOS();

  const [customers, setCustomers] = useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // null | 'create' | customer-object

  const fetchCustomers = async (q = '') => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/customers?search=${encodeURIComponent(q)}`, { headers: authHeader() });
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch { setCustomers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSave = async (form) => {
    const isEdit = modal && modal !== 'create';
    const url    = isEdit ? `${API}/customers/${modal._id}` : `${API}/customers`;
    const method = isEdit ? 'PUT' : 'POST';
    const res    = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    isEdit
      ? setCustomers((c) => c.map((x) => x._id === data._id ? data : x))
      : setCustomers((c) => [data, ...c]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    await fetch(`${API}/customers/${id}`, { method: 'DELETE', headers: authHeader() });
    setCustomers((c) => c.filter((x) => x._id !== id));
    if (currentCustomer?._id === id) unlinkCustomer();
  };

  const handleSelect = async (customer) => {
    // Already selected — deselect
    if (currentCustomer?._id === customer._id) {
      unlinkCustomer();
      // Release table booking
      if (currentTable) {
        await fetch(`${API}/customers/${customer._id}/book-table`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ tableId: null }),
        });
      }
      return;
    }
    // Link customer to order
    linkCustomer(customer);
    // Book the current table under this customer
    if (currentTable?._id) {
      await fetch(`${API}/customers/${customer._id}/book-table`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ tableId: currentTable._id }),
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-500" />
            <span className="text-sm font-semibold text-gray-800">Customers</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{customers.length}</span>
          </div>
          <button onClick={() => setModal('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors">
            <Plus size={13} /> New Customer
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Linked customer banner ── */}
      {currentCustomer && (
        <div className="mx-4 mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {currentCustomer.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-800">{currentCustomer.name}</p>
            <p className="text-xs text-indigo-500 truncate">{currentCustomer.email || currentCustomer.phone || 'Linked to order'}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 size={10} /> Active
            </span>
            <button onClick={() => handleSelect(currentCustomer)}
              className="p-1 text-indigo-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1">
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Customer List ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading...</div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <Users size={32} className="opacity-30" />
            <p className="text-sm">{search ? 'No customers found' : 'No customers yet'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {customers.map((c) => {
              const isLinked = currentCustomer?._id === c._id;
              return (
                <div key={c._id}
                  className={`bg-white rounded-2xl border-2 p-3 flex items-center gap-3 transition-all
                    ${isLinked ? 'border-indigo-400 shadow-sm shadow-indigo-100' : 'border-gray-100 hover:border-gray-200'}`}>

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0
                    ${isLinked ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {c.name[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {c.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Mail size={10} /> {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone size={10} /> {c.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setModal(c)}
                      className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(c._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                    <button onClick={() => handleSelect(c)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ml-1
                        ${isLinked
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                      <UserCheck size={12} />
                      {isLinked ? 'Linked' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <CustomerModal
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
