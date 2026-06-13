import { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function LeafBottomLeft() {
  return (
    <svg width="260" height="220" viewBox="0 0 260 220" fill="none"
      className="absolute bottom-0 left-0 pointer-events-none select-none opacity-[0.13]">
      <path d="M-20 220 C20 180, 60 160, 40 100 C20 40, 80 10, 120 40 C80 60, 60 100, 100 140 C120 160, 80 200, -20 220Z" fill="#9A3412" />
      <path d="M0 220 C30 190, 50 170, 80 150 C110 130, 90 90, 60 70" stroke="#9A3412" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M-10 180 C20 195, 60 185, 90 160 C120 135, 140 100, 110 70 C90 100, 70 130, 40 150 C10 170, -10 180, -10 180Z" fill="#2E1A12" />
    </svg>
  );
}
function LeafBottomRight() {
  return (
    <svg width="260" height="220" viewBox="0 0 260 220" fill="none"
      className="absolute bottom-0 right-0 pointer-events-none select-none opacity-[0.13]"
      style={{ transform: 'scaleX(-1)' }}>
      <path d="M-20 220 C20 180, 60 160, 40 100 C20 40, 80 10, 120 40 C80 60, 60 100, 100 140 C120 160, 80 200, -20 220Z" fill="#9A3412" />
      <path d="M0 220 C30 190, 50 170, 80 150 C110 130, 90 90, 60 70" stroke="#9A3412" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M-10 180 C20 195, 60 185, 90 160 C120 135, 140 100, 110 70 C90 100, 70 130, 40 150 C10 170, -10 180, -10 180Z" fill="#2E1A12" />
    </svg>
  );
}

function BrandLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M10 18h28l-3 18H13L10 18z" fill="#9A3412" />
      <rect x="9" y="14" width="30" height="5" rx="2.5" fill="#7C2D12" />
      <path d="M18 10 Q19 7 18 4" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24 10 Q25 7 24 4" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M30 10 Q31 7 30 4" stroke="#9A3412" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M38 20 Q46 20 46 28 Q46 36 38 36" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SetupInput({ id, label, type, value, onChange, placeholder, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-widest" style={{ color: '#78716C' }}>{label}</label>
      <div className="relative transition-all duration-200" style={{ transform: focused ? 'scale(1.025)' : 'scale(1)' }}>
        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
          style={{ color: focused ? '#9A3412' : '#A8A29E' }} />
        <input id={id} type={type} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder} required
          className="w-full rounded-xl px-6 py-4 text-sm outline-none transition-all duration-200 placeholder:text-stone-400"
          style={{
            paddingLeft: '2.75rem', paddingRight: rightSlot ? '3rem' : '1.5rem',
            background: '#FFFFFF', color: '#2E1A12',
            border: focused ? '1.5px solid #9A3412' : '1px solid #D6D3D1',
            boxShadow: focused ? '0 0 0 3px rgba(154,52,18,0.12), 0 4px 12px rgba(154,52,18,0.08)' : '0 1px 2px rgba(46,26,18,0.04)',
          }} />
        {rightSlot && <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}

function strengthScore(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['#D6D3D1', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#166534'];

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = strengthScore(password);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? STRENGTH_COLORS[score] : '#E8E5DE' }} />
        ))}
      </div>
      <p className="text-xs font-semibold" style={{ color: STRENGTH_COLORS[score] }}>{STRENGTH_LABELS[score]}</p>
    </div>
  );
}

export default function FirstTimeSetup({ userId, name, onComplete }) {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm)  return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/first-time-setup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
      setTimeout(() => onComplete(data), 1400);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: '#FAFAF6' }}>
      <LeafBottomLeft /><LeafBottomRight />
      <div className="flex flex-col items-center gap-4 animate-pop-in">
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: '#F0FDF4', border: '2px solid #BBF7D0', boxShadow: '0 8px 32px rgba(22,101,52,0.15)' }}>
          <CheckCircle2 size={40} style={{ color: '#166534' }} />
        </div>
        <div className="text-center">
          <p className="text-xl font-black" style={{ color: '#2E1A12' }}>Account Activated!</p>
          <p className="text-sm mt-1" style={{ color: '#78716C' }}>Redirecting to your dashboard…</p>
        </div>
        <div className="flex gap-1 mt-2">
          {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#9A3412', animationDelay: `${i * 0.15}s` }} />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#FAFAF6' }}>
      <LeafBottomLeft /><LeafBottomRight />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(154,52,18,0.04) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: '#FFF0EB', border: '1.5px solid #FBBFA3', boxShadow: '0 8px 24px rgba(154,52,18,0.14)' }}>
              <BrandLogo size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none" style={{ color: '#2E1A12', fontFamily: 'Georgia, "Times New Roman", serif' }}>The Velvet Bean Co.</h1>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] mt-1.5" style={{ color: '#9A3412', fontFamily: 'Georgia, serif' }}>Artisan Roasters &amp; Kitchen</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#F4F4ED', border: '1.5px solid #D6D3D1', boxShadow: '0 20px 60px rgba(46,26,18,0.1), 0 4px 16px rgba(46,26,18,0.06)' }}>

          <div className="px-7 pt-7 pb-5 flex items-center gap-4" style={{ borderBottom: '1px solid #D6D3D1' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#FFF0EB', border: '1.5px solid #FBBFA3' }}>
              <ShieldCheck size={20} style={{ color: '#9A3412' }} />
            </div>
            <div>
              <p className="text-base font-black" style={{ color: '#2E1A12' }}>Welcome, {name}!</p>
              <p className="text-xs mt-0.5" style={{ color: '#78716C' }}>Set your password to activate your account.</p>
            </div>
          </div>

          <div className="px-7 py-7">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <SetupInput id="new-password" label="New Password" type={showPw ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                rightSlot={
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ color: '#A8A29E' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#9A3412'}
                    onMouseLeave={e => e.currentTarget.style.color = '#A8A29E'}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                } />
              <PasswordStrength password={password} />
              <SetupInput id="confirm-password" label="Confirm Password" type={showCf ? 'text' : 'password'}
                value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password"
                rightSlot={
                  <button type="button" onClick={() => setShowCf(v => !v)} style={{ color: '#A8A29E' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#9A3412'}
                    onMouseLeave={e => e.currentTarget.style.color = '#A8A29E'}>
                    {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                } />
              {confirm.length > 0 && (
                <div className="flex items-center gap-1.5 animate-slide-up">
                  <CheckCircle2 size={13} style={{ color: password === confirm ? '#166534' : '#EF4444' }} />
                  <span className="text-xs font-semibold" style={{ color: password === confirm ? '#166534' : '#EF4444' }}>
                    {password === confirm ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              )}
              {error && <div className="text-sm px-4 py-3 rounded-xl font-medium animate-slide-up"
                style={{ background: '#FFF0EB', color: '#9A3412', border: '1px solid #FBBFA3' }}>{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full py-4 text-white text-sm font-bold rounded-xl transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                style={{ background: '#9A3412', boxShadow: '0 4px 16px rgba(154,52,18,0.3)' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#7C2D12'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#9A3412'; e.currentTarget.style.transform = 'translateY(0)'; }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'translateY(-1px)'}>
                {loading ? <><Loader2 size={15} className="animate-spin" />Activating…</> : <><ShieldCheck size={15} />Set Password &amp; Activate</>}
              </button>
            </form>
          </div>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: '#A8A29E' }}>
          Having trouble? Contact your <span className="font-semibold cursor-pointer hover:underline" style={{ color: '#9A3412' }}>store administrator</span>
        </p>
      </div>
    </div>
  );
}
