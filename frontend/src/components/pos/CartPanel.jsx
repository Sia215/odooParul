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
}) {
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  return (
    <div className="flex flex-col h-full bg-white border-x border-gray-100">

      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={15} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">Current Order</span>
        </div>
        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
          {cartItems.length} items
        </span>
      </div>

      {/* ── Line Items ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300">
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
                    className={`rounded-xl p-2.5 cursor-pointer transition-all border
                      ${isSelected
                        ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                        : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}
                  >
                    {/* Name + remove */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.category?.color && (
                          <span className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                            style={{ background: item.category.color }} />
                        )}
                        <span className="text-sm font-medium text-gray-800 truncate">{item.name}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onRemove(item._id); }}
                        className="p-0.5 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Qty + price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onDecrement(item._id); }}
                          className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors text-sm font-bold flex items-center justify-center">
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-800">{item.qty}</span>
                        <button onClick={(e) => { e.stopPropagation(); onIncrement(item._id); }}
                          className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors text-sm font-bold flex items-center justify-center">
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">₹{item.price} each</p>
                        <p className="text-sm font-bold text-gray-800">₹{(item.price * item.qty).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Product-level promo badge ── */}
                  {promo && (
                    <div className="flex items-center gap-1.5 px-3 py-1 mx-0.5 mb-0.5 bg-amber-50 border border-amber-200 rounded-b-xl -mt-1">
                      <Zap size={11} className="text-amber-500 shrink-0" />
                      <span className="text-[11px] text-amber-700 font-medium">{promo.label}</span>
                      <span className="ml-auto text-[11px] font-bold text-amber-600">−₹{promo.discAmount.toFixed(2)}</span>
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
        <div className="mx-3 mt-2 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 shrink-0">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {currentCustomer.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-indigo-700 truncate">{currentCustomer.name}</p>
            {currentCustomer.email && <p className="text-[10px] text-indigo-400 truncate">{currentCustomer.email}</p>}
          </div>
          <button onClick={onUnlinkCustomer} className="p-0.5 text-indigo-300 hover:text-red-400 transition-colors">
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Send to Kitchen ── */}
      {cartItems.length > 0 && (
        <div className="px-3 pt-2 shrink-0">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-amber-200 active:scale-95">
            <ChefHat size={15} /> Send to Kitchen
          </button>
        </div>
      )}

      {/* ── Quick Actions ── */}
      {cartItems.length > 0 && (
        <div className="px-3 pt-2 grid grid-cols-3 gap-1.5 shrink-0">
          <button
            onClick={onOpenCustomers}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors
              ${currentCustomer
                ? 'bg-indigo-50 border-indigo-300 text-indigo-600 hover:bg-indigo-100'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <User size={12} />
            {currentCustomer ? currentCustomer.name.split(' ')[0] : 'Customer'}
          </button>
          <button
            onClick={() => setShowDiscountModal(true)}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors
              ${coupon
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100'
                : 'border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300'}`}
          >
            <Tag size={12} />
            {coupon ? coupon.code : 'Discount'}
          </button>
          <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-colors">
            <Send size={12} /> Send
          </button>
        </div>
      )}

      {/* ── Order Summary ── */}
      <div className="px-4 py-3 mt-2 border-t border-gray-100 bg-gray-50 shrink-0 space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>GST ({tax}%)</span>
          <span>₹{taxAmt.toFixed(2)}</span>
        </div>

        {/* Auto promo — order level */}
        {orderPromo && (
          <div className="flex items-center justify-between text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
            <div className="flex items-center gap-1">
              <Zap size={10} /> <span>{orderPromo.label}</span>
            </div>
            <span className="font-semibold">−₹{orderPromo.discAmount.toFixed(2)}</span>
          </div>
        )}

        {/* Coupon discount row — between Tax and Total */}
        {coupon && couponDiscAmt > 0 && (
          <div className="flex items-center justify-between text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
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

        {/* Manual % discount (numpad) */}
        {manualDiscAmt > 0 && !coupon && (
          <div className="flex justify-between text-xs text-emerald-600">
            <span>Discount</span>
            <span className="font-semibold">−₹{manualDiscAmt.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-1.5 border-t border-gray-200">
          <span className="text-sm font-bold text-gray-800">Total</span>
          <span className="text-xl font-extrabold text-indigo-600">₹{finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Discount Modal ── */}
      {showDiscountModal && (
        <DiscountModal
          onClose={() => setShowDiscountModal(false)}
          onApply={async (code) => {
            const ok = await onApplyCoupon(code);
            if (ok) setShowDiscountModal(false);  // close on success
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
