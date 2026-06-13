import { useState, useCallback, useEffect } from 'react';
import ProductGrid  from './pos/ProductGrid';
import CartPanel    from './pos/CartPanel';
import PaymentPanel from './pos/PaymentPanel';
import { usePOS }   from '../context/POSContext';
import useDiscount  from '../hooks/useDiscount';
import usePromotions from '../hooks/usePromotions';
import { CheckCircle, X, Mail, Printer } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DEFAULT_TAX = 5;
const INR = (v) => `₹${Number(v || 0).toFixed(2)}`;

// ── Bill Modal ─────────────────────────────────────────────────────
function BillModal({ order, customerEmail, onClose, onSendMail, sending, sent }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900">☕ Odoo Cafe</p>
            <p className="text-xs text-gray-400">{order.orderNumber} · {new Date(order.sessionDate || Date.now()).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Items */}
        <div className="px-5 py-4 flex flex-col gap-2 max-h-60 overflow-y-auto">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {item.category?.color && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.category.color }} />
                )}
                <span className="text-gray-700 truncate">{item.name}</span>
                <span className="text-gray-400 shrink-0">×{item.qty}</span>
              </div>
              <span className="font-semibold text-gray-800 shrink-0 ml-2">{INR(item.price * item.qty)}</span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span><span>{INR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Tax</span><span>{INR(order.taxAmt)}</span>
          </div>
          {order.discountAmt > 0 && (
            <div className="flex justify-between text-xs text-emerald-600">
              <span>Discount</span><span>−{INR(order.discountAmt)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1.5 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-800">Total</span>
            <span className="text-xl font-extrabold text-indigo-600">{INR(order.total)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 pt-1">
            <span>Customer: {order.customer || 'Walk-in'}</span>
            <span>{(order.paymentMethod || 'cash').toUpperCase()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex flex-col gap-2">
          {customerEmail && order._id ? (
            <button
              onClick={onSendMail}
              disabled={sending || sent}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                ${sent ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60'}`}
            >
              <Mail size={15} />
              {sending ? 'Sending…' : sent ? `✓ Sent to ${customerEmail}` : `Send to ${customerEmail}`}
            </button>
          ) : (
            <p className="text-xs text-center text-gray-400">
              {!order._id ? 'Complete payment first to send bill by email' : 'No customer email — link a customer to send bill'}
            </p>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Printer size={15} /> Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderView() {
  const {
    searchQuery, editingOrder, setEditingOrder,
    currentCustomer, unlinkCustomer, navigate,
    currentTable, markTableActive, markTableInactive,
  } = usePOS();

  const [cartItems,        setCartItems]      = useState([]);
  const [selectedItemId,   setSelectedItemId] = useState(null);
  const [sendingToKitchen, setSending]        = useState(false);
  const [kitchenMsg,       setKitchenMsg]     = useState(null);
  const [editingOrderId,   setEditingOrderId] = useState(null);
  const [paidOrder,        setPaidOrder]      = useState(null);
  const [showBill,         setShowBill]       = useState(false);
  const [sendingBill,      setSendingBill]    = useState(false);
  const [billSent,         setBillSent]       = useState(false);
  const [customerEmail,    setCustomerEmail]  = useState(null);
  const [successMsg,       setSuccessMsg]     = useState(null);

  useEffect(() => {
    if (!editingOrder) return;
    setEditingOrderId(editingOrder._id);
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

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const {
    coupon, applyCoupon, removeCoupon,
    manualPct, setManualPct,
    loading: couponLoading, error: couponError, success: couponSuccess,
    taxAmt, couponDiscAmt, manualDiscAmt, totalDiscAmt, finalTotal,
  } = useDiscount(subtotal, DEFAULT_TAX);

  const { itemPromos, orderPromo, promoDiscAmt } = usePromotions(cartItems, subtotal);
  const grandTotal = Math.max(0, finalTotal - promoDiscAmt);

  const getHeaders = () => {
    const token = JSON.parse(localStorage.getItem('pos_session') || '{}')?.token;
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const occupyTable = async (tableId, orderId) => {
    try {
      await fetch(`${API}/tables/${tableId}/occupy`, {
        method: 'PATCH', headers: getHeaders(),
        body: JSON.stringify({ occupied: true, orderId }),
      });
      markTableActive(tableId);
    } catch (_) {}
  };

  const freeTable = async (tableId) => {
    try {
      await fetch(`${API}/tables/${tableId}/occupy`, {
        method: 'PATCH', headers: getHeaders(),
        body: JSON.stringify({ occupied: false }),
      });
      markTableInactive(tableId);
    } catch (_) {}
  };

  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) return;
    setSending(true);
    setKitchenMsg(null);
    try {
      const orderPayload = {
        items: cartItems.map(i => ({
          productId: i._id, name: i.name, price: i.price, qty: i.qty, category: i.category || {},
        })),
        customer:    currentCustomer?.name || 'Walk-in',
        table:       currentTable ? { number: String(currentTable.number), floor: currentTable.floor } : {},
        subtotal, taxAmt,
        discountAmt: totalDiscAmt + promoDiscAmt,
        total:       grandTotal,
        status:      'Draft',
      };

      const orderRes = await fetch(`${API}/orders`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(orderPayload),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.message || 'Failed to save order');

      if (currentTable?._id) await occupyTable(currentTable._id, order._id);

      await fetch(`${API}/kds/orders/${order._id}/send`, {
        method: 'POST', headers: getHeaders(),
      });

      setKitchenMsg({ ok: true, text: `✓ ${order.orderNumber} sent to kitchen!` });
      setTimeout(() => setKitchenMsg(null), 3000);
    } catch (err) {
      setKitchenMsg({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleCharge = async (paymentMethod) => {
    if (cartItems.length === 0) return;
    try {
      const orderPayload = {
        items: cartItems.map(i => ({
          productId: i._id, name: i.name, price: i.price, qty: i.qty, category: i.category || {},
        })),
        customer:      currentCustomer?.name || 'Walk-in',
        customerEmail: currentCustomer?.email || '',
        table:         currentTable ? { number: String(currentTable.number), floor: currentTable.floor } : {},
        subtotal, taxAmt,
        discountAmt:   totalDiscAmt + promoDiscAmt,
        total:         grandTotal,
        paymentMethod: paymentMethod || 'cash',
        status:        'Paid',
      };

      let savedOrder;
      if (editingOrderId) {
        const r = await fetch(`${API}/orders/${editingOrderId}`, {
          method: 'PATCH', headers: getHeaders(), body: JSON.stringify(orderPayload),
        });
        savedOrder = await r.json();
        if (!r.ok) throw new Error(savedOrder.message || 'Failed to update order');
        setEditingOrderId(null);
      } else {
        const r = await fetch(`${API}/orders`, {
          method: 'POST', headers: getHeaders(), body: JSON.stringify(orderPayload),
        });
        savedOrder = await r.json();
        if (!r.ok) throw new Error(savedOrder.message || 'Failed to create order');
      }

      if (currentTable?._id) await freeTable(currentTable._id);

      // Save state before clearing cart
      const email = currentCustomer?.email || null;
      setCustomerEmail(email);
      setPaidOrder(savedOrder);
      setBillSent(false);

      // Clear cart
      setCartItems([]);
      setSelectedItemId(null);
      removeCoupon();

      // Show bill modal automatically
      setShowBill(true);

      // Also show small toast
      setSuccessMsg(`✓ ${savedOrder.orderNumber} paid!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Charge failed:', err);
    }
  };

  const handleSendBill = async () => {
    if (!paidOrder?._id || paidOrder.orderNumber === 'Preview' || !customerEmail) return;
    setSendingBill(true);
    try {
      const token = JSON.parse(localStorage.getItem('pos_session') || '{}')?.token;
      const res = await fetch(`${API}/orders/${paidOrder._id}/send-bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customerEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setBillSent(true);
      } else {
        alert('Failed to send email: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setSendingBill(false);
    }
  };

  // Send button in CartPanel — open bill of current (unsaved) order
  const handleSendBillFromCart = () => {
    if (cartItems.length === 0) return;
    const previewOrder = {
      orderNumber: 'Preview',
      items: cartItems,
      subtotal, taxAmt,
      discountAmt: totalDiscAmt + promoDiscAmt,
      total: grandTotal,
      customer: currentCustomer?.name || 'Walk-in',
      paymentMethod: 'pending',
      sessionDate: new Date(),
    };
    setPaidOrder(previewOrder);
    setCustomerEmail(currentCustomer?.email || null);
    setBillSent(false);
    setShowBill(true);
  };

  const handleNumpadInput = useCallback((value, mode) => {
    if (!selectedItemId) return;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    if (mode === 'Qty')   setCartItems((p) => p.map((i) => i._id === selectedItemId ? { ...i, qty: Math.max(1, Math.floor(num)) } : i));
    if (mode === 'Price') setCartItems((p) => p.map((i) => i._id === selectedItemId ? { ...i, price: num } : i));
    if (mode === 'Disc.') setManualPct(Math.min(100, Math.max(0, num)));
  }, [selectedItemId, setManualPct]);

  return (
    <div className="relative flex h-full overflow-hidden">

      {/* ── Success Toast ── */}
      {successMsg && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2">
          <CheckCircle size={15} /> {successMsg}
        </div>
      )}

      {/* ── Bill Modal ── */}
      {showBill && (
        <BillModal
          order={paidOrder}
          customerEmail={customerEmail}
          onClose={() => setShowBill(false)}
          onSendMail={handleSendBill}
          sending={sendingBill}
          sent={billSent}
        />
      )}

      {/* Col 1: Products */}
      <div className="flex-1 min-w-0 overflow-hidden border-r border-gray-100">
        <ProductGrid searchQuery={searchQuery} onAddToCart={handleAddToCart} />
      </div>

      {/* Col 2: Cart */}
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
          onSendBill={handleSendBillFromCart}
        />
      </div>

      {/* Col 3: Payment */}
      <div className="w-64 xl:w-72 shrink-0 overflow-hidden flex flex-col">
        <PaymentPanel
          total={grandTotal}
          onNumpadInput={handleNumpadInput}
          onModeChange={() => {}}
          onCharge={handleCharge}
          currentTable={currentTable}
          onFreeTable={freeTable}
        />
      </div>
    </div>
  );
}
