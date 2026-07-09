// // import { apiFetch } from './api'

// // type VehicleResponse = {
// //   status: string
// //   vehicleLabel?: string
// // }

// // /** Assign vehicle when moving to out for delivery, or update it when already out. */
// // export async function postDeliveryVehicle(
// //   deliveryId: string,
// //   token: string,
// //   vehicleNumber: string,
// //   _currentStatus?: string,
// //   _options?: { forAdmin?: boolean },
// // ): Promise<VehicleResponse> {
// //   // out-for-delivery handles new assignments, admin overrides, and vehicle changes
// //   // while already OUT_FOR_DELIVERY (see backend outForDelivery controller).
// //   return apiFetch<VehicleResponse>(`/deliveries/${deliveryId}/out-for-delivery`, {
// //     token,
// //     method: 'POST',
// //     body: JSON.stringify({ vehicleNumber }),
// //   })
// // }

// import { apiFetch } from './api'

// type VehicleResponse = {
//   status: string
//   vehicleLabel?: string
//   driverName?: string
//   driverPhone?: string
// }

// export async function postDeliveryVehicle(
//   deliveryId: string,
//   token: string,
//   vehicleNumber: string,
//   _currentStatus?: string,
//   _options?: { forAdmin?: boolean },
//   driverName?: string,
//   driverPhone?: string,
// ): Promise<VehicleResponse> {
//   const payload = {
//     vehicleNumber,
//     ...(driverName ? { driverName } : {}),
//     ...(driverPhone ? { driverPhone } : {}),
//   }

//   return apiFetch<VehicleResponse>(
//     `/deliveries/${deliveryId}/out-for-delivery`,
//     {
//       token,
//       method: 'POST',
//       body: JSON.stringify(payload),
//     }
//   )
// }

import { apiFetch } from './api'

type VehicleResponse = {
  status: string
  vehicleLabel?: string
  driverName?: string
  driverPhone?: string
  vehicleType?: 'PRIVATE' | 'PORTER' | 'OWN'
}

export async function postDeliveryVehicle(
  deliveryId: string,
  token: string,
  vehicleNumber: string,
  _currentStatus?: string,
  _options?: { forAdmin?: boolean },
  driverName?: string,
  driverPhone?: string,
  vehicleType?: 'PRIVATE' | 'PORTER' | 'OWN',
): Promise<VehicleResponse> {
  const payload = {
    vehicleNumber,
    ...(driverName ? { driverName } : {}),
    ...(driverPhone ? { driverPhone } : {}),
    ...(vehicleType ? { vehicleType } : {}),
  }

  return apiFetch<VehicleResponse>(
    `/deliveries/${deliveryId}/out-for-delivery`,
    {
      token,
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}