// import { useMemo, useState } from 'react'
// import { useNavigate } from 'react-router-dom'

// import { login } from '../auth/store'


// // ── Icons ────────────────────────────────────────────────────────────────────
// function HomeIcon({ size = 20 }: { size?: number }) {
//   return (
//     <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}
//       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//       <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
//       <polyline points="9 22 9 12 15 12 15 22" />
//     </svg>
//   )
// }

// function ClockIcon() {
//   return (
//     <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2}
//       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//       <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
//     </svg>
//   )
// }

// function BoxIcon() {
//   return (
//     <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2}
//       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//       <rect x="2" y="7" width="20" height="14" rx="2" />
//       <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
//       <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
//     </svg>
//   )
// }

// function RefreshIcon() {
//   return (
//     <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2}
//       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//       <polyline points="1 4 1 10 7 10" />
//       <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
//     </svg>
//   )
// }

// function BarChartIcon() {
//   return (
//     <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.2}
//       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//       <line x1="18" y1="20" x2="18" y2="10" />
//       <line x1="12" y1="20" x2="12" y2="4" />
//       <line x1="6" y1="20" x2="6" y2="14" />
//     </svg>
//   )
// }

// function UserIcon({ size = 16 }: { size?: number }) {
//   return (
//     <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2}
//       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
//       <circle cx="12" cy="7" r="4" />
//     </svg>
//   )
// }

// function EyeIcon() {
//   return (
//     <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}
//       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//       <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
//       <circle cx="12" cy="12" r="3" />
//     </svg>
//   )
// }

// function EyeOffIcon() {
//   return (
//     <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}
//       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//       <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
//       <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
//       <line x1="1" y1="1" x2="23" y2="23" />
//     </svg>
//   )
// }

// function LockIcon() {
//   return (
//     <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}
//       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
//       <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
//       <path d="M7 11V7a5 5 0 0 1 10 0v4" />
//     </svg>
//   )
// }

// // ── Feature cards data ────────────────────────────────────────────────────────
// const FEATURES = [
//   { icon: <ClockIcon />,    title: 'Live Tracking', desc: 'Track deliveries in real time' },
//   { icon: <BoxIcon />,      title: 'Inventory',     desc: 'Godown stock overview'         },
//   { icon: <RefreshIcon />,  title: 'Returns',       desc: 'Pending return alerts'         },
//   { icon: <BarChartIcon />, title: 'Reports',       desc: 'Analytics & exports'           },
// ]

// // ── Component ─────────────────────────────────────────────────────────────────
// export function LoginPage() {
//   const navigate = useNavigate()

//   const [identifier, setIdentifier] = useState('')
//   const [password, setPassword]     = useState('')
//   const [showPwd, setShowPwd]       = useState(false)
//   const [remember, setRemember]     = useState(true)
//   const [touched, setTouched]       = useState(false)
//   const [serverError, setServerError] = useState<string | null>(null)
//   const [loading, setLoading]       = useState(false)

//   const errors = useMemo(() => {
//     if (!touched) return {}
//     return {
//       identifier: identifier.trim().length < 1 ? 'Enter your email or mobile number.' : undefined,
//       password:   password.trim().length < 6   ? 'Password must be at least 6 characters.' : undefined,
//     }
//   }, [identifier, password, touched])

//   const hasError = Boolean(errors.identifier || errors.password)

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault()
//     setTouched(true)
//     setServerError(null)
//     if (hasError) return
//     setLoading(true)
//     login(identifier, password)
//       .then((u) => {
//         const next = u.role === 'DELIVERY' ? '/deliveries' : '/'
//         navigate(next, { replace: true })
//       })
//       .catch((err: any) => setServerError(err?.message || 'Login failed'))
//       .finally(() => setLoading(false))
//   }

//   return (
//     <div className="h-screen overflow-hidden bg-[#101010] p-3">
//       {/* <div className="mx-auto flex h-full max-w-[1500px] overflow-hidden rounded-[28px] bg-white shadow-2xl"> */}
//       <div className="mx-auto flex h-full w-full max-w-[1800px] overflow-hidden rounded-[28px] bg-white shadow-2xl">

//         {/* ══ LEFT PANEL ══ */}
//         <div className="relative hidden w-1/2 lg:block">

