import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem('pos_session');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = (data) => {
    localStorage.setItem('pos_session', JSON.stringify(data));
    setSession(data);
  };

  const logout = () => {
    localStorage.removeItem('pos_session');
    setSession(null);
  };

  // Returns Authorization header for API calls
  const authHeader = () =>
    session?.token ? { Authorization: `Bearer ${session.token}` } : {};

  return (
    <AuthContext.Provider value={{ session, login, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
