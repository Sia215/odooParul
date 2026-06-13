import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function LeafBottomLeft() {
  return (
    <svg width="260" height="220" viewBox="0 0 260 220" fill="none"
      className="absolute bottom-0 left-0 pointer-events-none select-none opacity-[0.13]">
      <path d="M-20 220 C20 180, 60 160, 40 100 C20 40, 80 10, 120 40 C80 60, 60 100, 100 140 C120 160, 80 200, -20 220Z" fill="#9A3412" />
      <path d="M0 220 C30 190, 50 170, 80 150 C110 130, 90 90, 60 70" stroke="#9A3412" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M-10 180 C20 195, 60 185, 90 160 C120 135, 140 100, 110 70 C90 100, 70 130, 40 150 C10 170, -10 180, -10 180Z" fill="#2E1A12" />
      <circle cx="120" cy="42" r="5" fill="#9A3412" />
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
      <circle cx="120" cy="42" r="5" fill="#9A3412" />
    </svg>
  );
}

function BrandLogo({ size = 44 }) {
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

function AuthInput({ id, label, type = 'text', value, onChange, placeholder, icon: Icon, rightSlot, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-widest" style={{ color: '#78716C' }}>{label}</label>
      <div className="relative transition-all duration-200" style={{ transform: focused ? 'scale(1.025)' : 'scale(1)' }}>
        {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
          style={{ color: focused ? '#9A3412' : '#A8A29E' }} />}
        <input id={id} type={type} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder} required={required}
          className="w-full rounded-xl px-6 py-4 text-sm outline-none transition-all duration-200 placeholder:text-stone-400"
          style={{
            paddingLeft: Icon ? '2.75rem' : '1.5rem',
            paddingRight: rightSlot ? '3rem' : '1.5rem',
            background: '#FFFFFF', color: '#2E1A12',
            border: focused ? '1.5px solid #9A3412' : '1px solid #D6D3D1',
            boxShadow: focused ? '0 0 0 3px rgba(154,52,18,0.12), 0 4px 12px rgba(154,52,18,0.08)' : '0 1px 2px rgba(46,26,18,0.04)',
          }} />
        {rightSlot && <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}

function MessageBanner({ message }) {
  if (!message) return null;
  return (
    <div className="text-sm px-4 py-3 rounded-xl font-medium animate-slide-up"
      style={message.error
        ? { background: '#FFF0EB', color: '#9A3412', border: '1px solid #FBBFA3' }
        : { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>
      {message.text}
    </div>
  );
}

function SubmitButton({ loading, children }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-4 text-white text-sm font-bold rounded-xl transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
      style={{ background: '#9A3412', boxShadow: '0 4px 16px rgba(154,52,18,0.3)' }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#7C2D12'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.background = '#9A3412'; e.currentTarget.style.transform = 'translateY(0)'; }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'translateY(-1px)'}>
      {children}
    </button>
  );
}

export default function AuthPortal({ onLogin }) {
  const [tab, setTab]           = useState('signin');
  const [step, setStep]         = useState('email');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [showFormPw, setShowFormPw] = useState(false);
  const [message, setMessage]   = useState(null);
  const [loading, setLoading]   = useState(false);

  const switchTab = (t) => { setTab(t); setMessage(null); setStep('email'); };

  const handleSignIn = async (e) => {
    e.preventDefault(); setMessage(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: step === 'password' ? password : undefined }),
      });
      const data = await res.json();
      if (data.firstTimeSetup) { if (onLogin) onLogin(data); return; }
      if (!res.ok && step === 'email' && data.message === 'Password is required.') { setStep('password'); setLoading(false); return; }
      if (!res.ok) throw new Error(data.message);
      setMessage({ text: `Welcome back, ${data.name}!`, error: false });
      if (onLogin) setTimeout(() => onLogin(data), 700);
    } catch (err) { setMessage({ text: err.message, error: true }); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setMessage(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage({ text: data.message || 'Account created! You can now sign in.', error: false });
      setForm({ name: '', email: '', password: '' });
    } catch (err) { setMessage({ text: err.message, error: true }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#FAFAF6' }}>
      <LeafBottomLeft />
      <LeafBottomRight />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 55%, rgba(154,52,18,0.04) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Branding */}
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
          <p className="text-sm mt-3 font-medium" style={{ color: '#78716C' }}>Sign in to your POS to start your shift</p>
        </div>

        {/* Auth Box */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#F4F4ED', border: '1.5px solid #D6D3D1', boxShadow: '0 20px 60px rgba(46,26,18,0.1), 0 4px 16px rgba(46,26,18,0.06)' }}>

          {/* Tabs */}
          <div className="flex p-1.5 gap-1" style={{ background: '#ECEAE3', borderBottom: '1px solid #D6D3D1' }}>
            {[{ id: 'signin', label: 'Sign In' }, { id: 'create', label: 'Create Account' }].map(({ id, label }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => switchTab(id)}
                  className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200"
                  style={active ? { background: '#FAFAF6', color: '#2E1A12', boxShadow: '0 2px 8px rgba(46,26,18,0.1)' } : { color: '#78716C' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#2E1A12'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#78716C'; }}>
                  {label}
                </button>
              );
            })}
          </div>

          <div className="px-7 py-7">
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="flex flex-col gap-5">
                <AuthInput id="signin-email" label="Email Address" type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setStep('email'); setMessage(null); }}
                  placeholder="you@example.com" icon={Mail} required />
                {step === 'password' && (
                  <div className="animate-slide-up">
                    <AuthInput id="signin-password" label="Password" type={showPw ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password" icon={Lock} required
                      rightSlot={
                        <button type="button" onClick={() => setShowPw(v => !v)} style={{ color: '#A8A29E' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#9A3412'}
                          onMouseLeave={e => e.currentTarget.style.color = '#A8A29E'}>
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      } />
                  </div>
                )}
                <MessageBanner message={message} />
                <SubmitButton loading={loading}>
                  {loading ? <><Loader2 size={15} className="animate-spin" />Please wait…</> : step === 'email' ? <><span>Continue</span><ArrowRight size={15} /></> : 'Sign In'}
                </SubmitButton>
              </form>
            )}

            {tab === 'create' && (
              <form onSubmit={handleCreate} className="flex flex-col gap-5">
                <AuthInput id="create-name" label="Full Name" value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setMessage(null); }}
                  placeholder="Jane Smith" icon={User} required />
                <AuthInput id="create-email" label="Email Address" type="email" value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setMessage(null); }}
                  placeholder="you@example.com" icon={Mail} required />
                <AuthInput id="create-password" label="Password" type={showFormPw ? 'text' : 'password'}
                  value={form.password} onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setMessage(null); }}
                  placeholder="Min. 8 characters" icon={Lock} required
                  rightSlot={
                    <button type="button" onClick={() => setShowFormPw(v => !v)} style={{ color: '#A8A29E' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#9A3412'}
                      onMouseLeave={e => e.currentTarget.style.color = '#A8A29E'}>
                      {showFormPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  } />
                <MessageBanner message={message} />
                <SubmitButton loading={loading}>
                  {loading ? <><Loader2 size={15} className="animate-spin" />Creating account…</> : 'Create Account'}
                </SubmitButton>
              </form>
            )}
          </div>
        </div>

        <div className="text-center mt-6 flex flex-col gap-2">
          <p className="text-xs" style={{ color: '#A8A29E' }}>
            Need access? Contact your <span className="font-semibold cursor-pointer hover:underline" style={{ color: '#9A3412' }}>store administrator</span>
          </p>
          <p className="text-xs" style={{ color: '#A8A29E' }}>
            <span className="cursor-pointer hover:underline" style={{ color: '#78716C' }}>Privacy Policy</span>
            {' · '}
            <span className="cursor-pointer hover:underline" style={{ color: '#78716C' }}>Terms of Use</span>
          </p>
        </div>
      </div>
    </div>
  );
}
