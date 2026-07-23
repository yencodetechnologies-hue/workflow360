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
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('OWN')

  const [drivers, setDrivers] = useState<DriverSuggestion[]>([])
  const [nameOpen, setNameOpen] = useState(false)
  const nameBoxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open) {
      setVehicleNumber(initialValue.trim())
      setDriverName(initialDriverName.trim())
      setDriverPhone(initialDriverPhone.trim())
      setVehicleType(initialVehicleType || 'OWN')
      setNameOpen(false)

      const token = getToken()
      if (token) {
        searchDrivers('', token)
          .then(setDrivers)
          .catch(() => setDrivers([]))
      }
    } else {
      setVehicleNumber('')
      setDriverName('')
      setDriverPhone('')
      setVehicleType('OWN')
      setDrivers([])
      setNameOpen(false)
    }
  }, [open, initialValue, initialDriverName, initialDriverPhone, initialVehicleType])

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (nameBoxRef.current && !nameBoxRef.current.contains(e.target as Node)) {
        setNameOpen(false)
      }
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  const q = driverName.trim().toLowerCase()
  const filteredDrivers = q
    ? drivers.filter(
        (d) =>
          d.driverName.toLowerCase().includes(q) ||
          d.driverPhone.toLowerCase().includes(q) ||
          d.vehicleNumber.toLowerCase().includes(q),
      )
    : []

  const showSuggestions = nameOpen && q.length > 0 && filteredDrivers.length > 0

  /** Click a matching name → auto-fill phone + vehicle (fields stay editable). */
  const pickDriver = (d: DriverSuggestion) => {
    setDriverName(d.driverName)
    setDriverPhone(d.driverPhone || '')
    setVehicleNumber(d.vehicleNumber || '')
    setNameOpen(false)
  }

  const handleConfirm = () => {
    void onConfirm(vehicleNumber.trim(), driverName.trim(), driverPhone.trim(), vehicleType)
  }

  const inp: React.CSSProperties = {
    width: '100%',
    height: 36,
    padding: '0 10px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    color: '#111827',
    background: '#f9fafb',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const label: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {description ? <p className="mb-4 text-sm text-slate-600">{description}</p> : null}

      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <span className="mb-2 block text-sm font-medium text-slate-800">Vehicle type</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {(
            [
              { value: 'OWN', label: 'Own vehicle' },
              { value: 'PRIVATE', label: 'Private' },
              { value: 'PORTER', label: 'Porter' },
            ] as { value: VehicleType; label: string }[]
          ).map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={vehicleType === opt.value}
                onChange={() => setVehicleType(opt.value)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-400"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={label}>Driver name</div>
          <div ref={nameBoxRef} style={{ position: 'relative' }}>
            <input
              value={driverName}
              onFocus={() => setNameOpen(true)}
              onChange={(e) => {
                setDriverName(e.target.value)
                setNameOpen(true)
              }}
              placeholder="Full name"
              autoComplete="off"
              style={inp}
            />
            {showSuggestions && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 3,
                  zIndex: 20,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {filteredDrivers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => pickDriver(d)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      border: 'none',
                      borderBottom: '1px solid #f8fafc',
                      background: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      {d.driverName || 'Unnamed'}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {[d.driverPhone, d.vehicleNumber].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={label}>Phone</div>
          <input
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
            placeholder="Mobile"
            autoComplete="off"
            style={inp}
          />
        </div>

        <div>
          <div style={label}>Vehicle number</div>
          <input
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
            placeholder="e.g. TN01AB1234"
            autoComplete="off"
            style={{ ...inp, fontFamily: 'monospace', fontWeight: 700 }}
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={busy || !vehicleNumber.trim() || !driverName.trim() || !driverPhone.trim()}
        >
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
