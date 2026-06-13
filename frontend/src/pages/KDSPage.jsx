import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Search, Wifi, WifiOff, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  ShoppingCart, ClipboardList, Plus, User, Menu, Coffee, LogOut,
  LayoutGrid, Tag, CreditCard, Ticket, Zap, UserCog, BookOpen, BarChart2, ChefHat,
} from 'lucide-react';

const API    = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const WS_URL = API.replace('http://', 'ws://').replace('https://', 'wss://');

const STAGE_META = {
  to_cook:   { label: 'To Cook',   color: '#D85A30', bg: 'bg-[#D85A30]', border: 'border-[#D85A30]', text: 'text-[#D85A30]' },
  preparing: { label: 'Preparing', color: '#BA7517', bg: 'bg-[#BA7517]', border: 'border-[#BA7517]', text: 'text-[#BA7517]' },
  completed: { label: 'Completed', color: '#3B6D11', bg: 'bg-[#3B6D11]', border: 'border-[#3B6D11]', text: 'text-[#3B6D11]' },
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
  return <span className="text-sm font-bold text-gray-300 tabular-nums">{t}</span>;
}

function ElapsedTick({ iso }) {
  const [txt, setTxt] = useState(() => elapsed(iso));
  useEffect(() => {
    const id = setInterval(() => setTxt(elapsed(iso)), 10000);
    return () => clearInterval(id);
  }, [iso]);
  return <span className="text-xs text-gray-500">{txt} ago</span>;
}