//           {/* Background image */}
//           <img
//             src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1400&q=80&auto=format&fit=crop"
//             alt="Warehouse"
//             className="h-full w-full object-cover brightness-[0.55] transition-transform duration-[8000ms] hover:scale-[1.04]"
//           />

//           {/* Overlay 1: purple-blue diagonal gradient (top-left to mid) */}
//           <div
//             className="absolute inset-0"
//             style={{
//               background:
//                 'linear-gradient(135deg, rgba(38,33,92,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
//             }}
//           />

//           {/* Overlay 2: bottom fade to near-black */}
//           <div
//             className="absolute bottom-0 left-0 right-0 h-[40%]"
//             style={{
//               background:
//                 'linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 100%)',
//             }}
//           />

//           {/* Top-left badge */}
//           {/* <div className="absolute left-10 top-9 flex items-center gap-2.5">
//             <div
//               className="flex h-10 w-10 items-center justify-center rounded-[11px] text-white"
//               style={{ background: '#7F77DD', boxShadow: '0 4px 16px rgba(127,119,221,0.5)' }}
//             >
//               <HomeIcon size={20} />
//             </div>
//             <div className="leading-[1.1]">
//               <span className="block text-[15px] font-semibold text-white">Godown Manager</span>
//               <span className="block text-[10.5px] font-medium text-white/50">Admin Console</span>
//             </div>
//           </div> */}

//           {/* Bottom content */}
//           <div className="absolute bottom-8 left-8 right-8">

//             {/* Headline */}
//             <h1 className="max-w-xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white"style={{fontWeight:"600"}}>
//               Send and receive
//               <br />
//               your packages 
//               <span
//                 className="mt-1 block"
//                 style={{
//                   background: 'linear-gradient(135deg, #FF6B6B, #FFB347)',
//                   WebkitBackgroundClip: 'text',
//                   WebkitTextFillColor: 'transparent',
//                   backgroundClip: 'text',
//                 }}
//               >
//                 in record time
//               </span>
//             </h1>

//             {/* Subtitle */}
//             <p className="mt-3 max-w-lg text-sm leading-6 text-white/60">
//               Manage deliveries, monitor stock, and streamline logistics
//               operations with a modern admin dashboard experience.
//             </p>

//             {/* Feature cards */}
//             <div className="mt-6 grid grid-cols-2 gap-3">
//               {FEATURES.map((f) => (
//                 <div
//                   key={f.title}
//                   className="rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-sm"
//                 >
//                   <div className="flex items-center gap-2 text-sm font-semibold text-white">
//                     <span className="text-white/80">{f.icon}</span>
//                     {f.title}
//                   </div>
//                   <div className="mt-1 text-xs text" style={{color:"#9c9898"}}>{f.desc}</div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* ══ RIGHT PANEL ══ */}
//         <div className="relative flex w-full items-center justify-center overflow-hidden bg-[#F4F3FD] px-10 py-8 lg:w-1/2">

//           {/* Radial glow top-right */}
//           <div
//             className="pointer-events-none absolute right-0 top-0 h-[280px] w-[280px] -translate-y-20 translate-x-20"
//             style={{ background: 'radial-gradient(circle, rgba(127,119,221,0.14) 0%, transparent 70%)' }}
//           />
//           {/* Radial glow bottom-left */}
//           <div
//             className="pointer-events-none absolute bottom-0 left-0 h-[220px] w-[220px] -translate-x-15 translate-y-15"
//             style={{ background: 'radial-gradient(circle, rgba(83,74,183,0.10) 0%, transparent 70%)' }}
//           />

//           {/* Login card */}
//           <div className="relative z-10 w-full max-w-[400px] rounded-[20px] bg-white px-9 pb-7 pt-9 shadow-[0_8px_40px_rgba(30,26,78,0.12),0_1px_4px_rgba(30,26,78,0.06)]">

//             {/* Logo + heading */}
//             <div className="mb-4 flex flex-col items-center">

//               {/* Logo icon */}
//               <div
//                 className="flex h-12 w-12 items-center justify-center rounded-[13px] text-white"
//                 style={{
//                   background: 'linear-gradient(135deg, #7F77DD, #3C3489)',
//                   boxShadow: '0 4px 16px rgba(83,74,183,0.35)',
//                 }}
//               >
//                 <HomeIcon size={24} />
//               </div>

