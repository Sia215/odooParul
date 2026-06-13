import { useEffect, useRef } from 'react';
import {
  ShoppingCart, ClipboardList, Users, LayoutGrid, Search,
  MapPin, Menu, X, LogOut, ChefHat, BarChart2,
  Tag, CreditCard, Ticket, Zap, UserCog, BookOpen, Coffee,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePOS } from '../context/POSContext';

// ── Nav tabs shown inline in the top bar ──────────────────────────
const NAV_TABS = [
  { id: 'pos-order',   label: 'POS Order',  icon: ShoppingCart },
  { id: 'orders',      label: 'Orders',     icon: ClipboardList },
  { id: 'customers',   label: 'Customer',   icon: Users },
  { id: 'table-view',  label: 'Table View', icon: LayoutGrid },
];

// ── Hamburger menu items ──────────────────────────────────────────
const MENU_SECTIONS = [
  {
    label: 'POS Operations',
    items: [
      { id: 'kds',    label: 'Kitchen Display (KDS)', icon: ChefHat,   admin: false },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'products',   label: 'Products',           icon: ShoppingCart, admin: true },
      { id: 'categories', label: 'Categories',         icon: Tag,          admin: true },
      { id: 'payments',   label: 'Payment Methods',    icon: CreditCard,   admin: true },
      { id: 'coupons',    label: 'Coupons & Promos',   icon: Ticket,       admin: true },
      { id: 'booking',    label: 'Booking',            icon: BookOpen,     admin: true },
      { id: 'employees',  label: 'Users / Employees',  icon: UserCog,      admin: true },
      { id: 'reports',    label: 'Reports',            icon: BarChart2,    admin: true },
    ],
  },
];

export default function POSTopNav() {
  const { session, logout } = useAuth();
  const {
    activeView, navigate,
    currentTable,
    searchQuery, setSearchQuery,
    isMenuOpen, setIsMenuOpen,
    requireAdmin, openTableModal,
  } = usePOS();

  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMenuItemClick = (item) => {
    if (item.admin) { requireAdmin(); return; }
    navigate(item.id);
  };

  const initials = session?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'CA';

  return (
    <header className="bg-gray-900 text-white h-14 flex items-center px-3 gap-2 shrink-0 relative z-40">

      {/* Brand */}
      <div className="flex items-center gap-1.5 pr-3 border-r border-gray-700 shrink-0">
        <Coffee size={18} className="text-indigo-400" />
        <span className="font-semibold text-sm text-white hidden sm:block">Odoo Cafe</span>
      </div>

      {/* Nav Tabs */}
      <nav className="flex items-center gap-0.5">
        {NAV_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => id === 'table-view' ? openTableModal() : navigate(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
              ${activeView === id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
          >
            <Icon size={13} />
            <span className="hidden md:block">{label}</span>
          </button>
        ))}
      </nav>

      {/* Search Bar */}
      <div className="flex-1 max-w-xs mx-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-indigo-500 placeholder:text-gray-500 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Right side cluster */}
      <div className="flex items-center gap-2 ml-auto shrink-0">

        {/* Current Table Indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors
          ${currentTable
            ? 'bg-emerald-900/50 border-emerald-700 text-emerald-300'
            : 'bg-gray-800 border-gray-700 text-gray-500'
          }`}>
          <MapPin size={11} />
          <span className="hidden sm:block whitespace-nowrap">
            {currentTable
              ? `Table ${String(currentTable.number).padStart(2, '0')} · ${currentTable.floor}`
              : 'No Table'}
          </span>
        </div>

        {/* Employee Avatar */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-800 border border-gray-700">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <span className="text-xs text-gray-300 hidden lg:block max-w-[80px] truncate">
            {session?.name}
          </span>
        </div>

        {/* Hamburger Menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 transition-colors"
          >
            {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">

              {MENU_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.label}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuItemClick(item)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors
                          ${item.admin
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                            : 'text-emerald-400 hover:text-emerald-300 hover:bg-gray-800'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={14} />
                          {item.label}
                        </div>
                        {item.admin && (
                          <span className="text-xs bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                            Admin
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Divider + Logout */}
              <div className="border-t border-gray-700 mt-1">
                <button
                  onClick={() => { setIsMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
