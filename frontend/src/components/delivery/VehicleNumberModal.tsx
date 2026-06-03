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
  onClose: () => void
  onConfirm: (vehicleNumber: string) => void | Promise<void>
}

export function VehicleNumberModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  const [vehicleNumber, setVehicleNumber] = useState('')

  useEffect(() => {
    if (!open) setVehicleNumber('')
  }, [open])

  const handleConfirm = () => {
    const v = vehicleNumber.trim()
    if (!v) return
    void onConfirm(v)
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {description ? <p className="mb-3 text-sm text-slate-600">{description}</p> : null}
      <Input label="Vehicle number" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
      <div className="mt-4 flex gap-2">
        <Button onClick={handleConfirm} disabled={busy || !vehicleNumber.trim()}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
