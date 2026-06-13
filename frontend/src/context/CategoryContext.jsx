import { createContext, useContext, useEffect, useReducer, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const WS_URL = API.replace('http', 'ws').replace('/api', '');

const CategoryContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'SET':
      return action.payload;
    case 'CATEGORY_CREATED':
      return [...state, action.category].sort((a, b) => a.name.localeCompare(b.name));
    case 'CATEGORY_UPDATED':
      return state.map((c) => (c._id === action.category._id ? action.category : c));
    case 'CATEGORY_DELETED':
      return state.filter((c) => c._id !== action.id);
    default:
      return state;
  }
}

export function CategoryProvider({ children }) {
  const [categories, dispatch] = useReducer(reducer, []);
  const wsRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then((data) => dispatch({ type: 'SET', payload: data }))
      .catch(console.error);
  }, []);

  // WebSocket — real-time color/name sync
  useEffect(() => {
    let active = true;
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        dispatch(msg);
      };

      ws.onclose = () => { if (active) setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => { active = false; wsRef.current?.close(); };
  }, []);

  const createCategory = async (name, color) => {
    const res  = await fetch(`${API}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data; // caller gets the new category back immediately
  };

  const updateCategory = async (id, payload) => {
    const res  = await fetch(`${API}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  };

  const deleteCategory = async (id) => {
    const res = await fetch(`${API}/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
  };

  return (
    <CategoryContext.Provider value={{ categories, createCategory, updateCategory, deleteCategory }}>
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategories = () => useContext(CategoryContext);
