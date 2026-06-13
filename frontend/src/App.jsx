import { useState } from 'react';
import { CategoryProvider } from './context/CategoryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import KDSPage from './pages/KDSPage';
import AuthPortal from './components/AuthPortal';
import FirstTimeSetup from './pages/FirstTimeSetup';
import CashierDashboard from './pages/CashierDashboard';
import ProductsPage from './pages/admin/ProductsPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import PaymentMethodsPage from './pages/admin/PaymentMethodsPage';
import FloorPlanPage from './pages/admin/FloorPlanPage';
import CouponsPage from './pages/admin/CouponsPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import { LayoutGrid, Tag, CreditCard, Building2, Ticket, Zap, Users, LogOut, BarChart2 } from 'lucide-react';
import ReportsPage from './pages/pos/ReportsPage';

const NAV = [
  { id: 'products',   label: 'Products',   icon: LayoutGrid },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'payments',   label: 'Payments',   icon: CreditCard },
  { id: 'floorplan',  label: 'Floor Plan', icon: Building2 },
  { id: 'coupons',    label: 'Coupons',    icon: Ticket },
  { id: 'promotions', label: 'Promotions', icon: Zap },
  { id: 'employees',  label: 'Employees',  icon: Users },
  { id: 'reports',    label: 'Reports',    icon: BarChart2 },
];

function AdminLayout() {
  const { session, logout } = useAuth();
  const [tab, setTab] = useState('products');

  return (
    <CategoryProvider>
      <div className="min-h-screen flex" style={{ background: '#FAFAF6' }}>
        <aside className="w-56 shrink-0 flex flex-col" style={{ background: '#F4F4ED', borderRight: '1.5px solid #D6D3D1' }}>
          <div className="px-5 py-5" style={{ borderBottom: '1px solid #D6D3D1' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFF0EB', border: '1.5px solid #FBBFA3' }}>
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path d="M10 18h28l-3 18H13L10 18z" fill="#9A3412" />
                  <rect x="9" y="14" width="30" height="5" rx="2.5" fill="#7C2D12" />
                  <path d="M18 10 Q19 7 18 4" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
                  <path d="M24 10 Q25 7 24 4" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
                  <path d="M30 10 Q31 7 30 4" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
                  <path d="M38 20 Q46 20 46 28 Q46 36 38 36" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-black leading-tight" style={{ color: '#2E1A12', fontFamily: 'Georgia, serif' }}>The Velvet Bean Co.</p>
                <p className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: '#9A3412' }}>POS Admin</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 w-full text-left active:scale-95"
                  style={active
                    ? { background: '#9A3412', color: '#FFF0EB', boxShadow: '0 2px 8px rgba(154,52,18,0.2)' }
                    : { color: '#78716C' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(214,211,209,0.4)'; e.currentTarget.style.color = '#2E1A12'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; } }}>
                  <Icon size={15} />{label}
                </button>
              );
            })}
          </nav>
          <div className="p-3" style={{ borderTop: '1px solid #D6D3D1' }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1" style={{ background: 'rgba(214,211,209,0.3)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: '#9A3412', color: '#FFF0EB' }}>
                {session?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'AD'}
              </div>
              <span className="text-xs font-medium truncate" style={{ color: '#78716C' }}>{session?.name}</span>
            </div>
            <button onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl w-full transition-all duration-150 active:scale-95"
              style={{ color: '#991B1B' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto">
          {tab === 'products'   && <ProductsPage />}
          {tab === 'categories' && <CategoriesPage />}
          {tab === 'payments'   && <PaymentMethodsPage />}
          {tab === 'floorplan'  && <FloorPlanPage />}
          {tab === 'coupons'    && <CouponsPage />}
          {tab === 'promotions' && <PromotionsPage />}
          {tab === 'employees'  && <EmployeesPage />}
          {tab === 'reports'    && <ReportsPage />}
        </main>
      </div>
    </CategoryProvider>
  );
}

function AppRouter() {
  const { session, login } = useAuth();
  const [setupData, setSetupData] = useState(null);

  // Role-based routing guard
  if (session) {
    if (session.role === 'CASHIER' && session.status === 'ACTIVE') return <CashierDashboard />;
    if (session.role === 'ADMIN'   && session.status === 'ACTIVE') return <AdminLayout />;
  }

  // First-time setup flow
  if (setupData) {
    return (
      <FirstTimeSetup
        userId={setupData.userId}
        name={setupData.name}
        onComplete={(data) => {
          setSetupData(null);
          login(data); // auto-login after setup, triggers re-render to CashierDashboard
        }}
      />
    );
  }

  // Handle login response — checks firstTimeSetup flag and redirect field
  const handleLogin = (data) => {
    if (data.firstTimeSetup) {
      setSetupData({ userId: data.userId, name: data.name });
      return;
    }
    login(data);
  };

  return <AuthPortal onLogin={handleLogin} />;
}

export default function App() {
  // /kds is auth-free — check before any auth context
  if (window.location.pathname === '/kds') return <KDSPage />;
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
