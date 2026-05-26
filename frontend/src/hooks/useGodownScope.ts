import { useMemo } from 'react'
import { useAuth } from '../auth/store'

export function useGodownScope() {
  const auth = useAuth()

  return useMemo(() => {
    const isGodown = auth.status === 'authenticated' && auth.user.role === 'GODOWN'
    const godownId = isGodown ? auth.user.godownId : undefined
    const godownName =
      isGodown && auth.user.godownName
        ? auth.user.godownName
        : isGodown && auth.user.siteName
          ? auth.user.siteName
          : undefined

    return {
      isGodown,
      godownId,
      godownName,
      godownBasePath: godownId ? `/godowns/${godownId}` : undefined,
    }
  }, [auth])
}
