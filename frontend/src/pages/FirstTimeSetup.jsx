import { useState } from 'react';
import { Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function FirstTimeSetup({ userId, name, onComplete }) {
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm)  return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/first-time-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
      setTimeout(() => onComplete(data), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center flex flex-col items-center gap-3">
        <CheckCircle size={52} className="text-green-500" />
        <p className="text-lg font-semibold text-gray-800">Account activated!</p>
        <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
            <KeyRound size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome, {name}!</h1>
          <p className="text-sm text-gray-500 mt-1">Set your password to activate your account.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Min. 6 characters" required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <input
                  type={showCf ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Re-enter password" required
                />
                <button type="button" onClick={() => setShowCf(!showCf)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password match indicator */}
            {confirm && (
              <p className={`text-xs flex items-center gap-1 ${password === confirm ? 'text-green-600' : 'text-red-500'}`}>
                <CheckCircle size={12} />
                {password === confirm ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}

            {error && (
              <p className="text-sm px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors">
              {loading ? 'Activating...' : 'Set Password & Activate'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
