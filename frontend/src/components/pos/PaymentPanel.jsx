import { useEffect, useState } from 'react';
import { Banknote, CreditCard, Smartphone, Delete, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiLink } from '../../utils/upi';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NUMPAD_MODES = ['Qty', 'Price', 'Disc.'];
const NUMPAD_KEYS  = ['7','8','9','4','5','6','1','2','3','+/-','0','⌫'];

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
    payConfig.cash?.enabled && { id: 'cash', label: 'Cash', icon: Banknote },
    payConfig.card?.enabled && { id: 'card', label: 'Card', icon: CreditCard },
    payConfig.upi?.enabled  && { id: 'upi',  label: 'UPI',  icon: Smartphone, upiId: payConfig.upi.upiId },
  ].filter(Boolean) : [];

  return (
    <div className="flex flex-col h-full" style={{ background: '#FFFFFF' }}>

      {/* ── Payment Methods ── */}
      <div className="px-3 pt-3 pb-2 shrink-0" style={{ borderBottom: '1.5px solid #D6D3D1' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#A8A29E' }}>
          Payment Method
        </p>
        <div className="flex flex-col gap-2">
          {methods.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: '#A8A29E' }}>No payment methods configured</p>
          ) : methods.map((m) => {
            const Icon     = m.icon;
            const isActive = activeMethod === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMethod(m.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{
                  background:  isActive ? '#2E1A12' : '#FFFFFF',
                  border:      isActive ? '2px solid #2E1A12' : '1.5px solid #D6D3D1',
                  color:       isActive ? '#FFF0EB' : '#78716C',
                  boxShadow:   isActive ? '0 4px 16px rgba(46,26,18,0.3)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#F4F4ED'; e.currentTarget.style.borderColor = '#2E1A12'; e.currentTarget.style.color = '#2E1A12'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#D6D3D1'; e.currentTarget.style.color = '#78716C'; }}}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{m.label}</span>
                {isActive && m.id === 'upi' && m.upiId && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {m.upiId}
                  </span>
                )}
                {isActive && <CheckCircle size={14} style={{ opacity: 0.85 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── UPI QR Code ── */}
      {activeMethod === 'upi' && payConfig?.upi?.upiId && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-3 py-2">
          <p className="text-xs font-semibold" style={{ color: '#9A3412' }}>Scan to Pay ₹{total.toFixed(2)}</p>
          <div className="p-2 rounded-xl" style={{ background: '#FFFFFF', border: '2px solid #D6D3D1', boxShadow: '0 2px 12px rgba(46,26,18,0.08)' }}>
            <QRCodeSVG
              value={buildUpiLink({ upiId: payConfig.upi.upiId, amount: total })}
              size={160}
              level="H"
              includeMargin
            />
          </div>
          <p className="text-xs font-mono font-bold" style={{ color: '#9A3412' }}>{payConfig.upi.upiId}</p>
          <p className="text-xs" style={{ color: '#A8A29E' }}>After customer pays, tap Charge below</p>
        </div>
      )}

      {/* ── Numpad (hidden when UPI) ── */}
      {activeMethod !== 'upi' && (
        <>
          {/* Amount Display */}
          <div className="px-3 py-2.5 shrink-0" style={{ background: '#F4F4ED', borderBottom: '1px solid #D6D3D1' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: '#A8A29E' }}>Amount Due</span>
              <span className="text-xs" style={{ color: '#A8A29E' }}>Entered</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold" style={{ color: '#2E1A12' }}>₹{total.toFixed(2)}</span>
              <span className="text-xl font-bold transition-colors" style={{ color: amountEntered ? '#9A3412' : '#D6D3D1' }}>
                {amountEntered || '—'}
              </span>
            </div>
            {amountEntered && parseFloat(amountEntered) >= total && (
              <p className="text-xs font-semibold mt-1" style={{ color: '#166534' }}>
                Change: ₹{(parseFloat(amountEntered) - total).toFixed(2)}
              </p>
            )}
          </div>

          {/* Numpad Mode Tabs */}
          <div className="px-3 pt-2.5 shrink-0">
            <div className="flex gap-1 rounded-xl p-1" style={{ background: '#F4F4ED' }}>
              {NUMPAD_MODES.map((mode) => (
                <button key={mode} onClick={() => handleModeChange(mode)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: numpadMode === mode ? '#FFFFFF' : 'transparent',
                    color:      numpadMode === mode ? '#9A3412'  : '#A8A29E',
                    boxShadow:  numpadMode === mode ? '0 1px 4px rgba(46,26,18,0.1)' : 'none',
                  }}>
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
                  className="flex items-center justify-center rounded-xl text-base font-bold transition-all active:scale-95"
                  style={
                    key === '⌫'
                      ? { background: '#FFF0EB', color: '#9A3412', border: '1px solid #FBBFA3' }
                      : key === '+/-'
                      ? { background: '#F4F4ED', color: '#78716C', border: '1px solid #D6D3D1' }
                      : { background: '#F4F4ED', color: '#2E1A12', border: '1px solid #D6D3D1' }
                  }
                  onMouseEnter={e => {
                    if (key === '⌫') { e.currentTarget.style.background = '#FBBFA3'; }
                    else { e.currentTarget.style.background = '#EDE8E3'; e.currentTarget.style.borderColor = '#9A3412'; e.currentTarget.style.color = '#9A3412'; }
                  }}
                  onMouseLeave={e => {
                    if (key === '⌫') { e.currentTarget.style.background = '#FFF0EB'; }
                    else if (key === '+/-') { e.currentTarget.style.background = '#F4F4ED'; e.currentTarget.style.borderColor = '#D6D3D1'; e.currentTarget.style.color = '#78716C'; }
                    else { e.currentTarget.style.background = '#F4F4ED'; e.currentTarget.style.borderColor = '#D6D3D1'; e.currentTarget.style.color = '#2E1A12'; }
                  }}
                >
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
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
          style={{
            background: (!activeMethod || total === 0) ? '#D6D3D1' : '#9A3412',
            color:      (!activeMethod || total === 0) ? '#A8A29E' : '#FFF0EB',
            boxShadow:  (!activeMethod || total === 0) ? 'none'    : '0 4px 16px rgba(154,52,18,0.3)',
          }}
          onMouseEnter={e => { if (activeMethod && total > 0) e.currentTarget.style.background = '#7C2D12'; }}
          onMouseLeave={e => { if (activeMethod && total > 0) e.currentTarget.style.background = '#9A3412'; }}
        >
          {activeMethod ? `Charge ₹${total.toFixed(2)} · ${activeMethod.toUpperCase()}` : 'Select Payment Method'}
        </button>
      </div>
    </div>
  );
}