function TicketCard({ order, onStage, onItem }) {
  const meta = STAGE_META[order.stage] || STAGE_META.completed;
  const visibleItems = order.items.filter(i => i.showOnKDS);

  const handleCardClick = (e) => {
    // only advance if clicking card background, not item buttons
    if (e.target.closest('[data-item]')) return;
    onStage(order.id, NEXT_STAGE[order.stage]);
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex-shrink-0 w-52 rounded-2xl bg-[#1e1e1e] border border-white/10 flex flex-col overflow-hidden cursor-pointer hover:border-white/20 transition-all animate-slideIn select-none"
      style={{ borderTopColor: meta.color, borderTopWidth: 3 }}
    >
      {/* Card header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-1">
          <span className="text-lg font-black text-white leading-tight">{order.orderNumber}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white shrink-0 mt-0.5"
            style={{ background: meta.color }}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {order.tableNumber && (
            <span className="text-xs text-gray-500">T{order.tableNumber}</span>
          )}
          {order.customerName && (
            <span className="text-xs text-gray-500 truncate">{order.customerName}</span>
          )}
          <ElapsedTick iso={order.receivedAt} />
        </div>
      </div>

      {/* Items */}
      <div className="px-3 pb-3 flex flex-col gap-1 flex-1">
        {visibleItems.map(item => (
          <div
            key={item.id}
            data-item="true"
            onClick={(e) => { e.stopPropagation(); onItem(order.id, item.id, !item.done); }}
            className={`flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-white/5 transition-colors min-h-[32px]`}
          >
            <span className="text-sm font-bold w-6 text-center shrink-0" style={{ color: meta.color }}>
              {item.quantity}
            </span>
            <span className="text-xs text-gray-300 shrink-0">×</span>
            <span className={`text-sm font-medium flex-1 ${item.done ? 'line-through text-gray-600' : 'text-white'}`}>
              {item.productName}
            </span>
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

  const upsert = useCallback((incoming) => {
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === incoming.id);
      if (idx === -1) return [...prev, incoming];
      const next = [...prev]; next[idx] = incoming; return next;
    });
  }, []);

  const connectWS = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen  = () => { setConn(true); backoff.current = 1000; loadOrders(); };
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
    ws.onerror = () => ws.close();
  }, [loadOrders, upsert]);

  useEffect(() => {
    connectWS(); loadOrders();
    return () => { wsRef.current?.close(); clearTimeout(retryRef.current); };
  }, [connectWS, loadOrders]);

  // Auto-remove completed after 5 min
  useEffect(() => {
    const id = setInterval(() => {
      setOrders(prev => prev.filter(o =>
        o.stage !== 'completed' || (Date.now() - new Date(o.receivedAt)) < 5 * 60 * 1000
      ));
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // Close menu on outside click
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
    setOrders(prev => prev.map(o =>
      o.id !== orderId ? o :
      { ...o, items: o.items.map(it => it.id === itemId ? { ...it, done } : it) }
    ));
    try {
      await fetch(`${API}/api/kds/orders/${orderId}/items/${itemId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      });
    } catch (_) {}
  };

  // Sidebar filter data
  const allProds = [...new Set(orders.flatMap(o => o.items.map(i => i.productName)))].sort();
  const allCats  = [...new Set(orders.flatMap(o => o.items.map(i => i.category).filter(Boolean)))].sort();

  // Filter pipeline
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

  // Pagination
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
    'Products', 'Category', 'Payment Method',
    'Coupon & Promotion', 'Booking', 'User/Employee', 'KDS', 'Reports',
  ];

  const startIdx = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const endIdx   = Math.min(safePage * PAGE_SIZE + PAGE_SIZE, filtered.length);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#141414', color: '#fff' }}>

      {/* ── ZONE 1: TOP NAVBAR ── */}
      <header className="h-12 shrink-0 flex items-center px-4 gap-3 border-b border-white/10 bg-[#0f0f0f]">

        {/* Left: logo + KDS label */}
        <div className="flex items-center gap-2 pr-4 border-r border-white/10">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Coffee size={14} className="text-white" />
          </div>
          <span className="font-black text-white text-sm tracking-tight">Odoo Cafe</span>
          <span className="text-xs font-bold text-gray-500 ml-1">KDS</span>
        </div>

        {/* Center: nav icons */}
        <div className="flex items-center gap-1 flex-1 justify-center">
          <a href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors">
            <ShoppingCart size={14} /> POS
          </a>
          <a href="/orders" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors">
            <ClipboardList size={14} /> Orders
          </a>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors">
            <Plus size={14} /> New
          </button>
        </div>

        {/* Right: connection, clock, user, hamburger */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            {connected
              ? <><Wifi size={12} className="text-green-400" /><span className="text-green-400 hidden sm:block">Live</span></>
              : <><WifiOff size={12} className="text-red-400 animate-pulse" /><span className="text-red-400 hidden sm:block">Reconnecting</span></>
            }
          </div>
          <LiveClock />

          <button className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            <User size={13} />
          </button>

          {/* Hamburger */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenu(m => !m)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
            >
              <Menu size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                {NAV_MENU.map(item => (
                  <button key={item}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    {item}
                  </button>
                ))}
                <div className="border-t border-white/10">
                  <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors">
                    <LogOut size={13} /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── ZONE 2: FILTER / STAGE BAR ── */}
      <div className="h-11 shrink-0 flex items-center px-3 gap-2 border-b border-white/10 bg-[#111]">

        {/* Filter toggle */}
        <button
          onClick={() => setSidebar(s => !s)}
          className={`p-1.5 rounded-lg border transition-colors shrink-0 ${sidebarOpen ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <SlidersHorizontal size={14} />
        </button>

        <div className="w-px h-5 bg-white/10 shrink-0" />

        {/* Stage tabs */}
        <div className="flex items-center gap-1">
          {STAGE_TABS.map(tab => {
            const count = counts[tab.id];
            const meta  = tab.id !== 'all' ? STAGE_META[tab.id] : null;
            const active = stageFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setStage(tab.id); setPage(0); }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
                  ${active ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                style={active ? { background: meta?.color || '#4f46e5' } : {}}
              >
                {tab.label}
                <span className={`text-[10px] font-bold px-1 py-0.5 rounded min-w-[16px] text-center
                  ${active ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-white/10 shrink-0" />

        {/* Search */}
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search......"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/20"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
              <X size={11} />
            </button>
          )}
        </div>

        {/* Pagination indicator */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-gray-500 tabular-nums">
            {filtered.length === 0 ? '0' : `${startIdx}–${endIdx}`}
          </span>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── ZONES 3 + 4 ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── ZONE 3: LEFT SIDEBAR ── */}
        {sidebarOpen && (
          <aside className="w-44 shrink-0 bg-[#111] border-r border-white/10 flex flex-col overflow-y-auto">
            {/* Clear filter */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
              <span className="text-xs font-semibold text-gray-400">Filters</span>
              <button
                onClick={() => { setProd(''); setCat(''); }}
                className="p-0.5 text-gray-600 hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            </div>

            {/* Product list */}
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Product</p>
              <div className="flex flex-col gap-0.5">
                {allProds.length === 0
                  ? <span className="text-xs text-gray-700">No products</span>
                  : allProds.map(p => (
                    <button key={p} onClick={() => { setProd(prev => prev === p ? '' : p); setPage(0); }}
                      className={`text-left text-xs px-2 py-1.5 rounded-lg transition-colors truncate
                        ${prodFilter === p ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                      {p}
                    </button>
                  ))
                }
              </div>
            </div>

            {/* Category list */}
            <div className="px-3 pt-3 pb-3">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Category</p>
              <div className="flex flex-col gap-0.5">
                {allCats.length === 0
                  ? <span className="text-xs text-gray-700">No categories</span>
                  : allCats.map(c => (
                    <button key={c} onClick={() => { setCat(prev => prev === c ? '' : c); setPage(0); }}
                      className={`text-left text-xs px-2 py-1.5 rounded-lg transition-colors truncate
                        ${catFilter === c ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                      {c}
                    </button>
                  ))
                }
              </div>
            </div>
          </aside>
        )}

        {/* ── ZONE 4: TICKET GRID ── */}
        <main className="flex-1 overflow-x-auto overflow-y-hidden">
          {pageItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-700">
              <ChefHat size={40} className="opacity-30" />
              <p className="text-sm">No tickets</p>
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
