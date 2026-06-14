import { X, CheckCircle } from 'lucide-react';
import { usePOS } from '../context/POSContext';

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function SessionSummaryModal() {
  const { closingSummary, dismissClosingSummary } = usePOS();
  if (!closingSummary) return null;
  const { openedAt, closedAt, totalSales, orders, openingCash } = closingSummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-500" />
            <h2 className="text-base font-semibold text-gray-900">Session Closed</h2>
          </div>
          <button onClick={dismissClosingSummary} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-2 text-sm border rounded-xl divide-y divide-gray-100 overflow-hidden mb-5">
          <Row label="Opened"         value={fmt(openedAt)} />
          <Row label="Closed"         value={fmt(closedAt)} />
          <Row label="Opening Cash"   value={`₹${openingCash.toFixed(2)}`} />
          <Row label="Total Orders"   value={orders} />
          <Row label="Total Sales"    value={`₹${totalSales.toFixed(2)}`} highlight />
        </div>

        <button
          onClick={dismissClosingSummary}
          className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className={`flex justify-between px-4 py-2.5 ${highlight ? 'bg-green-50' : 'bg-white'}`}>
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-green-700' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}
