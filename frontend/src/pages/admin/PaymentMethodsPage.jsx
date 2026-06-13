import { useEffect, useState } from 'react';
import { Banknote, CreditCard, QrCode, Save } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DEFAULT = {
  cash: { enabled: false },
  card: { enabled: false },
  upi:  { enabled: false, upiId: '' },
};

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
        ${enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default function PaymentMethodsPage() {
  const [config, setConfig]   = useState(DEFAULT);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/payment-methods`)
      .then((r) => r.json())
      .then((d) => setConfig({ cash: d.cash, card: d.card, upi: d.upi }))
      .catch(console.error);
  }, []);

  const setMethod = (method, patch) =>
    setConfig((c) => ({ ...c, [method]: { ...c[method], ...patch } }));

  const handleSave = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/payment-methods`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage({ text: 'Payment settings saved successfully.', error: false });
    } catch (err) {
      setMessage({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    {
      key:   'cash',
      label: 'Cash',
      desc:  'Accept cash payments. Cashier enters amount received and system computes change.',
      icon:  Banknote,
      color: 'text-green-600',
      bg:    'bg-green-50',
    },
    {
      key:   'card',
      label: 'Card / Digital',
      desc:  'Accept card and bank transfers. Requires a transaction reference number for auditing.',
      icon:  CreditCard,
      color: 'text-blue-600',
      bg:    'bg-blue-50',
    },
    {
      key:   'upi',
      label: 'UPI QR',
      desc:  'Generate a dynamic QR code at checkout embedding your UPI ID and order total.',
      icon:  QrCode,
      color: 'text-indigo-600',
      bg:    'bg-indigo-50',
    },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Payment Methods</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enable or disable payment options shown at checkout.</p>
      </div>

      <div className="flex flex-col gap-4">
        {methods.map(({ key, label, desc, icon: Icon, color, bg }) => (
          <div key={key} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`${bg} p-2.5 rounded-xl`}>
                  <Icon size={20} className={color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-sm">{desc}</p>
                </div>
              </div>
              <Toggle
                enabled={config[key]?.enabled}
                onChange={(val) => setMethod(key, { enabled: val })}
              />
            </div>

            {/* UPI ID input — only shown when UPI card is expanded and enabled */}
            {key === 'upi' && config.upi.enabled && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-700 block mb-1.5">
                  Business UPI ID
                </label>
                <input
                  type="text"
                  value={config.upi.upiId}
                  onChange={(e) => setMethod('upi', { upiId: e.target.value })}
                  placeholder="e.g. cafe@ybl"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This ID will be embedded in the QR code shown at checkout.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {message && (
        <div className={`mt-4 text-sm px-4 py-3 rounded-xl border
          ${message.error
            ? 'bg-red-50 text-red-600 border-red-200'
            : 'bg-green-50 text-green-700 border-green-200'}`}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
      >
        <Save size={15} />
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