//               <h2
//                 className="mt-[18px] text-2xl font-bold leading-none tracking-tight"
//                 style={{ color: '#1E1A4E' }}
//               >
//                 Welcome Back
//               </h2>
//               <p className="mb-7 mt-1.5 text-center text-[13px]" style={{ color: '#7C7A9A' }}>
//                 Sign in to continue managing deliveries and inventory.
//               </p>
//             </div>

//             {/* ── Form ── */}
//             <form className="space-y-4" onSubmit={handleSubmit}>

//               {/* Email / Mobile */}
//               <div className="space-y-1.5">
//                 <label className="block text-[12.5px] font-semibold" style={{ color: '#1E1A4E' }}>
//                   Email or mobile number
//                 </label>
//                 <div className="relative flex items-center">
//                   <span className="pointer-events-none absolute left-3 text-[#7C7A9A]">
//                     <UserIcon size={17} />
//                   </span>
//                   <input
//                     type="text"
//                     value={identifier}
//                     onChange={(e) => setIdentifier(e.target.value)}
//                     onBlur={() => setTouched(true)}
//                     placeholder="admin@gmail.com or mobile"
//                     style={{
//                       border: '1.5px solid rgba(83,74,183,0.15)',
//                       color: '#1E1A4E',
//                       background: '#faf9ff',
//                     }}
//                     className="h-11 w-full rounded-[10px] pl-10 pr-4 text-[13.5px] outline-none transition placeholder:text-[#7C7A9A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(127,119,221,0.15)]"
//                     onFocus={(e) => (e.target.style.borderColor = '#7F77DD')}
//                     onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(83,74,183,0.15)')}
//                   />
//                 </div>
//                 {errors.identifier && (
//                   <p className="text-xs text-rose-600">{errors.identifier}</p>
//                 )}
//               </div>

//               {/* Password */}
//               <div className="space-y-1.5">
//                 <label className="block text-[12.5px] font-semibold" style={{ color: '#1E1A4E' }}>
//                   Password
//                 </label>
//                 <div className="relative flex items-center">
//                   <span className="pointer-events-none absolute left-3 text-[#7C7A9A]">
//                     <LockIcon />
//                   </span>
//                   <input
//                     type={showPwd ? 'text' : 'password'}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     onBlur={() => setTouched(true)}
//                     placeholder="Min. 6 characters"
//                     style={{
//                       border: '1.5px solid rgba(83,74,183,0.15)',
//                       color: '#1E1A4E',
//                       background: '#faf9ff',
//                     }}
//                     className="h-11 w-full rounded-[10px] pl-10 pr-11 text-[13.5px] outline-none transition placeholder:text-[#7C7A9A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(127,119,221,0.15)]"
//                     onFocus={(e) => (e.target.style.borderColor = '#7F77DD')}
//                     onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(83,74,183,0.15)')}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPwd((v) => !v)}
//                     className="absolute right-3 transition"
//                     style={{ color: '#7C7A9A' }}
//                     tabIndex={-1}
//                     onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#534AB7')}
//                     onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#7C7A9A')}
//                   >
//                     {showPwd ? <EyeOffIcon /> : <EyeIcon />}
//                   </button>
//                 </div>
//                 {errors.password && (
//                   <p className="text-xs text-rose-600">{errors.password}</p>
//                 )}
//               </div>

//               {/* Remember me + Forgot password */}
//               <div className="flex items-center justify-between" style={{ marginBottom: '22px' }}>
//                 <label className="flex cursor-pointer items-center gap-2 select-none">
//                   <input
//                     type="checkbox"
//                     checked={remember}
//                     onChange={(e) => setRemember(e.target.checked)}
//                     className="h-4 w-4 rounded accent-[#534AB7]"
//                   />
//                   <span className="text-[12.5px] font-medium" style={{ color: '#7C7A9A' }}>Remember me</span>
//                 </label>
//                 <button
//                   type="button"
//                   className="text-[12.5px] font-semibold transition hover:opacity-75"
//                   style={{ color: '#534AB7' }}
//                   onClick={() => alert('Forgot password flow (template placeholder).')}
//                 >
//                   Forgot password?
//                 </button>
//               </div>

