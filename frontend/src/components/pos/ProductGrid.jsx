import { useEffect, useState, useMemo } from 'react';
import { Search, X, Package } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ProductCard({ product, onAdd }) {
  const color = product.category?.color || '#6366f1';
  return (
    <button
      onClick={() => onAdd(product)}
      className="group bg-white rounded-2xl border border-gray-200 p-3 flex flex-col gap-2 hover:border-indigo-400 hover:shadow-md transition-all duration-150 text-left active:scale-95"
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-[10px] text-gray-400 truncate">{product.category?.name}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">
        {product.name}
      </p>
      <p className="text-base font-bold text-indigo-600 mt-auto">₹{product.price}</p>
    </button>
  );
}

export default function ProductGrid({ searchQuery, onAddToCart }) {
  const [categories,     setCategories]     = useState([]);
  const [products,       setProducts]       = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading,        setLoading]        = useState(true);
  const [localSearch,    setLocalSearch]    = useState(searchQuery || '');

  useEffect(() => { setLocalSearch(searchQuery || ''); }, [searchQuery]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/categories`).then((r) => r.json()),
      fetch(`${API}/products`).then((r) => r.json()),
    ]).then(([cats, prods]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all') list = list.filter((p) => p.category?._id === activeCategory);
    if (localSearch.trim()) list = list.filter((p) => p.name.toLowerCase().includes(localSearch.toLowerCase()));
    return list;
  }, [products, activeCategory, localSearch]);

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Category Sidebar ── */}
      <div className="w-20 shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto py-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex flex-col items-center gap-1.5 py-3 px-1 text-center transition-all border-l-[3px]
            ${activeCategory === 'all'
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
        >
          <Package size={15} />
          <span className="text-[10px] font-medium">All</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setActiveCategory(cat._id)}
            style={{ borderLeftColor: activeCategory === cat._id ? cat.color : 'transparent' }}
            className={`flex flex-col items-center gap-1.5 py-3 px-1 text-center transition-all border-l-[3px]
              ${activeCategory === cat._id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
          >
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
            <span className="text-[10px] font-medium leading-tight line-clamp-2 px-0.5">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* ── Product Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Inline search */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-8 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {localSearch && (
              <button onClick={() => setLocalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading products...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
              <Package size={32} className="opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
              {filtered.map((p) => (
                <ProductCard key={p._id} product={p} onAdd={onAddToCart} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
