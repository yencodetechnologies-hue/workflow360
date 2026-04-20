import type React from 'react'
import {
  DashboardIcon,
  DeliveryIcon,
  GodownIcon,
  ProductIcon,
  ReportsIcon,
} from './icons'

export type NavItem = {
  label: string
  to: string
  icon: React.ReactNode
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
  { label: 'Godowns', to: '/godowns', icon: <GodownIcon /> },
  { label: 'Products', to: '/products', icon: <ProductIcon /> },
  { label: 'Deliveries', to: '/deliveries', icon: <DeliveryIcon /> },
  { label: 'Reports', to: '/reports', icon: <ReportsIcon /> },
]

