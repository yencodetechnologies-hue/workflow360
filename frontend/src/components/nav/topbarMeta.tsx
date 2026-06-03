// import type React from 'react'
// import {
//   CalendarIcon,
//   DashboardIcon,
//   DeliveryIcon,
//   GodownIcon,
//   ProductIcon,
//   ReportsIcon,
// } from './icons'

// export type Breadcrumb = {
//   label: string
//   to?: string
// }

// export type TopbarMeta = {
//   title: string
//   subtitle: string
//   icon: React.ReactNode
//   breadcrumbs: Breadcrumb[]
// }

// const mastersLabels: Record<string, string> = {
//   billers: 'Billers',
//   'delivery-persons': 'Delivery persons',
// }

// export function topbarMetaFromPath(pathname: string): TopbarMeta {
//   if (pathname === '/' || pathname === '/dashboard') {
//     return {
//       title: 'Dashboard',
//       subtitle: 'Overview of warehouse operations',
//       icon: <DashboardIcon />,
//       breadcrumbs: [{ label: 'Home', to: '/' }],
//     }
//   }

//   if (pathname.startsWith('/calendar')) {
//     return {
//       title: 'Calendar',
//       subtitle: 'Delivery schedule at a glance',
//       icon: <CalendarIcon />,
//       breadcrumbs: [{ label: 'Home', to: '/' }, { label: 'Calendar', to: '/calendar' }],
//     }
//   }

//   if (pathname.startsWith('/godowns')) {
//     const crumbs: Breadcrumb[] = [{ label: 'Home', to: '/' }, { label: 'Godowns', to: '/godowns' }]
//     if (pathname !== '/godowns') crumbs.push({ label: 'Details' })
//     return {
//       title: pathname === '/godowns' ? 'Godowns' : 'Godown details',
//       subtitle: 'Sites, stock, and inventory',
//       icon: <GodownIcon />,
//       breadcrumbs: crumbs,
//     }
//   }

//   if (pathname.startsWith('/products')) {
//     return {
//       title: 'Products',
//       subtitle: 'Catalog and pricing',
//       icon: <ProductIcon />,
//       breadcrumbs: [{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }],
//     }
//   }

//   if (pathname.startsWith('/deliveries')) {
//     const crumbs: Breadcrumb[] = [{ label: 'Home', to: '/' }, { label: 'Deliveries', to: '/deliveries' }]
//     if (pathname.includes('/scan')) crumbs.push({ label: 'Scan' })
//     else if (pathname !== '/deliveries') crumbs.push({ label: 'Details' })
//     return {
//       title: pathname === '/deliveries' ? 'Deliveries' : pathname.includes('/scan') ? 'Scan delivery' : 'Delivery details',
//       subtitle: 'Create, assign, and track handovers',
//       icon: <DeliveryIcon />,
//       breadcrumbs: crumbs,
//     }
//   }

//   if (pathname.startsWith('/reports')) {
//     return {
//       title: 'Reports',
//       subtitle: 'Analytics and customer insights',
//       icon: <ReportsIcon />,
//       breadcrumbs: [{ label: 'Home', to: '/' }, { label: 'Reports', to: '/reports' }],
//     }
//   }

//   if (pathname.startsWith('/editprofile')) {
//     return {
//       title: 'Profile',
//       subtitle: 'Update your account details and password',
//       icon: <DashboardIcon />,
//       breadcrumbs: [
//         { label: 'Home', to: '/' },
//         { label: 'Profile', to: '/editprofile' },
//       ],
//     }
//   }

//   if (pathname.startsWith('/queue')) {
//     return {
//       title: 'Queue',
//       subtitle: 'Pending dispatch work',
//       icon: <DeliveryIcon />,
//       breadcrumbs: [{ label: 'Home', to: '/' }, { label: 'Queue', to: '/queue' }],
//     }
//   }

//   if (pathname.startsWith('/masters/')) {
//     const segment = pathname.split('/')[2] ?? ''
//     const label = mastersLabels[segment] ?? 'Masters'
//     return {
//       title: label,
//       subtitle: 'Master data management',
//       icon: <DashboardIcon />,
//       breadcrumbs: [
//         { label: 'Home', to: '/' },
//         { label: 'Masters' },
//         { label, to: `/masters/${segment}` },
//       ],
//     }
//   }

//   return {
//     title: 'Godown Manager',
//     subtitle: 'Warehouse operations',
//     icon: <DashboardIcon />,
//     breadcrumbs: [{ label: 'Home', to: '/' }],
//   }
// }

import type React from 'react'

// ── inline SVG icons (22×22, white stroke for topbar icon box) ─────────────

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function GodownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function ProductIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 4v4h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function ReportsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="8" y1="9" x2="10" y2="9" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

// ── types ──────────────────────────────────────────────────────────────────

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
}

// ── meta resolver ──────────────────────────────────────────────────────────

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
      breadcrumbs: [
        { label: 'Home', to: '/' },
        { label: 'Calendar', to: '/calendar' },
      ],
    }
  }

  if (pathname.startsWith('/godowns')) {
    const crumbs: Breadcrumb[] = [
      { label: 'Home', to: '/' },
      { label: 'Godowns', to: '/godowns' },
    ]
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
      breadcrumbs: [
        { label: 'Home', to: '/' },
        { label: 'Products', to: '/products' },
      ],
    }
  }

  if (pathname.startsWith('/deliveries')) {
    const crumbs: Breadcrumb[] = [
      { label: 'Home', to: '/' },
      { label: 'Deliveries', to: '/deliveries' },
    ]
    if (pathname.includes('/scan')) crumbs.push({ label: 'Scan' })
    else if (pathname !== '/deliveries') crumbs.push({ label: 'Details' })
    return {
      title:
        pathname === '/deliveries'
          ? 'Deliveries'
          : pathname.includes('/scan')
          ? 'Scan delivery'
          : 'Delivery details',
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
      breadcrumbs: [
        { label: 'Home', to: '/' },
        { label: 'Reports', to: '/reports' },
      ],
    }
  }

  if (pathname.startsWith('/editprofile')) {
    return {
      title: 'Profile',
      subtitle: 'Update your account details and password',
      icon: <ProfileIcon />,
      breadcrumbs: [
        { label: 'Home', to: '/' },
        { label: 'Profile', to: '/editprofile' },
      ],
    }
  }

  if (pathname.startsWith('/queue')) {
    return {
      title: 'Queue',
      subtitle: 'Pending dispatch work',
      icon: <DeliveryIcon />,
      breadcrumbs: [
        { label: 'Home', to: '/' },
        { label: 'Queue', to: '/queue' },
      ],
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