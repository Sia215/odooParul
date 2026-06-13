import { useEffect, useState, useMemo } from 'react';
import { Search, X, Package, Utensils } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Curated Unsplash image map ─────────────────────────────────────
const UNSPLASH_CURATED = [
  { keys: ['sprite','7up','lemon soda','lime soda'],          id: 'photo-1625772299848-391b6a87d7b3' },
  { keys: ['cola','pepsi','coke','cold drink'],               id: 'photo-1554866585-cd94860890b7' },
  { keys: ['soda','soft drink','fizzy'],                      id: 'photo-1581006852262-e4307cf6283a' },
  { keys: ['juice','orange juice','mango juice'],             id: 'photo-1600271886742-f049cd451bba' },
  { keys: ['lassi','buttermilk'],                             id: 'photo-1571091718767-18b5b1457add' },
  { keys: ['smoothie','shake','milkshake'],                   id: 'photo-1553361371-9b22f78e8b1d' },
  { keys: ['water','mineral water'],                          id: 'photo-1548839140-29a749e1cf4d' },
  { keys: ['coffee','cafe'],                                  id: 'photo-1514432324607-a09d9b4aefdd' },
  { keys: ['espresso'],                                       id: 'photo-1495474472287-4d71bcdd2085' },
  { keys: ['latte'],                                          id: 'photo-1572442388796-11668a67e53d' },
  { keys: ['cappuccino'],                                     id: 'photo-1534778101976-62847782c213' },
  { keys: ['mocha'],                                          id: 'photo-1578374173705-969cbe6f2d6b' },
  { keys: ['tea','chai'],                                     id: 'photo-1544787219-7f47ccb76574' },
  { keys: ['noodle','noodles','hakka','chow mein','lo mein'], id: 'photo-1569050467447-ce54b3bbc37d' },
  { keys: ['ramen','udon','soba'],                            id: 'photo-1591814468924-caf88d1232e1' },
  { keys: ['maggi'],                                          id: 'photo-1612929633738-8fe44f7ec841' },
  { keys: ['spaghetti','pasta','penne'],                      id: 'photo-1555949258-eb67b1ef0ceb' },
  { keys: ['biryani','biriyani'],                             id: 'photo-1645177628172-a4f4cff02c72' },
  { keys: ['rice','fried rice','pulao'],                      id: 'photo-1516684732162-798a0062be99' },
  { keys: ['roti','chapati','paratha'],                       id: 'photo-1596560548464-f010549b84d7' },
  { keys: ['naan'],                                           id: 'photo-1605522324364-d7bb2b50a0e6' },
  { keys: ['butter chicken','murgh'],                         id: 'photo-1603894584373-5ac82b2ae398' },
  { keys: ['tikka','tandoori'],                               id: 'photo-1599487488170-d11ec9c172f0' },
  { keys: ['chicken','poultry'],                              id: 'photo-1598514982205-f36b96d1e8e4' },
  { keys: ['pizza'],                                          id: 'photo-1513104890138-7c749659a591' },
  { keys: ['burger','hamburger'],                             id: 'photo-1568901346375-23c9450c58cd' },
  { keys: ['sandwich','sub','wrap'],                          id: 'photo-1528735602780-2552fd46c7af' },
  { keys: ['fries','chips','french fries'],                   id: 'photo-1576107232684-1279f390859f' },
  { keys: ['samosa'],                                         id: 'photo-1601050690597-df0568f70950' },
  { keys: ['steak','beef'],                                   id: 'photo-1544025162-d76694265947' },
  { keys: ['fish','seafood','prawn'],                         id: 'photo-1519708227418-c8fd9a32b7a2' },
  { keys: ['egg','omelette'],                                 id: 'photo-1525351484163-7529414344d8' },
  { keys: ['soup','broth'],                                   id: 'photo-1547592180-85f173990554' },
  { keys: ['salad'],                                          id: 'photo-1546069901-ba9599a7e63c' },
  { keys: ['sushi','maki'],                                   id: 'photo-1553621042-f6e147245754' },
  { keys: ['bread','loaf','toast'],                           id: 'photo-1509440159596-0249088772ff' },
  { keys: ['waffle','waffles'],                               id: 'photo-1562376552-0d160a2f238d' },
  { keys: ['pancake','pancakes'],                             id: 'photo-1567620905732-2d1ec7ab7445' },
  { keys: ['cake','pastry'],                                  id: 'photo-1578985545062-69928b1d9587' },
  { keys: ['ice cream','icecream','kulfi'],                   id: 'photo-1501443762994-82bd5dace89a' },
  { keys: ['dessert','sweet'],                                id: 'photo-1565958011703-44f9829ba187' },
  { keys: ['chocolate','brownie'],                            id: 'photo-1606312619070-d48b4c652a52' },
  { keys: ['milk','dairy'],                                   id: 'photo-1550583724-b2692b85b150' },
];

