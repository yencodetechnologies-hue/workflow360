import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { getToken } from '../../auth/store'
import { searchDrivers, type DriverSuggestion } from '../../lib/driverSearchApi'

export type VehicleType = 'PRIVATE' | 'PORTER' | 'OWN'

type Props = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  busy?: boolean
  initialValue?: string
  initialDriverName?: string
  initialDriverPhone?: string
  initialVehicleType?: VehicleType
  onClose: () => void
  onConfirm: (
    vehicleNumber: string,
    driverName: string,
    driverPhone: string,
    vehicleType: VehicleType,
  ) => void | Promise<void>
}

export function VehicleNumberModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  busy = false,
  initialValue = '',
  initialDriverName = '',
  initialDriverPhone = '',
  initialVehicleType = 'OWN',
  onClose,
  onConfirm,
}: Props) {
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [driverName,    setDriverName]    = useState('')
  const [driverPhone,   setDriverPhone]   = useState('')
  const [vehicleType,   setVehicleType]   = useState<VehicleType>('OWN')

  // Existing drivers, loaded once per open. Each of the three fields below
  // searches this same list independently (vehicle number field matches on
  // vehicle number, driver name field matches on name, phone field matches
  // on phone) — pick a suggestion from any of them to reuse that driver's
  // full details, or just keep typing to add a new one.
  const [drivers, setDrivers] = useState<DriverSuggestion[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open) {
      setVehicleNumber(initialValue.trim())
      setDriverName(initialDriverName.trim())
      setDriverPhone(initialDriverPhone.trim())
      setVehicleType('OWN')
      setSelectedDriverId(null)

      const token = getToken()
      if (token) {
        searchDrivers('', token)
          .then((list) => {
            setDrivers(list)
            const v = initialValue.trim().toUpperCase()
            const match = v ? list.find((d) => d.vehicleNumber.toUpperCase() === v) : undefined
            if (match) setSelectedDriverId(match.id)
          })
          .catch(() => setDrivers([]))
      }
    } else {
      setVehicleNumber('')
      setDriverName('')
      setDriverPhone('')
      setVehicleType('OWN')
      setDrivers([])
      setSelectedDriverId(null)
    }
  }, [open, initialValue, initialDriverName, initialDriverPhone, initialVehicleType])

  // ── Derived lists for separate pickers ──────────────────────────────────
  // All unique drivers (by id) — for the "Select driver" dropdown
  const allDriverOptions = drivers

  // All unique vehicle numbers — for the "Select vehicle" dropdown
  const vehicleOptions = Array.from(
    new Map(drivers.filter((d) => d.vehicleNumber).map((d) => [d.vehicleNumber, d])).values()
  )

  const [driverSearch,  setDriverSearch]  = useState('')
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [driverOpen,    setDriverOpen]    = useState(false)
  const [vehicleOpen,   setVehicleOpen]   = useState(false)
  const driverBoxRef  = useRef<HTMLDivElement | null>(null)
  const vehicleBoxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open) { setDriverSearch(''); setVehicleSearch(''); setDriverOpen(false); setVehicleOpen(false) }
  }, [open])

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (driverBoxRef.current && !driverBoxRef.current.contains(e.target as Node)) setDriverOpen(false)
      if (vehicleBoxRef.current && !vehicleBoxRef.current.contains(e.target as Node)) setVehicleOpen(false)
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  const filteredDrivers = allDriverOptions.filter((d) => {
    const q = driverSearch.trim().toLowerCase()
    if (!q) return true
    return d.driverName.toLowerCase().includes(q) || d.driverPhone.toLowerCase().includes(q)
  })

  const filteredVehicles = vehicleOptions.filter((d) => {
    const q = vehicleSearch.trim().toLowerCase()
    if (!q) return true
    return d.vehicleNumber.toLowerCase().includes(q)
  })

  const pickDriver = (d: DriverSuggestion) => {
    setDriverName(d.driverName)
    setDriverPhone(d.driverPhone)
    // only pre-fill vehicle if not already typed one
    if (!vehicleNumber.trim()) setVehicleNumber(d.vehicleNumber)
    setSelectedDriverId(d.id)
    setDriverOpen(false)
    setDriverSearch('')
  }

  const pickVehicle = (d: DriverSuggestion) => {
    setVehicleNumber(d.vehicleNumber)
    // only pre-fill driver if not already typed one
    if (!driverName.trim() && !driverPhone.trim()) {
      setDriverName(d.driverName)
      setDriverPhone(d.driverPhone)
      setSelectedDriverId(d.id)
    }
    setVehicleOpen(false)
    setVehicleSearch('')
  }

  const fieldChanged = (field: 'vehicleNumber' | 'driverName' | 'driverPhone', value: string) => {
    setSelectedDriverId(null)
    if (field === 'vehicleNumber') setVehicleNumber(value)
    if (field === 'driverName') setDriverName(value)
    if (field === 'driverPhone') setDriverPhone(value)
  }

  const handleConfirm = () => {
    void onConfirm(vehicleNumber.trim(), driverName.trim(), driverPhone.trim(), vehicleType)
  }

  const inp: React.CSSProperties = {
    width: '100%', height: 36, padding: '0 10px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, color: '#111827', background: '#f9fafb',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {description ? <p className="mb-4 text-sm text-slate-600">{description}</p> : null}

      {/* Vehicle type */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <span className="mb-2 block text-sm font-medium text-slate-800">Vehicle type</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {([ { value: 'OWN', label: 'Own vehicle' }, { value: 'PRIVATE', label: 'Private' }, { value: 'PORTER', label: 'Porter' } ] as { value: VehicleType; label: string }[]).map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
              <input type="checkbox" checked={vehicleType === opt.value} onChange={() => setVehicleType(opt.value)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-400" />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div ref={boxRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Driver picker ────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Select driver</div>
          <div ref={driverBoxRef} style={{ position: 'relative' }}>
            <input
              value={driverSearch || (driverName ? `${driverName}${driverPhone ? ' · ' + driverPhone : ''}` : '')}
              onFocus={() => { setDriverSearch(''); setDriverOpen(true) }}
              onChange={(e) => { setDriverSearch(e.target.value); setDriverOpen(true); setSelectedDriverId(null) }}
              placeholder="Search by name or phone…"
              autoComplete="off"
              style={{ ...inp, paddingRight: 32 }}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>▾</span>
            {driverOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 3, zIndex: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                {filteredDrivers.length === 0 ? (
                  <div style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8' }}>No drivers found</div>
                ) : filteredDrivers.map((d) => (
                  <button key={d.id} type="button" onClick={() => pickDriver(d)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f8fafc', background: d.id === selectedDriverId ? '#ecfdf5' : '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{d.driverName || 'Unnamed'}</span>
                    <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.driverPhone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Manual name + phone inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>Driver name</div>
              <input value={driverName} onChange={(e) => fieldChanged('driverName', e.target.value)} placeholder="Full name" autoComplete="off" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>Phone</div>
              <input value={driverPhone} onChange={(e) => fieldChanged('driverPhone', e.target.value)} placeholder="Mobile" autoComplete="off" style={inp} />
            </div>
          </div>
        </div>

        {/* ── Vehicle picker ────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Select vehicle</div>
          <div ref={vehicleBoxRef} style={{ position: 'relative' }}>
            <input
              value={vehicleSearch || vehicleNumber}
              onFocus={() => { setVehicleSearch(''); setVehicleOpen(true) }}
              onChange={(e) => { setVehicleSearch(e.target.value); setVehicleOpen(true) }}
              placeholder="Search or enter vehicle number…"
              autoComplete="off"
              style={{ ...inp, paddingRight: 32 }}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>▾</span>
            {vehicleOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 3, zIndex: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                {filteredVehicles.length === 0 ? (
                  <div style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8' }}>No vehicles found</div>
                ) : filteredVehicles.map((d) => (
                  <button key={d.vehicleNumber} type="button" onClick={() => pickVehicle(d)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f8fafc', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{d.vehicleNumber}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{d.driverName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Manual entry */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>Or type vehicle number</div>
            <input value={vehicleNumber} onChange={(e) => fieldChanged('vehicleNumber', e.target.value.toUpperCase())} placeholder="e.g. TN01AB1234" autoComplete="off" style={{ ...inp, fontFamily: 'monospace', fontWeight: 700 }} />
          </div>
        </div>

      </div>

      {selectedDriverId ? (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ borderRadius: 20, background: '#ecfdf5', padding: '2px 10px', fontWeight: 700, color: '#059669' }}>Existing driver selected</span>
          <button type="button" onClick={() => { setSelectedDriverId(null); setVehicleNumber(''); setDriverName(''); setDriverPhone('') }}
            style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
            Clear / enter new driver
          </button>
        </div>
      ) : null}

      <div className="mt-5 flex gap-2">
        <Button onClick={handleConfirm} disabled={busy || !vehicleNumber.trim() || !driverName.trim() || !driverPhone.trim()}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
      </div>
    </Modal>
  )
}