import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { navItems } from './navItems'

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-medium',
                isActive ? 'text-slate-900' : 'text-slate-500',
              )
            }
          >
            <span className="h-5 w-5">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}

