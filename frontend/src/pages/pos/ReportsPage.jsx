import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X, ChevronDown, FileText, FileSpreadsheet,
  TrendingUp, ShoppingBag, DollarSign, Calendar, Mail,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const INR = (v) => `₹${Number(v || 0).toFixed(2)}`;
const PCT_COLOR = (v) => v === null ? 'text-gray-400' : Number(v) >= 0 ? 'text-emerald-500' : 'text-red-500';
const PCT_LABEL = (v) => v === null ? '—' : `${Number(v) >= 0 ? '+' : ''}${v}% Since Last period`;

const PERIOD_OPTIONS = ['Today', 'This Week', 'This Month', 'Custom Range'];
const PIE_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

function getPeriodDates(period, custom) {
  const now = new Date();
  const today = (d) => { d.setHours(0,0,0,0); return d; };
  const eod   = (d) => { d.setHours(23,59,59,999); return d; };
  if (period === 'Today')      return { from: today(new Date()), to: eod(new Date()) };
  if (period === 'This Week')  { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return { from: today(d), to: eod(new Date()) }; }
  if (period === 'This Month') { const d = new Date(); d.setDate(1); return { from: today(d), to: eod(new Date()) }; }
  if (period === 'Custom Range' && custom.from && custom.to)
    return { from: new Date(custom.from), to: new Date(custom.to + 'T23:59:59') };
  return { from: today(new Date()), to: eod(new Date()) };
}

