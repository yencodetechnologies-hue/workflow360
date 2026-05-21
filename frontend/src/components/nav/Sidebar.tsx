import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { navItemsForRole } from './navItems'
import { logout, useAuth } from '../../auth/store'

export function Sidebar() {
  const auth = useAuth()
  // console.log("authh",auth?.user?.email);

  const userInitial = auth.status === 'authenticated' && auth.user?.email
  ? auth.user.email.charAt(0).toUpperCase()
  : 'A';
  
  const role = auth.status === 'authenticated' ? auth.user.role : 'ADMIN'

  const navItems = navItemsForRole(role)

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col fade-in">
      <div className="flex h-full flex-col border-r border-white/20 glass shadow-xl">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg group-hover:shadow-xl transform group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
              <div className="h-6 w-6 bg-white rounded-lg opacity-90"></div>
            </div>
            <div>
              <div className="text-sm font-bold gradient-text-primary">
                Godown Manager
              </div>
              <div className="text-xs text-slate-500 font-medium">Admin Console</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4">
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 slide-up',
                    'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-primary-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 transform scale-105'
                      : 'text-slate-700 hover:bg-white/50 hover:text-primary-700 hover:shadow-md',
                  )
                }
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="opacity-90">{item.icon}</span>
                <span className="relative z-10">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="mt-8 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 gradient-text">
            Masters
          </div>
          <div className="mt-3 space-y-2">
            {[
              { label: 'Billers', to: '/masters/billers' },
              { label: 'Delivery Persons', to: '/masters/delivery-persons' },
              { label: 'Vehicles', to: '/masters/vehicles' },
            ].map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:scale-105 slide-up',
                    'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-accent-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25 transform scale-105'
                      : 'text-slate-600 hover:bg-white/50 hover:text-accent-700 hover:shadow-md',
                  )
                }
                style={{ animationDelay: `${(index + navItems.length) * 50}ms` }}
              >
                <span className="relative z-10">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-md group-hover:shadow-lg transform group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                 <span>{userInitial}</span>
              </span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-900 gradient-text">
                {auth.status === 'authenticated' ? auth.user.role : 'Admin'}
              </div>
              <div className="truncate text-xs text-slate-500 font-medium">
                {auth.status === 'authenticated' ? auth.user.email : 'admin@godown.local'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </aside>
  )
}

