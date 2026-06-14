import { createContext, useContext, useState } from 'react';

const POSContext = createContext(null);

export function POSProvider({ children }) {
  const [activeView,      setActiveView]      = useState('pos-order');
  const [currentTable,    setCurrentTable]    = useState(null);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [isMenuOpen,      setIsMenuOpen]      = useState(false);
  const [adminBlockModal, setAdminBlockModal] = useState(false);
  const [tableModal,      setTableModal]      = useState(false);
  const [activeTables,    setActiveTables]    = useState(new Set());
  const [editingOrder,    setEditingOrder]    = useState(null);
  const [currentCustomer, setCurrentCustomer] = useState(null); // { _id, name, email, phone }

  // POS Session
  const [posSession,        setPosSession]        = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_active_session')) || null; } catch { return null; }
  });
  const [lastSessionInfo,   setLastSessionInfo]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_last_session')) || null; } catch { return null; }
  });
  const [closingSummary,    setClosingSummary]    = useState(null);
  const [sessionSales,      setSessionSales]      = useState({ total: 0, orders: 0 });

  const openSession = (openingCash = 0) => {
    const s = { openedAt: new Date().toISOString(), openingCash };
    localStorage.setItem('pos_active_session', JSON.stringify(s));
    setPosSession(s);
    setSessionSales({ total: 0, orders: 0 });
  };

  const recordSale = (amount) =>
    setSessionSales((prev) => ({ total: prev.total + amount, orders: prev.orders + 1 }));

  const closeSession = () => {
    const summary = {
      openedAt:    posSession?.openedAt,
      closedAt:    new Date().toISOString(),
      totalSales:  sessionSales.total,
      orders:      sessionSales.orders,
      openingCash: posSession?.openingCash || 0,
    };
    localStorage.setItem('pos_last_session', JSON.stringify({ closedAt: summary.closedAt, totalSales: summary.totalSales }));
    localStorage.removeItem('pos_active_session');
    setLastSessionInfo({ closedAt: summary.closedAt, totalSales: summary.totalSales });
    setPosSession(null);
    setSessionSales({ total: 0, orders: 0 });
    setClosingSummary(summary);
  };

  const dismissClosingSummary = () => setClosingSummary(null);

  const navigate     = (view) => { setActiveView(view); setIsMenuOpen(false); };
  const openTableModal  = () => setTableModal(true);
  const closeTableModal = () => setTableModal(false);
  const selectTable  = (table) => {
    setCurrentTable(table);
    setTableModal(false);
    setActiveView('pos-order');
  };
  const clearTable   = () => setCurrentTable(null);
  const requireAdmin = () => { setAdminBlockModal(true); setIsMenuOpen(false); };
  const markTableActive   = (id) => setActiveTables((s) => new Set([...s, id]));
  const markTableInactive = (id) => setActiveTables((s) => { const n = new Set(s); n.delete(id); return n; });
  // Load a draft order into the cart for editing
  const editOrder = (order) => { setEditingOrder(order); setActiveView('pos-order'); };
  const linkCustomer   = (customer) => { setCurrentCustomer(customer); setActiveView('pos-order'); };
  const unlinkCustomer = () => setCurrentCustomer(null);

  return (
    <POSContext.Provider value={{
      activeView, navigate,
      currentTable, selectTable, clearTable,
      searchQuery, setSearchQuery,
      isMenuOpen, setIsMenuOpen,
      adminBlockModal, setAdminBlockModal, requireAdmin,
      tableModal, openTableModal, closeTableModal,
      activeTables, markTableActive, markTableInactive,
      editingOrder, setEditingOrder, editOrder,
      currentCustomer, setCurrentCustomer, linkCustomer, unlinkCustomer,
      posSession, lastSessionInfo, openSession, closeSession, recordSale,
      closingSummary, dismissClosingSummary,
    }}>
      {children}
    </POSContext.Provider>
  );
}

export const usePOS = () => useContext(POSContext);