// ── Area Chart ────────────────────────────────────────────────────
function AreaChart({ data }) {
  const [tip, setTip] = useState(null);
  if (!data || data.length === 0)
    return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>;

  const W = 420, H = 140, PAD = { t:10, r:10, b:30, l:50 };
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;
  const vals = data.map(d => d.value);
  const maxV = Math.max(...vals, 1);
  const xs = data.map((_, i) => PAD.l + (i / Math.max(data.length - 1, 1)) * iW);
  const ys = vals.map(v => PAD.t + iH - (v / maxV) * iH);
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `${line} L${xs[xs.length-1].toFixed(1)},${(PAD.t+iH).toFixed(1)} L${PAD.l},${(PAD.t+iH).toFixed(1)} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({ v: (maxV * r).toFixed(0), y: PAD.t + iH - r * iH }));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map(t => (
          <g key={t.v}>
            <line x1={PAD.l} y1={t.y} x2={W-PAD.r} y2={t.y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={PAD.l - 4} y={t.y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">₹{t.v}</text>
          </g>
        ))}
        <path d={area} fill="url(#ag)" />
        <path d={line} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r="4" fill="#6366f1" stroke="white" strokeWidth="2"
            className="cursor-pointer"
            onMouseEnter={() => setTip({ x, y: ys[i], v: vals[i], label: data[i].date })}
            onMouseLeave={() => setTip(null)} />
        ))}
        {data.map((d, i) => (
          <text key={i} x={xs[i]} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {d.date?.slice(5)}
          </text>
        ))}
      </svg>
      {tip && (
        <div className="absolute pointer-events-none bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg"
          style={{ left: tip.x - 20, top: tip.y - 36 }}>
          {INR(tip.v)}
        </div>
      )}
    </div>
  );
}

// ── Pie Chart ─────────────────────────────────────────────────────
function PieChart({ data }) {
  if (!data || data.length === 0)
    return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>;
  const total = data.reduce((s, d) => s + d.revenue, 0);
  if (total === 0) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>;

  let angle = -Math.PI / 2;
  const slices = data.slice(0, 8).map((d, i) => {
    const pct = d.revenue / total;
    const a1 = angle, a2 = angle + pct * 2 * Math.PI; angle = a2;
    const cx = 70, cy = 70, r = 60;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    return {
      path: `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`,
      color: PIE_COLORS[i % PIE_COLORS.length], name: d.name, pct: (pct * 100).toFixed(1),
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />)}
      </svg>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-600 truncate flex-1">{s.name}</span>
            <span className="text-xs font-bold text-gray-800 shrink-0">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Export helpers ────────────────────────────────────────────────
function exportCSV(data, metrics, period, empName) {
  const rows = [
    ['Report', `${period} — ${empName}`], [],
    ['Summary'],
    ['Total Orders', metrics.totalOrders], ['Revenue', metrics.revenue], ['Avg Order', metrics.avgOrder], [],
    ['Top Orders'], ['Order','Date','Customer','Employee','Table','Total'],
    ...( data.topOrders || []).map(o => [o.orderNumber, new Date(o.date).toLocaleDateString(), o.customer, o.employee, o.table, o.total]),
    [], ['Top Products'], ['Product','Qty','Revenue'],
    ...(data.topProducts || []).map(p => [p.name, p.qty, p.revenue]),
    [], ['Top Categories'], ['Category','Revenue'],
    ...(data.topCategories || []).map(c => [c.name, c.revenue]),
  ];
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `report_${new Date().toISOString().slice(0,10)}_${empName.replace(/\s/g,'_')}.csv`;
  a.click();
}

// ── Main Page ─────────────────────────────────────────────────────
export default function ReportsPage() {
  const { session, authHeader } = useAuth();

  const [period,     setPeriod]     = useState('Today');
  const [custom,     setCustom]     = useState({ from: '', to: '' });
  const [empId, setEmpId] = useState('all');
  const [productF,   setProductF]   = useState('all');
  const [showPeriod, setShowPeriod] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [sending,    setSending]    = useState(false);
  const [emailMsg,   setEmailMsg]   = useState(null); // 'success' | 'error' | null

  const exportRef = useRef(null);
  const periodRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getPeriodDates(period, custom);
      const params = new URLSearchParams({
        from: from.toISOString(), to: to.toISOString(),
        ...(empId !== 'all' ? { employeeId: empId } : {}),
        ...(productF !== 'all' ? { productName: productF } : {}),
      });
      const res  = await fetch(`${API}/reports?${params}`, { headers: { ...authHeader() } });
      const json = await res.json();
      setData(json);
    } catch (_) {}
    finally { setLoading(false); }
  }, [period, custom, empId, productF]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const h = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
      if (periodRef.current && !periodRef.current.contains(e.target)) setShowPeriod(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const empName     = session?.name || 'Employee';
  const m           = data?.metrics || {};
  const { from, to } = getPeriodDates(period, custom);

  const handleSendEmail = async () => {
    setSending(true); setEmailMsg(null);
    try {
      const res = await fetch(`${API}/reports/send-email`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period,
          from: from.toISOString(),
          to:   to.toISOString(),
          employeeId:   empId,
          employeeName: empId === 'all' ? 'All' : empName,
          productName:  productF,
        }),
      });
      setEmailMsg(res.ok ? 'success' : 'error');
    } catch { setEmailMsg('error'); }
    finally { setSending(false); setTimeout(() => setEmailMsg(null), 3500); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── ZONE 2: FILTER BAR ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-wrap">

        {/* Period */}
        <div ref={periodRef} className="relative">
          <button onClick={() => setShowPeriod(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
            <Calendar size={12} />
            {period === 'Custom Range' && custom.from ? `${custom.from} → ${custom.to}` : period}
            <ChevronDown size={11} />
          </button>
          {showPeriod && (
            <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-gray-200 rounded-xl shadow-xl w-56 p-2">
              {PERIOD_OPTIONS.map(p => (
                <button key={p} onClick={() => { setPeriod(p); if (p !== 'Custom Range') setShowPeriod(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${period === p ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
              {period === 'Custom Range' && (
                <div className="flex flex-col gap-2 px-2 pt-2 border-t border-gray-100 mt-1">
                  <input type="date" value={custom.from} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-400" />
                  <input type="date" value={custom.to} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-400" />
                  <button onClick={() => setShowPeriod(false)}
                    className="bg-indigo-600 text-white text-xs rounded-lg py-1.5 font-medium hover:bg-indigo-700">Apply</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
          <span className="text-gray-500">User:</span>
          <select value={empId} onChange={e => setEmpId(e.target.value)}
            className="bg-transparent text-gray-700 font-medium outline-none text-xs">
            <option value="all">All</option>
            <option value={session?.userId}>{empName}</option>
            {data?.employees?.filter(e => String(e.id) !== String(session?.userId)).map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <button onClick={() => setEmpId('all')} className="text-gray-400 hover:text-gray-600"><X size={11} /></button>
        </div>

        {/* Product filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
          <span className="text-gray-500">Product:</span>
          <select value={productF} onChange={e => setProductF(e.target.value)}
            className="bg-transparent text-gray-700 font-medium outline-none text-xs max-w-[120px]">
            <option value="all">All</option>
            {data?.allProducts?.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => setProductF('all')} className="text-gray-400 hover:text-gray-600"><X size={11} /></button>
        </div>

        {/* Send Report Email */}
        <button onClick={handleSendEmail} disabled={sending || loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60
            ${emailMsg === 'success' ? 'bg-emerald-600 text-white' : emailMsg === 'error' ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          <Mail size={12} />
          {sending ? 'Sending…' : emailMsg === 'success' ? '✓ Report Sent!' : emailMsg === 'error' ? '✗ Failed' : 'Send Report'}
        </button>

        {/* Export */}
        <div ref={exportRef} className="ml-auto relative">
          <button onClick={() => setShowExport(s => !s)}
            className="w-7 h-7 flex items-center justify-center bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-bold">
            *
          </button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl w-36 overflow-hidden z-30">
              <button onClick={() => { window.print(); setShowExport(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <FileText size={14} className="text-red-500" /> PDF
              </button>
              <button onClick={() => { exportCSV(data, m, period, empName); setShowExport(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <FileSpreadsheet size={14} className="text-green-500" /> XLS
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading report...</div>
        )}

        {!loading && (
          <>
            {/* ── ZONE 3: METRIC CARDS ── */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: ShoppingBag, label: 'Total Orders',  value: m.totalOrders ?? 0, fmt: v => v,  change: m.ordChange, color: 'indigo'  },
                { icon: DollarSign,  label: 'Revenue',       value: m.revenue ?? 0,     fmt: INR,     change: m.revChange, color: 'emerald' },
                { icon: TrendingUp,  label: 'Average Order', value: m.avgOrder ?? 0,    fmt: INR,     change: null,        color: 'amber'   },
              ].map(card => {
                const Icon = card.icon;
                const colorMap = {
                  indigo:  { bg: 'bg-indigo-50',  icon: 'text-indigo-600',  border: 'border-indigo-100'  },
                  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
                  amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   border: 'border-amber-100'   },
                };
                const c = colorMap[card.color];
                return (
                  <div key={card.label} className={`bg-white rounded-2xl border ${c.border} p-5 flex flex-col gap-3 shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 font-medium">{card.label}</span>
                      <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
                        <Icon size={18} className={c.icon} />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-gray-900">{card.fmt(card.value)}</div>
                    <div className={`text-xs font-medium ${PCT_COLOR(card.change)}`}>{PCT_LABEL(card.change)}</div>
                  </div>
                );
              })}
            </div>

            {/* ── ZONE 4: CHARTS ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-800 mb-4">Sales</p>
                <AreaChart data={data?.salesTrend} />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-800 mb-4">Top Selling Category</p>
                <PieChart data={data?.topCategories} />
              </div>
            </div>

            {/* ── ZONE 5: TOP ORDERS TABLE ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Top Orders</p>
                <p className="text-xs text-gray-400 mt-0.5">Highest value orders for the selected period</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Order','Date','Customer','Employee','Table','Total'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {(data?.topOrders || []).length === 0 ? (
                      <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400 text-sm">No orders</td></tr>
                    ) : data.topOrders.map((o, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-indigo-600">{o.orderNumber}</td>
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{new Date(o.date).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-gray-700">{o.customer}</td>
                        <td className="px-5 py-3 text-gray-700">{o.employee}</td>
                        <td className="px-5 py-3 text-gray-500">{o.table}</td>
                        <td className="px-5 py-3 font-bold text-gray-900">{INR(o.total)}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 5 - (data?.topOrders?.length || 0)) }).map((_, i) => (
                      <tr key={`sk-${i}`} className="border-b border-gray-50">
                        {Array(6).fill(0).map((_, j) => (
                          <td key={j} className="px-5 py-3"><div className="h-3 bg-gray-100 rounded w-16 animate-pulse" /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── ZONE 6: BOTTOM TWO TABLES ── */}
            <div className="grid grid-cols-2 gap-4">
              {/* Top Products */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">Top Product</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Product','Qty','Revenue'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {(data?.topProducts || []).length === 0
                      ? <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-400 text-xs">No data</td></tr>
                      : data.topProducts.map((p, i) => (
                        <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                          <td className="px-4 py-2.5 text-gray-600">{p.qty}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900">{INR(p.revenue)}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>

              {/* Top Categories */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">Top Category</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Category','Revenue'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {(data?.topCategories || []).length === 0
                      ? <tr><td colSpan="2" className="px-4 py-6 text-center text-gray-400 text-xs">No data</td></tr>
                      : data.topCategories.map((c, i) => (
                        <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-4 py-2.5 font-medium text-gray-800">{c.name}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900">{INR(c.revenue)}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
