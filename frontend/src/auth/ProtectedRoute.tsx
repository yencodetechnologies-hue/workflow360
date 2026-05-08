import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './store'
import type { Role } from './store'

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const auth = useAuth()
  if (auth.status !== 'authenticated') return <Navigate to="/login" replace />
  if (roles && !roles.includes(auth.user.role)) return <Navigate to="/login" replace />
  return <Outlet />
}

