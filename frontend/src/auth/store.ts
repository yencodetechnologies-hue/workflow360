import { useSyncExternalStore } from 'react'
import { apiFetch } from '../lib/api'

export type Role = 'ADMIN' | 'GODOWN' | 'DELIVERY' | 'BILLER'

export type AuthUser = {
  id: string
  email?: string
  loginId?: string
  role: Role
  godownId?: string
  godownName?: string
  siteName?: string
  siteAddress?: string
  contactPhone?: string
  contactName?: string
}

type AuthState =
  | { status: 'anonymous' }
  | { status: 'authenticated'; token: string; user: AuthUser }

const STORAGE_KEY = 'workflow360_auth_v1'

type Listener = () => void
let listeners: Listener[] = []

function notify() {
  for (const l of listeners) l()
}

let cachedState: AuthState | null = null

export function readState(): AuthState {
  if (cachedState) return cachedState
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    cachedState = { status: 'anonymous' }
  } else {
    try {
      const parsed = JSON.parse(raw) as AuthState
      if (parsed && parsed.status === 'authenticated' && parsed.token && parsed.user) {
        cachedState = parsed
      } else {
        cachedState = { status: 'anonymous' }
      }
    } catch {
      cachedState = { status: 'anonymous' }
    }
  }
  return cachedState
}

function writeState(next: AuthState) {
  cachedState = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  notify()
}

export function subscribeAuth(listener: Listener) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export function useAuth() {
  return useSyncExternalStore(subscribeAuth, readState, readState)
}

export async function login(identifier: string, password: string, opts?: { useLoginId?: boolean }) {
  const trimmed = identifier.trim()
  const body = opts?.useLoginId
    ? { loginId: trimmed, password }
    : {
        identifier: trimmed.includes('@') ? trimmed.toLowerCase() : trimmed,
        password,
      }
  const res = await apiFetch<{ token: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  writeState({ status: 'authenticated', token: res.token, user: res.user })
  return res.user
}

export function logout() {
  writeState({ status: 'anonymous' })
}

export function getToken(): string | null {
  const s = readState()
  return s.status === 'authenticated' ? s.token : null
}

export function getUser(): AuthUser | null {
  const s = readState()
  return s.status === 'authenticated' ? s.user : null
}

