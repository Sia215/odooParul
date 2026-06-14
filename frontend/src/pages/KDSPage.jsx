import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Search, Wifi, WifiOff, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  ShoppingCart, ClipboardList, Plus, User, Menu, LogOut,
  LayoutGrid, Tag, CreditCard, Ticket, Zap, Users, BarChart2, ChefHat,
} from 'lucide-react';

const API    = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const WS_URL = API.replace('http://', 'ws://').replace('https://', 'wss://');

const STAGE_META = {
  to_cook:   { label: 'To Cook',   color: '#9A3412', bg: '#FFF0EB', border: '#FBBFA3', text: '#9A3412' },
  preparing: { label: 'Preparing', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  completed: { label: 'Completed', color: '#166534', bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' },
};

const NEXT_STAGE = { to_cook: 'preparing', preparing: 'completed', completed: 'archived' };
const PAGE_SIZE = 8;

function playChime() {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(); osc.stop(ctx.currentTime + 0.6);
  } catch (_) {}
}

function elapsed(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

function LiveClock() {
  const [t, setT] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 10000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-sm font-bold tabular-nums" style={{ color: '#78716C' }}>{t}</span>;
}

function ElapsedTick({ iso }) {
  const [txt, setTxt] = useState(() => elapsed(iso));
  useEffect(() => {
    const id = setInterval(() => setTxt(elapsed(iso)), 10000);
    return () => clearInterval(id);
  }, [iso]);
  return <span className="text-xs" style={{ color: '#A8A29E' }}>{txt} ago</span>;
}

function BrandLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
      <path d="M10 18h28l-3 18H13L10 18z" fill="#9A3412" />
      <rect x="9" y="14" width="30" height="5" rx="2.5" fill="#7C2D12" />
      <path d="M18 10 Q19 7 18 4" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24 10 Q25 7 24 4" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M30 10 Q31 7 30 4" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M38 20 Q46 20 46 28 Q46 36 38 36" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function TicketCard({ order, onStage, onItem }) {
  const meta = STAGE_META[order.stage] || STAGE_META.completed;
  const visibleItems = order.items.filter(i => i.showOnKDS);

  const handleCardClick = (e) => {
    if (e.target.closest('[data-item]')) return;
    onStage(order.id, NEXT_STAGE[order.stage]);
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex-shrink-0 w-52 rounded-2xl flex flex-col overflow-hidden cursor-pointer transition-all animate-slideIn select-none"
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${meta.border}`,
        borderTop: `3px solid ${meta.color}`,
        boxShadow: '0 2px 12px rgba(46,26,18,0.07)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(46,26,18,0.13)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(46,26,18,0.07)'}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-1">
          <span className="text-lg font-black leading-tight" style={{ color: '#2E1A12' }}>{order.orderNumber}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 mt-0.5"
            style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {order.tableNumber && (
            <span className="text-xs" style={{ color: '#A8A29E' }}>T{order.tableNumber}</span>
          )}
          {order.customerName && (
            <span className="text-xs truncate" style={{ color: '#A8A29E' }}>{order.customerName}</span>
          )}
          <ElapsedTick iso={order.receivedAt} />
        </div>
      </div>

      <div className="px-3 pb-3 flex flex-col gap-1 flex-1" style={{ borderTop: `1px solid ${meta.border}` }}>
        {visibleItems.map(item => (
          <div
            key={item.id}
            data-item="true"
            onClick={(e) => { e.stopPropagation(); onItem(order.id, item.id, !item.done); }}
            className="flex flex-col py-1 px-1 rounded-lg cursor-pointer transition-colors"
            style={{ marginTop: '0.25rem' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFF0EB'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div className="flex items-center gap-2 min-h-[32px]">
              <span className="text-sm font-bold w-6 text-center shrink-0" style={{ color: meta.color }}>
                {item.quantity}
              </span>
              <span className="text-xs shrink-0" style={{ color: '#A8A29E' }}>×</span>
              <span className="text-sm font-medium flex-1" style={{
                textDecoration: item.done ? 'line-through' : 'none',
                color: item.done ? '#A8A29E' : '#2E1A12',
              }}>
                {item.productName}
              </span>
            </div>
            {item.kitchen_notes && (
              <div className="text-[10px] font-bold mt-0.5 ml-8 text-[#2E1A12] leading-tight px-1.5 py-0.5 bg-stone-100 rounded border border-stone-200 uppercase tracking-wide">
                ⚠️ {item.kitchen_notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KDSPage() {
  const [orders, setOrders]       = useState([]);
  const [connected, setConn]      = useState(false);
  const [search, setSearch]       = useState('');
  const [stageFilter, setStage]   = useState('all');
  const [sidebarOpen, setSidebar] = useState(false);
  const [prodFilter, setProd]     = useState('');
  const [catFilter, setCat]       = useState('');
  const [page, setPage]           = useState(0);
  const [menuOpen, setMenu]       = useState(false);
  const wsRef    = useRef(null);
  const retryRef = useRef(null);
  const backoff  = useRef(1000);
  const menuRef  = useRef(null);

  const loadOrders = useCallback(async () => {
    try {
      const r    = await fetch(`${API}/api/kds/orders`);
      const data = await r.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (_) {}
  }, []);

  const STAGE_ORDER = { to_cook: 0, preparing: 1, completed: 2, archived: 3 };

  const upsert = useCallback((incoming) => {
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === incoming.id);
      if (idx === -1) return [...prev, incoming];
      const existing = prev[idx];
      // Keep local stage if it's ahead of what the server broadcast
      const merged = {
        ...incoming,
        stage: (STAGE_ORDER[incoming.stage] ?? 0) >= (STAGE_ORDER[existing.stage] ?? 0)
          ? incoming.stage
          : existing.stage,
      };
      const next = [...prev]; next[idx] = merged; return next;
    });
  }, []);

  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen  = () => { setConn(true); backoff.current = 1000; };
    ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data);
        if (event === 'order:new')    { upsert(data); playChime(); }
        if (event === 'order:update') upsert(data);
        if (event === 'order:stage')  upsert(data);
      } catch (_) {}
    };
    ws.onclose = () => {
      setConn(false);
      retryRef.current = setTimeout(() => {
        backoff.current = Math.min(backoff.current * 2, 30000);
        connectWS();
      }, backoff.current);
    };
    ws.onerror = () => {};
  }, [loadOrders, upsert]);

  useEffect(() => {
    connectWS(); loadOrders();
    return () => { wsRef.current?.close(); clearTimeout(retryRef.current); };
  }, [connectWS, loadOrders]);

  useEffect(() => {
    const id = setInterval(() => {
      setOrders(prev => prev.filter(o =>
        o.stage !== 'completed' || (Date.now() - new Date(o.receivedAt)) < 5 * 60 * 1000
      ));
    }, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleStage = async (orderId, newStage) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, stage: newStage } : o));
    try {
      await fetch(`${API}/api/kds/orders/${orderId}/stage`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch (_) {}
  };

  const handleItem = async (orderId, itemId, done) => {
    let newStage;
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items.map(it => it.id === itemId ? { ...it, done } : it);
      const visibleItems = updatedItems.filter(it => it.showOnKDS);
      const anyDone = visibleItems.some(it => it.done);
      const allDone = visibleItems.every(it => it.done);
      newStage = allDone ? 'completed' : anyDone ? 'preparing' : 'to_cook';
      return { ...o, items: updatedItems, stage: newStage };
    }));
    try {
      await fetch(`${API}/api/kds/orders/${orderId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      });
      if (newStage) {
        await fetch(`${API}/api/kds/orders/${orderId}/stage`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: newStage }),
        });
      }
    } catch (_) {}
  };

  const allProds = [...new Set(orders.flatMap(o => o.items.map(i => i.productName)))].sort();
  const allCats  = [...new Set(orders.flatMap(o => o.items.map(i => i.category).filter(Boolean)))].sort();
  const activeOrders = orders.filter(o => o.stage !== 'archived');

  const filtered = activeOrders.filter(o => {
    if (stageFilter !== 'all' && o.stage !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!o.orderNumber.toLowerCase().includes(q) &&
          !o.items.some(i => i.productName.toLowerCase().includes(q))) return false;
    }
    if (prodFilter && !o.items.some(i => i.productName === prodFilter)) return false;
    if (catFilter  && !o.items.some(i => i.category === catFilter))     return false;
    return true;
  }).sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage   = Math.min(page, Math.max(0, totalPages - 1));
  const pageItems  = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const counts = {
    all:       activeOrders.length,
    to_cook:   activeOrders.filter(o => o.stage === 'to_cook').length,
    preparing: activeOrders.filter(o => o.stage === 'preparing').length,
    completed: activeOrders.filter(o => o.stage === 'completed').length,
  };

  const STAGE_TABS = [
    { id: 'all',       label: 'All' },
    { id: 'to_cook',   label: 'To Cook' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'completed', label: 'Completed' },
  ];

  const NAV_MENU = [
    { label: 'Products',          icon: LayoutGrid },
    { label: 'Categories',        icon: Tag },
    { label: 'Payment Methods',   icon: CreditCard },
    { label: 'Coupons',           icon: Ticket },
    { label: 'Promotions',        icon: Zap },
    { label: 'Employees',         icon: Users },
    { label: 'Reports',           icon: BarChart2 },
  ];

  const startIdx = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const endIdx   = Math.min(safePage * PAGE_SIZE + PAGE_SIZE, filtered.length);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#FAFAF6' }}>

      {/* TOP NAVBAR */}
      <header className="h-12 shrink-0 flex items-center px-4 gap-3" style={{ background: '#F4F4ED', borderBottom: '1.5px solid #D6D3D1' }}>

        <div className="flex items-center gap-2 pr-4" style={{ borderRight: '1px solid #D6D3D1' }}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#FFF0EB', border: '1.5px solid #FBBFA3' }}>
            <BrandLogo />
          </div>
          <span className="font-black text-sm tracking-tight" style={{ color: '#2E1A12', fontFamily: 'Georgia, serif' }}>The Velvet Bean Co.</span>
          <span className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: '#9A3412' }}>KDS</span>
        </div>

        <div className="flex items-center gap-1 flex-1 justify-center">
          {[
            { href: '/', icon: ShoppingCart, label: 'POS' },
            { href: '/orders', icon: ClipboardList, label: 'Orders' },
          ].map(({ href, icon: Icon, label }) => (
            <a key={label} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
              style={{ color: '#78716C' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(214,211,209,0.4)'; e.currentTarget.style.color = '#2E1A12'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; }}>
              <Icon size={14} /> {label}
            </a>
          ))}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
            style={{ color: '#78716C' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(214,211,209,0.4)'; e.currentTarget.style.color = '#2E1A12'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; }}>
            <Plus size={14} /> New
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            {connected
              ? <><Wifi size={12} style={{ color: '#166534' }} /><span className="hidden sm:block font-medium" style={{ color: '#166534' }}>Live</span></>
              : <><WifiOff size={12} style={{ color: '#9A3412' }} className="animate-pulse" /><span className="hidden sm:block font-medium" style={{ color: '#9A3412' }}>Reconnecting</span></>
            }
          </div>
          <LiveClock />

          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" style={{ background: '#9A3412', color: '#FFF0EB' }}>
            <User size={13} />
          </div>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenu(m => !m)}
              className="p-1.5 rounded-xl transition-all duration-150"
              style={{
                color: menuOpen ? '#9A3412' : '#78716C',
                background: menuOpen ? '#FFF0EB' : 'transparent',
                border: `1px solid ${menuOpen ? '#FBBFA3' : '#D6D3D1'}`,
              }}
              onMouseEnter={e => { if (!menuOpen) { e.currentTarget.style.background = 'rgba(214,211,209,0.4)'; e.currentTarget.style.color = '#2E1A12'; } }}
              onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; } }}
            >
              <Menu size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl overflow-hidden z-50"
                style={{ background: '#F4F4ED', border: '1.5px solid #D6D3D1', boxShadow: '0 20px 60px rgba(46,26,18,0.12)' }}>
                {NAV_MENU.map(({ label, icon: Icon }) => (
                  <button key={label}
                    className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm font-semibold transition-all duration-150"
                    style={{ color: '#78716C' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(214,211,209,0.4)'; e.currentTarget.style.color = '#2E1A12'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; }}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid #D6D3D1' }}>
                  <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-all duration-150"
                    style={{ color: '#991B1B' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <LogOut size={13} /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* FILTER / STAGE BAR */}
      <div className="h-11 shrink-0 flex items-center px-3 gap-2" style={{ background: '#F4F4ED', borderBottom: '1px solid #D6D3D1' }}>

        <button
          onClick={() => setSidebar(s => !s)}
          className="p-1.5 rounded-xl transition-all duration-150 shrink-0"
          style={{
            color: sidebarOpen ? '#9A3412' : '#78716C',
            background: sidebarOpen ? '#FFF0EB' : 'transparent',
            border: `1px solid ${sidebarOpen ? '#FBBFA3' : '#D6D3D1'}`,
          }}
        >
          <SlidersHorizontal size={14} />
        </button>

        <div className="w-px h-5 shrink-0" style={{ background: '#D6D3D1' }} />

        <div className="flex items-center gap-1">
          {STAGE_TABS.map(tab => {
            const count = counts[tab.id];
            const meta  = tab.id !== 'all' ? STAGE_META[tab.id] : null;
            const active = stageFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setStage(tab.id); setPage(0); }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap"
                style={active
                  ? { background: meta?.color || '#9A3412', color: '#FFF0EB', boxShadow: '0 2px 8px rgba(154,52,18,0.2)' }
                  : { color: '#78716C' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(214,211,209,0.4)'; e.currentTarget.style.color = '#2E1A12'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; } }}
              >
                {tab.label}
                <span className="text-[10px] font-bold px-1 py-0.5 rounded min-w-[16px] text-center"
                  style={active
                    ? { background: 'rgba(255,255,255,0.25)', color: '#FFF0EB' }
                    : { background: 'rgba(214,211,209,0.6)', color: '#78716C' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 shrink-0" style={{ background: '#D6D3D1' }} />

        <div className="relative flex-1 max-w-xs ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#A8A29E' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search orders..."
            className="w-full rounded-xl pl-7 pr-3 py-1.5 text-xs outline-none transition-all duration-200"
            style={{
              background: '#FFFFFF',
              border: '1px solid #D6D3D1',
              color: '#2E1A12',
            }}
            onFocus={e => { e.target.style.border = '1.5px solid #9A3412'; e.target.style.boxShadow = '0 0 0 3px rgba(154,52,18,0.1)'; }}
            onBlur={e => { e.target.style.border = '1px solid #D6D3D1'; e.target.style.boxShadow = 'none'; }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: '#A8A29E' }}>
              <X size={11} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs tabular-nums font-medium" style={{ color: '#A8A29E' }}>
            {filtered.length === 0 ? '0' : `${startIdx}–${endIdx}`}
          </span>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="p-0.5 rounded transition-colors disabled:opacity-30"
            style={{ color: '#78716C' }}
            onMouseEnter={e => e.currentTarget.style.color = '#2E1A12'}
            onMouseLeave={e => e.currentTarget.style.color = '#78716C'}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="p-0.5 rounded transition-colors disabled:opacity-30"
            style={{ color: '#78716C' }}
            onMouseEnter={e => e.currentTarget.style.color = '#2E1A12'}
            onMouseLeave={e => e.currentTarget.style.color = '#78716C'}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        {sidebarOpen && (
          <aside className="w-44 shrink-0 flex flex-col overflow-y-auto" style={{ background: '#F4F4ED', borderRight: '1.5px solid #D6D3D1' }}>
            <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid #D6D3D1' }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#A8A29E' }}>Filters</span>
              <button onClick={() => { setProd(''); setCat(''); }} style={{ color: '#A8A29E' }}
                onMouseEnter={e => e.currentTarget.style.color = '#9A3412'}
                onMouseLeave={e => e.currentTarget.style.color = '#A8A29E'}>
                <X size={13} />
              </button>
            </div>

            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#A8A29E' }}>Product</p>
              <div className="flex flex-col gap-0.5">
                {allProds.length === 0
                  ? <span className="text-xs" style={{ color: '#D6D3D1' }}>No products</span>
                  : allProds.map(p => (
                    <button key={p} onClick={() => { setProd(prev => prev === p ? '' : p); setPage(0); }}
                      className="text-left text-xs px-2 py-1.5 rounded-xl transition-all duration-150 truncate font-medium"
                      style={prodFilter === p
                        ? { background: '#9A3412', color: '#FFF0EB' }
                        : { color: '#78716C' }}
                      onMouseEnter={e => { if (prodFilter !== p) { e.currentTarget.style.background = 'rgba(214,211,209,0.4)'; e.currentTarget.style.color = '#2E1A12'; } }}
                      onMouseLeave={e => { if (prodFilter !== p) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; } }}>
                      {p}
                    </button>
                  ))
                }
              </div>
            </div>

            <div className="px-3 pt-3 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#A8A29E' }}>Category</p>
              <div className="flex flex-col gap-0.5">
                {allCats.length === 0
                  ? <span className="text-xs" style={{ color: '#D6D3D1' }}>No categories</span>
                  : allCats.map(c => (
                    <button key={c} onClick={() => { setCat(prev => prev === c ? '' : c); setPage(0); }}
                      className="text-left text-xs px-2 py-1.5 rounded-xl transition-all duration-150 truncate font-medium"
                      style={catFilter === c
                        ? { background: '#9A3412', color: '#FFF0EB' }
                        : { color: '#78716C' }}
                      onMouseEnter={e => { if (catFilter !== c) { e.currentTarget.style.background = 'rgba(214,211,209,0.4)'; e.currentTarget.style.color = '#2E1A12'; } }}
                      onMouseLeave={e => { if (catFilter !== c) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; } }}>
                      {c}
                    </button>
                  ))
                }
              </div>
            </div>
          </aside>
        )}

        {/* TICKET GRID */}
        <main className="flex-1 overflow-x-auto overflow-y-hidden">
          {pageItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3" style={{ color: '#D6D3D1' }}>
              <ChefHat size={40} className="opacity-50" />
              <p className="text-sm font-medium" style={{ color: '#A8A29E' }}>No tickets</p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 h-full">
              {pageItems.map(order => (
                <TicketCard
                  key={order.id}
                  order={order}
                  onStage={handleStage}
                  onItem={handleItem}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.25s ease; }
      `}</style>
    </div>
  );
}
