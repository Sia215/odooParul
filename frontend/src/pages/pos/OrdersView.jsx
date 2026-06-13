import { useEffect, useState, useMemo } from 'react';
import {
  Search, X, ChevronRight, ArrowLeft, Trash2, Pencil,
  ClipboardList, User, Calendar, Hash, Package,
  BadgeCheck, Clock, Ban, RefreshCw, Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePOS }  from '../../context/POSContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_MAP = {
  Draft:     { bg: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', icon: Clock },
  Paid:      { bg: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', icon: BadgeCheck },
  Cancelled: { bg: '#FFF0EB', color: '#9A3412', border: '1px solid #FBBFA3', icon: Ban },
};

function StatusBadge({ status }) {
  const { bg, color, border, icon: Icon } = STATUS_MAP[status] || STATUS_MAP.Draft;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: bg, color, border }}>
      <Icon size={10} /> {status}
    </span>
  );
}

function OrderRow({ order, isSelected, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
      style={{
        borderBottom: '1px solid #F5F5F4',
        background: isSelected ? '#FFF0EB' : 'transparent',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#FAFAF6'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-semibold" style={{ color: '#2E1A12' }}>{order.orderNumber}</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs truncate" style={{ color: '#A8A29E' }}>
            {order.customer || 'Walk-in'}
            {order.table?.number ? ` · Table ${order.table.number}` : ''}
          </span>
          <span className="text-sm font-bold shrink-0" style={{ color: '#9A3412' }}>₹{order.total?.toFixed(2)}</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: '#A8A29E' }}>
          {new Date(order.sessionDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>
      <ChevronRight size={14} style={{ color: '#D6D3D1' }} className="shrink-0" />
    </button>
  );
}

function OrderDetail({ order, onBack, onDelete, onEdit, authHeader }) {
  const isDraft = order.status === 'Draft';
  const isPaid  = order.status === 'Paid';
  const [email,     setEmail]     = useState(order.customerEmail || '');
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [sendError, setSendError] = useState('');

  const handleSendBill = async () => {
    if (!email.trim()) return;
    setSending(true); setSendError(''); setSent(false);
    try {
      const res  = await fetch(`${API}/orders/${order._id}/send-bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ customerEmail: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) setSent(true);
      else setSendError(data.message || 'Failed to send');
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#FFFFFF' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1.5px solid #D6D3D1', background: '#F4F4ED' }}>
        <button onClick={onBack}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: '#78716C' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EDE8E3'; e.currentTarget.style.color = '#2E1A12'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h3 className="text-sm font-bold" style={{ color: '#2E1A12', fontFamily: 'Georgia, serif' }}>{order.orderNumber}</h3>
          <p className="text-xs" style={{ color: '#A8A29E' }}>Order Details</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Meta */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3 shrink-0" style={{ borderBottom: '1px solid #F5F5F4' }}>
        {[
          { icon: Hash,     label: 'Order No.',  val: order.orderNumber },
          { icon: User,     label: 'Customer',   val: order.customer || 'Walk-in' },
          { icon: Calendar, label: 'Date',        val: new Date(order.sessionDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) },
          { icon: Clock,    label: 'Time',        val: new Date(order.sessionDate).toLocaleTimeString('en-IN', { timeStyle: 'short' }) },
        ].map(({ icon: Icon, label, val }) => (
          <div key={label}>
            <p className="text-[10px] flex items-center gap-1 mb-0.5" style={{ color: '#A8A29E' }}><Icon size={10} />{label}</p>
            <p className="text-xs font-semibold" style={{ color: '#2E1A12' }}>{val}</p>
          </div>
        ))}
        {order.table?.number && (
          <div className="col-span-2">
            <p className="text-[10px] mb-0.5" style={{ color: '#A8A29E' }}>Table</p>
            <p className="text-xs font-semibold" style={{ color: '#2E1A12' }}>{order.table.number} · {order.table.floor}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: '#A8A29E' }}>
          <Package size={10} /> Products
        </p>
        <div className="flex flex-col gap-1">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F5F5F4' }}>
              <div className="flex items-center gap-2 min-w-0">
                {item.category?.color && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.category.color }} />
                )}
                <span className="text-sm truncate" style={{ color: '#2E1A12' }}>{item.name}</span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs" style={{ color: '#A8A29E' }}>×{item.qty} · ₹{item.price}</p>
                <p className="text-sm font-semibold" style={{ color: '#2E1A12' }}>₹{(item.price * item.qty).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 space-y-1.5 shrink-0" style={{ background: '#F4F4ED', borderTop: '1.5px solid #D6D3D1' }}>
        <div className="flex justify-between text-xs" style={{ color: '#78716C' }}>
          <span>Subtotal</span><span>₹{order.subtotal?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs" style={{ color: '#78716C' }}>
          <span>Tax</span><span>₹{order.taxAmt?.toFixed(2)}</span>
        </div>
        {order.discountAmt > 0 && (
          <div className="flex justify-between text-xs" style={{ color: '#166534' }}>
            <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
            <span>−₹{order.discountAmt?.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1.5" style={{ borderTop: '1px solid #D6D3D1' }}>
          <span className="text-sm font-bold" style={{ color: '#2E1A12' }}>Total</span>
          <span className="text-lg font-extrabold" style={{ color: '#9A3412' }}>₹{order.total?.toFixed(2)}</span>
        </div>
      </div>

      {/* Draft actions */}
      {isDraft && (
        <div className="px-4 py-3 flex gap-2 shrink-0" style={{ borderTop: '1px solid #F5F5F4' }}>
          <button onClick={() => onDelete(order._id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ border: '1.5px solid #FBBFA3', color: '#9A3412' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFF0EB'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={() => onEdit(order)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: '#9A3412', color: '#FFF0EB', boxShadow: '0 4px 16px rgba(154,52,18,0.25)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#7C2D12'}
            onMouseLeave={e => e.currentTarget.style.background = '#9A3412'}>
            <Pencil size={14} /> Edit Order
          </button>
        </div>
      )}

      {/* Paid — send bill */}
      {isPaid && (
        <div className="px-4 py-3 shrink-0 flex flex-col gap-2" style={{ borderTop: '1px solid #F5F5F4' }}>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSent(false); setSendError(''); }}
              placeholder="Enter customer email"
              className="flex-1 rounded-xl px-3 py-2 text-xs outline-none transition-all"
              style={{ border: '1px solid #D6D3D1', color: '#2E1A12', background: '#FFFFFF' }}
              onFocus={e => { e.target.style.border = '1.5px solid #9A3412'; e.target.style.boxShadow = '0 0 0 3px rgba(154,52,18,0.1)'; }}
              onBlur={e => { e.target.style.border = '1px solid #D6D3D1'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              onClick={handleSendBill}
              disabled={sending || !email.trim() || sent}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              style={sent
                ? { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }
                : { background: '#9A3412', color: '#FFF0EB', boxShadow: '0 4px 12px rgba(154,52,18,0.2)' }}
              onMouseEnter={e => { if (!sending && !sent) e.currentTarget.style.background = '#7C2D12'; }}
              onMouseLeave={e => { if (!sent) e.currentTarget.style.background = '#9A3412'; }}
            >
              <Mail size={13} />
              {sending ? 'Sending…' : sent ? '✓ Sent' : 'Send Bill'}
            </button>
          </div>
          {sendError && <p className="text-xs" style={{ color: '#9A3412' }}>{sendError}</p>}
        </div>
      )}
    </div>
  );
}

export default function OrdersView() {
  const { authHeader }          = useAuth();
  const { editOrder }           = usePOS();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
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
    <div className="flex h-full overflow-hidden" style={{ background: '#F4F4ED' }}>

      {/* ── List panel ── */}
      <div className={`flex flex-col border-r ${selected ? 'hidden md:flex md:w-80' : 'w-full md:w-80'}`}
        style={{ background: '#FFFFFF', borderColor: '#D6D3D1' }}>

        {/* Header */}
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1.5px solid #D6D3D1', background: '#F4F4ED' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList size={15} style={{ color: '#9A3412' }} />
              <span className="text-sm font-bold" style={{ color: '#2E1A12', fontFamily: 'Georgia, serif' }}>Today's Orders</span>
            </div>
            <button onClick={fetchOrders}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: '#A8A29E' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EDE8E3'; e.currentTarget.style.color = '#9A3412'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A8A29E'; }}>
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#A8A29E' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Order #, customer, date..."
              className="w-full rounded-xl pl-8 pr-8 py-2 text-xs outline-none transition-all"
              style={{ background: '#FFFFFF', border: '1px solid #D6D3D1', color: '#2E1A12' }}
              onFocus={e => { e.target.style.border = '1.5px solid #9A3412'; e.target.style.boxShadow = '0 0 0 3px rgba(154,52,18,0.1)'; }}
              onBlur={e => { e.target.style.border = '1px solid #D6D3D1'; e.target.style.boxShadow = 'none'; }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: '#A8A29E' }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 shrink-0" style={{ borderBottom: '1px solid #F5F5F4' }}>
          {[
            { label: 'Total', val: orders.length,                                    color: '#2E1A12' },
            { label: 'Paid',  val: orders.filter((o) => o.status === 'Paid').length,  color: '#166534' },
            { label: 'Draft', val: orders.filter((o) => o.status === 'Draft').length, color: '#92400E' },
          ].map(({ label, val, color }, i) => (
            <div key={label} className="py-2 text-center" style={{ borderRight: i < 2 ? '1px solid #F5F5F4' : 'none' }}>
              <p className="text-base font-bold" style={{ color }}>{val}</p>
              <p className="text-[10px]" style={{ color: '#A8A29E' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Order list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm" style={{ color: '#A8A29E' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2" style={{ color: '#A8A29E' }}>
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
            authHeader={authHeader}
          />
        ) : (
          <div className="text-center" style={{ color: '#D6D3D1' }}>
            <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select an order to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
