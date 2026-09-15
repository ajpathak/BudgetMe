import { SCHEMA_VERSION, STORAGE_KEY } from "./types"
import { migrateStore } from "./mutations"
import { seedDemoStore } from "./seed"
import type { BudgetStore } from "./types"

export interface BudgetRepository {
  load(): Promise<BudgetStore>
  save(store: BudgetStore): Promise<void>
  clear(): Promise<void>
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

export const localStorageRepository: BudgetRepository = {
  async load() {
    if (!canUseStorage()) return seedDemoStore()
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = seedDemoStore()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    try {
      const parsed = JSON.parse(raw) as unknown
      const store = migrateStore(parsed)
      store.version = SCHEMA_VERSION
      return store
    } catch {
      return seedDemoStore()
    }
  },
  async save(store) {
    if (!canUseStorage()) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...store, version: SCHEMA_VERSION })
    )
  },
  async clear() {
    if (!canUseStorage()) return
    localStorage.removeItem(STORAGE_KEY)
  },
}

export async function swapToBackend(_endpoint: string): Promise<BudgetRepository> {
  return localStorageRepository
}
