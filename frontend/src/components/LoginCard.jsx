import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

export default function LoginCard({ onSwitchToSignUp, onLogin }) {
  const [step, setStep]         = useState('email'); // 'email' | 'password'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [message, setMessage]   = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: step === 'password' ? password : undefined }),
      });
      const data = await res.json();

      // PENDING employee — no password needed, go to first-time setup
      if (data.firstTimeSetup) {
        if (onLogin) onLogin(data);
        return;
      }

      // Active account on step 1 — backend asks for password, show the field
      if (!res.ok && step === 'email' && data.message === 'Password is required.') {
        setStep('password');
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(data.message);

      setMessage({ text: `Welcome back, ${data.name}!`, error: false });
      if (onLogin) setTimeout(() => onLogin(data), 800);
    } catch (err) {
      setMessage({ text: err.message, error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
            <LogIn size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email — always shown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setStep('email'); setMessage(null); }}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password — only shown for active accounts on step 2 */}
            {step === 'password' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400"
                    placeholder="Enter your password"
                    autoFocus
                    required
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className={`text-sm px-3 py-2 rounded-lg ${message.error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 cursor-pointer mt-1 flex items-center justify-center gap-2">
              {loading ? 'Please wait...' : step === 'email' ? <><span>Continue</span><ArrowRight size={15} /></> : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignUp} className="text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer">
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
