import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { login } from '../auth/store'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@godown.local')
  const [password, setPassword] = useState('admin123')
  const [remember, setRemember] = useState(true)
  const [touched, setTouched] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const errors = useMemo(() => {
    if (!touched) return {}
    return {
      email: email.trim().length < 3 ? 'Enter a valid email.' : undefined,
      password: password.trim().length < 3 ? 'Enter a valid password.' : undefined,
    }
  }, [email, password, touched])

  const hasError = Boolean(errors.email || errors.password)

  return (
    <div className="min-h-full bg-slate-950">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
          <div className="absolute inset-0 opacity-50">
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
          </div>
          <div className="relative p-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/15" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Godown Manager
                </div>
                <div className="text-xs text-white/70">Admin Console</div>
              </div>
            </div>

            <div className="mt-14 max-w-md">
              <div className="text-3xl font-semibold tracking-tight text-white">
                Track deliveries. Control stock. Ship faster.
              </div>
              <div className="mt-3 text-sm leading-6 text-white/70">
                A clean, mobile-first web UI template for godown, product, and
                delivery operations.
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3">
                {[
                  { k: 'Live', v: 'Delivery tracking' },
                  { k: 'Stock', v: 'Godown overview' },
                  { k: 'Returns', v: 'Pending alerts' },
                  { k: 'Reports', v: 'Exports & trends' },
                ].map((x) => (
                  <div
                    key={x.k}
                    className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                  >
                    <div className="text-xs font-semibold text-white">{x.k}</div>
                    <div className="mt-1 text-xs text-white/70">{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-50 px-4 py-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden">
              <div className="mx-auto mb-6 h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700" />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="text-xl font-semibold text-slate-900">
                Sign in
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Use your admin credentials to continue.
              </div>

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  setTouched(true)
                  setServerError(null)
                  if (hasError) return
                  setLoading(true)
                  login(email, password)
                    .then((u) => {
                      const next =
                        u.role === 'DELIVERY'
                          ? '/deliveries'
                          : u.role === 'GODOWN'
                            ? '/queue'
                            : '/'
                      navigate(next, { replace: true })
                    })
                    .catch((err: any) => setServerError(err?.message || 'Login failed'))
                    .finally(() => setLoading(false))
                }}
              >
                <Input
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="name@company.com"
                  error={errors.email}
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="••••••••"
                  error={errors.password}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="text-sm font-medium text-slate-900 hover:text-slate-700"
                    onClick={() => alert('Forgot password flow (template placeholder).')}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button className="w-full" type="submit">
                  {loading ? 'Signing in…' : 'Continue'}
                </Button>

                {serverError ? (
                  <div className="rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-700">
                    {serverError}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    Sign in with your role account (admin/godown/delivery/biller).
                  </div>
                )}
              </form>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              By continuing you agree to your company policies.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

