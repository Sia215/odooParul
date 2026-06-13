const Coupon             = require('../models/Coupon');
const AutomatedPromotion = require('../models/AutomatedPromotion');

/**
 * cartItems: [{ productId, name, price, quantity }]
 * appliedCouponCode: string | null
 * taxRate: number (percentage, e.g. 5 for 5%)
 */
async function calculateOrderTotal(cartItems, appliedCouponCode = null, taxRate = 0) {
  // 1. Subtotal
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // 2. Evaluate all active automated promotions — pick best (highest discount)
  const activePromos = await AutomatedPromotion.find({ active: true });
  let autoPromo = null;

  for (const promo of activePromos) {
    let triggered = false;

    if (promo.triggerType === 'product') {
      const item = cartItems.find(
        (i) => i.productId && i.productId.toString() === promo.productId.toString()
      );
      triggered = !!(item && item.quantity >= promo.minQty);
    } else if (promo.triggerType === 'order') {
      triggered = subtotal >= promo.minOrderAmount;
    }

    if (triggered) {
      const amt = promo.discountType === 'percentage'
        ? parseFloat(((subtotal * promo.discountValue) / 100).toFixed(2))
        : Math.min(parseFloat(promo.discountValue.toFixed(2)), subtotal);

      if (!autoPromo || amt > autoPromo.discountAmount) {
        autoPromo = {
          name: promo.name,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          discountAmount: amt,
        };
      }
    }
  }

  // 3. Validate coupon — applied on top of auto-discounted amount
  let couponResult = null;
  if (appliedCouponCode) {
    const coupon = await Coupon.findOne({ code: appliedCouponCode.toUpperCase(), active: true });
    if (coupon) {
      const notExpired  = !coupon.expiresAt || new Date() <= new Date(coupon.expiresAt);
      const withinLimit = coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit;
      if (notExpired && withinLimit) {
        const base = Math.max(0, subtotal - (autoPromo?.discountAmount || 0));
        const amt  = coupon.discountType === 'percentage'
          ? parseFloat(((base * coupon.discountValue) / 100).toFixed(2))
          : Math.min(parseFloat(coupon.discountValue.toFixed(2)), base);
        couponResult = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: amt,
        };
      }
    }
  }

  // 4. Compute final total
  const totalDiscount  = parseFloat(((autoPromo?.discountAmount || 0) + (couponResult?.discountAmount || 0)).toFixed(2));
  const discountedBase = Math.max(0, subtotal - totalDiscount);
  const taxAmount      = parseFloat(((discountedBase * taxRate) / 100).toFixed(2));
  const finalTotal     = parseFloat((discountedBase + taxAmount).toFixed(2));

  const breakdown = [
    { label: 'Subtotal', amount: parseFloat(subtotal.toFixed(2)), type: 'base' },
    ...(autoPromo    ? [{ label: `Promo: ${autoPromo.name}`,    amount: -autoPromo.discountAmount,    type: 'promo'  }] : []),
    ...(couponResult ? [{ label: `Coupon: ${couponResult.code}`, amount: -couponResult.discountAmount, type: 'coupon' }] : []),
    ...(taxAmount > 0 ? [{ label: 'Tax',   amount: taxAmount, type: 'tax' }] : []),
    { label: 'Total', amount: finalTotal, type: 'total' },
  ];

  return {
    subtotal:      parseFloat(subtotal.toFixed(2)),
    autoPromo,
    coupon:        couponResult,
    totalDiscount,
    taxAmount,
    finalTotal,
    breakdown,
  };
}

module.exports = { calculateOrderTotal };
