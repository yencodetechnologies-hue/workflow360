import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { apiFetch } from '../lib/api'
import { getToken, patchAuthUser, useAuth } from '../auth/store'
import type { Role } from '../auth/store'

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

type UpdateProfileResponse = {
  message?: string
  user?: ProfileResponse
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  GODOWN: 'Godown operator',
  BILLER: 'Biller',
  DELIVERY: 'Delivery person',
}

function roleBadge(role: string) {
  if (role === 'ADMIN') return 'Full admin access'
  if (role === 'GODOWN') return 'Godown access'
  if (role === 'BILLER') return 'Biller access'
  return 'Account access'
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

  const role = form.role as Role
  const showSiteFields = role === 'BILLER' || role === 'GODOWN'
  const showGodownId = role === 'GODOWN'

  const pageTitle = useMemo(() => {
    if (role === 'ADMIN') return 'Admin profile'
    if (role === 'GODOWN') return 'Godown profile'
    if (role === 'BILLER') return 'Biller profile'
    return 'My profile'
  }, [role])

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = getToken()
        if (!token) {
          setError('Unauthorized')
          return
        }

        const data = await apiFetch<ProfileResponse>('/users/me', { token })

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
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : 'Failed to load profile'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSave = async () => {
    try {
      setError(null)
      setSuccess(null)

      if (form.password && form.password !== form.confirmPassword) {
        setError('Passwords do not match')
        return
      }

      const token = getToken()
      if (!token) {
        setError('Unauthorized')
        return
      }

      setSaving(true)

      const payload: Record<string, string> = {
        email: form.email.trim(),
        loginId: form.loginId.trim(),
        contactPhone: form.contactPhone.trim(),
        contactName: form.contactName.trim(),
      }

      if (showSiteFields) {
        payload.siteName = form.siteName.trim()
        payload.siteAddress = form.siteAddress.trim()
      }

      if (showGodownId) {
        payload.godownId = form.godownId.trim()
      }

      if (form.password) {
        payload.password = form.password
      }

      const res = await apiFetch<UpdateProfileResponse>('/users/me', {
        method: 'PUT',
        token,
        body: JSON.stringify(payload),
      })

      const updated = res.user
      if (updated) {
        patchAuthUser({
          email: updated.email,
          loginId: updated.loginId,
          contactName: updated.contactName,
          contactPhone: updated.contactPhone,
          siteName: updated.siteName,
          siteAddress: updated.siteAddress,
          godownId: updated.godownId,
        })
      }

      setSuccess(res.message || 'Profile updated successfully')
      setForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }))
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Profile update failed'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const displayName =
    form.contactName ||
    (auth.status === 'authenticated' ? auth.user.email : null) ||
    roleLabels[form.role] ||
    'User'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Update your account details, contact information, and password.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="group inline-flex h-14 items-center justify-center rounded-2xl border-0 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-6 text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
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
              {saving ? 'Saving...' : 'Save changes'}
            </span>
          </div>
        </Button>
      </div>

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

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
        </div>
      ) : null}

      {!loading ? (
        <Card className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)]">
          <div className="relative h-40 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_40%)]" />
          </div>

          <CardContent className="p-8">
            <div className="mb-10 flex flex-col gap-5 border-b border-slate-100 pb-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700 shadow-inner">
                  <span className="text-3xl font-bold">
                    {(form.email || form.loginId || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{displayName}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {roleLabels[form.role] || form.role}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
                  {roleBadge(form.role)}
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  {auth.status === 'authenticated' ? 'Signed in' : 'Guest'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Contact name"
                value={form.contactName}
                onChange={(e) => updateField('contactName', e.target.value)}
                className="h-12 rounded-2xl"
              />

              <Input
                label="Login ID"
                value={form.loginId}
                onChange={(e) => updateField('loginId', e.target.value)}
                className="h-12 rounded-2xl"
              />

              <Input
                label="Email address"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="h-12 rounded-2xl"
              />

              <Input
                label="Phone number"
                value={form.contactPhone}
                onChange={(e) => updateField('contactPhone', e.target.value)}
                className="h-12 rounded-2xl"
              />

              <Input
                label="Role"
                value={form.role}
                disabled
                className="h-12 rounded-2xl bg-slate-100"
              />

              {showGodownId ? (
                <Input
                  label="Godown ID"
                  value={form.godownId}
                  onChange={(e) => updateField('godownId', e.target.value)}
                  className="h-12 rounded-2xl"
                />
              ) : null}

              {showSiteFields ? (
                <>
                  <Input
                    label="Site name"
                    value={form.siteName}
                    onChange={(e) => updateField('siteName', e.target.value)}
                    className="h-12 rounded-2xl"
                  />

                  <Input
                    label="Site address"
                    value={form.siteAddress}
                    onChange={(e) => updateField('siteAddress', e.target.value)}
                    className="h-12 rounded-2xl"
                  />
                </>
              ) : null}

              <Input
                type="password"
                label="New password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="h-12 rounded-2xl"
                placeholder="Leave blank to keep current password"
              />

              <Input
                type="password"
                label="Confirm password"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>

            <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
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
                  <h3 className="text-lg font-bold text-slate-900">Security</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Use a strong password. Changes apply immediately after you save.
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
