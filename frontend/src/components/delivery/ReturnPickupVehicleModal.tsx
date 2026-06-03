import { VehicleNumberModal } from './VehicleNumberModal'

type Props = {
  open: boolean
  busy?: boolean
  onClose: () => void
  onConfirm: (vehicleNumber: string) => void | Promise<void>
}

export function ReturnPickupVehicleModal({ open, busy, onClose, onConfirm }: Props) {
  return (
    <VehicleNumberModal
      open={open}
      title="Assign return pickup"
      description="Enter vehicle number for the driver collecting returns."
      confirmLabel="Assign"
      busy={busy}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