//               {/* Sign In button */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full rounded-[10px] py-[13px] text-[14px] font-bold tracking-[0.3px] text-white transition hover:-translate-y-px hover:opacity-93 active:translate-y-0 disabled:opacity-70"
//                 style={{
//                   background: 'linear-gradient(135deg, #7F77DD 0%, #3C3489 100%)',
//                   boxShadow: '0 4px 16px rgba(83,74,183,0.4)',
//                 }}
//               >
//                 {loading ? 'Signing in…' : 'Sign In'}
//               </button>

//               {/* Server error */}
//               {serverError && (
//                 <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
//                   {serverError}
//                 </div>
//               )}

        



//             </form>

//             {/* Powered by */}
//             <div className="mt-4 flex items-center justify-center gap-1.5">
//               <span className="h-1 w-1 rounded-full bg-[#AFA9EC]" />
//               <span className="text-[11.5px]" style={{ color: '#7C7A9A' }}>Powered by</span>
//               <span className="text-[11.5px] font-bold tracking-[0.2px]" style={{ color: '#534AB7' }}>
//                 Yencode Technologies
//               </span>
//               <span className="h-1 w-1 rounded-full bg-[#AFA9EC]" />
//             </div>

//           </div>
//         </div>

//       </div>
//     </div>
//   )
// }

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { login } from '../auth/store'


// ── Icons ────────────────────────────────────────────────────────────────────
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

