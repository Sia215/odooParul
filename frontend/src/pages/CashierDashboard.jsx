import { POSProvider, usePOS } from '../context/POSContext';
import POSTopNav from '../components/POSTopNav';
import AdminBlockModal from '../components/AdminBlockModal';
import { ShoppingCart, ClipboardList, Users, LayoutGrid, ChefHat } from 'lucide-react';

// ── Placeholder views ─────────────────────────────────────────────
const VIEW_META = {
  'pos-order':  { icon: ShoppingCart, label: 'POS Order',             sub: 'Select products and build the order.' },
  'orders':     { icon: ClipboardList, label: 'Orders',               sub: 'View and manage shift order history.' },
  'customers':  { icon: Users,         label: 'Customer',             sub: 'Search, register, and manage customers.' },
  'table-view': { icon: LayoutGrid,    label: 'Table / Floor View',   sub: 'Select an active table from the floor plan.' },
  'kds':        { icon: ChefHat,       label: 'Kitchen Display (KDS)', sub: 'Live kitchen ticket queue.' },
};

function ViewPlaceholder() {
  const { activeView, searchQuery } = usePOS();
  const meta = VIEW_META[activeView] || VIEW_META['pos-order'];
  const Icon = meta.icon;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
        <Icon size={30} className="text-indigo-400" />
      </div>
      <p className="text-lg font-semibold text-gray-700">{meta.label}</p>
      <p className="text-sm text-gray-400 max-w-xs">{meta.sub}</p>
      {searchQuery && activeView === 'pos-order' && (
        <p className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full mt-1">
          Searching: <strong>{searchQuery}</strong>
        </p>
      )}
    </div>
  );
}

function POSShell() {
  const { adminBlockModal } = usePOS();

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <POSTopNav />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <ViewPlaceholder />
      </main>
      {adminBlockModal && <AdminBlockModal />}
    </div>
  );
}

export default function CashierDashboard() {
  return (
    <POSProvider>
      <POSShell />
    </POSProvider>
  );
}
