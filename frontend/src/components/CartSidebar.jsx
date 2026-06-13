import { useEffect, useState, useCallback } from 'react';
import { Trash2, Tag, Zap, X, Plus, Minus, ShoppingCart } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

// Debounce helper
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Single cart row
function CartItem({ item, onQtyChange, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
        <p className="text-xs text-gray-400">₹{item.price} × {item.quantity}</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onQtyChange(item.productId, item.quantity - 1)}
          className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
          <Minus size={11} />
        </button>
        <span className="text-sm font-semibold text-gray-800 w-6 text-center">{item.quantity}</span>
        <button onClick={() => onQtyChange(item.productId, item.quantity + 1)}
          className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
          <Plus size={11} />
        </button>
      </div>
      <span className="text-sm font-semibold text-gray-800 w-16 text-right">
        ₹{(item.price * item.quantity).toFixed(2)}
      </span>
      <button onClick={() => onRemove(item.productId)} className="text-gray-300 hover:text-red-400 ml-1">
        <X size={14} />
      </button>
    </div>
  );
}

// Breakdown line
function BreakdownLine({ line }) {
  const colorMap = {
    base:   'text-gray-700',
    promo:  'text-emerald-600 font-medium',
    coupon: 'text-indigo-600 font-medium',
    tax:    'text-gray-500',
    total:  'text-gray-900 font-bold text-base border-t border-gray-200 pt-2 mt-1',
  };
  return (
    <div className={`flex justify-between items-center py-0.5 ${colorMap[line.type]}`}>
      <span className="text-sm flex items-center gap-1.5">
        {line.type === 'promo'  && <Zap size={12} className="text-emerald-500" />}
        {line.type === 'coupon' && <Tag size={12} className="text-indigo-500" />}
        {line.label}
      </span>
      <span className={`text-sm ${line.amount < 0 ? 'text-emerald-600' : ''}`}>
        {line.amount < 0 ? `−₹${Math.abs(line.amount).toFixed(2)}` : `₹${line.amount.toFixed(2)}`}
      </span>
    </div>
  );
}

export default function CartSidebar({ cartItems, onQtyChange, onRemove, onCheckout, taxRate = 5 }) {
  const [couponInput, setCouponInput]   = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError]   = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [pricing, setPricing]           = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const debouncedCart = useDebounce(cartItems, 400);

  // Recalculate whenever cart or coupon changes
  const recalculate = useCallback(async (items, couponCode) => {
    if (!items || items.length === 0) { setPricing(null); return; }
    setPricingLoading(true);
    try {
      const res  = await fetch(`${API}/pos/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: items, couponCode: couponCode || null, taxRate }),
      });
      const data = await res.json();
      if (res.ok) setPricing(data);
    } catch (err) { console.error(err); }
    finally { setPricingLoading(false); }
  }, [taxRate]);

  useEffect(() => {
    recalculate(debouncedCart, appliedCoupon?.code || null);
  }, [debouncedCart, appliedCoupon, recalculate]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError(''); setCouponLoading(true);
    try {
      const res  = await fetch(`${API}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAppliedCoupon(data);
      setCouponInput('');
    } catch (err) { setCouponError(err.message); }
    finally { setCouponLoading(false); }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null); setCouponInput(''); setCouponError('');
  };

  const isEmpty = !cartItems || cartItems.length === 0;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-sm">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
        <ShoppingCart size={18} className="text-indigo-500" />
        <h2 className="font-semibold text-gray-800">Order</h2>
        {cartItems?.length > 0 && (
          <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            {cartItems.length} item{cartItems.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <ShoppingCart size={36} />
            <p className="text-sm mt-2">Cart is empty</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <CartItem key={item.productId} item={item} onQtyChange={onQtyChange} onRemove={onRemove} />
          ))
        )}
      </div>

      {!isEmpty && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-gray-100 pt-3">

          {/* Auto promo badge */}
          {pricing?.autoPromo && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <Zap size={14} className="text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-700">{pricing.autoPromo.name}</p>
                <p className="text-xs text-emerald-600">
                  −₹{pricing.autoPromo.discountAmount.toFixed(2)} applied automatically
                </p>
              </div>
            </div>
          )}

          {/* Coupon input */}
          <div className="flex flex-col gap-1.5">
            {appliedCoupon ? (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                <Tag size={14} className="text-indigo-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-indigo-700 font-mono">{appliedCoupon.code}</p>
                  <p className="text-xs text-indigo-500">{appliedCoupon.message}</p>
                </div>
                <button onClick={handleRemoveCoupon} className="text-indigo-300 hover:text-indigo-500">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-1.5">
                  <input
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono uppercase"
                  />
                  <button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-medium disabled:opacity-50">
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              </>
            )}
          </div>

          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-xl px-3 py-3">
            {pricingLoading ? (
              <p className="text-xs text-gray-400 text-center py-2">Calculating...</p>
            ) : pricing ? (
              pricing.breakdown.map((line, i) => <BreakdownLine key={i} line={line} />)
            ) : null}
          </div>

          {/* Checkout button */}
          <button
            onClick={() => onCheckout && onCheckout({ pricing, appliedCoupon })}
            disabled={!pricing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            Proceed to Checkout
            {pricing && <span className="ml-2 opacity-80">• ₹{pricing.finalTotal.toFixed(2)}</span>}
          </button>
        </div>
      )}
    </div>
  );
}
