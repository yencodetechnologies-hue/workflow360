

import { NavLink } from 'react-router-dom'
import { navItemsForRole } from './navItems'
import { useAuth } from '../../auth/store'
import { useGodownScope } from '../../hooks/useGodownScope'

export function MobileNav() {
  const auth = useAuth()
  const { godownId } = useGodownScope()
  const role = auth.status === 'authenticated' ? auth.user.role : 'ADMIN'
  const navItems = navItemsForRole(role, godownId).slice(0, 5)

  return (
    <nav
      className="lg:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '10px 4px 8px',
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#059669' : '#94a3b8',
              textDecoration: 'none',
              borderTop: isActive ? '2px solid #059669' : '2px solid transparent',
              transition: 'color 0.15s',
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? '#059669' : '#94a3b8',
                }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: 10, lineHeight: 1.2 }}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}