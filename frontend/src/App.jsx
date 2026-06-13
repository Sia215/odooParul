import { useState } from 'react';
import { CategoryProvider } from './context/CategoryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginCard from './components/LoginCard';
import SignUpCard from './components/SignUpCard';
import FirstTimeSetup from './pages/FirstTimeSetup';
import CashierDashboard from './pages/CashierDashboard';
import ProductsPage from './pages/admin/ProductsPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import PaymentMethodsPage from './pages/admin/PaymentMethodsPage';
import FloorPlanPage from './pages/admin/FloorPlanPage';
import CouponsPage from './pages/admin/CouponsPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import { LayoutGrid, Tag, CreditCard, Building2, Ticket, Zap, Users, LogOut } from 'lucide-react';

const NAV = [
  { id: 'products',   label: 'Products',   icon: LayoutGrid },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'payments',   label: 'Payments',   icon: CreditCard },
  { id: 'floorplan',  label: 'Floor Plan', icon: Building2 },
  { id: 'coupons',    label: 'Coupons',    icon: Ticket },
  { id: 'promotions', label: 'Promotions', icon: Zap },
  { id: 'employees',  label: 'Employees',  icon: Users },
];

function AdminLayout() {
  const { session, logout } = useAuth();
  const [tab, setTab] = useState('products');

  return (
    <CategoryProvider>
      <div className="min-h-screen bg-slate-50 flex">
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-200">
            <p className="text-base font-semibold text-indigo-600">☕ Odoo Cafe</p>
            <p className="text-xs text-gray-400 mt-0.5">POS Admin</p>
          </div>
          <nav className="flex-1 p-3 flex flex-col gap-1">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left
                  ${tab === id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-200">
            <div className="px-3 py-2 text-xs text-gray-500 truncate">{session?.name}</div>
            <button onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg w-full">
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
        </main>
      </div>
    </CategoryProvider>
  );
}

function AppRouter() {
  const { session, login } = useAuth();
  const [page, setPage]           = useState('login');
  // firstTimeSetup: { userId, name } when pending cashier logs in
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {page === 'login'
        ? <LoginCard onSwitchToSignUp={() => setPage('signup')} onLogin={handleLogin} />
        : <SignUpCard onSwitchToLogin={() => setPage('login')} />
      }
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
