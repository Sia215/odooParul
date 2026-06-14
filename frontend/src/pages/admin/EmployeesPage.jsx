import { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, Archive, KeyRound, X, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_STYLES = {
  ADMIN:   { background: '#FFF0EB', color: '#9A3412', border: '1px solid #FBBFA3' },
  CASHIER: { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' },
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const KDS_BADGE = {
  to_cook:   { label: '🍳 In Kitchen',  bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  preparing: { label: '👨‍🍳 Preparing', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  completed: { label: '✅ Ready',       bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
};

const STATUS_STYLES = {
  PENDING:  { background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' },
  ACTIVE:   { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' },
  ARCHIVED: { background: '#F5F5F4', color: '#78716C', border: '1px solid #D6D3D1' },
};

function Modal({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(46,26,18,0.25)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#F4F4ED', border: '1.5px solid #D6D3D1', boxShadow: '0 20px 60px rgba(46,26,18,0.15)' }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon: Icon, title, onClose }) {
  return (
    <div className="flex justify-between items-center mb-5">
      <div className="flex items-center gap-2">
        <Icon size={18} style={{ color: '#9A3412' }} />
        <h3 className="font-bold" style={{ color: '#2E1A12', fontFamily: 'Georgia, serif' }}>{title}</h3>
      </div>
      <button onClick={onClose} style={{ color: '#A8A29E' }}
        onMouseEnter={e => e.currentTarget.style.color = '#9A3412'}
        onMouseLeave={e => e.currentTarget.style.color = '#A8A29E'}>
        <X size={18} />
      </button>
    </div>
  );
}

function FieldInput({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-widest" style={{ color: '#78716C' }}>{label}</label>
      <input type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
        className="rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
        style={{ background: '#FFFFFF', color: '#2E1A12', border: '1px solid #D6D3D1' }}
        onFocus={e => { e.target.style.border = '1.5px solid #9A3412'; e.target.style.boxShadow = '0 0 0 3px rgba(154,52,18,0.1)'; }}
        onBlur={e => { e.target.style.border = '1px solid #D6D3D1'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

function ModalButtons({ onClose, loading, submitLabel, loadingLabel }) {
  return (
    <div className="flex gap-2 pt-1">
      <button type="button" onClick={onClose}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
        style={{ border: '1.5px solid #D6D3D1', color: '#78716C' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(214,211,209,0.4)'; e.currentTarget.style.color = '#2E1A12'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716C'; }}>
        Cancel
      </button>
      <button type="submit" disabled={loading}
        className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-150 disabled:opacity-60"
        style={{ background: '#9A3412', color: '#FFF0EB', boxShadow: '0 4px 16px rgba(154,52,18,0.25)' }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#7C2D12'; }}
        onMouseLeave={e => e.currentTarget.style.background = '#9A3412'}>
        {loading ? loadingLabel : submitLabel}
      </button>
    </div>
  );
}

function InviteModal({ onClose, onInvited, authHeader }) {
  const [form, setForm]   = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res  = await fetch(`${API}/employees/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onInvited(data.employee);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal>
      <ModalHeader icon={UserPlus} title="Invite Employee" onClose={onClose} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldInput label="Full Name"     value={form.name}  onChange={set('name')}  placeholder="e.g. John Doe"         required />
        <FieldInput label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="e.g. john@cafe.com" required />
        <FieldInput label="Phone Number"  type="tel"  value={form.phone} onChange={set('phone')} placeholder="e.g. +91 9876543210" />
        {error && (
          <p className="text-xs px-3 py-2 rounded-xl" style={{ background: '#FFF0EB', color: '#9A3412', border: '1px solid #FBBFA3' }}>{error}</p>
        )}
        <ModalButtons onClose={onClose} loading={loading} submitLabel="Send Invite" loadingLabel="Inviting..." />
      </form>
    </Modal>
  );
}

function PasswordModal({ employee, onClose, authHeader }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (password.length < 6) return setError('Minimum 6 characters.');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/employees/${employee._id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(data.message);
      setTimeout(onClose, 1200);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal>
      <ModalHeader icon={KeyRound} title="Reset Password" onClose={onClose} />
      <p className="text-sm mb-4" style={{ color: '#78716C' }}>Set new password for <strong style={{ color: '#2E1A12' }}>{employee.name}</strong></p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <FieldInput label="New Password" type="password" value={password}
          onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required />
        {error   && <p className="text-xs" style={{ color: '#9A3412' }}>{error}</p>}
        {success && <p className="text-xs" style={{ color: '#166534' }}>{success}</p>}
        <ModalButtons onClose={onClose} loading={loading} submitLabel="Update" loadingLabel="Saving..." />
      </form>
    </Modal>
  );
}

export default function EmployeesPage({ readOnly = false }) {
  const { authHeader } = useAuth();
  const [employees,    setEmployees]   = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [fetchError,   setFetchError]  = useState('');
  const [showInvite,   setShowInvite]  = useState(false);
  const [pwEmployee,   setPwEmployee]  = useState(null);
  const [orderStatus,  setOrderStatus] = useState({});
  const wsRef = useRef(null);

  const fetchEmployees = async () => {
    setLoading(true); setFetchError('');
    try {
      const endpoint = `${API}/employees`;
      const res  = await fetch(endpoint, { headers: { 'Content-Type': 'application/json', ...authHeader() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err.message);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStatus = async () => {
    try {
      const res  = await fetch(`${API}/kds/orders`);
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const map = {};
      data.forEach(o => { if (o.customerName) map[o.customerName.toLowerCase()] = o.stage; });
      setOrderStatus(map);
    } catch (_) {}
  };

  useEffect(() => {
    fetchOrderStatus();
    const wsBase = API.replace('http', 'ws').replace('/api', '');
    let ws; let retryTimer;
    const connect = () => {
      ws = new WebSocket(wsBase);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          const { event, data } = JSON.parse(e.data);
          if (['order:update','order:stage','order:new'].includes(event)) {
            if (data.customerName)
              setOrderStatus(prev => ({ ...prev, [data.customerName.toLowerCase()]: data.stage }));
            fetchOrderStatus();
          }
        } catch (_) {}
      };
      ws.onclose = () => { retryTimer = setTimeout(connect, 3000); };
      ws.onerror = () => {};
    };
    connect();
    return () => { clearTimeout(retryTimer); ws?.close(); };
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [readOnly]);

  const handleInvited = async (emp) => {
    await fetchEmployees();
  };

  const handleArchive = async (emp) => {
    const res  = await fetch(`${API}/employees/${emp._id}/archive`, { method: 'PATCH', headers: authHeader() });
    if (res.ok) {
      await fetchEmployees();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this employee?')) return;
    const res = await fetch(`${API}/employees/${id}`, { method: 'DELETE', headers: authHeader() });
    if (res.ok) {
      await fetchEmployees();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={handleInvited} authHeader={authHeader} />}
      {pwEmployee && <PasswordModal employee={pwEmployee} onClose={() => setPwEmployee(null)} authHeader={authHeader} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#2E1A12', fontFamily: 'Georgia, serif' }}>Employees</h1>
          <p className="text-sm mt-0.5" style={{ color: '#A8A29E' }}>{employees.length} {readOnly ? 'users' : 'accounts'}</p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl transition-all duration-150 active:scale-95"
            style={{ background: '#9A3412', color: '#FFF0EB', boxShadow: '0 4px 16px rgba(154,52,18,0.25)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#7C2D12'}
            onMouseLeave={e => e.currentTarget.style.background = '#9A3412'}>
            <Plus size={15} /> Invite Employee
          </button>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1.5px solid #D6D3D1', boxShadow: '0 2px 12px rgba(46,26,18,0.06)' }}>
        {loading ? (
          <p className="text-center py-12 text-sm" style={{ color: '#A8A29E' }}>Loading...</p>
        ) : employees.length === 0 ? (
          <div className="text-center py-12">
            <Users size={36} className="mx-auto mb-2 opacity-30" style={{ color: '#9A3412' }} />
            <p className="text-sm" style={{ color: '#A8A29E' }}>
              {fetchError ? `Error: ${fetchError}` : 'No employees yet. Invite one!'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: '#F4F4ED', borderBottom: '1.5px solid #D6D3D1' }}>
              <tr>
                {[
                  'Name', 'Email', 'Phone', 'Role', 'Status',
                  ...(!readOnly ? ['Order Status', 'Actions'] : []),
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#A8A29E' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp._id}
                  className="transition-colors"
                  style={{
                    borderTop: i > 0 ? '1px solid #F5F5F4' : 'none',
                    opacity: emp.status === 'ARCHIVED' ? 0.55 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAF6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#2E1A12' }}>{emp.name}</td>
                  <td className="px-4 py-3" style={{ color: '#78716C' }}>{emp.email}</td>
                  <td className="px-4 py-3" style={{ color: '#78716C' }}>{emp.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={ROLE_STYLES[emp.role] || ROLE_STYLES.CASHIER}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={STATUS_STYLES[emp.status]}>
                      {emp.status}
                    </span>
                  </td>
                  {!readOnly && (
                    <>
                      <td className="px-4 py-3">
                        {orderStatus[emp.name.toLowerCase()] ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                            style={{
                              background: KDS_BADGE[orderStatus[emp.name.toLowerCase()]]?.bg,
                              color:      KDS_BADGE[orderStatus[emp.name.toLowerCase()]]?.color,
                              border:     `1px solid ${KDS_BADGE[orderStatus[emp.name.toLowerCase()]]?.border}`,
                            }}>
                            {KDS_BADGE[orderStatus[emp.name.toLowerCase()]]?.label}
                          </span>
                        ) : <span style={{ color: '#D6D3D1' }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setPwEmployee(emp)} title="Reset Password"
                            className="p-1.5 rounded-lg transition-all duration-150"
                            style={{ color: '#9A3412' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FFF0EB'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <KeyRound size={14} />
                          </button>
                          <button onClick={() => handleArchive(emp)} title={emp.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                            className="p-1.5 rounded-lg transition-all duration-150"
                            style={{ color: emp.status === 'ARCHIVED' ? '#166534' : '#92400E' }}
                            onMouseEnter={e => e.currentTarget.style.background = emp.status === 'ARCHIVED' ? '#F0FDF4' : '#FFFBEB'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Archive size={14} />
                          </button>
                          <button onClick={() => handleDelete(emp._id)} title="Delete"
                            className="p-1.5 rounded-lg transition-all duration-150"
                            style={{ color: '#991B1B' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
