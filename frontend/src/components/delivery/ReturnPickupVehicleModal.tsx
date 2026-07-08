
// import { VehicleNumberModal } from './VehicleNumberModal'

// type Props = {
//   open: boolean
//   busy?: boolean
//   initialValue?: string
//   initialDriverName?: string
//   initialDriverPhone?: string
//   onClose: () => void
//   onConfirm: (vehicleNumber: string, driverName: string, driverPhone: string) => void | Promise<void>
// }

// export function ReturnPickupVehicleModal({
//   open,
//   busy,
//   initialValue,
//   initialDriverName,
//   initialDriverPhone,
//   onClose,
//   onConfirm,
// }: Props) {
//   return (
//     <VehicleNumberModal
//       open={open}
//       title="Assign return pickup"
//       description="Enter the vehicle number and driver details for the driver collecting returns."
//       confirmLabel="Assign"
//       busy={busy}
//       initialValue={initialValue}
//       initialDriverName={initialDriverName}
//       initialDriverPhone={initialDriverPhone}
//       onClose={onClose}
//       onConfirm={onConfirm}
//     />
//   )
// }


import { VehicleNumberModal, type VehicleType } from './VehicleNumberModal'

type Props = {
  open: boolean
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
      description="Enter the vehicle number and driver details for the driver collecting returns."
      confirmLabel="Assign"
      busy={busy}
      initialValue={initialValue}
      initialDriverName={initialDriverName}
      initialDriverPhone={initialDriverPhone}
      initialVehicleType={initialVehicleType}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
