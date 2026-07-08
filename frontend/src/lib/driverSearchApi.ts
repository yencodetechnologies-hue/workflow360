import { apiFetch } from './api'

export type DriverSuggestion = {
  id: string
  vehicleNumber: string
  driverName: string
  driverPhone: string
}

/** Search existing drivers by vehicle number, driver name, or phone. */
export async function searchDrivers(query: string, token: string): Promise<DriverSuggestion[]> {
  const q = query.trim()
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''
  const res = await apiFetch<{ drivers: DriverSuggestion[] }>(`/deliveries/drivers/search${qs}`, {
    token,
    method: 'GET',
  })
  return res.drivers || []
}
