import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { apiFetch } from '../../lib/api'
import { getToken, useAuth } from '../../auth/store'
import { formatDateTime } from '../../lib/format'
import { API_BASE } from '../../lib/api'

type Delivery = {
  id: string
  deliveryNo: string
  customerName: string
  siteName?: string
  siteAddress?: string
  contactPhone?: string
  fromGodownId: string
  deliveryAt: string
  returnExpectedAt?: string
  status: string
  lines: Array<{ productId: string; qty: number }>
  dispatchedTagIds: string[]
  deliveredTagIds: string[]
  returnedTagIds: string[]
  lostTagIds: string[]
  damagedTagIds: string[]
}

type ScanAction = 'dispatch' | 'deliver' | 'return'

function endpoint(action: ScanAction) {
  if (action === 'dispatch') return 'dispatch-scan'
  if (action === 'deliver') return 'deliver-scan'
  return 'return-scan'
}

function badgeVariant(status: string) {
  if (status === 'UPCOMING') return 'blue'
  if (status === 'DISPATCHED') return 'green'
  if (status === 'DELIVERED') return 'amber'
  if (status === 'PENDING_RETURN') return 'amber'
  if (status === 'COMPLETED') return 'slate'
  return 'slate'
}

export function ScanDeliveryPage({ action }: { action: ScanAction }) {
  const { id } = useParams()
  const nav = useNavigate()
  const auth = useAuth()
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [tagId, setTagId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const title = useMemo(() => {
    if (action === 'dispatch') return 'Dispatch scan'
    if (action === 'deliver') return 'Delivery confirmation'
    return 'Return scan'
  }, [action])

  const allowed = useMemo(() => {
    if (auth.status !== 'authenticated') return false
    if (auth.user.role === 'ADMIN') return true
    if (action === 'deliver') return auth.user.role === 'DELIVERY'
    return auth.user.role === 'GODOWN'
  }, [auth, action])

  useEffect(() => {
    inputRef.current?.focus()
  }, [id, action])

  const load = () => {
    const token = getToken()
    if (!token || !id) return
    setError(null)
    apiFetch<Delivery>(`/deliveries/${id}`, { token })
      .then(setDelivery)
      .catch((e: any) => setError(e?.message || 'Failed to load delivery'))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const submit = async () => {
    const token = getToken()
    if (!token || !id) return
    const t = tagId.trim()
    if (!t) return
    setLoading(true)
    setError(null)
    try {
      await apiFetch(`/deliveries/${id}/${endpoint(action)}`, {
        method: 'POST',
        token,
        body: JSON.stringify({ tagId: t }),
      })
      setTagId('')
      load()
      inputRef.current?.focus()
    } catch (e: any) {
      setError(e?.message || 'Scan failed')
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const closeReturn = async () => {
    const token = getToken()
    if (!token || !id) return
    setLoading(true)
    setError(null)
    try {
      await apiFetch(`/deliveries/${id}/close-return`, { method: 'POST', token })
      load()
    } catch (e: any) {
      setError(e?.message || 'Close return failed')
    } finally {
      setLoading(false)
    }
  }

  const openChallan = async () => {
    const token = getToken()
    if (!token || !id) return
    try {
      const res = await fetch(`${API_BASE}/deliveries/${id}/challan.pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to generate PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e: any) {
      setError(e?.message || 'Failed to open challan')
    }
  }

  if (!allowed) {
    return (
      <div className="fade-in">
        <PageHeader title={title} subtitle="You don't have access to this scan screen." />
        <Button variant="secondary" onClick={() => nav('/deliveries')}>
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <PageHeader
        title={title}
        subtitle={delivery ? `${delivery.deliveryNo} • ${delivery.customerName}` : 'Loading delivery…'}
        right={
          <Button variant="secondary" onClick={() => nav('/deliveries')}>
            Back
          </Button>
        }
      />

      {error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Scan items</CardTitle>
            {delivery ? <Badge variant={badgeVariant(delivery.status)}>{delivery.status}</Badge> : null}
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Tag ID (RFID / Barcode)"
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              placeholder="Scan or type tag id…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
              ref={(el) => {
                inputRef.current = el
              }}
            />
            <div className="flex gap-2">
              <Button onClick={submit} disabled={loading}>
                {loading ? 'Saving…' : 'Submit scan'}
              </Button>
              {action === 'return' ? (
                <Button variant="secondary" onClick={closeReturn} disabled={loading}>
                  Close return
                </Button>
              ) : null}
            </div>
            <div className="text-xs text-slate-600">
              Tip: a USB/Bluetooth scanner will type into this field. Keep focus here.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {delivery ? (
              <>
                <div className="text-slate-700">
                  Delivery at: <span className="font-semibold">{formatDateTime(delivery.deliveryAt)}</span>
                </div>
                <div className="text-slate-700">
                  Site: <span className="font-semibold">{delivery.siteName || delivery.siteAddress || '—'}</span>
                </div>
                <div className="pt-2 text-xs text-slate-500">
                  Dispatch: {delivery.dispatchedTagIds.length} • Delivered: {delivery.deliveredTagIds.length} • Returned:{' '}
                  {delivery.returnedTagIds.length}
                </div>
                <div className="pt-3">
                  <Button variant="secondary" size="sm" onClick={openChallan}>
                    Open challan PDF
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-slate-600">Loading…</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

