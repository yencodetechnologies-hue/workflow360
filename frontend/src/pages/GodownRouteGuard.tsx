import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useGodownScope } from '../hooks/useGodownScope'

export function GodownRouteGuard() {
  const { id } = useParams()
  const { isGodown, godownId } = useGodownScope()

  if (isGodown && godownId && id && id !== godownId) {
    return <Navigate to={`/godowns/${godownId}`} replace />
  }

  return <Outlet />
}
