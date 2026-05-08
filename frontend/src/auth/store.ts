import { useSyncExternalStore } from 'react'
import { apiFetch } from '../lib/api'

export type Role = 'ADMIN' | 'GODOWN' | 'DELIVERY' | 'BILLER'

export type AuthUser = {
  id: string
  email: string
  role: Role
  godownId?: string
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

function readState(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { status: 'anonymous' }
  try {
    const parsed = JSON.parse(raw) as AuthState
    if (parsed && parsed.status === 'authenticated' && parsed.token && parsed.user) return parsed
    return { status: 'anonymous' }
  } catch {
    return { status: 'anonymous' }
  }
}

function writeState(next: AuthState) {
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

export async function login(email: string, password: string) {
  const res = await apiFetch<{ token: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
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

