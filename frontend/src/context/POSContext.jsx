import { createContext, useContext, useState } from 'react';

const POSContext = createContext(null);

export function POSProvider({ children }) {
  const [activeView,      setActiveView]      = useState('pos-order'); // 'pos-order' | 'orders' | 'customers' | 'table-view'
  const [currentTable,    setCurrentTable]    = useState(null);        // { id, number, floor } | null
  const [searchQuery,     setSearchQuery]     = useState('');
  const [isMenuOpen,      setIsMenuOpen]      = useState(false);
  const [adminBlockModal, setAdminBlockModal] = useState(false);

  const navigate = (view) => { setActiveView(view); setIsMenuOpen(false); };
  const selectTable = (table) => { setCurrentTable(table); setActiveView('pos-order'); };
  const clearTable  = () => setCurrentTable(null);
  const requireAdmin = () => { setAdminBlockModal(true); setIsMenuOpen(false); };

  return (
    <POSContext.Provider value={{
      activeView, navigate,
      currentTable, selectTable, clearTable,
      searchQuery, setSearchQuery,
      isMenuOpen, setIsMenuOpen,
      adminBlockModal, setAdminBlockModal, requireAdmin,
    }}>
      {children}
    </POSContext.Provider>
  );
}

export const usePOS = () => useContext(POSContext);
