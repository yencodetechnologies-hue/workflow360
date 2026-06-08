import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { getToken } from '../../auth/store'

type NotificationItem = {
  id: string
  type: string
  title: string
  body?: string
  refType?: string
  refId?: string
  readAt?: string
  createdAt: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(() => {
    const token = getToken()
    if (!token) return
    apiFetch<{ items: NotificationItem[]; unreadCount: number }>('/notifications?limit=30', { token })
      .then((res) => {
        setItems(res.items)
        setUnreadCount(res.unreadCount)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [load])

  const markRead = async (id: string) => {
    const token = getToken()
    if (!token) return
    await apiFetch(`/notifications/${id}/read`, { token, method: 'PATCH' })
    load()
  }

  const markAllRead = async () => {
    const token = getToken()
    if (!token) return
    await apiFetch('/notifications/read-all', { token, method: 'POST' })
    load()
  }

  const linkFor = (n: NotificationItem) => {
    if (n.refType === 'Delivery' && n.refId) return `/deliveries/${n.refId}`
    return '/deliveries'
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-primary-200"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 ? (
                <button type="button" className="text-xs font-semibold text-primary-600" onClick={markAllRead}>
                  Mark all read
                </button>
              ) : null}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-slate-500">No notifications</li>
              ) : (
                items.map((n) => (
                  <li key={n.id} className="border-b border-slate-50 last:border-0">
                    <Link
                      to={linkFor(n)}
                      onClick={() => {
                        if (!n.readAt) void markRead(n.id)
                        setOpen(false)
                      }}
                      className={`block px-4 py-3 hover:bg-slate-50 ${!n.readAt ? 'bg-primary-50/50' : ''}`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                      {n.body ? <div className="mt-0.5 text-xs text-slate-600">{n.body}</div> : null}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  )
}
