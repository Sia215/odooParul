import { useEffect } from 'react';
import { POSProvider, usePOS } from '../context/POSContext';
import POSTopNav from '../components/POSTopNav';
import AdminBlockModal from '../components/AdminBlockModal';
import TableSelectorModal from '../components/TableView';
import OrderView from '../components/OrderView';
import OrdersView from './pos/OrdersView';
import CustomersView from './pos/CustomersView';
import ReportsPage from './pos/ReportsPage';

function POSShell() {
  const { activeView, adminBlockModal, tableModal, currentTable, openTableModal } = usePOS();

  useEffect(() => {
    if (!currentTable) openTableModal();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <POSTopNav />
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'pos-order' && <OrderView />}
        {activeView === 'orders'    && <OrdersView />}
        {activeView === 'customers' && <CustomersView />}
        {activeView === 'reports'   && <ReportsPage />}
      </main>
      {tableModal      && <TableSelectorModal />}
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
