import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { DeliveryIcon } from './icons'
import { navItemsForRole } from './navItems'
import { useAuth } from '../../auth/store'

function titleFromPathWithNav(pathname: string, nav: Array<{ label: string; to: string }>) {
  const found = nav.find((n) => pathname.startsWith(n.to) && n.to !== '/')
  if (found) return found.label
  return 'Godown Manager'
}

export function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const auth = useAuth()
  const role = auth.status === 'authenticated' ? auth.user.role : 'ADMIN'
  const nav = navItemsForRole(role)

  const title = useMemo(() => titleFromPathWithNav(pathname, nav), [pathname, nav])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="text-xs text-slate-500">
              Warehouse • Deliveries • Returns
            </div>
          </div>
        </div>

        <div className="hidden w-full max-w-md md:block">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search delivery / product / godown…"
            className="h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {role !== 'DELIVERY' ? (
            <Button variant="secondary" size="sm" onClick={() => navigate('/deliveries')}>
              <span className="text-slate-700">
                <DeliveryIcon />
              </span>
              Deliveries
            </Button>
          ) : null}
          <Button variant="primary" size="sm" onClick={() => navigate('/reports')}>
            Reports
          </Button>
        </div>
      </div>
    </header>
  )
}

