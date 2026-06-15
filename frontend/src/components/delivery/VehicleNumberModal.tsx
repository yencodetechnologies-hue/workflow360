import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'

type Props = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  busy?: boolean
  initialValue?: string
  initialDriverName?: string
  initialDriverPhone?: string
  onClose: () => void
  onConfirm: (vehicleNumber: string, driverName: string, driverPhone: string) => void | Promise<void>
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
  onClose,
  onConfirm,
}: Props) {
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [driverName,    setDriverName]    = useState('')
  const [driverPhone,   setDriverPhone]   = useState('')

  useEffect(() => {
    if (open) {
      setVehicleNumber(initialValue.trim())
      setDriverName(initialDriverName.trim())
      setDriverPhone(initialDriverPhone.trim())
    } else {
      setVehicleNumber('')
      setDriverName('')
      setDriverPhone('')
    }
  }, [open, initialValue, initialDriverName, initialDriverPhone])

  // const handleConfirm = () => {
  //   const v = vehicleNumber.trim()
  //   if (!v) return
  //   void onConfirm(v, driverName.trim(), driverPhone.trim())
  // }

  const handleConfirm = () => {
  console.log("MODAL VALUES", {
    vehicleNumber,
    driverName,
    driverPhone,
  })

  void onConfirm(
    vehicleNumber.trim(),
    driverName.trim(),
    driverPhone.trim()
  )
}

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {description ? <p className="mb-4 text-sm text-slate-600">{description}</p> : null}
      <div className="space-y-3">
        <Input
          label="Vehicle number"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          placeholder="e.g. TN-01-AB-1234"
        />
        <Input
          label="Driver name"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          placeholder="Driver's full name"
        />
        <Input
          label="Driver phone number"
          value={driverPhone}
          onChange={(e) => setDriverPhone(e.target.value)}
          placeholder="e.g. 9876543210"
        />
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