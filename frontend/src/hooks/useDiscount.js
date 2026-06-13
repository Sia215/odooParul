import { useState, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function useDiscount(subtotal, tax) {
  const [coupon,         setCoupon]         = useState(null);   // { code, discountType, discountValue, message }
  const [manualPct,      setManualPct]      = useState(0);      // numpad Disc. mode sets this
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');

  // Validate coupon code against backend
  // Returns true on success so caller can close the modal
  const applyCoupon = useCallback(async (code) => {
    if (!code.trim()) return false;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`${API}/coupons/validate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCoupon(data);
      setManualPct(0);
      setSuccess(data.message);
      return true;   // ← signal success to caller
    } catch (err) {
      setError(err.message);
      setCoupon(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setCoupon(null); setError(''); setSuccess('');
  }, []);

  // ── Computed totals ──────────────────────────────────────────────
  const taxAmt = subtotal * (tax / 100);

  // Coupon discount takes precedence over manual pct
  let couponDiscAmt = 0;
  if (coupon) {
    couponDiscAmt = coupon.discountType === 'percentage'
      ? (subtotal + taxAmt) * (coupon.discountValue / 100)
      : Math.min(coupon.discountValue, subtotal + taxAmt);
  }

  const manualDiscAmt = coupon ? 0 : (subtotal + taxAmt) * (manualPct / 100);
  const totalDiscAmt  = couponDiscAmt + manualDiscAmt;
  const finalTotal    = Math.max(0, subtotal + taxAmt - totalDiscAmt);

  return {
    coupon, applyCoupon, removeCoupon,
    manualPct, setManualPct,
    loading, error, success,
    setError, setSuccess,
    // Computed
    taxAmt, couponDiscAmt, manualDiscAmt, totalDiscAmt, finalTotal,
  };
}
