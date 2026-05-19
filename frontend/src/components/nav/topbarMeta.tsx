import type React from 'react'
import {
  CalendarIcon,
  DashboardIcon,
  DeliveryIcon,
  GodownIcon,
  ProductIcon,
  ReportsIcon,
} from './icons'

export type Breadcrumb = {
  label: string
  to?: string
}

export type TopbarMeta = {
  title: string
  subtitle: string
  icon: React.ReactNode
  breadcrumbs: Breadcrumb[]
}

const mastersLabels: Record<string, string> = {
  billers: 'Billers',
  'delivery-persons': 'Delivery persons',
  vehicles: 'Vehicles',
}

export function topbarMetaFromPath(pathname: string): TopbarMeta {
  if (pathname === '/' || pathname === '/dashboard') {
    return {
      title: 'Dashboard',
      subtitle: 'Overview of warehouse operations',
      icon: <DashboardIcon />,
      breadcrumbs: [{ label: 'Home', to: '/' }],
    }
  }

  if (pathname.startsWith('/calendar')) {
    return {
      title: 'Calendar',
      subtitle: 'Delivery schedule at a glance',
      icon: <CalendarIcon />,
      breadcrumbs: [{ label: 'Home', to: '/' }, { label: 'Calendar', to: '/calendar' }],
    }
  }

  if (pathname.startsWith('/godowns')) {
    const crumbs: Breadcrumb[] = [{ label: 'Home', to: '/' }, { label: 'Godowns', to: '/godowns' }]
    if (pathname !== '/godowns') crumbs.push({ label: 'Details' })
    return {
      title: pathname === '/godowns' ? 'Godowns' : 'Godown details',
      subtitle: 'Sites, stock, and inventory',
      icon: <GodownIcon />,
      breadcrumbs: crumbs,
    }
  }

  if (pathname.startsWith('/products')) {
    return {
      title: 'Products',
      subtitle: 'Catalog and pricing',
      icon: <ProductIcon />,
      breadcrumbs: [{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }],
    }
  }

  if (pathname.startsWith('/deliveries')) {
    const crumbs: Breadcrumb[] = [{ label: 'Home', to: '/' }, { label: 'Deliveries', to: '/deliveries' }]
    if (pathname.includes('/scan')) crumbs.push({ label: 'Scan' })
    else if (pathname !== '/deliveries') crumbs.push({ label: 'Details' })
    return {
      title: pathname === '/deliveries' ? 'Deliveries' : pathname.includes('/scan') ? 'Scan delivery' : 'Delivery details',
      subtitle: 'Create, assign, and track handovers',
      icon: <DeliveryIcon />,
      breadcrumbs: crumbs,
    }
  }

  if (pathname.startsWith('/reports')) {
    return {
      title: 'Reports',
      subtitle: 'Analytics and customer insights',
      icon: <ReportsIcon />,
      breadcrumbs: [{ label: 'Home', to: '/' }, { label: 'Reports', to: '/reports' }],
    }
  }

  if (pathname.startsWith('/queue')) {
    return {
      title: 'Queue',
      subtitle: 'Pending dispatch work',
      icon: <DeliveryIcon />,
      breadcrumbs: [{ label: 'Home', to: '/' }, { label: 'Queue', to: '/queue' }],
    }
  }

  if (pathname.startsWith('/masters/')) {
    const segment = pathname.split('/')[2] ?? ''
    const label = mastersLabels[segment] ?? 'Masters'
    return {
      title: label,
      subtitle: 'Master data management',
      icon: <DashboardIcon />,
      breadcrumbs: [
        { label: 'Home', to: '/' },
        { label: 'Masters' },
        { label, to: `/masters/${segment}` },
      ],
    }
  }

  return {
    title: 'Godown Manager',
    subtitle: 'Warehouse operations',
    icon: <DashboardIcon />,
    breadcrumbs: [{ label: 'Home', to: '/' }],
  }
}