function RefreshIcon() {
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

// ── Feature cards data ────────────────────────────────────────────────────────
const FEATURES = [
  { icon: <ClockIcon />,    title: 'Live Tracking', desc: 'Track deliveries in real time' },
  { icon: <BoxIcon />,      title: 'Inventory',     desc: 'Godown stock overview'         },
  { icon: <RefreshIcon />,  title: 'Returns',       desc: 'Pending return alerts'         },
  { icon: <BarChartIcon />, title: 'Reports',       desc: 'Analytics & exports'           },
]

// ── Component ─────────────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate()

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

  return (
    <div className="min-h-screen bg-[#101010] lg:h-screen lg:overflow-hidden lg:p-3">
      {/* <div className="mx-auto flex h-full max-w-[1500px] overflow-hidden rounded-[28px] bg-white shadow-2xl"> */}
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] bg-white shadow-2xl lg:h-full lg:overflow-hidden lg:rounded-[28px]">

        {/* ══ LEFT PANEL ══ */}
        <div className="relative hidden w-1/2 lg:block">

          {/* Background image */}
          <img
            src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1400&q=80&auto=format&fit=crop"
            alt="Warehouse"
            className="h-full w-full object-cover brightness-[0.55] transition-transform duration-[8000ms] hover:scale-[1.04]"
          />

          {/* Overlay 1: purple-blue diagonal gradient (top-left to mid) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(38,33,92,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
            }}
          />

          {/* Overlay 2: bottom fade to near-black */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[40%]"
            style={{
              background:
                'linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 100%)',
            }}
          />

          {/* Top-left badge */}
          {/* <div className="absolute left-10 top-9 flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[11px] text-white"
              style={{ background: '#7F77DD', boxShadow: '0 4px 16px rgba(127,119,221,0.5)' }}
            >
              <HomeIcon size={20} />
            </div>
            <div className="leading-[1.1]">
              <span className="block text-[15px] font-semibold text-white">Godown Manager</span>
              <span className="block text-[10.5px] font-medium text-white/50">Admin Console</span>
            </div>
          </div> */}

          {/* Bottom content */}
          <div className="absolute bottom-8 left-8 right-8">

            {/* Headline */}
            <h1 className="max-w-xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white"style={{fontWeight:"600"}}>
              Send and receive
              <br />
              your packages 
              <span
                className="mt-1 block"
                style={{
                  background: 'linear-gradient(135deg, #FF6B6B, #FFB347)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                in record time
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/60">
              Manage deliveries, monitor stock, and streamline logistics
              operations with a modern admin dashboard experience.
            </p>

            {/* Feature cards */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="text-white/80">{f.icon}</span>
                    {f.title}
                  </div>
                  <div className="mt-1 text-xs text" style={{color:"#9c9898"}}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="relative flex w-full items-center justify-center overflow-y-auto bg-[#F4F3FD] px-5 py-8 sm:px-10 lg:w-1/2">

          {/* Radial glow top-right */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-[280px] w-[280px] -translate-y-20 translate-x-20"
            style={{ background: 'radial-gradient(circle, rgba(127,119,221,0.14) 0%, transparent 70%)' }}
          />
          {/* Radial glow bottom-left */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-[220px] w-[220px] -translate-x-15 translate-y-15"
            style={{ background: 'radial-gradient(circle, rgba(83,74,183,0.10) 0%, transparent 70%)' }}
          />

          {/* Login card */}
          <div className="relative z-10 w-full max-w-[400px] rounded-[20px] bg-white px-9 pb-7 pt-9 shadow-[0_8px_40px_rgba(30,26,78,0.12),0_1px_4px_rgba(30,26,78,0.06)]">

            {/* Logo + heading */}
            <div className="mb-4 flex flex-col items-center">

              {/* Logo icon */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[13px] text-white"
                style={{
                  background: 'linear-gradient(135deg, #7F77DD, #3C3489)',
                  boxShadow: '0 4px 16px rgba(83,74,183,0.35)',
                }}
              >
                <HomeIcon size={24} />
              </div>

              <h2
                className="mt-[18px] text-2xl font-bold leading-none tracking-tight"
                style={{ color: '#1E1A4E' }}
              >
                Welcome Back
              </h2>
              <p className="mb-7 mt-1.5 text-center text-[13px]" style={{ color: '#7C7A9A' }}>
                Sign in to continue managing deliveries and inventory.
              </p>
            </div>

            {/* ── Form ── */}
            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Email / Mobile */}
              <div className="space-y-1.5">
                <label className="block text-[12.5px] font-semibold" style={{ color: '#1E1A4E' }}>
                  Email or mobile number
                </label>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-3 text-[#7C7A9A]">
                    <UserIcon size={17} />
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="admin@gmail.com or mobile"
                    style={{
                      border: '1.5px solid rgba(83,74,183,0.15)',
                      color: '#1E1A4E',
                      background: '#faf9ff',
                    }}
                    className="h-11 w-full rounded-[10px] pl-10 pr-4 text-[13.5px] outline-none transition placeholder:text-[#7C7A9A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(127,119,221,0.15)]"
                    onFocus={(e) => (e.target.style.borderColor = '#7F77DD')}
                    onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(83,74,183,0.15)')}
                  />
                </div>
                {errors.identifier && (
                  <p className="text-xs text-rose-600">{errors.identifier}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[12.5px] font-semibold" style={{ color: '#1E1A4E' }}>
                  Password
                </label>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-3 text-[#7C7A9A]">
                    <LockIcon />
                  </span>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="Min. 6 characters"
                    style={{
                      border: '1.5px solid rgba(83,74,183,0.15)',
                      color: '#1E1A4E',
                      background: '#faf9ff',
                    }}
                    className="h-11 w-full rounded-[10px] pl-10 pr-11 text-[13.5px] outline-none transition placeholder:text-[#7C7A9A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(127,119,221,0.15)]"
                    onFocus={(e) => (e.target.style.borderColor = '#7F77DD')}
                    onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(83,74,183,0.15)')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 transition"
                    style={{ color: '#7C7A9A' }}
                    tabIndex={-1}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#534AB7')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#7C7A9A')}
                  >
                    {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-600">{errors.password}</p>
                )}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between" style={{ marginBottom: '22px' }}>
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#534AB7]"
                  />
                  <span className="text-[12.5px] font-medium" style={{ color: '#7C7A9A' }}>Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-[12.5px] font-semibold transition hover:opacity-75"
                  style={{ color: '#534AB7' }}
                  onClick={() => alert('Forgot password flow (template placeholder).')}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[10px] py-[13px] text-[14px] font-bold tracking-[0.3px] text-white transition hover:-translate-y-px hover:opacity-93 active:translate-y-0 disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #7F77DD 0%, #3C3489 100%)',
                  boxShadow: '0 4px 16px rgba(83,74,183,0.4)',
                }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              {/* Server error */}
              {serverError && (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {serverError}
                </div>
              )}

        



            </form>

            {/* Powered by */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#AFA9EC]" />
              <span className="text-[11.5px]" style={{ color: '#7C7A9A' }}>Powered by</span>
              <span className="text-[11.5px] font-bold tracking-[0.2px]" style={{ color: '#534AB7' }}>
                Yencode Technologies
              </span>
              <span className="h-1 w-1 rounded-full bg-[#AFA9EC]" />
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}