import { useSyncExternalStore } from 'react'
import { db, loadDb, subscribe } from './db'
import type { Db } from './seed'

export function useDb(): Db {
  return useSyncExternalStore(
    subscribe,
    () => loadDb(),
    () => loadDb(),
  )
}

export { db }

