import { useState } from 'react';
import { Trash2, ChefHat, User, Tag, Send, ShoppingCart, Percent, Zap, X } from 'lucide-react';
import DiscountModal from './DiscountModal';

export default function CartPanel({
  cartItems, onIncrement, onDecrement, onRemove,
  onSelectItem, selectedItemId,
  subtotal, taxAmt, tax,
  couponDiscAmt, manualDiscAmt, promoDiscAmt,
  totalDiscAmt, finalTotal,
  coupon, onApplyCoupon, onRemoveCoupon,
  couponLoading, couponError, couponSuccess,
  itemPromos, orderPromo,
  currentCustomer, onOpenCustomers, onUnlinkCustomer,
  onSendToKitchen, sendingToKitchen, sentToKitchen,
  onSendBill,
  onNotesChange,
}) {
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  return (
    <div className="flex flex-col h-full" style={{ background: '#FFFFFF', borderRight: '1px solid #F5F5F4' }}>

      {/* ── Header ── */}
      <div className="px-4 py-3 shrink-0 flex items-center justify-between"
        style={{ borderBottom: '1.5px solid #D6D3D1', background: '#F4F4ED' }}>
        <div className="flex items-center gap-2">
          <ShoppingCart size={15} style={{ color: '#9A3412' }} />
          <span className="text-sm font-bold" style={{ color: '#2E1A12', fontFamily: 'Georgia, serif' }}>Current Order</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
          style={{ background: '#2E1A12', color: '#FFF0EB' }}>
          {cartItems.length} items
        </span>
      </div>

      {/* ── Line Items ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: '#D6D3D1' }}>
            <ShoppingCart size={36} className="opacity-40" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs">Tap a product to add it</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {cartItems.map((item) => {
              const isSelected = item._id === selectedItemId;
              const promo      = itemPromos?.get(item._id);
              return (
                <div key={item._id}>
                  <div
                    onClick={() => onSelectItem(item._id)}
                    className="rounded-xl p-2.5 cursor-pointer transition-all"
                    style={{
                      background: isSelected ? '#FFF0EB' : '#F4F4ED',
                      border:     isSelected ? '1.5px solid #9A3412' : '1.5px solid transparent',
                      boxShadow:  isSelected ? '0 2px 8px rgba(154,52,18,0.12)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#EDE8E3'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#F4F4ED'; }}
                  >
                    {/* Name + remove */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.category?.color && (
                          <span className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                            style={{ background: item.category.color }} />
                        )}
                        <span className="text-sm font-semibold truncate" style={{ color: '#2E1A12' }}>{item.name}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onRemove(item._id); }}
                        className="p-0.5 transition-colors shrink-0"
                        style={{ color: '#D6D3D1' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#9A3412'}
                        onMouseLeave={e => e.currentTarget.style.color = '#D6D3D1'}>
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Qty + price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onDecrement(item._id); }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                          style={{ background: '#FFFFFF', border: '1px solid #D6D3D1', color: '#78716C' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EB'; e.currentTarget.style.borderColor = '#9A3412'; e.currentTarget.style.color = '#9A3412'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D6D3D1'; e.currentTarget.style.color = '#78716C'; }}>
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-bold" style={{ color: '#2E1A12' }}>{item.qty}</span>
                        <button onClick={(e) => { e.stopPropagation(); onIncrement(item._id); }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                          style={{ background: '#FFFFFF', border: '1px solid #D6D3D1', color: '#78716C' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EB'; e.currentTarget.style.borderColor = '#9A3412'; e.currentTarget.style.color = '#9A3412'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D6D3D1'; e.currentTarget.style.color = '#78716C'; }}>
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: '#A8A29E' }}>₹{item.price} each</p>
                        <p className="text-sm font-bold" style={{ color: '#2E1A12' }}>₹{(item.price * item.qty).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Special Recommendations / Kitchen Notes Input Box */}
                  <div className="mt-1 px-1">
                    <input
                      type="text"
                      value={item.kitchen_notes || ''}
                      onChange={(e) => onNotesChange(item._id, e.target.value)}
                      placeholder="Special Recommendations / Kitchen Notes"
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-[#D6D3D1] outline-none transition-all duration-150 focus:ring-2 focus:ring-[#9A3412] focus:outline-none placeholder-stone-400 font-medium"
                      style={{ background: '#FAFAF6', color: '#2E1A12' }}
                    />
                  </div>

                  {/* Product-level promo badge */}
                  {promo && (
                    <div className="flex items-center gap-1.5 px-3 py-1 mx-0.5 mb-0.5 rounded-b-xl mt-1"
                      style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                      <Zap size={11} style={{ color: '#92400E' }} className="shrink-0" />
                      <span className="text-[11px] font-medium" style={{ color: '#92400E' }}>{promo.label}</span>
                      <span className="ml-auto text-[11px] font-bold" style={{ color: '#92400E' }}>−₹{promo.discAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Customer badge ── */}
      {currentCustomer && (
        <div className="mx-3 mt-2 flex items-center gap-2 rounded-xl px-3 py-2 shrink-0"
          style={{ background: '#FFF0EB', border: '1px solid #FBBFA3' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: '#9A3412', color: '#FFF0EB' }}>
            {currentCustomer.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: '#9A3412' }}>{currentCustomer.name}</p>
            {currentCustomer.email && <p className="text-[10px] truncate" style={{ color: '#C2694A' }}>{currentCustomer.email}</p>}
          </div>
          <button onClick={onUnlinkCustomer} className="p-0.5 transition-colors"
            style={{ color: '#FBBFA3' }}
            onMouseEnter={e => e.currentTarget.style.color = '#9A3412'}
            onMouseLeave={e => e.currentTarget.style.color = '#FBBFA3'}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Send to Kitchen ── */}
      {cartItems.length > 0 && (
        <div className="px-3 pt-2 shrink-0">
          <button
            onClick={onSendToKitchen}
            disabled={sendingToKitchen || sentToKitchen}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: sentToKitchen ? '#166534' : '#92400E',
              color: '#FFFBEB',
              boxShadow: sentToKitchen ? '0 4px 12px rgba(22,101,52,0.3)' : '0 4px 12px rgba(146,64,14,0.3)'
            }}
            onMouseEnter={e => { if (!sendingToKitchen && !sentToKitchen) e.currentTarget.style.background = '#78350F'; }}
            onMouseLeave={e => e.currentTarget.style.background = sentToKitchen ? '#166534' : '#92400E'}>
            <ChefHat size={15} />
            {sendingToKitchen ? 'Sending…' : sentToKitchen ? '✓ Sent to Kitchen' : 'Send to Kitchen'}
          </button>
        </div>
      )}

      {/* ── Quick Actions ── */}
      {cartItems.length > 0 && (
        <div className="px-3 pt-2 grid grid-cols-3 gap-1.5 shrink-0">
          <button
            onClick={onOpenCustomers}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background:  currentCustomer ? '#FFF0EB' : 'transparent',
              border:      currentCustomer ? '1px solid #FBBFA3' : '1px solid #D6D3D1',
              color:       currentCustomer ? '#9A3412' : '#78716C',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EB'; e.currentTarget.style.borderColor = '#9A3412'; e.currentTarget.style.color = '#9A3412'; }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = currentCustomer ? '#FFF0EB' : 'transparent';
              e.currentTarget.style.borderColor = currentCustomer ? '#FBBFA3' : '#D6D3D1';
              e.currentTarget.style.color       = currentCustomer ? '#9A3412' : '#78716C';
            }}
          >
            <User size={12} />
            {currentCustomer ? currentCustomer.name.split(' ')[0] : 'Customer'}
          </button>

          <button
            onClick={() => setShowDiscountModal(true)}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background:  coupon ? '#F0FDF4' : 'transparent',
              border:      coupon ? '1px solid #BBF7D0' : '1px solid #D6D3D1',
              color:       coupon ? '#166534' : '#78716C',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EB'; e.currentTarget.style.borderColor = '#9A3412'; e.currentTarget.style.color = '#9A3412'; }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = coupon ? '#F0FDF4' : 'transparent';
              e.currentTarget.style.borderColor = coupon ? '#BBF7D0' : '#D6D3D1';
              e.currentTarget.style.color       = coupon ? '#166534' : '#78716C';
            }}
          >
            <Tag size={12} />
            {coupon ? coupon.code : 'Discount'}
          </button>

          <button onClick={onSendBill}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'transparent', border: '1px solid #D6D3D1', color: '#78716C' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EB'; e.currentTarget.style.borderColor = '#9A3412'; e.currentTarget.style.color = '#9A3412'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#D6D3D1'; e.currentTarget.style.color = '#78716C'; }}>
            <Send size={12} /> Bill
          </button>
        </div>
      )}

      {/* ── Order Summary ── */}
      <div className="px-4 py-3 mt-2 shrink-0 space-y-1.5"
        style={{ borderTop: '1.5px solid #D6D3D1', background: '#F4F4ED' }}>
        <div className="flex justify-between text-xs" style={{ color: '#78716C' }}>
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs" style={{ color: '#78716C' }}>
          <span>GST ({tax}%)</span>
          <span>₹{taxAmt.toFixed(2)}</span>
        </div>

        {/* Auto promo — order level */}
        {orderPromo && (
          <div className="flex items-center justify-between text-xs px-2 py-1 rounded-lg"
            style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
            <div className="flex items-center gap-1">
              <Zap size={10} /> <span>{orderPromo.label}</span>
            </div>
            <span className="font-bold">−₹{orderPromo.discAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Coupon discount row */}
        {coupon && couponDiscAmt > 0 && (
          <div className="flex items-center justify-between text-xs px-2 py-1 rounded-lg"
            style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
            <div className="flex items-center gap-1.5">
              <Percent size={10} />
              <span>
                {coupon.code} (
                {coupon.discountType === 'percentage'
                  ? `${coupon.discountValue}%`
                  : `₹${coupon.discountValue}`}
                )
              </span>
            </div>
            <span className="font-bold">−₹{couponDiscAmt.toFixed(2)}</span>
          </div>
        )}

        {/* Manual % discount */}
        {manualDiscAmt > 0 && !coupon && (
          <div className="flex justify-between text-xs" style={{ color: '#166534' }}>
            <span>Discount</span>
            <span className="font-semibold">−₹{manualDiscAmt.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-1.5" style={{ borderTop: '1px solid #D6D3D1' }}>
          <span className="text-sm font-bold" style={{ color: '#2E1A12' }}>Total</span>
          <span className="text-xl font-extrabold" style={{ color: '#9A3412' }}>₹{finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Discount Modal ── */}
      {showDiscountModal && (
        <DiscountModal
          onClose={() => setShowDiscountModal(false)}
          onApply={async (code) => {
            const ok = await onApplyCoupon(code);
            if (ok) setShowDiscountModal(false);
          }}
          onRemove={() => { onRemoveCoupon(); setShowDiscountModal(false); }}
          appliedCoupon={coupon}
          loading={couponLoading}
          error={couponError}
          success={couponSuccess}
        />
      )}
    </div>
  );
}
