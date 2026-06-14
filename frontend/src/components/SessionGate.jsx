import { useState } from 'react';
import { Play, Clock, DollarSign } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import SessionSummaryModal from './SessionSummaryModal';

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function SessionGate() {
  const { lastSessionInfo, openSession, closingSummary } = usePOS();
  const [openingCash, setOpeningCash] = useState('');

  const handleOpen = () => {
    openSession(parseFloat(openingCash) || 0);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
          style={{ background: '#FFF0EB' }}>
          <Play size={24} style={{ color: '#9A3412' }} />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">POS Terminal</h2>
        <p className="text-sm text-gray-500 mb-6">Open a session to start taking orders.</p>

        {lastSessionInfo ? (
          <div className="rounded-xl border divide-y divide-gray-100 overflow-hidden mb-6 text-left text-sm">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50">
              <Clock size={13} className="text-gray-400 shrink-0" />
              <span className="text-gray-500">Last closed</span>
              <span className="ml-auto font-medium text-gray-700">{fmt(lastSessionInfo.closedAt)}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50">
              <DollarSign size={13} className="text-gray-400 shrink-0" />
              <span className="text-gray-500">Last closing sales</span>
              <span className="ml-auto font-semibold" style={{ color: '#9A3412' }}>
                ₹{parseFloat(lastSessionInfo.totalSales || 0).toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mb-6">No previous session found.</p>
        )}

        <div className="mb-4 text-left">
          <label className="text-xs font-medium text-gray-500 block mb-1">Opening Cash (₹)</label>
          <input
            type="number"
            min="0"
            value={openingCash}
            onChange={e => setOpeningCash(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all"
            style={{ borderColor: '#D6D3D1' }}
            onFocus={e => e.target.style.borderColor = '#9A3412'}
            onBlur={e => e.target.style.borderColor = '#D6D3D1'}
          />
        </div>

        <button
          onClick={handleOpen}
          className="w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-colors"
          style={{ background: '#9A3412' }}
          onMouseEnter={e => e.currentTarget.style.background = '#7C2D12'}
          onMouseLeave={e => e.currentTarget.style.background = '#9A3412'}
        >
          Open Session
        </button>
      </div>

      {closingSummary && <SessionSummaryModal />}
    </div>
  );
}
