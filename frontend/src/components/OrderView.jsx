import { useState, useCallback, useEffect } from 'react';
import ProductGrid  from './pos/ProductGrid';
import CartPanel    from './pos/CartPanel';
import PaymentPanel from './pos/PaymentPanel';
import { usePOS }   from '../context/POSContext';
import useDiscount  from '../hooks/useDiscount';
import usePromotions from '../hooks/usePromotions';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DEFAULT_TAX = 5;

export default function OrderView() {
  const { searchQuery, editingOrder, setEditingOrder, currentCustomer, unlinkCustomer, navigate } = usePOS();

  const [cartItems,      setCartItems]      = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [sendingToKitchen, setSending]      = useState(false);
  const [kitchenMsg, setKitchenMsg]         = useState(null);

  // Restore draft order into cart when editingOrder is set
  useEffect(() => {
    if (!editingOrder) return;
    setCartItems(editingOrder.items.map((i) => ({
      _id:      i.productId || String(i.productId),
      name:     i.name,
      price:    i.price,
      qty:      i.qty,
      category: i.category,
    })));
    setSelectedItemId(null);
    setEditingOrder(null);
  }, [editingOrder]);

  const handleAddToCart = useCallback((product) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i._id === product._id);
      if (exists) return prev.map((i) => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setSelectedItemId(product._id);
  }, []);

  const handleIncrement = (id) =>
    setCartItems((p) => p.map((i) => i._id === id ? { ...i, qty: i.qty + 1 } : i));

  const handleDecrement = (id) =>
    setCartItems((p) => {
      const item = p.find((i) => i._id === id);
      if (item?.qty <= 1) return p.filter((i) => i._id !== id);
      return p.map((i) => i._id === id ? { ...i, qty: i.qty - 1 } : i);
    });

  const handleRemove = (id) => {
    setCartItems((p) => p.filter((i) => i._id !== id));
    setSelectedItemId((s) => s === id ? null : s);
  };

  // ── Subtotal (before discount) ──────────────────────────────────
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  // ── Hooks ───────────────────────────────────────────────────────
  const {
    coupon, applyCoupon, removeCoupon,
    manualPct, setManualPct,
    loading: couponLoading, error: couponError, success: couponSuccess,
    taxAmt, couponDiscAmt, manualDiscAmt, totalDiscAmt, finalTotal,
  } = useDiscount(subtotal, DEFAULT_TAX);

  const { itemPromos, orderPromo, promoDiscAmt } = usePromotions(cartItems, subtotal);

  // Grand total including promo savings
  const grandTotal = Math.max(0, finalTotal - promoDiscAmt);

  // ── Send to Kitchen ────────────────────────────────────────────
  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) return;
    setSending(true);
    setKitchenMsg(null);
    try {
      // Step 1: save/create a Draft order
      const orderPayload = {
        items: cartItems.map(i => ({
          productId: i._id,
          name:      i.name,
          price:     i.price,
          qty:       i.qty,
          category:  i.category || {},
        })),
        customer:    currentCustomer?.name || 'Walk-in',
        table:       {},
        subtotal,
        taxAmt,
        discountAmt: totalDiscAmt + promoDiscAmt,
        total:       grandTotal,
        status:      'Draft',
      };

      const token = JSON.parse(localStorage.getItem('pos_session') || '{}')?.token;
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const orderRes = await fetch(`${API}/orders`, {
        method: 'POST', headers, body: JSON.stringify(orderPayload),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.message || 'Failed to save order');

      // Step 2: send to KDS — use same base URL
      const kdsRes = await fetch(`${API.replace('/api','')}/api/kds/orders/${order._id}/send`, {
        method: 'POST', headers,
      });
      if (!kdsRes.ok) {
        const kdsErr = await kdsRes.json().catch(() => ({}));
        throw new Error(kdsErr.message || 'Failed to send to kitchen');
      }

      setKitchenMsg({ ok: true, text: `✓ ${order.orderNumber} sent to kitchen!` });
      setCartItems([]);
      setTimeout(() => setKitchenMsg(null), 3000);
    } catch (err) {
      setKitchenMsg({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  };

  // ── Numpad → mutate selected item ──────────────────────────────
  const handleNumpadInput = useCallback((value, mode) => {
    if (!selectedItemId) return;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;

    if (mode === 'Qty') {
      setCartItems((p) => p.map((i) => i._id === selectedItemId ? { ...i, qty: Math.max(1, Math.floor(num)) } : i));
    } else if (mode === 'Price') {
      setCartItems((p) => p.map((i) => i._id === selectedItemId ? { ...i, price: num } : i));
    } else if (mode === 'Disc.') {
      setManualPct(Math.min(100, Math.max(0, num)));
    }
  }, [selectedItemId, setManualPct]);

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Col 1: Products ── */}
      <div className="flex-1 min-w-0 overflow-hidden border-r border-gray-100">
        <ProductGrid searchQuery={searchQuery} onAddToCart={handleAddToCart} />
      </div>

      {/* ── Col 2: Cart ── */}
      <div className="w-72 xl:w-80 shrink-0 overflow-hidden border-r border-gray-100 flex flex-col">
        {kitchenMsg && (
          <div className={`mx-3 mt-2 px-3 py-2 rounded-lg text-xs font-semibold text-center
            ${kitchenMsg.ok ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {kitchenMsg.text}
          </div>
        )}
        <CartPanel
          cartItems={cartItems}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRemove={handleRemove}
          onSelectItem={setSelectedItemId}
          selectedItemId={selectedItemId}
          subtotal={subtotal}
          taxAmt={taxAmt}
          tax={DEFAULT_TAX}
          couponDiscAmt={couponDiscAmt}
          manualDiscAmt={manualDiscAmt}
          promoDiscAmt={promoDiscAmt}
          totalDiscAmt={totalDiscAmt}
          finalTotal={grandTotal}
          coupon={coupon}
          onApplyCoupon={applyCoupon}
          onRemoveCoupon={removeCoupon}
          couponLoading={couponLoading}
          couponError={couponError}
          couponSuccess={couponSuccess}
          itemPromos={itemPromos}
          orderPromo={orderPromo}
          currentCustomer={currentCustomer}
          onOpenCustomers={() => navigate('customers')}
          onUnlinkCustomer={unlinkCustomer}
          onSendToKitchen={handleSendToKitchen}
          sendingToKitchen={sendingToKitchen}
        />
      </div>

      {/* ── Col 3: Payment ── */}
      <div className="w-64 xl:w-72 shrink-0 overflow-hidden flex flex-col">
        <PaymentPanel
          total={grandTotal}
          onNumpadInput={handleNumpadInput}
          onModeChange={() => {}}
        />
      </div>
    </div>
  );
}
