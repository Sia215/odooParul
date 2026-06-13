import { useEffect, useState } from 'react';
import { Banknote, CreditCard, Smartphone, Delete, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiLink } from '../../utils/upi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NUMPAD_MODES = ['Qty', 'Price', 'Disc.'];

const NUMPAD_KEYS = [
  '7', '8', '9',
  '4', '5', '6',
  '1', '2', '3',
  '+/-', '0', '⌫',
];

export default function PaymentPanel({ total, onNumpadInput, onModeChange, onCharge, currentTable, onFreeTable }) {
  const [payConfig,     setPayConfig]     = useState(null);
  const [activeMethod,  setActiveMethod]  = useState(null);
  const [numpadMode,    setNumpadMode]    = useState('Qty');
  const [amountEntered, setAmountEntered] = useState('');

  useEffect(() => {
    fetch(`${API}/payment-methods`)
      .then((r) => r.json())
      .then((data) => {
        setPayConfig(data);
        // Default to first enabled method
        if (data.cash?.enabled)      setActiveMethod('cash');
        else if (data.card?.enabled) setActiveMethod('card');
        else if (data.upi?.enabled)  setActiveMethod('upi');
      })
      .catch(() => {});
  }, []);

  const handleNumpad = (key) => {
    if (key === '⌫') {
      const next = amountEntered.slice(0, -1);
      setAmountEntered(next);
      onNumpadInput?.(next, numpadMode);
      return;
    }
    if (key === '+/-') {
      const next = amountEntered.startsWith('-') ? amountEntered.slice(1) : '-' + amountEntered;
      setAmountEntered(next);
      onNumpadInput?.(next, numpadMode);
      return;
    }
    // Prevent multiple decimals
    if (key === '.' && amountEntered.includes('.')) return;
    const next = amountEntered + key;
    setAmountEntered(next);
    onNumpadInput?.(next, numpadMode);
  };

  const handleModeChange = (mode) => {
    setNumpadMode(mode);
    setAmountEntered('');
    onModeChange?.(mode);
  };

  const methods = payConfig ? [
    payConfig.cash?.enabled && { id: 'cash', label: 'Cash',  icon: Banknote,    color: 'emerald' },
    payConfig.card?.enabled && { id: 'card', label: 'Card',  icon: CreditCard,  color: 'blue' },
    payConfig.upi?.enabled  && { id: 'upi',  label: 'UPI',   icon: Smartphone,  color: 'purple', upiId: payConfig.upi.upiId },
  ].filter(Boolean) : [];

  const colorMap = {
    emerald: { active: 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200', hover: 'hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700' },
    blue:    { active: 'bg-blue-600 border-blue-600 text-white shadow-blue-200',          hover: 'hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700' },
    purple:  { active: 'bg-violet-600 border-violet-600 text-white shadow-violet-200',    hover: 'hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700' },
  };

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Payment Methods ── */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 shrink-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment Method</p>
        <div className="flex flex-col gap-2">
          {methods.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No payment methods configured</p>
          ) : methods.map((m) => {
            const Icon    = m.icon;
            const isActive = activeMethod === m.id;
            const cls      = colorMap[m.color];
            return (
              <button
                key={m.id}
                onClick={() => setActiveMethod(m.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                  ${isActive ? `${cls.active} shadow-md` : `border-gray-200 text-gray-600 ${cls.hover}`}`}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{m.label}</span>
                {isActive && m.id === 'upi' && m.upiId && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md bg-white/20`}>
                    {m.upiId}
                  </span>
                )}
                {isActive && <CheckCircle size={14} className="opacity-80" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── UPI QR Code ── */}
      {activeMethod === 'upi' && payConfig?.upi?.upiId && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3 py-2">
          <p className="text-xs text-violet-600 font-medium">Scan to Pay ₹{total.toFixed(2)}</p>
          <div className="bg-white p-2 rounded-xl border-2 border-violet-200 shadow-sm">
            <QRCodeSVG
              value={buildUpiLink({ upiId: payConfig.upi.upiId, amount: total })}
              size={160}
              level="H"
              includeMargin
            />
          </div>
          <p className="text-xs font-mono text-violet-700 font-semibold">{payConfig.upi.upiId}</p>
          <p className="text-xs text-gray-400">After customer pays, tap Charge below</p>
        </div>
      )}

      {/* ── Numpad (hidden when UPI) ── */}
      {activeMethod !== 'upi' && (
        <>
          {/* Amount Display */}
          <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Amount Due</span>
              <span className="text-xs text-gray-400">Entered</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-gray-800">₹{total.toFixed(2)}</span>
              <span className={`text-xl font-bold transition-colors ${amountEntered ? 'text-indigo-600' : 'text-gray-300'}`}>
                {amountEntered || '—'}
              </span>
            </div>
            {amountEntered && parseFloat(amountEntered) >= total && (
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Change: ₹{(parseFloat(amountEntered) - total).toFixed(2)}
              </p>
            )}
          </div>

          {/* Numpad Mode Tabs */}
          <div className="px-3 pt-2.5 shrink-0">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {NUMPAD_MODES.map((mode) => (
                <button key={mode} onClick={() => handleModeChange(mode)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${numpadMode === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Numpad Grid */}
          <div className="flex-1 px-3 pb-3 pt-2">
            <div className="grid grid-cols-3 gap-1.5 h-full">
              {NUMPAD_KEYS.map((key) => (
                <button key={key} onClick={() => handleNumpad(key)}
                  className={`flex items-center justify-center rounded-xl text-base font-bold transition-all active:scale-95
                    ${key === '⌫' ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100'
                    : key === '+/-' ? 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'}`}>
                  {key === '⌫' ? <Delete size={16} /> : key}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Charge Button ── */}
      <div className="px-3 pb-3 shrink-0">
        <button
          disabled={!activeMethod || total === 0}
          onClick={() => onCharge?.(activeMethod)}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 disabled:shadow-none active:scale-95"
        >
          {activeMethod ? `Charge ₹${total.toFixed(2)} · ${activeMethod.toUpperCase()}` : 'Select Payment Method'}
        </button>
      </div>
    </div>
  );
}
