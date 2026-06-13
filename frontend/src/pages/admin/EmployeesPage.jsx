import { useEffect, useState } from 'react';
import { Plus, Trash2, Archive, KeyRound, X, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_STYLES = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  ACTIVE:   'bg-green-100 text-green-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

// Invite modal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-indigo-500" />
            <h3 className="font-semibold text-gray-800">Invite Employee</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { key: 'name',  label: 'Full Name',    type: 'text',  placeholder: 'e.g. John Doe' },
            { key: 'email', label: 'Email Address', type: 'email', placeholder: 'e.g. john@cafe.com' },
            { key: 'phone', label: 'Phone Number',  type: 'tel',   placeholder: 'e.g. +91 9876543210' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <input type={type} required value={form[key]} onChange={set(key)} placeholder={placeholder}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            </div>
          ))}

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-60">
              {loading ? 'Inviting...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Password reset modal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <KeyRound size={16} className="text-indigo-500" /> Reset Password
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Set new password for <strong>{employee.name}</strong></p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 6 chars)"
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          {error   && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-green-600">{success}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg disabled:opacity-60">
              {loading ? 'Saving...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main page
export default function EmployeesPage() {
  const { authHeader } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [pwEmployee, setPwEmployee] = useState(null);

  useEffect(() => {
    fetch(`${API}/employees`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data) => { setEmployees(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleInvited = (emp) => setEmployees((e) => [emp, ...e]);

  const handleArchive = async (emp) => {
    const res  = await fetch(`${API}/employees/${emp._id}/archive`, {
      method: 'PATCH', headers: authHeader(),
    });
    const data = await res.json();
    setEmployees((e) => e.map((x) => x._id === emp._id ? { ...x, status: data.status } : x));
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this employee?')) return;
    await fetch(`${API}/employees/${id}`, { method: 'DELETE', headers: authHeader() });
    setEmployees((e) => e.filter((x) => x._id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={handleInvited}
          authHeader={authHeader}
        />
      )}
      {pwEmployee && (
        <PasswordModal
          employee={pwEmployee}
          onClose={() => setPwEmployee(null)}
          authHeader={authHeader}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500">{employees.length} accounts</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium">
          <Plus size={15} /> Invite Employee
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400 text-sm">Loading...</p>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No employees yet. Invite one!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Phone', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <tr key={emp._id} className={`hover:bg-gray-50 ${emp.status === 'ARCHIVED' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.email}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[emp.status]}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setPwEmployee(emp)} title="Reset Password"
                        className="p-1.5 text-indigo-400 hover:bg-indigo-50 rounded-lg">
                        <KeyRound size={14} />
                      </button>
                      <button onClick={() => handleArchive(emp)} title={emp.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                        className={`p-1.5 rounded-lg ${emp.status === 'ARCHIVED' ? 'text-green-500 hover:bg-green-50' : 'text-amber-400 hover:bg-amber-50'}`}>
                        <Archive size={14} />
                      </button>
                      <button onClick={() => handleDelete(emp._id)} title="Delete"
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
