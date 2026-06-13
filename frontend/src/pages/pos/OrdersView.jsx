import { useEffect, useState, useMemo } from 'react';
import {
  Search, X, ChevronRight, ArrowLeft, Trash2, Pencil,
  ClipboardList, User, Calendar, Hash, Package,
  BadgeCheck, Clock, Ban, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePOS }  from '../../context/POSContext';

const API = import.meta.env.VITE_API_URL;

function StatusBadge({ status }) {
  const map = {
    Draft:     { cls: 'bg-amber-100 text-amber-700',    icon: Clock },
    Paid:      { cls: 'bg-emerald-100 text-emerald-700', icon: BadgeCheck },
    Cancelled: { cls: 'bg-red-100 text-red-500',         icon: Ban },
  };
  const { cls, icon: Icon } = map[status] || map.Draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      <Icon size={10} /> {status}
    </span>
  );
}

function OrderRow({ order, isSelected, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 flex items-center gap-3 transition-colors
        ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-semibold text-gray-800">{order.orderNumber}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400 truncate">
            {order.customer || 'Walk-in'}
            {order.table?.number ? ` · Table ${order.table.number}` : ''}
          </span>
          <span className="text-sm font-bold text-indigo-600 shrink-0">₹{order.total?.toFixed(2)}</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {new Date(order.sessionDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>
      <ChevronRight size={14} className="text-gray-300 shrink-0" />
    </button>
  );
}

function OrderDetail({ order, onBack, onDelete, onEdit }) {
  const isDraft = order.status === 'Draft';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
        <button onClick={onBack}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800">{order.orderNumber}</h3>
          <p className="text-xs text-gray-400">Order Details</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Meta */}
      <div className="px-4 py-4 border-b border-gray-100 grid grid-cols-2 gap-3 shrink-0">
        {[
          { icon: Hash,     label: 'Order No.',  val: order.orderNumber },
          { icon: User,     label: 'Customer',   val: order.customer || 'Walk-in' },
          { icon: Calendar, label: 'Date',        val: new Date(order.sessionDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) },
          { icon: Clock,    label: 'Time',        val: new Date(order.sessionDate).toLocaleTimeString('en-IN', { timeStyle: 'short' }) },
        ].map(({ icon: Icon, label, val }) => (
          <div key={label}>
            <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5"><Icon size={10} />{label}</p>
            <p className="text-xs font-semibold text-gray-700">{val}</p>
          </div>
        ))}
        {order.table?.number && (
          <div className="col-span-2">
            <p className="text-[10px] text-gray-400 mb-0.5">Table</p>
            <p className="text-xs font-semibold text-gray-700">{order.table.number} · {order.table.floor}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Package size={10} /> Products
        </p>
        <div className="flex flex-col gap-1">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                {item.category?.color && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.category.color }} />
                )}
                <span className="text-sm text-gray-700 truncate">{item.name}</span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs text-gray-400">×{item.qty} · ₹{item.price}</p>
                <p className="text-sm font-semibold text-gray-800">₹{(item.price * item.qty).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-1.5 shrink-0">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Subtotal</span><span>₹{order.subtotal?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Tax</span><span>₹{order.taxAmt?.toFixed(2)}</span>
        </div>
        {order.discountAmt > 0 && (
          <div className="flex justify-between text-xs text-emerald-600">
            <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
            <span>−₹{order.discountAmt?.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1.5 border-t border-gray-200">
          <span className="text-sm font-bold text-gray-800">Total</span>
          <span className="text-lg font-extrabold text-indigo-600">₹{order.total?.toFixed(2)}</span>
        </div>
      </div>

      {/* Draft actions only */}
      {isDraft && (
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2 shrink-0">
          <button onClick={() => onDelete(order._id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors">
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={() => onEdit(order)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm">
            <Pencil size={14} /> Edit Order
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrdersView() {
  const { authHeader }          = useAuth();
  const { editOrder }           = usePOS();
  const [orders,  setOrders]    = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [selected, setSelected] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/orders`, { headers: authHeader() });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return orders;
    return orders.filter((o) =>
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customer?.toLowerCase().includes(q) ||
      new Date(o.sessionDate).toLocaleDateString('en-IN').includes(q)
    );
  }, [orders, search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this draft order?')) return;
    await fetch(`${API}/orders/${id}`, { method: 'DELETE', headers: authHeader() });
    setOrders((o) => o.filter((x) => x._id !== id));
    setSelected(null);
  };

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">

      {/* ── List panel ── */}
      <div className={`flex flex-col bg-white border-r border-gray-100
        ${selected ? 'hidden md:flex md:w-80' : 'w-full md:w-80'}`}>

        {/* Header + search */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={15} className="text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">Today's Orders</span>
            </div>
            <button onClick={fetchOrders}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw size={13} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Order #, customer, date..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-8 py-2 text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 shrink-0">
          {[
            { label: 'Total', val: orders.length,                                    color: 'text-gray-700' },
            { label: 'Paid',  val: orders.filter((o) => o.status === 'Paid').length,  color: 'text-emerald-600' },
            { label: 'Draft', val: orders.filter((o) => o.status === 'Draft').length, color: 'text-amber-600' },
          ].map(({ label, val, color }) => (
            <div key={label} className="py-2 text-center">
              <p className={`text-base font-bold ${color}`}>{val}</p>
              <p className="text-[10px] text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Order list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
              <ClipboardList size={28} className="opacity-30" />
              <p className="text-sm">{search ? 'No matching orders' : 'No orders today'}</p>
            </div>
          ) : (
            filtered.map((order) => (
              <OrderRow key={order._id} order={order}
                isSelected={selected?._id === order._id}
                onClick={() => setSelected(order)} />
            ))
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      <div className={`flex-1 overflow-hidden ${selected ? 'flex flex-col' : 'hidden md:flex md:flex-col md:items-center md:justify-center'}`}>
        {selected ? (
          <OrderDetail
            order={selected}
            onBack={() => setSelected(null)}
            onDelete={handleDelete}
            onEdit={editOrder}
          />
        ) : (
          <div className="text-center text-gray-300">
            <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select an order to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
