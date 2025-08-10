import type { FermentationLog, StorageLocation, Wine } from '@/shared/types/wine'

export interface CellarData {
  wines: Wine[]
  fermentationLogs: FermentationLog[]
  storageLocations: StorageLocation[]
}

const LOCAL_KEYS = {
  wines: 'wines',
  fermentationLogs: 'fermentationLogs',
  storageLocations: 'storageLocations',
} as const

function readLocalFallback(): CellarData {
  try {
    const wines = JSON.parse(localStorage.getItem(LOCAL_KEYS.wines) || '[]') as Wine[]
    const fermentationLogs = JSON.parse(localStorage.getItem(LOCAL_KEYS.fermentationLogs) || '[]') as FermentationLog[]
    const storageLocations = JSON.parse(localStorage.getItem(LOCAL_KEYS.storageLocations) || '[]') as StorageLocation[]
    return { wines, fermentationLogs, storageLocations }
  } catch {
    return { wines: [], fermentationLogs: [], storageLocations: [] }
  }
}

function writeLocalFallback(data: Partial<CellarData>): void {
  if (data.wines) localStorage.setItem(LOCAL_KEYS.wines, JSON.stringify(data.wines))
  if (data.fermentationLogs) localStorage.setItem(LOCAL_KEYS.fermentationLogs, JSON.stringify(data.fermentationLogs))
  if (data.storageLocations) localStorage.setItem(LOCAL_KEYS.storageLocations, JSON.stringify(data.storageLocations))
}

export async function loadData(): Promise<CellarData> {
  try {
    const res = await fetch('/api/data', { method: 'GET' })
    if (!res.ok) throw new Error('not ok')
    const data = (await res.json()) as Partial<CellarData>
    return {
      wines: data.wines ?? [],
      fermentationLogs: data.fermentationLogs ?? [],
      storageLocations: data.storageLocations ?? [],
    }
  } catch {
    return readLocalFallback()
  }
}

export async function saveData(partial: Partial<CellarData>): Promise<void> {
  try {
    // Merge on server to avoid races
    const current = await loadData()
    const merged: CellarData = {
      wines: partial.wines ?? current.wines,
      fermentationLogs: partial.fermentationLogs ?? current.fermentationLogs,
      storageLocations: partial.storageLocations ?? current.storageLocations,
    }
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    })
    if (!res.ok) throw new Error('not ok')
  } catch {
    writeLocalFallback(partial)
  }
}

export async function saveWines(wines: Wine[]): Promise<void> {
  return saveData({ wines })
}

export async function saveFermentationLogs(fermentationLogs: FermentationLog[]): Promise<void> {
  return saveData({ fermentationLogs })
}

export async function saveStorageLocations(storageLocations: StorageLocation[]): Promise<void> {
  return saveData({ storageLocations })
}

