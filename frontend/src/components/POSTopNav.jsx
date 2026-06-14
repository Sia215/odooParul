import { useEffect, useRef } from 'react';
import {
  ShoppingCart, ClipboardList, Users, LayoutGrid, Search,
  MapPin, Menu, X, LogOut, ChefHat, Tag, CreditCard, Ticket, UserCog, Coffee, StopCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePOS } from '../context/POSContext';

const NAV_TABS = [
  { id: 'pos-order',  label: 'POS Order',  icon: ShoppingCart },
  { id: 'orders',     label: 'Orders',     icon: ClipboardList },
  { id: 'customers',  label: 'Customer',   icon: Users },
  { id: 'table-view', label: 'Table View', icon: LayoutGrid },
];

const MENU_SECTIONS = [
  {
    label: 'POS Operations',
    items: [{ id: 'kds', label: 'Kitchen Display (KDS)', icon: ChefHat, admin: false }],
  },
  {
    label: 'Management',
    items: [
      { id: 'products',   label: 'Products',          icon: ShoppingCart, admin: false },
      { id: 'categories', label: 'Categories',        icon: Tag,          admin: false },
      { id: 'payments',   label: 'Payment Methods',   icon: CreditCard,   admin: false },
      { id: 'coupons',    label: 'Coupons & Promos',  icon: Ticket,       admin: false },
      { id: 'employees',  label: 'Users / Employees', icon: UserCog,      admin: false },
    ],
  },
];

function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 18h28l-3 18H13L10 18z" fill="#9A3412" />
      <rect x="9" y="14" width="30" height="5" rx="2.5" fill="#7C2D12" />
      <path d="M18 10 Q19 7 18 4" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 10 Q25 7 24 4" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 10 Q31 7 30 4" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 20 Q46 20 46 28 Q46 36 38 36" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function POSTopNav() {
  const { session, logout } = useAuth();
  const {
    activeView, navigate, currentTable,
    searchQuery, setSearchQuery,
    isMenuOpen, setIsMenuOpen,
    requireAdmin, openTableModal,
    closeSession,
  } = usePOS();

  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMenuItemClick = (item) => {
    if (item.admin) { requireAdmin(); return; }
    if (item.id === 'kds') { window.open('/kds', '_blank'); setIsMenuOpen(false); return; }
    navigate(item.id);
  };

  const initials = session?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'VB';

  return (
    <header className="h-14 flex items-center px-4 gap-3 shrink-0 relative z-40 border-b"
      style={{ background: '#FAFAF6', borderColor: '#D6D3D1' }}>

      {/* Brand */}
      <div className="flex items-center gap-2.5 pr-4 shrink-0 border-r" style={{ borderColor: '#D6D3D1' }}>
        <BrandMark />
        <div className="hidden sm:block">
          <p className="font-black text-sm leading-none" style={{ color: '#2E1A12', fontFamily: 'Georgia, serif' }}>The Velvet Bean Co.</p>
          <p className="text-[9px] font-semibold uppercase tracking-widest leading-none mt-0.5" style={{ color: '#9A3412' }}>Artisan Roasters & Kitchen</p>
        </div>
      </div>

      {/* Nav Tabs */}
      <nav className="flex items-center gap-0.5">
        {NAV_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button key={id}
              onClick={() => id === 'table-view' ? openTableModal() : navigate(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap active:scale-95"
              style={isActive
                ? { background: '#9A3412', color: '#FFF0EB', boxShadow: '0 2px 8px rgba(154,52,18,0.25)' }
                : { color: '#78716C' }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#2E1A12'; e.currentTarget.style.background = '#F4F4ED'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = '#78716C'; e.currentTarget.style.background = 'transparent'; } }}>
              <Icon size={13} />
              <span className="hidden md:block">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Search */}
      <div className="flex-1 max-w-xs mx-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#A8A29E' }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full text-sm rounded-lg pl-8 pr-3 py-1.5 outline-none transition-all"
            style={{ background: '#F4F4ED', border: '1px solid #D6D3D1', color: '#2E1A12' }}
            onFocus={e => { e.target.style.borderColor = '#9A3412'; e.target.style.boxShadow = '0 0 0 2px rgba(154,52,18,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#D6D3D1'; e.target.style.boxShadow = 'none'; }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: '#A8A29E' }}>
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all"
          style={currentTable
            ? { background: '#FFF0EB', borderColor: '#9A3412', color: '#9A3412' }
            : { background: '#F4F4ED', borderColor: '#D6D3D1', color: '#A8A29E' }}>
          <MapPin size={11} />
          <span className="hidden sm:block whitespace-nowrap">
            {currentTable ? `Table ${String(currentTable.number).padStart(2, '0')} · ${currentTable.floor}` : 'No Table'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border" style={{ background: '#F4F4ED', borderColor: '#D6D3D1' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: '#9A3412' }}>
            {initials}
          </div>
          <span className="text-xs hidden lg:block max-w-[80px] truncate" style={{ color: '#78716C' }}>{session?.name}</span>
        </div>

        <div ref={menuRef} className="relative">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-lg transition-all border"
            style={{ borderColor: '#D6D3D1', background: isMenuOpen ? '#F4F4ED' : 'transparent', color: '#78716C' }}>
            {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl overflow-hidden animate-pop-in"
              style={{ background: '#FAFAF6', border: '1px solid #D6D3D1' }}>
              {MENU_SECTIONS.map(section => (
                <div key={section.label}>
                  <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#A8A29E' }}>{section.label}</p>
                  {section.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <button key={item.id} onClick={() => handleMenuItemClick(item)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all"
                        style={{ color: '#2E1A12' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F4F4ED'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Icon size={14} />{item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="border-t mt-1" style={{ borderColor: '#D6D3D1' }}>
                <button onClick={() => { setIsMenuOpen(false); closeSession(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all"
                  style={{ color: '#B45309' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFFBEB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <StopCircle size={14} /> Close Session
                </button>
                <button onClick={() => { setIsMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all"
                  style={{ color: '#9A3412' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFF0EB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
