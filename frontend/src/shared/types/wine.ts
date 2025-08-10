export type BottleShape = 'standard' | 'burgundy' | 'champagne' | 'german'

export interface WineVisualStyle {
  bottleColor: string
  bottleShape: BottleShape
  labelColor: string
}

export interface Wine {
  id: string
  name: string
  brand: string
  type: string
  vintage: string
  startDate?: string
  currentSG?: number
  targetSG?: number
  abv: number
  status?: 'fermenting' | 'aging' | 'ready' | 'bottled'
  notes?: string
  flavors: string[]
  storageLocation?: string
  labelImage?: string
  visualStyle: WineVisualStyle
}

export interface FermentationLog {
  id: string
  wineId: string
  date: string
  sg: number
  temperature: number
  notes: string
}

export interface WinePosition {
  wineId: string
  wineName: string
  x: number
  y: number
}

export type StorageType = 'rack' | 'box' | 'cellar' | 'fridge'

export interface StorageVisualStyle {
  rackColor: string
  rackMaterial: 'wood' | 'metal' | 'plastic'
  backgroundColor: string
}

export interface StorageLocation {
  id: string
  name: string
  type: StorageType
  width: number
  height: number
  capacity: number
  description: string
  wines: WinePosition[]
  visualStyle: StorageVisualStyle
}

