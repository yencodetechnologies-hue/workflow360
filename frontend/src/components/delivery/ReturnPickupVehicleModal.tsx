import { VehicleNumberModal, type VehicleType } from './VehicleNumberModal'

export type ReturnPickupAssignPayload = {
  vehicleNumber: string
  driverName: string
  driverPhone: string
  vehicleType: VehicleType
}

type Props = {
  open: boolean
  busy?: boolean
  initialValue?: string
  initialDriverName?: string
  initialDriverPhone?: string
  initialVehicleType?: VehicleType
  onClose: () => void
  onConfirm: (payload: ReturnPickupAssignPayload) => void | Promise<void>
}

export function ReturnPickupVehicleModal({
  open,
  busy,
  initialValue,
  initialDriverName,
  initialDriverPhone,
  initialVehicleType,
  onClose,
  onConfirm,
}: Props) {
  return (
    <VehicleNumberModal
      open={open}
      title="Assign return pickup"
      description="Type the driver name — matching drivers fill phone and vehicle automatically. All fields stay editable."
      confirmLabel="Assign"
      busy={busy}
      initialValue={initialValue}
      initialDriverName={initialDriverName}
      initialDriverPhone={initialDriverPhone}
      initialVehicleType={initialVehicleType}
      onClose={onClose}
      onConfirm={(vehicleNumber, driverName, driverPhone, vehicleType) =>
        onConfirm({ vehicleNumber, driverName, driverPhone, vehicleType })
      }
    />
  )
}