const EMOJI_MAP = [
  { keys: ['coffee','cafe','cappuccino','latte','espresso','mocha'], emoji: '☕' },
  { keys: ['tea','chai'], emoji: '🍵' },
  { keys: ['pizza'], emoji: '🍕' },
  { keys: ['burger','sandwich'], emoji: '🍔' },
  { keys: ['pasta','noodle','spaghetti','maggi','ramen'], emoji: '🍝' },
  { keys: ['rice','biryani','pulao'], emoji: '🍚' },
  { keys: ['roti','chapati','naan','bread'], emoji: '🫓' },
  { keys: ['sprite','soda','cola','juice','drink'], emoji: '🥤' },
  { keys: ['cake','dessert','sweet','ice cream'], emoji: '🍰' },
  { keys: ['fries','chips'], emoji: '🍟' },
  { keys: ['salad'], emoji: '🥗' },
  { keys: ['soup'], emoji: '🍜' },
  { keys: ['chicken','tikka'], emoji: '🍗' },
  { keys: ['fish','seafood'], emoji: '🐟' },
  { keys: ['egg'], emoji: '🍳' },
  { keys: ['milk','shake','lassi','smoothie'], emoji: '🥛' },
  { keys: ['water'], emoji: '💧' },
];

function getEmoji(name) {
  const lower = name.toLowerCase();
  for (const { keys, emoji } of EMOJI_MAP) {
    if (keys.some(k => lower.includes(k))) return emoji;
  }
  return '🍽️';
}

// Global cache
const imageCache = {};

