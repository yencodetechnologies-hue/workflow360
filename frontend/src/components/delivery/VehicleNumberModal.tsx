import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { getToken } from '../../auth/store'
import { searchDrivers, type DriverSuggestion } from '../../lib/driverSearchApi'

export type VehicleType = 'PRIVATE' | 'PORTER'

type FieldKey = 'vehicleNumber' | 'driverName' | 'driverPhone'

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
  initialVehicleType = 'PRIVATE',
  onClose,
  onConfirm,
}: Props) {
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [driverName,    setDriverName]    = useState('')
  const [driverPhone,   setDriverPhone]   = useState('')
  const [vehicleType,   setVehicleType]   = useState<VehicleType>('PRIVATE')

  // Existing drivers, loaded once per open. Each of the three fields below
  // searches this same list independently (vehicle number field matches on
  // vehicle number, driver name field matches on name, phone field matches
  // on phone) — pick a suggestion from any of them to reuse that driver's
  // full details, or just keep typing to add a new one.
  const [drivers, setDrivers] = useState<DriverSuggestion[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [openField, setOpenField] = useState<FieldKey | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open) {
      setVehicleNumber(initialValue.trim())
      setDriverName(initialDriverName.trim())
      setDriverPhone(initialDriverPhone.trim())
      setVehicleType(initialVehicleType === 'PORTER' ? 'PORTER' : 'PRIVATE')
      setSelectedDriverId(null)
      setOpenField(null)

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
      setVehicleType('PRIVATE')
      setDrivers([])
      setSelectedDriverId(null)
      setOpenField(null)
    }
  }, [open, initialValue, initialDriverName, initialDriverPhone, initialVehicleType])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpenField(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const matchKey: Record<FieldKey, keyof DriverSuggestion> = {
    vehicleNumber: 'vehicleNumber',
    driverName: 'driverName',
    driverPhone: 'driverPhone',
  }

  const suggestionsFor = (field: FieldKey, value: string) => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    const key = matchKey[field]
    return drivers.filter((d) => (d[key] || '').toLowerCase().includes(q)).slice(0, 8)
  }

  const pickSuggestion = (d: DriverSuggestion) => {
    setVehicleNumber(d.vehicleNumber)
    setDriverName(d.driverName)
    setDriverPhone(d.driverPhone)
    setSelectedDriverId(d.id)
    setOpenField(null)
  }

  const fieldChanged = (field: FieldKey, value: string) => {
    setSelectedDriverId(null)
    setOpenField(value.trim() ? field : null)
    if (field === 'vehicleNumber') setVehicleNumber(value)
    if (field === 'driverName') setDriverName(value)
    if (field === 'driverPhone') setDriverPhone(value)
  }

  const handleConfirm = () => {
    void onConfirm(
      vehicleNumber.trim(),
      driverName.trim(),
      driverPhone.trim(),
      vehicleType,
    )
  }

  const renderDropdown = (field: FieldKey, value: string) => {
    if (openField !== field) return null
    const results = suggestionsFor(field, value)
    if (!results.length) return null
    return (
      <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
        {results.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => pickSuggestion(d)}
            className={
              'flex w-full items-center justify-between gap-3 border-b border-slate-50 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50 ' +
              (d.id === selectedDriverId ? 'bg-emerald-50' : 'bg-white')
            }
          >
            <span className="truncate text-sm font-semibold text-slate-900">
              {d.driverName || 'Unnamed driver'}
              <span className="ml-1.5 font-normal text-slate-400">{d.vehicleNumber}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-emerald-700">{d.driverPhone || ''}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {description ? <p className="mb-4 text-sm text-slate-600">{description}</p> : null}

      {/* Vehicle type — on/off toggle */}
      <div className="mb-4 flex items-center justify-between gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <span className="text-sm font-medium text-slate-800">
          Porter vehicle
          <span className="ml-1 font-normal text-slate-500">
            ({vehicleType === 'PORTER' ? 'On = Porter' : 'Off = Private'})
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={vehicleType === 'PORTER'}
          onClick={() => setVehicleType(vehicleType === 'PORTER' ? 'PRIVATE' : 'PORTER')}
          className={
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 ' +
            (vehicleType === 'PORTER' ? 'bg-primary-600' : 'bg-slate-300')
          }
        >
          <span
            className={
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' +
              (vehicleType === 'PORTER' ? 'translate-x-6' : 'translate-x-1')
            }
          />
        </button>
      </div>

      {selectedDriverId ? (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
            Existing driver selected
          </span>
          <button
            type="button"
            onClick={() => { setSelectedDriverId(null); setVehicleNumber(''); setDriverName(''); setDriverPhone('') }}
            className="font-semibold text-slate-500 hover:text-slate-700"
          >
            Clear / enter new driver
          </button>
        </div>
      ) : null}

      <div ref={boxRef} className="space-y-3">
        <div className="relative">
          <Input
            label="Vehicle number"
            value={vehicleNumber}
            onChange={(e) => fieldChanged('vehicleNumber', e.target.value)}
            onFocus={() => vehicleNumber.trim() && setOpenField('vehicleNumber')}
            placeholder="e.g. TN-01-AB-1234"
            autoComplete="off"
          />
          {renderDropdown('vehicleNumber', vehicleNumber)}
        </div>

        <div className="relative">
          <Input
            label="Driver name"
            value={driverName}
            onChange={(e) => fieldChanged('driverName', e.target.value)}
            onFocus={() => driverName.trim() && setOpenField('driverName')}
            placeholder="Driver's full name"
            autoComplete="off"
          />
          {renderDropdown('driverName', driverName)}
        </div>

        <div className="relative">
          <Input
            label="Driver phone number"
            value={driverPhone}
            onChange={(e) => fieldChanged('driverPhone', e.target.value)}
            onFocus={() => driverPhone.trim() && setOpenField('driverPhone')}
            placeholder="e.g. 9876543210"
            autoComplete="off"
          />
          {renderDropdown('driverPhone', driverPhone)}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button onClick={handleConfirm} disabled={busy || !vehicleNumber.trim() || !driverName.trim() || !driverPhone.trim()}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}