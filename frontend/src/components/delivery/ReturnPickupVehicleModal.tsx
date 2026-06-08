import { VehicleNumberModal } from './VehicleNumberModal'

type Props = {
  open: boolean
  busy?: boolean
  initialValue?: string
  onClose: () => void
  onConfirm: (vehicleNumber: string) => void | Promise<void>
}

export function ReturnPickupVehicleModal({ open, busy, initialValue, onClose, onConfirm }: Props) {
  return (
    <VehicleNumberModal
      open={open}
      title="Assign return pickup"
      description="Enter or update the vehicle number for the driver collecting returns."
      confirmLabel="Assign"
      busy={busy}
      initialValue={initialValue}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
