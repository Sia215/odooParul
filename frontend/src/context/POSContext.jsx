import { createContext, useContext, useState } from 'react';

const POSContext = createContext(null);

export function POSProvider({ children }) {
  const [activeView,      setActiveView]      = useState('pos-order');
  const [currentTable,    setCurrentTable]    = useState(null);   // { _id, number, floor } | null
  const [searchQuery,     setSearchQuery]     = useState('');
  const [isMenuOpen,      setIsMenuOpen]      = useState(false);
  const [adminBlockModal, setAdminBlockModal] = useState(false);
  const [tableModal,      setTableModal]      = useState(false);  // floor/table picker modal
  // Set of table _ids that currently have an open order
  const [activeTables,    setActiveTables]    = useState(new Set());

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

  return (
    <POSContext.Provider value={{
      activeView, navigate,
      currentTable, selectTable, clearTable,
      searchQuery, setSearchQuery,
      isMenuOpen, setIsMenuOpen,
      adminBlockModal, setAdminBlockModal, requireAdmin,
      tableModal, openTableModal, closeTableModal,
      activeTables, markTableActive, markTableInactive,
    }}>
      {children}
    </POSContext.Provider>
  );
}

export const usePOS = () => useContext(POSContext);