function getUnsplashUrl(name) {
  const lower = name.toLowerCase();
  for (const { keys, id } of UNSPLASH_CURATED) {
    if (keys.some(k => lower.includes(k)))
      return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=80`;
  }
  return null;
}

async function fetchFoodImage(name) {
  if (name in imageCache) return imageCache[name];
  // Try curated Unsplash first
  const unsplashUrl = getUnsplashUrl(name);
  if (unsplashUrl) { imageCache[name] = unsplashUrl; return unsplashUrl; }
  // Fallback: TheMealDB
  try {
    const terms = [...new Set([name, name.split(' ')[0], name.split(' ').pop()])];
    for (const term of terms) {
      const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.meals?.[0]?.strMealThumb) { imageCache[name] = data.meals[0].strMealThumb; return imageCache[name]; }
    }
  } catch (_) {}
  imageCache[name] = null;
  return null;
}

function ProductImage({ name }) {
  const [src, setSrc]       = useState(() => imageCache[name] ?? null);
  const [status, setStatus] = useState(imageCache[name] === undefined ? 'loading' : imageCache[name] ? 'loaded' : 'error');

  useEffect(() => {
    if (name in imageCache) { setSrc(imageCache[name]); setStatus(imageCache[name] ? 'loaded' : 'error'); return; }
    fetchFoodImage(name).then(url => { setSrc(url); setStatus(url ? 'loaded' : 'error'); });
  }, [name]);

  return (
    <div className="relative w-full h-40 overflow-hidden" style={{ background: '#F4F4ED' }}>
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(90deg,#F4F4ED,#E8E5DE,#F4F4ED)' }} />
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ background: '#F4F4ED' }}>
          <span className="text-4xl">{getEmoji(name)}</span>
        </div>
      )}
      {src && (
        <img src={src} alt={name}
          onError={() => setStatus('error')}
          className={`w-full h-40 object-cover transition-all duration-500 group-hover:scale-105 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`} />
      )}
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const color = product.category?.color || '#9A3412';
  const [popped, setPopped] = useState(false);

  const handleClick = () => {
    onAdd(product);
    setPopped(true);
    setTimeout(() => setPopped(false), 350);
  };

  return (
    <button onClick={handleClick}
      className="group relative flex flex-col text-left rounded-2xl overflow-hidden focus:outline-none"
      style={{
        border: '1px solid #D6D3D1',
        boxShadow: '0 2px 6px rgba(46,26,18,0.07)',
        background: '#FFFFFF',
        transition: popped
          ? 'transform 0.08s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.08s ease'
          : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, border-color 0.15s ease',
        transform: popped ? 'scale(0.95)' : 'scale(1)',
      }}
      onMouseEnter={e => { if (popped) return; e.currentTarget.style.borderColor = '#A8A29E'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(46,26,18,0.12)'; e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)'; }}
      onMouseLeave={e => { if (popped) return; e.currentTarget.style.borderColor = '#D6D3D1'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(46,26,18,0.07)'; e.currentTarget.style.transform = 'scale(1)'; }}>

      {popped && <span className="absolute inset-0 rounded-xl pointer-events-none z-10"
        style={{ background: 'rgba(154,52,18,0.12)', animation: 'cardPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }} />}
      {popped && <span className="absolute top-2 right-2 z-20 text-white text-[10px] font-black px-2 py-0.5 rounded-full"
        style={{ background: '#9A3412', animation: 'badgePop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>+1</span>}

      <div className="w-full shrink-0"><ProductImage name={product.name} /></div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-1.5">
          <Utensils size={10} style={{ color: '#A8A29E' }} className="shrink-0" />
          <span className="text-[10px] truncate" style={{ color: '#A8A29E' }}>{product.category?.name}</span>
        </div>
        <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: '#2E1A12' }}>{product.name}</p>
        <p className="text-base font-extrabold mt-auto" style={{ color: '#9A3412' }}>₹{product.price}</p>
      </div>

      <style>{`
        @keyframes cardPop { 0% { opacity: 0.7; } 50% { opacity: 0.15; } 100% { opacity: 0; } }
        @keyframes badgePop { 0% { opacity: 0; transform: scale(0.5) translateY(4px); } 60% { opacity: 1; transform: scale(1.2) translateY(-2px); } 100% { opacity: 0; transform: scale(1) translateY(-6px); } }
      `}</style>
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
      fetch(`${API}/categories`).then(r => r.json()),
      fetch(`${API}/products`).then(r => r.json()),
    ]).then(([cats, prods]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all') list = list.filter(p => p.category?._id === activeCategory);
    if (localSearch.trim()) list = list.filter(p => p.name.toLowerCase().includes(localSearch.toLowerCase()));
    return list;
  }, [products, activeCategory, localSearch]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Category Sidebar */}
      <div className="w-20 shrink-0 flex flex-col overflow-y-auto py-1 border-r" style={{ background: '#FAFAF6', borderColor: '#D6D3D1' }}>
        <button onClick={() => setActiveCategory('all')}
          className="flex flex-col items-center gap-1.5 py-3 px-1 text-center transition-all duration-200 border-l-[3px]"
          style={activeCategory === 'all'
            ? { borderLeftColor: '#2E1A12', background: '#F4F4ED', color: '#2E1A12' }
            : { borderLeftColor: 'transparent', color: '#A8A29E' }}>
          <Package size={15} />
          <span className="text-[10px] font-semibold">All</span>
        </button>
        {categories.map(cat => (
          <button key={cat._id} onClick={() => setActiveCategory(cat._id)}
            className="flex flex-col items-center gap-1.5 py-3 px-1 text-center transition-all duration-200 border-l-[3px]"
            style={{
              borderLeftColor: activeCategory === cat._id ? '#2E1A12' : 'transparent',
              background:      activeCategory === cat._id ? '#F4F4ED' : 'transparent',
              color:           activeCategory === cat._id ? '#2E1A12' : '#A8A29E',
            }}>
            <Utensils size={14} style={{ color: activeCategory === cat._id ? '#2E1A12' : '#C4B8B0' }} />
            <span className="text-[10px] font-semibold leading-tight line-clamp-2 px-0.5">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Product Area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#FAFAF6' }}>
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#A8A29E' }} />
            <input value={localSearch} onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl pl-8 pr-8 py-2 text-sm outline-none transition-all"
              style={{ background: '#F4F4ED', border: '1px solid #D6D3D1', color: '#2E1A12' }}
              onFocus={e => { e.target.style.borderColor = '#9A3412'; e.target.style.boxShadow = '0 0 0 3px rgba(154,52,18,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#D6D3D1'; e.target.style.boxShadow = 'none'; }} />
            {localSearch && (
              <button onClick={() => setLocalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: '#A8A29E' }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #D6D3D1' }}>
                  <div className="h-40 animate-pulse" style={{ background: '#F4F4ED' }} />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="h-2.5 rounded animate-pulse" style={{ background: '#E8E5DE', width: '55%' }} />
                    <div className="h-3.5 rounded animate-pulse" style={{ background: '#E8E5DE', width: '80%' }} />
                    <div className="h-4 rounded animate-pulse mt-1" style={{ background: '#E8E5DE', width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: '#A8A29E' }}>
              <Package size={32} className="opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(p => <ProductCard key={p._id} product={p} onAdd={onAddToCart} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
