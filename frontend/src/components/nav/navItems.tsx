import type React from 'react'
import {
  ActivityLogsIcon,
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

function ordersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function navItemsForRole(role: Role, godownId?: string): NavItem[] {
  if (role === 'DELIVERY') {
    return [{ label: 'My deliveries', to: '/deliveries', icon: <DeliveryIcon /> }]
  }
  if (role === 'GODOWN') {
    const myGodown = godownId ? `/godowns/${godownId}` : '/godowns'
    return [
      { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
      { label: 'My godown', to: myGodown, icon: <GodownIcon /> },
      { label: 'Orders', to: '/orders', icon: ordersIcon() },
      { label: 'Delivery Manager', to: '/deliveries', icon: <DeliveryIcon /> },
    
      { label: 'Calendar', to: '/calendar', icon: <CalendarIcon /> },
      { label: 'Reports', to: '/reports', icon: <ReportsIcon /> },
    ]
  }
  return [
    { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
    { label: 'Godowns', to: '/godowns', icon: <GodownIcon /> },
    { label: 'Calendar', to: '/calendar', icon: <CalendarIcon /> },
    { label: 'Products', to: '/products', icon: <ProductIcon /> },
    { label: 'Delivery Manager', to: '/deliveries', icon: <DeliveryIcon /> },
    { label: 'Reports', to: '/reports', icon: <ReportsIcon /> },
    { label: 'Activity Logs', to: '/activity-logs', icon: <ActivityLogsIcon /> },
  ]
}
