import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../auth/store'
import { apiFetch } from '../lib/api'

// ── Icons ─────────────────────────────────────────────────────────────────────
function HomeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function BoxIcon() {
  return (
    <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  )
}
function RefreshIconSm() {
  return (
    <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
    </svg>
  )
}
function BarChartIcon() {
  return (
    <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}
function UserIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function MailIcon() {
  return (
    <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}
function ArrowLeftIcon() {
  return (
    <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}
function CheckCircleIcon() {
  return (
    <svg width={52} height={52} fill="none" stroke="#059669" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

const FEATURES = [
  { icon: <ClockIcon />,      title: 'Live Tracking', desc: 'Track deliveries in real time' },
  { icon: <BoxIcon />,        title: 'Inventory',     desc: 'Godown stock overview'         },
  { icon: <RefreshIconSm />,  title: 'Returns',       desc: 'Pending return alerts'         },
  { icon: <BarChartIcon />,   title: 'Reports',       desc: 'Analytics & exports'           },
]

// ── Forgot password view ──────────────────────────────────────────────────────
type FPStep = 'email' | 'otp' | 'newpwd' | 'done'

function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [step, setStep]             = useState<FPStep>('email')
  const [email, setEmail]           = useState('')
  const [otp, setOtp]               = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [showCfm, setShowCfm]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [resendCd, setResendCd]     = useState(0)

  function startResendTimer() {
    setResendCd(60)
    const iv = setInterval(() => {
      setResendCd((v) => {
        if (v <= 1) { clearInterval(iv); return 0 }
        return v - 1
      })
    }, 1000)
  }

  // Step 1 — send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setError(null); setLoading(true)
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setStep('otp')
      startResendTimer()
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  // Step 2 — verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.trim().length !== 6) { setError('Enter the 6-digit OTP sent to your email.'); return }
    setError(null); setLoading(true)
    try {
      await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      })
      setStep('newpwd')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  // Step 3 — reset password
  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd.length < 6)       { setError('Password must be at least 6 characters.'); return }
    if (newPwd !== confirmPwd)   { setError('Passwords do not match.'); return }
    setError(null); setLoading(true)
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword: newPwd }),
      })
      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Reset failed')
    } finally { setLoading(false) }
  }

  // Resend OTP
  async function handleResend() {
    if (resendCd > 0) return
    setError(null); setLoading(true)
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setOtp('')
      startResendTimer()
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP')
    } finally { setLoading(false) }
  }

  const inputStyle = { border: '1.5px solid rgba(5,150,105,0.15)', color: '#1E1A4E', background: '#faf9ff' }
  const inputCls   = 'h-11 w-full rounded-[10px] pl-10 pr-4 text-[13.5px] outline-none transition placeholder:text-[#7C7A9A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(52,211,153,0.15)]'

  const stepMeta: Record<FPStep, { title: string; sub: string }> = {
    email:  { title: 'Forgot password',  sub: "Enter your email and we'll send you a 6-digit OTP." },
    otp:    { title: 'Verify OTP',       sub: `We sent a 6-digit code to ${email}` },
    newpwd: { title: 'New password',     sub: 'Choose a strong password for your account.' },
    done:   { title: 'Password reset!',  sub: 'Your password has been updated successfully.' },
  }
  const meta = stepMeta[step]
  const fpSteps: FPStep[] = ['email', 'otp', 'newpwd']

  return (
    <div className="relative z-10 w-full max-w-[400px] rounded-[20px] bg-white px-9 pb-7 pt-9 shadow-[0_8px_40px_rgba(30,26,78,0.12),0_1px_4px_rgba(30,26,78,0.06)]">

      {/* Back button */}
      {step !== 'done' && (
        <button type="button"
          onClick={step === 'email' ? onBack : () => { setStep(step === 'otp' ? 'email' : 'otp'); setError(null) }}
          style={{ color: '#7C7A9A' }}
          className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold hover:opacity-70 transition">
          <ArrowLeftIcon /> Back
        </button>
      )}

      {/* Header icon */}
      <div className="mb-5 flex flex-col items-center">
        {step === 'done' ? (
          <div className="mb-2"><CheckCircleIcon /></div>
        ) : (
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[13px] text-white"
            style={{ background: 'linear-gradient(135deg, #34d399, #047857)', boxShadow: '0 4px 16px rgba(52,211,153,0.3)' }}>
            {step === 'email'  && <MailIcon />}
            {step === 'otp'    && <span style={{ fontSize: 20 }}>🔢</span>}
            {step === 'newpwd' && <LockIcon />}
          </div>
        )}
        <h2 className="text-xl font-bold leading-none tracking-tight" style={{ color: '#1E1A4E' }}>{meta.title}</h2>
        <p className="mt-1.5 text-center text-[12.5px]" style={{ color: '#7C7A9A' }}>{meta.sub}</p>
      </div>

      {/* Progress dots */}
      {step !== 'done' && (
        <div className="mb-4 flex justify-center gap-2">
          {fpSteps.map((s, i) => (
            <div key={s} style={{
              height: 8, borderRadius: 4, transition: 'all 0.3s',
              width: step === s ? 20 : 8,
              background: fpSteps.indexOf(step) >= i ? '#059669' : '#e2e8f0',
            }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ── Step 1: Email ── */}
      {step === 'email' && (
        <form className="space-y-4" onSubmit={handleSendOtp}>
          <div className="space-y-1.5">
            <label className="block text-[12.5px] font-semibold" style={{ color: '#1E1A4E' }}>Email address</label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-[#7C7A9A]"><MailIcon /></span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" className={inputCls} style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#34d399')}
                onBlur={(e)  => (e.target.style.borderColor = 'rgba(5,150,105,0.15)')}
                autoFocus />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-[10px] py-[13px] text-[14px] font-bold tracking-[0.3px] text-white transition hover:-translate-y-px disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #34d399 0%, #047857 100%)', boxShadow: '0 4px 14px rgba(52,211,153,0.35)' }}>
            {loading ? 'Sending OTP…' : 'Send OTP →'}
          </button>
        </form>
      )}

      {/* ── Step 2: OTP ── */}
      {step === 'otp' && (
        <form className="space-y-4" onSubmit={handleVerifyOtp}>
          <div className="space-y-1.5">
            <label className="block text-[12.5px] font-semibold" style={{ color: '#1E1A4E' }}>6-digit OTP</label>
            <input type="text" inputMode="numeric" maxLength={6}
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="_ _ _ _ _ _"
              className="h-14 w-full rounded-[10px] text-center text-[28px] font-bold outline-none transition"
              style={{ ...inputStyle, letterSpacing: '0.55rem', fontFamily: 'monospace' }}
              onFocus={(e) => (e.target.style.borderColor = '#34d399')}
              onBlur={(e)  => (e.target.style.borderColor = 'rgba(5,150,105,0.15)')}
              autoFocus />
          </div>
          <button type="submit" disabled={loading || otp.length !== 6}
            className="w-full rounded-[10px] py-[13px] text-[14px] font-bold tracking-[0.3px] text-white transition hover:-translate-y-px disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #34d399 0%, #047857 100%)', boxShadow: '0 4px 14px rgba(52,211,153,0.35)' }}>
            {loading ? 'Verifying…' : 'Verify OTP →'}
          </button>
          <div className="text-center text-[12.5px]" style={{ color: '#7C7A9A' }}>
            Didn't receive it?{' '}
            <button type="button" onClick={handleResend} disabled={resendCd > 0 || loading}
              className="font-semibold transition hover:opacity-75 disabled:opacity-40"
              style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12.5px' }}>
              {resendCd > 0 ? `Resend in ${resendCd}s` : 'Resend OTP'}
            </button>
          </div>
        </form>
      )}

      {/* ── Step 3: New password ── */}
      {step === 'newpwd' && (
        <form className="space-y-4" onSubmit={handleReset}>
          <div className="space-y-1.5">
            <label className="block text-[12.5px] font-semibold" style={{ color: '#1E1A4E' }}>New password</label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-[#7C7A9A]"><LockIcon /></span>
              <input type={showPwd ? 'text' : 'password'} value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)} placeholder="Min. 6 characters"
                className="h-11 w-full rounded-[10px] pl-10 pr-11 text-[13.5px] outline-none transition placeholder:text-[#7C7A9A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(52,211,153,0.15)]"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#34d399')}
                onBlur={(e)  => (e.target.style.borderColor = 'rgba(5,150,105,0.15)')}
                autoFocus />
              <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                className="absolute right-3" style={{ color: '#7C7A9A' }}>
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[12.5px] font-semibold" style={{ color: '#1E1A4E' }}>Confirm password</label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-[#7C7A9A]"><LockIcon /></span>
              <input type={showCfm ? 'text' : 'password'} value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Re-enter password"
                className="h-11 w-full rounded-[10px] pl-10 pr-11 text-[13.5px] outline-none transition placeholder:text-[#7C7A9A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(52,211,153,0.15)]"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#34d399')}
                onBlur={(e)  => (e.target.style.borderColor = 'rgba(5,150,105,0.15)')} />
              <button type="button" tabIndex={-1} onClick={() => setShowCfm(v => !v)}
                className="absolute right-3" style={{ color: '#7C7A9A' }}>
                {showCfm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirmPwd && confirmPwd !== newPwd && (
              <p style={{ fontSize: 11, color: '#e11d48', marginTop: 4 }}>Passwords do not match</p>
            )}
            {confirmPwd && confirmPwd === newPwd && (
              <p style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>✓ Passwords match</p>
            )}
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-[10px] py-[13px] text-[14px] font-bold tracking-[0.3px] text-white transition hover:-translate-y-px disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #34d399 0%, #047857 100%)', boxShadow: '0 4px 14px rgba(52,211,153,0.35)' }}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      )}

      {/* ── Step 4: Done ── */}
      {step === 'done' && (
        <div className="space-y-4 text-center">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Your password has been reset. You can now sign in with your new password.
          </div>
          <button type="button" onClick={onBack}
            className="w-full rounded-[10px] py-[13px] text-[14px] font-bold tracking-[0.3px] text-white transition hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, #34d399 0%, #047857 100%)', boxShadow: '0 4px 14px rgba(52,211,153,0.35)' }}>
            Back to Sign In
          </button>
        </div>
      )}

      {/* Powered by */}
      <div className="mt-5 flex items-center justify-center gap-1.5">
        <span className="h-1 w-1 rounded-full bg-[#6ee7b7]" />
        <span className="text-[11.5px]" style={{ color: '#7C7A9A' }}>Powered by</span>
        <span className="text-[11.5px] font-bold tracking-[0.2px]" style={{ color: '#059669' }}>Yencode Technologies</span>
        <span className="h-1 w-1 rounded-full bg-[#6ee7b7]" />
      </div>
    </div>
  )
}

// ── Main LoginPage ────────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate()

  const [showForgot, setShowForgot] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [remember, setRemember]     = useState(true)
  const [touched, setTouched]       = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)

  const errors = useMemo(() => {
    if (!touched) return {}
    return {
      identifier: identifier.trim().length < 1 ? 'Enter your email or mobile number.' : undefined,
      password:   password.trim().length < 6   ? 'Password must be at least 6 characters.' : undefined,
    }
  }, [identifier, password, touched])

  const hasError = Boolean(errors.identifier || errors.password)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    setServerError(null)
    if (hasError) return
    setLoading(true)
    login(identifier, password)
      .then((u) => {
        const next = u.role === 'DELIVERY' ? '/deliveries' : '/'
        navigate(next, { replace: true })
      })
      .catch((err: any) => setServerError(err?.message || 'Login failed'))
      .finally(() => setLoading(false))
  }

  const inputStyle = { border: '1.5px solid rgba(5,150,105,0.15)', color: '#1E1A4E', background: '#faf9ff' }

  return (
    <div className="min-h-screen bg-[#101010] lg:h-screen lg:overflow-hidden lg:p-3">
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] bg-white shadow-2xl lg:h-full lg:overflow-hidden lg:rounded-[28px]">

        {/* ══ LEFT PANEL ══ */}
        <div className="relative hidden w-1/2 lg:block">
          <img src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1400&q=80&auto=format&fit=crop"
            alt="Warehouse"
            className="h-full w-full object-cover brightness-[0.55] transition-transform duration-[8000ms] hover:scale-[1.04]" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-[40%]"
            style={{ background: 'linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 100%)' }} />
          <div className="absolute bottom-8 left-8 right-8">
            <h1 className="max-w-xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white" style={{ fontWeight: '600' }}>
              Send and receive<br />your packages{' '}
              <span className="mt-1 block" style={{
                background: 'linear-gradient(135deg, #FF6B6B, #FFB347)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>in record time</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/60">
              Manage deliveries, monitor stock, and streamline logistics operations with a modern admin dashboard experience.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="text-white/80">{f.icon}</span>{f.title}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: '#9c9898' }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="relative flex w-full items-center justify-center overflow-y-auto bg-[#F4F3FD] px-5 py-8 sm:px-10 lg:w-1/2">
          <div className="pointer-events-none absolute right-0 top-0 h-[280px] w-[280px] -translate-y-20 translate-x-20"
            style={{ background: 'radial-gradient(circle, rgba(127,119,221,0.14) 0%, transparent 70%)' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[220px] w-[220px]"
            style={{ background: 'radial-gradient(circle, rgba(83,74,183,0.10) 0%, transparent 70%)' }} />

          {/* Forgot password view */}
          {showForgot ? (
            <ForgotPasswordView onBack={() => setShowForgot(false)} />
          ) : (
            /* Login card */
            <div className="relative z-10 w-full max-w-[400px] rounded-[20px] bg-white px-9 pb-7 pt-9 shadow-[0_8px_40px_rgba(30,26,78,0.12),0_1px_4px_rgba(30,26,78,0.06)]">

              <div className="mb-4 flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-[13px] text-white"
                  style={{ background: 'linear-gradient(135deg, #34d399, #047857)', boxShadow: '0 4px 16px rgba(83,74,183,0.35)' }}>
                  <HomeIcon size={24} />
                </div>
                <h2 className="mt-[18px] text-2xl font-bold leading-none tracking-tight" style={{ color: '#1E1A4E' }}>
                  Welcome Back
                </h2>
                <p className="mb-7 mt-1.5 text-center text-[13px]" style={{ color: '#7C7A9A' }}>
                  Sign in to continue managing deliveries and inventory.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="block text-[12.5px] font-semibold" style={{ color: '#1E1A4E' }}>
                    Email or mobile number
                  </label>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-3 text-[#7C7A9A]"><UserIcon size={17} /></span>
                    <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                      onBlur={() => setTouched(true)} placeholder="email or mobile"
                      style={inputStyle}
                      className="h-11 w-full rounded-[10px] pl-10 pr-4 text-[13.5px] outline-none transition placeholder:text-[#7C7A9A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(127,119,221,0.15)]"
                      onFocus={(e) => (e.target.style.borderColor = '#34d399')}
                      onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(5,150,105,0.15)')} />
                  </div>
                  {errors.identifier && <p className="text-xs text-rose-600">{errors.identifier}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[12.5px] font-semibold" style={{ color: '#1E1A4E' }}>Password</label>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-3 text-[#7C7A9A]"><LockIcon /></span>
                    <input type={showPwd ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched(true)} placeholder="Min. 6 characters"
                      style={inputStyle}
                      className="h-11 w-full rounded-[10px] pl-10 pr-11 text-[13.5px] outline-none transition placeholder:text-[#7C7A9A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(127,119,221,0.15)]"
                      onFocus={(e) => (e.target.style.borderColor = '#34d399')}
                      onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(5,150,105,0.15)')} />
                    <button type="button" onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 transition" style={{ color: '#7C7A9A' }} tabIndex={-1}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#059669')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#7C7A9A')}>
                      {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-600">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between" style={{ marginBottom: '22px' }}>
                  <label className="flex cursor-pointer items-center gap-2 select-none">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#059669]" />
                    <span className="text-[12.5px] font-medium" style={{ color: '#7C7A9A' }}>Remember me</span>
                  </label>
                  {/* <button type="button"
                    className="text-[12.5px] font-semibold transition hover:opacity-75"
                    style={{ color: '#059669' }}
                    onClick={() => { setServerError(null); setShowForgot(true) }}>
                    Forgot password?
                  </button> */}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full rounded-[10px] py-[13px] text-[14px] font-bold tracking-[0.3px] text-white transition hover:-translate-y-px hover:opacity-93 active:translate-y-0 disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #34d399 0%, #047857 100%)', boxShadow: '0 4px 16px rgba(83,74,183,0.4)' }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>

                {serverError && (
                  <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{serverError}</div>
                )}
              </form>

              <div className="mt-4 flex items-center justify-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#6ee7b7]" />
                <span className="text-[11.5px]" style={{ color: '#7C7A9A' }}>Powered by</span>
                <span className="text-[11.5px] font-bold tracking-[0.2px]" style={{ color: '#059669' }}>Yencode Technologies</span>
                <span className="h-1 w-1 rounded-full bg-[#6ee7b7]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}