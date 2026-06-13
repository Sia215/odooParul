import { useEffect } from 'react';
import { POSProvider, usePOS } from '../context/POSContext';
import POSTopNav from '../components/POSTopNav';
import AdminBlockModal from '../components/AdminBlockModal';
import TableSelectorModal from '../components/TableView';
import OrderView from '../components/OrderView';
import OrdersView from './pos/OrdersView';
import CustomersView from './pos/CustomersView';
import { ChefHat } from 'lucide-react';

const PLACEHOLDER_META = {
  'kds': { icon: ChefHat, label: 'Kitchen Display (KDS)', sub: 'Live kitchen ticket queue.' },
};

function ViewPlaceholder({ view }) {
  const meta = PLACEHOLDER_META[view];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
        <Icon size={30} className="text-indigo-400" />
      </div>
      <p className="text-lg font-semibold text-gray-700">{meta.label}</p>
      <p className="text-sm text-gray-400 max-w-xs">{meta.sub}</p>
    </div>
  );
}

function POSShell() {
  const { activeView, adminBlockModal, tableModal, currentTable, openTableModal } = usePOS();

  useEffect(() => {
    if (!currentTable) openTableModal();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <POSTopNav />
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'pos-order'  && <OrderView />}
        {activeView === 'orders'     && <OrdersView />}
        {activeView === 'customers'  && <CustomersView />}
        {activeView === 'kds'        && <ViewPlaceholder view={activeView} />}
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
