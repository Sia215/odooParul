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
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
      style={{ background: enabled ? '#9A3412' : '#D6D3D1' }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default function PaymentMethodsPage({ readOnly = false }) {
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
      iconBg: '#FFF0EB',
      iconColor: '#9A3412',
    },
    {
      key:   'card',
      label: 'Card / Digital',
      desc:  'Accept card and bank transfers. Requires a transaction reference number for auditing.',
      icon:  CreditCard,
      iconBg: '#FFF0EB',
      iconColor: '#9A3412',
    },
    {
      key:   'upi',
      label: 'UPI QR',
      desc:  'Generate a dynamic QR code at checkout embedding your UPI ID and order total.',
      icon:  QrCode,
      iconBg: '#FFF0EB',
      iconColor: '#9A3412',
    },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-black" style={{ color: '#2E1A12', fontFamily: 'Georgia, serif' }}>Payment Methods</h1>
        <p className="text-sm mt-0.5" style={{ color: '#A8A29E' }}>Enable or disable payment options shown at checkout.</p>
      </div>

      <div className="flex flex-col gap-4">
        {methods.map(({ key, label, desc, icon: Icon, iconBg, iconColor }) => (
          <div key={key} className="rounded-2xl p-5 transition-all"
            style={{ background: '#FFFFFF', border: '1.5px solid #D6D3D1', boxShadow: '0 2px 12px rgba(46,26,18,0.06)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: iconBg }}>
                  <Icon size={20} style={{ color: iconColor }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#2E1A12' }}>{label}</p>
                  <p className="text-xs mt-0.5 max-w-sm" style={{ color: '#78716C' }}>{desc}</p>
                </div>
              </div>
              <Toggle
                enabled={config[key]?.enabled}
                onChange={readOnly ? () => {} : (val) => setMethod(key, { enabled: val })}
              />
            </div>

            {key === 'upi' && config.upi.enabled && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F5F5F4' }}>
                <label className="text-xs font-bold uppercase tracking-widest block mb-1.5" style={{ color: '#78716C' }}>
                  Business UPI ID
                </label>
                <input
                  type="text"
                  value={config.upi.upiId}
                  onChange={(e) => !readOnly && setMethod('upi', { upiId: e.target.value })}
                  readOnly={readOnly}
                  placeholder="e.g. cafe@ybl"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  style={{ background: readOnly ? '#F5F5F4' : '#FFFFFF', color: '#2E1A12', border: '1px solid #D6D3D1' }}
                  onFocus={e => { e.target.style.border = '1.5px solid #9A3412'; e.target.style.boxShadow = '0 0 0 3px rgba(154,52,18,0.1)'; }}
                  onBlur={e => { e.target.style.border = '1px solid #D6D3D1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {message && (
        <div className="mt-4 text-sm px-4 py-3 rounded-xl"
          style={{
            background: message.error ? '#FFF0EB' : '#F0FDF4',
            color:      message.error ? '#9A3412'  : '#166534',
            border:     `1px solid ${message.error ? '#FBBFA3' : '#BBF7D0'}`,
          }}>
          {message.text}
        </div>
      )}

      {!readOnly && (
        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-150 disabled:opacity-60 active:scale-95"
          style={{ background: '#9A3412', color: '#FFF0EB', boxShadow: '0 4px 16px rgba(154,52,18,0.25)' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#7C2D12'; }}
          onMouseLeave={e => e.currentTarget.style.background = '#9A3412'}
        >
          <Save size={15} />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      )}
    </div>
  );
}
