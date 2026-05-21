import type React from 'react'
import {
  CalendarIcon,
  DashboardIcon,
  DeliveryIcon,
  GodownIcon,
  ProductIcon,
  ReportsIcon,
} from './icons'
import type { Role } from '../../auth/store'

export type NavItem = {
  label: string
  to: string
  icon: React.ReactNode
}

export function navItemsForRole(role: Role): NavItem[] {
  if (role === 'DELIVERY') {
    return [{ label: 'Deliveries', to: '/deliveries', icon: <DeliveryIcon /> }]
  }
  if (role === 'GODOWN') {
    return [
      { label: 'Queue', to: '/queue', icon: <DeliveryIcon /> },
      { label: 'Godowns', to: '/godowns', icon: <GodownIcon /> },

      { label: 'Calendar', to: '/calendar', icon: <CalendarIcon /> },
      { label: 'Products', to: '/products', icon: <ProductIcon /> },
      { label: 'Deliveries', to: '/deliveries', icon: <DeliveryIcon /> },
      { label: 'Reports', to: '/reports', icon: <ReportsIcon /> },
    ]
  }
  // ADMIN, BILLER
  return [
    { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
    { label: 'Godowns', to: '/godowns', icon: <GodownIcon /> },

    { label: 'Calendar', to: '/calendar', icon: <CalendarIcon /> },
    { label: 'Products', to: '/products', icon: <ProductIcon /> },
    { label: 'Deliveries', to: '/deliveries', icon: <DeliveryIcon /> },
    { label: 'Reports', to: '/reports', icon: <ReportsIcon /> },
  ]
}

