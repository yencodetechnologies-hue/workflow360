
  import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { login } from '../auth/store'
import workflow from '../assets/workflowlogo.jpeg'

export function LoginPage() {
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [touched, setTouched] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const errors = useMemo(() => {
    if (!touched) return {}

    return {
      identifier:
        identifier.trim().length < 1
          ? 'Enter your email or mobile number.'
          : undefined,
      password:
        password.trim().length < 6
          ? 'Password must be at least 6 characters.'
          : undefined,
    }
  }, [identifier, password, touched])

  const hasError = Boolean(errors.identifier || errors.password)

  return (
    <div className="h-screen overflow-hidden bg-[#101010] p-3">
      <div className="mx-auto flex h-full max-w-[1500px] overflow-hidden rounded-[28px] bg-white shadow-2xl">

        {/* LEFT SIDE */}
        <div className="relative hidden w-1/2 lg:block">

          {/* IMAGE */}
          <img
            // src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1600&auto=format&fit=crop"
               src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1800&auto=format&fit=crop"
            alt="Delivery"
            className="h-full w-full object-cover"
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-black/20" />

          {/* CONTENT */}
          <div className="absolute bottom-8 left-8 right-8">

            {/* TITLE */}
            <h1 className="max-w-xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white">
              Send and receive
              <br />
              your packages
              <span className="mt-1 block text-[#ff4d4f]">
                in record time
              </span>
            </h1>

            {/* SUBTITLE */}
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/90">
              Manage deliveries, monitor stock, and streamline logistics
              operations with a modern admin dashboard experience.
            </p>

            {/* FEATURES */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                {
                  title: 'Live Tracking',
                  desc: 'Track deliveries in real time',
                },
                {
                  title: 'Inventory',
                  desc: 'Godown stock overview',
                },
                {
                  title: 'Returns',
                  desc: 'Pending return alerts',
                },
                {
                  title: 'Reports',
                  desc: 'Analytics & exports',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-sm"
                >
                  <div className="text-base font-semibold text-white">
                    {item.title}
                  </div>

                  <div className="mt-1 text-sm text-white/75">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex w-full items-center justify-center bg-[#f4f6f9] px-3 py-3 lg:w-1/2">

          {/* LOGIN CARD */}
          <div className="w-full max-w-[380px] rounded-[22px] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">

            {/* LOGO */}
            <div className="mb-3 flex flex-col items-center">

              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                <img
                  src={workflow}
                  alt="Workflow Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* HEADING */}
              <h2 className="mt-2 text-[34px] font-bold leading-none text-[#111111]">
                Welcome Back
              </h2>

              {/* SUBTITLE */}
              <p className="mt-2 text-center text-sm text-slate-500">
                Sign in to continue managing deliveries and inventory.
              </p>
            </div>

            {/* FORM */}
            <form
              className="space-y-2.5"
              onSubmit={(e) => {
                e.preventDefault()

                setTouched(true)
                setServerError(null)

                if (hasError) return

                setLoading(true)

                login(identifier, password)
                  .then((u) => {
                    const next =
                      u.role === 'DELIVERY'
                        ? '/deliveries'
                        : u.role === 'GODOWN'
                          ? '/queue'
                          : '/'

                    navigate(next, { replace: true })
                  })
                  .catch((err: any) =>
                    setServerError(err?.message || 'Login failed')
                  )
                  .finally(() => setLoading(false))
              }}
            >

              {/* EMAIL OR MOBILE */}
              <Input
                label="Email or mobile number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="name@company.com or 9876543210"
                error={errors.identifier}
              />

              {/* PASSWORD */}
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="••••••••"
                error={errors.password}
              />

              {/* OPTIONS */}
              <div className="flex items-center justify-between pt-1">

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#ff4d4f]"
                  />

                  Remember me
                </label>

                <button
                  type="button"
                  className="text-sm font-medium text-[#ff4d4f] transition hover:text-[#e63946]"
                  onClick={() =>
                    alert(
                      'Forgot password flow (template placeholder).'
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              {/* BUTTON */}
              <Button
                className="h-10 w-full rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-sm font-semibold text-white transition hover:opacity-90"
                type="submit"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>

              {/* ERROR / INFO */}
              {serverError ? (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {serverError}
                </div>
              ) : (
             <></>
              )}
            </form>



        

          </div>
        </div>
      </div>
    </div>
  )
}


// import { useMemo, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { Button } from '../components/ui/Button'
// import { Input } from '../components/ui/Input'
// import { login } from '../auth/store'
// import workflow from '../assets/workflowlogo.jpeg'

// export function LoginPage() {
//   const navigate = useNavigate()

//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [remember, setRemember] = useState(true)
//   const [touched, setTouched] = useState(false)
//   const [serverError, setServerError] = useState<string | null>(null)
//   const [loading, setLoading] = useState(false)

//   const errors = useMemo(() => {
//     if (!touched) return {}

//     return {
//       email:
//         email.trim().length < 3
//           ? 'Enter a valid email.'
//           : undefined,

//       password:
//         password.trim().length < 3
//           ? 'Enter a valid password.'
//           : undefined,
//     }
//   }, [email, password, touched])

//   const hasError = Boolean(
//     errors.email || errors.password,
//   )

//   return (
//     <div className="h-screen overflow-hidden bg-[#0b1120]">

//       {/* MAIN WRAPPER */}
//       <div className="flex h-full w-full flex-col overflow-hidden lg:flex-row">

//         {/* LEFT SIDE */}
//         <div className="relative hidden h-full lg:flex lg:w-[58%]">

//           {/* IMAGE */}
//           <img
//             src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1800&auto=format&fit=crop"
//             alt="Delivery"
//             className="h-full w-full object-cover"
//           />

//           {/* DARK OVERLAY */}
//           <div className="absolute inset-0 bg-black/45" />

//           {/* GRADIENT */}
//           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

//           {/* CONTENT */}
//           <div className="absolute inset-x-0 bottom-0 z-10 p-8 xl:p-12">

//             {/* TITLE */}
//             <h1 className="max-w-[680px] text-5xl font-extrabold leading-[1.05] tracking-tight text-white xl:text-6xl">
//               Track deliveries.
//               <br />
//               Control stock.
//               <br />
//               Ship faster.
//             </h1>

//             {/* DESCRIPTION */}
//             <p className="mt-6 max-w-[620px] text-base leading-7 text-white/80 xl:text-lg">
//               A clean, modern warehouse and delivery
//               management platform for products, godowns,
//               logistics teams, and operations.
//             </p>

//             {/* FEATURES */}
//             <div className="mt-8 grid max-w-[720px] grid-cols-2 gap-4">

//               {[
//                 {
//                   title: 'Live Tracking',
//                   desc: 'Track deliveries in real time',
//                 },
//                 {
//                   title: 'Inventory',
//                   desc: 'Manage godown stock instantly',
//                 },
//                 {
//                   title: 'Returns',
//                   desc: 'Handle pending returns easily',
//                 },
//                 {
//                   title: 'Reports',
//                   desc: 'Analytics and operational insights',
//                 },
//               ].map((item) => (
//                 <div
//                   key={item.title}
//                   className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md"
//                 >
//                   <div className="text-base font-semibold text-white">
//                     {item.title}
//                   </div>

//                   <div className="mt-1 text-sm text-white/70">
//                     {item.desc}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* RIGHT SIDE */}
//         <div className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-[#f8fafc] px-4 py-4 sm:px-6 lg:px-10">

//           {/* BACKGROUND BLUR */}
//           <div className="absolute left-[-100px] top-[-100px] h-[220px] w-[220px] rounded-full bg-violet-500/20 blur-3xl" />

//           <div className="absolute bottom-[-120px] right-[-120px] h-[260px] w-[260px] rounded-full bg-fuchsia-500/20 blur-3xl" />

//           {/* CARD */}
//           <div className="relative z-10 w-full max-w-[460px] rounded-[32px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8 lg:p-10">

//             {/* LOGO */}
//             <div className="flex flex-col items-center">

//               <div className="flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200">

//                 <img
//                   src={workflow}
//                   alt="Workflow360"
//                   className="h-full w-full object-contain"
//                 />
//               </div>

//               {/* TITLE */}
//               <h2 className="mt-5 text-center text-4xl font-extrabold tracking-tight text-slate-900">
//                 Sign in
//               </h2>

//               {/* SUBTITLE */}
//               <p className="mt-3 max-w-[320px] text-center text-sm leading-6 text-slate-500">
//                 Use your admin credentials to continue
//                 managing deliveries and inventory.
//               </p>
//             </div>

//             {/* FORM */}
//             <form
//               className="mt-8 space-y-5"
//               onSubmit={(e) => {
//                 e.preventDefault()

//                 setTouched(true)
//                 setServerError(null)

//                 if (hasError) return

//                 setLoading(true)

//                 login(email, password)
//                   .then((u) => {
//                     const next =
//                       u.role === 'DELIVERY'
//                         ? '/deliveries'
//                         : u.role === 'GODOWN'
//                           ? '/queue'
//                           : '/'

//                     navigate(next, {
//                       replace: true,
//                     })
//                   })
//                   .catch((err: any) =>
//                     setServerError(
//                       err?.message || 'Login failed',
//                     ),
//                   )
//                   .finally(() => setLoading(false))
//               }}
//             >

//               {/* EMAIL */}
//               <Input
//                 label="Email"
//                 value={email}
//                 onChange={(e) =>
//                   setEmail(e.target.value)
//                 }
//                 onBlur={() => setTouched(true)}
//                 placeholder="sanjay@gmail.com"
//                 error={errors.email}
//               />

//               {/* PASSWORD */}
//               <Input
//                 label="Password"
//                 type="password"
//                 value={password}
//                 onChange={(e) =>
//                   setPassword(e.target.value)
//                 }
//                 onBlur={() => setTouched(true)}
//                 placeholder="••••••••"
//                 error={errors.password}
//               />

//               {/* REMEMBER */}
//               <div className="flex items-center justify-between gap-4 pt-1">

//                 <label className="flex items-center gap-3 text-sm text-slate-600">

//                   <input
//                     type="checkbox"
//                     checked={remember}
//                     onChange={(e) =>
//                       setRemember(e.target.checked)
//                     }
//                     className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
//                   />

//                   Remember me
//                 </label>

//                 <button
//                   type="button"
//                   onClick={() =>
//                     alert(
//                       'Forgot password flow (template placeholder).',
//                     )
//                   }
//                   className="text-sm font-semibold text-violet-600 transition hover:text-violet-700"
//                 >
//                   Forgot password?
//                 </button>
//               </div>

//               {/* ERROR */}
//               {serverError && (
//                 <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
//                   {serverError}
//                 </div>
//               )}

//               {/* BUTTON */}
//               <Button
//                 type="submit"
//                 disabled={loading}
//                 className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-base font-bold text-white shadow-lg transition duration-300 hover:scale-[1.01] hover:opacity-95"
//               >
//                 {loading
//                   ? 'Signing in...'
//                   : 'Continue'}
//               </Button>
//             </form>

//             {/* DIVIDER */}
//             <div className="my-6 flex items-center gap-4">

//               <div className="h-px flex-1 bg-slate-200" />

//               <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
//                 OR
//               </span>

//               <div className="h-px flex-1 bg-slate-200" />
//             </div>

//             {/* SOCIAL LOGIN */}
//             <div className="space-y-3">

//               {/* GOOGLE */}
//               <button
//                 type="button"
//                 className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
//               >
//                 <img
//                   src="https://www.svgrepo.com/show/475656/google-color.svg"
//                   alt="Google"
//                   className="h-5 w-5"
//                 />

//                 Continue with Google
//               </button>

//               {/* FACEBOOK */}
//               <button
//                 type="button"
//                 className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
//               >
//                 <img
//                   src="https://cdn-icons-png.flaticon.com/512/124/124010.png"
//                   alt="Facebook"
//                   className="h-5 w-5"
//                 />

//                 Continue with Facebook
//               </button>
//             </div>

//             {/* INFO */}
//             <div className="mt-6 rounded-2xl bg-slate-100 px-4 py-4 text-center text-sm leading-6 text-slate-600">
//               Sign in with your role account
//               (admin/godown/delivery/biller).
//             </div>

//             {/* FOOTER */}
//             <div className="mt-5 text-center text-xs leading-6 text-slate-400">
//               By continuing you agree to your company
//               policies and terms of service.
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }