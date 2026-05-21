import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import { getToken, useAuth } from '../auth/store'

type ProfileResponse = {
  id: string
  email?: string
  loginId?: string
  role: string
  godownId?: string
  siteName?: string
  siteAddress?: string
  contactPhone?: string
  contactName?: string
  active: boolean
}

export function AdminEditProfilePage() {
  const auth = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '',
    loginId: '',
    role: '',
    godownId: '',
    siteName: '',
    siteAddress: '',
    contactPhone: '',
    contactName: '',
    password: '',
    confirmPassword: '',
  })

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  useEffect(() => {
    const token = getToken()

    if (!token) return

    setLoading(true)
    setError(null)

    apiFetch<ProfileResponse>('/users/me', { token })
      .then((data) => {
        setForm({
          email: data.email || '',
          loginId: data.loginId || '',
          role: data.role || '',
          godownId: data.godownId || '',
          siteName: data.siteName || '',
          siteAddress: data.siteAddress || '',
          contactPhone: data.contactPhone || '',
          contactName: data.contactName || '',
          password: '',
          confirmPassword: '',
        })
      })
      .catch((e: unknown) => {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : 'Failed to load profile'

        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      setError(null)
      setSuccess(null)

      if (form.password && form.password !== form.confirmPassword) {
        setError('Password confirmation does not match')
        return
      }

      setSaving(true)

      const token = getToken()

      if (!token) {
        setError('Unauthorized')
        return
      }

      const body = {
        email: form.email.trim(),
        loginId: form.loginId.trim(),
        godownId: form.godownId.trim(),
        siteName: form.siteName.trim(),
        siteAddress: form.siteAddress.trim(),
        contactPhone: form.contactPhone.trim(),
        contactName: form.contactName.trim(),
        ...(form.password
          ? {
              password: form.password,
            }
          : {}),
      }

      await apiFetch('/users/me', {
        method: 'PUT',
        token,
        body,
      })

      setSuccess('Profile updated successfully')

      setForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }))
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Failed to update profile'

      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Admin Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage administrator profile details, credentials and account
            settings.
          </p>
        </div>

        {/* SAVE BUTTON */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="
            group inline-flex h-14 items-center justify-center
            rounded-2xl border-0
            bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600
            px-6
            text-white
            shadow-lg shadow-violet-500/25
            transition-all duration-200
            hover:scale-[1.02]
            hover:shadow-xl hover:shadow-violet-500/30
            active:scale-[0.99]
          "
        >
          <div className="flex items-center gap-3">
            {/* ICON */}
            <div
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl
                bg-white/10
                ring-1 ring-white/20
              "
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 12l5 5L20 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <span className="text-base font-semibold leading-none">
              {saving ? 'Saving...' : 'Save Changes'}
            </span>
          </div>
        </Button>
      </div>

      {/* ALERTS */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      {/* LOADING */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
        </div>
      ) : null}

      {!loading ? (
        <Card className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)]">
          {/* TOP BANNER */}
          <div className="relative h-44 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_40%)]" />

            {/* AVATAR */}
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-[30px] border-4 border-white bg-white shadow-2xl">
                  <svg
                    className="h-14 w-14 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 12a5 5 0 100-10 5 5 0 000 10z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />

                    <path
                      d="M4 21a8 8 0 0116 0"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* CAMERA */}
                <button
                  className="
                    absolute -right-1 -bottom-1
                    flex h-11 w-11 items-center justify-center
                    rounded-2xl border-4 border-white
                    bg-violet-600 text-white shadow-lg
                    transition hover:bg-violet-700
                  "
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M4 7h3l2-2h6l2 2h3v10H4V7z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />

                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <CardContent className="px-8 pb-8 pt-24">
            {/* PROFILE DETAILS */}
            <div className="mb-10 flex flex-col gap-4 border-b border-slate-100 pb-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  {form.contactName || 'Administrator'}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {form.role}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
                  Full Admin Access
                </div>

                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  {auth.status === 'authenticated' ? 'Authenticated' : 'Guest'}
                </div>
              </div>
            </div>

            {/* FORM */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Contact Name"
                value={form.contactName}
                onChange={(e) =>
                  updateField('contactName', e.target.value)
                }
                className="h-12 rounded-2xl"
              />

              <Input
                label="Login ID"
                value={form.loginId}
                onChange={(e) => updateField('loginId', e.target.value)}
                className="h-12 rounded-2xl"
              />

              <Input
                label="Email Address"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="h-12 rounded-2xl"
              />

              <Input
                label="Phone Number"
                value={form.contactPhone}
                onChange={(e) =>
                  updateField('contactPhone', e.target.value)
                }
                className="h-12 rounded-2xl"
              />

              <Input
                label="Role"
                value={form.role}
                disabled
                className="h-12 rounded-2xl bg-slate-100"
              />

              <Input
                label="Godown ID"
                value={form.godownId}
                onChange={(e) => updateField('godownId', e.target.value)}
                className="h-12 rounded-2xl"
              />

              <Input
                label="Site Name"
                value={form.siteName}
                onChange={(e) => updateField('siteName', e.target.value)}
                className="h-12 rounded-2xl"
              />

              <Input
                label="Site Address"
                value={form.siteAddress}
                onChange={(e) =>
                  updateField('siteAddress', e.target.value)
                }
                className="h-12 rounded-2xl"
              />

              <Input
                type="password"
                label="New Password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="h-12 rounded-2xl"
              />

              <Input
                type="password"
                label="Confirm Password"
                value={form.confirmPassword}
                onChange={(e) =>
                  updateField('confirmPassword', e.target.value)
                }
                className="h-12 rounded-2xl"
              />
            </div>

            {/* SECURITY CARD */}
            <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M9.5 12l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Security & Privacy
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Protect your administrator account with strong credentials
                    and updated profile information.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}