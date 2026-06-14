import { useEffect } from 'react';
import { POSProvider, usePOS } from '../context/POSContext';
import { CategoryProvider } from '../context/CategoryContext';
import POSTopNav from '../components/POSTopNav';
import AdminBlockModal from '../components/AdminBlockModal';
import TableSelectorModal from '../components/TableView';
import OrderView from '../components/OrderView';
import OrdersView from './pos/OrdersView';
import CustomersView from './pos/CustomersView';
import ReportsPage from './pos/ReportsPage';
import ProductsPage from './admin/ProductsPage';
import CategoriesPage from './admin/CategoriesPage';
import PaymentMethodsPage from './admin/PaymentMethodsPage';
import CouponsPage from './admin/CouponsPage';
import EmployeesPage from './admin/EmployeesPage';
import SessionGate from '../components/SessionGate';
import SessionSummaryModal from '../components/SessionSummaryModal';

function POSShell() {
  const { activeView, adminBlockModal, tableModal, currentTable, openTableModal, posSession, closingSummary } = usePOS();

  useEffect(() => {
    if (posSession && !currentTable) openTableModal();
  }, [posSession]);

  if (!posSession) return <SessionGate />;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <POSTopNav />
      <main className="flex-1 overflow-y-auto flex flex-col">
        {activeView === 'pos-order'  && <OrderView />}
        {activeView === 'orders'     && <OrdersView />}
        {activeView === 'customers'  && <CustomersView />}
        {activeView === 'reports'    && <ReportsPage />}
        {activeView === 'products'   && <ProductsPage readOnly />}
        {activeView === 'categories' && <CategoriesPage readOnly />}
        {activeView === 'payments'   && <PaymentMethodsPage readOnly />}
        {activeView === 'coupons'    && <CouponsPage readOnly />}
        {activeView === 'employees'  && <EmployeesPage readOnly />}
      </main>
      {tableModal      && <TableSelectorModal />}
      {adminBlockModal && <AdminBlockModal />}
      {closingSummary  && <SessionSummaryModal />}
    </div>
  );
}

export default function CashierDashboard() {
  return (
    <CategoryProvider>
      <POSProvider>
        <POSShell />
      </POSProvider>
    </CategoryProvider>
  );
}
