import { useEffect, useState, useMemo } from 'react';

const API = import.meta.env.VITE_API_URL;

// Returns { itemPromos: Map<productId, promoInfo>, orderPromo: promoInfo|null }
export default function usePromotions(cartItems, subtotal) {
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    fetch(`${API}/promotions`)
      .then((r) => r.json())
      .then((data) => setPromotions(Array.isArray(data) ? data.filter((p) => p.active) : []))
      .catch(() => {});
  }, []);

  const { itemPromos, orderPromo } = useMemo(() => {
    const itemPromos = new Map();
    let orderPromo = null;

    for (const promo of promotions) {
      if (promo.triggerType === 'product' && promo.productId) {
        const cartItem = cartItems.find((i) => i._id === promo.productId._id || i._id === promo.productId);
        if (cartItem && cartItem.qty >= promo.minQty) {
          const lineTotal  = cartItem.price * cartItem.qty;
          const discAmount = promo.discountType === 'percentage'
            ? lineTotal * (promo.discountValue / 100)
            : Math.min(promo.discountValue, lineTotal);
          itemPromos.set(cartItem._id, {
            label: promo.discountType === 'percentage'
              ? `${promo.discountValue}% off on ₹${lineTotal.toFixed(0)}`
              : `₹${promo.discountValue} off`,
            discAmount,
            promo,
          });
        }
      }

      if (promo.triggerType === 'order' && subtotal >= promo.minOrderAmount) {
        if (!orderPromo || promo.discountValue > orderPromo.promo.discountValue) {
          const discAmount = promo.discountType === 'percentage'
            ? subtotal * (promo.discountValue / 100)
            : Math.min(promo.discountValue, subtotal);
          orderPromo = {
            label: promo.discountType === 'percentage'
              ? `${promo.discountValue}% off (order)`
              : `₹${promo.discountValue} off (order)`,
            discAmount,
            promo,
          };
        }
      }
    }

    return { itemPromos, orderPromo };
  }, [promotions, cartItems, subtotal]);

  // Total auto-promo savings (product-level + order-level)
  const promoDiscAmt = useMemo(() => {
    let total = 0;
    itemPromos.forEach((v) => { total += v.discAmount; });
    if (orderPromo) total += orderPromo.discAmount;
    return total;
  }, [itemPromos, orderPromo]);

  return { itemPromos, orderPromo, promoDiscAmt };
}
