import { useEffect, useRef, useState } from 'react';
import { X, Tag, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

export default function DiscountModal({ onClose, onApply, onRemove, appliedCoupon, loading, error, success }) {
  const [code, setCode] = useState('');
  const inputRef = useRef(null);

  // Auto-focus on open
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onApply(code);
  };

  // Clear error when user types
  const handleChange = (e) => {
    setCode(e.target.value.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(6px)', background: 'rgba(15,23,42,0.55)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Tag size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Apply Discount</h3>
              <p className="text-xs text-gray-400">Enter a coupon code</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── Applied coupon badge ── */}
        {appliedCoupon && (
          <div className="mx-5 mt-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700 tracking-wide">{appliedCoupon.code}</p>
                <p className="text-[11px] text-emerald-600">
                  {appliedCoupon.discountType === 'percentage'
                    ? `${appliedCoupon.discountValue}% off applied`
                    : `₹${appliedCoupon.discountValue} off applied`}
                </p>
              </div>
            </div>
            <button onClick={onRemove}
              className="p-1.5 text-emerald-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Coupon Code
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                value={code}
                onChange={handleChange}
                placeholder="e.g. CAFE20"
                disabled={loading}
                className={`w-full border-2 rounded-xl px-4 py-3 text-sm font-mono font-semibold tracking-widest uppercase outline-none transition-all placeholder:font-normal placeholder:tracking-normal placeholder:normal-case
                  ${error   ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-400'
                  : success ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50'}`}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 size={16} className="text-indigo-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            {/* Success state */}
            {success && !appliedCoupon && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 size={13} />
                {success}
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 disabled:shadow-none"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? 'Validating...' : 'Apply Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
