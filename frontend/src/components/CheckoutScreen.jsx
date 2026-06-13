import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Banknote, CreditCard, QrCode, CheckCircle } from 'lucide-react';
import { buildUpiLink } from '../../utils/upi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Cash Panel ──────────────────────────────────────────────
function CashPanel({ total, onConfirm }) {
  const [received, setReceived] = useState('');
  const change = received !== '' ? (parseFloat(received) - total).toFixed(2) : null;
  const valid  = received !== '' && parseFloat(received) >= total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Amount Received (₹)</label>
        <input
          type="number" min={total} step="0.01"
          value={received} onChange={(e) => setReceived(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-lg font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="0.00"
        />
      </div>
      {change !== null && (
        <div className={`flex justify-between items-center px-4 py-3 rounded-xl text-sm font-medium
          ${parseFloat(change) < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          <span>Change Due</span>
          <span className="text-lg font-bold">
            ₹{parseFloat(change) < 0 ? '—' : change}
          </span>
        </div>
      )}
      <button
        disabled={!valid}
        onClick={() => onConfirm({ method: 'cash', received: parseFloat(received), change: parseFloat(change) })}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <CheckCircle size={18} /> Confirm Cash Payment
      </button>
    </div>
  );
}

// ── Card Panel ───────────────────────────────────────────────
function CardPanel({ onConfirm }) {
  const [ref, setRef] = useState('');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Transaction Reference Number</label>
        <input
          type="text" value={ref} onChange={(e) => setRef(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="e.g. TXN123456789"
        />
        <p className="text-xs text-gray-400">Enter the reference from the card machine / bank slip.</p>
      </div>
      <button
        disabled={!ref.trim()}
        onClick={() => onConfirm({ method: 'card', reference: ref.trim() })}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <CheckCircle size={18} /> Confirm Card Payment
      </button>
    </div>
  );
}

// ── UPI Panel ────────────────────────────────────────────────
function UpiPanel({ upiId, total, onConfirm }) {
  const upiLink = buildUpiLink({ upiId, amount: total });

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-500">Scan the QR code with any UPI app to pay</p>
      <div className="p-4 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm">
        <QRCodeSVG value={upiLink} size={200} level="H" includeMargin />
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-400">UPI ID</p>
        <p className="text-sm font-semibold text-gray-700 font-mono">{upiId}</p>
      </div>
      <div className="w-full flex justify-between items-center bg-indigo-50 px-4 py-3 rounded-xl">
        <span className="text-sm text-gray-600">Amount</span>
        <span className="text-lg font-bold text-indigo-700">₹{Number(total).toFixed(2)}</span>
      </div>
      <button
        onClick={() => onConfirm({ method: 'upi', upiId })}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
      >
        <CheckCircle size={18} /> Mark as Paid
      </button>
    </div>
  );
}

// ── Main Checkout Screen ─────────────────────────────────────
export default function CheckoutScreen({ total = 0, onPaymentDone }) {
  const [config, setConfig]       = useState(null);
  const [activeMethod, setActiveMethod] = useState(null);
  const [success, setSuccess]     = useState(null);

  useEffect(() => {
    fetch(`${API}/payment-methods`)
      .then((r) => r.json())
      .then((d) => {
        setConfig(d);
        // Auto-select first enabled method
        if (d.cash?.enabled)      setActiveMethod('cash');
        else if (d.card?.enabled) setActiveMethod('card');
        else if (d.upi?.enabled)  setActiveMethod('upi');
      })
      .catch(console.error);
  }, []);

  const handleConfirm = (detail) => {
    setSuccess(detail);
    if (onPaymentDone) onPaymentDone(detail);
  };

  if (!config) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
      Loading payment options...
    </div>
  );

  const enabledMethods = [
    config.cash?.enabled && { key: 'cash', label: 'Cash',        icon: Banknote,    color: 'green' },
    config.card?.enabled && { key: 'card', label: 'Card/Digital', icon: CreditCard,  color: 'blue'  },
    config.upi?.enabled  && { key: 'upi',  label: 'UPI QR',      icon: QrCode,      color: 'indigo' },
  ].filter(Boolean);

  if (enabledMethods.length === 0) return (
    <div className="text-center py-10 text-gray-400 text-sm">
      No payment methods enabled. Contact admin.
    </div>
  );

  if (success) return (
    <div className="flex flex-col items-center gap-3 py-10">
      <CheckCircle size={48} className="text-green-500" />
      <p className="text-lg font-semibold text-gray-800">Payment Confirmed!</p>
      <p className="text-sm text-gray-500 capitalize">Method: {success.method}</p>
      {success.change !== undefined && (
        <p className="text-sm text-gray-500">Change: ₹{success.change.toFixed(2)}</p>
      )}
      {success.reference && (
        <p className="text-sm text-gray-500">Ref: {success.reference}</p>
      )}
    </div>
  );

  const colorMap = {
    green:  { active: 'bg-green-600 text-white',  inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
    blue:   { active: 'bg-blue-600 text-white',   inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
    indigo: { active: 'bg-indigo-600 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5 p-6">
      {/* Order total */}
      <div className="bg-slate-800 text-white rounded-2xl px-5 py-4 flex justify-between items-center">
        <span className="text-sm opacity-70">Order Total</span>
        <span className="text-2xl font-bold">₹{Number(total).toFixed(2)}</span>
      </div>

      {/* Method selector tabs */}
      <div className="flex gap-2">
        {enabledMethods.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setActiveMethod(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${activeMethod === key ? colorMap[color].active : colorMap[color].inactive}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        {activeMethod === 'cash' && <CashPanel total={total} onConfirm={handleConfirm} />}
        {activeMethod === 'card' && <CardPanel onConfirm={handleConfirm} />}
        {activeMethod === 'upi'  && (
          <UpiPanel
            upiId={config.upi.upiId}
            total={total}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}
