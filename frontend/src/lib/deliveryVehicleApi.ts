// import { apiFetch } from './api'

// type VehicleResponse = {
//   status: string
//   vehicleLabel?: string
// }

// /** Assign vehicle when moving to out for delivery, or update it when already out. */
// export async function postDeliveryVehicle(
//   deliveryId: string,
//   token: string,
//   vehicleNumber: string,
//   _currentStatus?: string,
//   _options?: { forAdmin?: boolean },
// ): Promise<VehicleResponse> {
//   // out-for-delivery handles new assignments, admin overrides, and vehicle changes
//   // while already OUT_FOR_DELIVERY (see backend outForDelivery controller).
//   return apiFetch<VehicleResponse>(`/deliveries/${deliveryId}/out-for-delivery`, {
//     token,
//     method: 'POST',
//     body: JSON.stringify({ vehicleNumber }),
//   })
// }

import { apiFetch } from './api'

type VehicleResponse = {
  status: string
  vehicleLabel?: string
  driverName?: string
  driverPhone?: string
}

export async function postDeliveryVehicle(
  deliveryId: string,
  token: string,
  vehicleNumber: string,
  _currentStatus?: string,
  _options?: { forAdmin?: boolean },
  driverName?: string,
  driverPhone?: string,
): Promise<VehicleResponse> {

   console.log('OUT FOR DELIVERY PARAMS', {
    vehicleNumber,
    driverName,
    driverPhone,
  })

  const payload = {
    vehicleNumber,
    ...(driverName ? { driverName } : {}),
    ...(driverPhone ? { driverPhone } : {}),
  }

  console.log('OUT FOR DELIVERY PAYLOAD', payload)

  return apiFetch<VehicleResponse>(
    `/deliveries/${deliveryId}/out-for-delivery`,
    {
      token,
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}