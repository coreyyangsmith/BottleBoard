import { useEffect, useMemo, useState } from 'react'
import type { StorageLocation, StorageType, Wine } from '@/shared/types/wine'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Grid, Package } from 'lucide-react'
import { loadData, saveStorageLocations } from '@/lib/dataStore'

export default function StorageManagement() {
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [wines, setWines] = useState<Wine[]>([])
  const [isAddingStorage, setIsAddingStorage] = useState(false)
  const [editingStorage, setEditingStorage] = useState<StorageLocation | null>(null)
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [showImportExport, setShowImportExport] = useState(false)

  useEffect(() => {
    loadData().then((data) => {
      setStorageLocations(data.storageLocations)
      setWines(data.wines)
    })
  }, [])

  const addStorage = (storageData: Omit<StorageLocation, 'id' | 'wines' | 'visualStyle'>) => {
    const newStorage: StorageLocation = {
      ...storageData,
      id: Date.now().toString(),
      wines: [],
      visualStyle: { rackColor: '#8B4513', rackMaterial: 'wood', backgroundColor: '#F5F5DC' },
    }
    setStorageLocations((prev) => [...prev, newStorage])
    setIsAddingStorage(false)
    void saveStorageLocations([...storageLocations, newStorage])
  }

  const updateStorage = (updated: StorageLocation) => {
    setStorageLocations((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setEditingStorage(null)
    void saveStorageLocations(storageLocations.map((s) => (s.id === updated.id ? updated : s)))
  }

  const confirmDeleteStorage = (id: string, name: string) => setDeleteConfirm({ id, name })

  const deleteStorage = (id: string) => {
    const next = storageLocations.filter((s) => s.id !== id)
    setStorageLocations(next)
    setDeleteConfirm(null)
    void saveStorageLocations(next)
  }

  const addWineToStorage = (storageId: string, wineId: string, x: number, y: number) => {
    const wine = wines.find((w) => w.id === wineId)
    if (!wine) return
    const next = storageLocations.map((storage) => {
      if (storage.id !== storageId) return storage
      const newWines = storage.wines.filter((w) => !(w.x === x && w.y === y))
      newWines.push({ wineId, wineName: wine.name, x, y })
      return { ...storage, wines: newWines }
    })
    setStorageLocations(next)
    void saveStorageLocations(next)
  }

  const removeWineFromStorage = (storageId: string, x: number, y: number) => {
    const next = storageLocations.map((storage) => {
      if (storage.id !== storageId) return storage
      return { ...storage, wines: storage.wines.filter((w) => !(w.x === x && w.y === y)) }
    })
    setStorageLocations(next)
    void saveStorageLocations(next)
  }

  const exportStorageData = () => {
    const data = { storageLocations, exportDate: new Date().toISOString(), version: '1.0' }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wine-storage-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importStorageData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse((e.target?.result as string) || '{}')
        if (data.storageLocations) {
          setStorageLocations(data.storageLocations)
          void saveStorageLocations(data.storageLocations)
        }
        setShowImportExport(false)
      } catch {
        // eslint-disable-next-line no-alert
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const getStorageTypeIcon = (type: StorageLocation['type']) => {
    switch (type) {
      case 'rack':
        return <Grid className="w-4 h-4" />
      case 'box':
      case 'cellar':
      case 'fridge':
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getStorageTypeColor = (type: StorageLocation['type']) => {
    switch (type) {
      case 'rack':
        return 'bg-amber-800'
      case 'box':
        return 'bg-gray-600'
      case 'cellar':
        return 'bg-stone-600'
      case 'fridge':
        return 'bg-blue-600'
      default:
        return 'bg-gray-600'
    }
  }

  const selectedStorage = useMemo(() => storageLocations.find((s) => s.id === selectedStorageId) ?? null, [storageLocations, selectedStorageId])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Storage Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportExport(true)}>Import/Export</Button>
          <Dialog open={isAddingStorage} onOpenChange={setIsAddingStorage}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Storage Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Storage Location</DialogTitle>
                <DialogDescription>Create a new storage location for your wines</DialogDescription>
              </DialogHeader>
              <StorageForm onSubmit={addStorage} onCancel={() => setIsAddingStorage(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {storageLocations.map((storage) => (
          <Card key={storage.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStorageTypeIcon(storage.type)}
                    {storage.name}
                  </CardTitle>
                  <CardDescription>{storage.description}</CardDescription>
                </div>
                <Badge className={`${getStorageTypeColor(storage.type)} capitalize`}>{storage.type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Dimensions:</span>
                  <span className="font-medium">{storage.width} × {storage.height}</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <span className="font-medium">{storage.capacity} bottles</span>
                </div>
                <div className="flex justify-between">
                  <span>Occupied:</span>
                  <span className="font-medium">{storage.wines.length} bottles</span>
                </div>
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span className="font-medium">{storage.capacity - storage.wines.length} bottles</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => setSelectedStorageId(storage.id)}>
                  <Grid className="w-4 h-4 mr-1" />
                  Manage
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingStorage(storage)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => confirmDeleteStorage(storage.id, storage.name)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Storage Dialog */}
      <Dialog open={!!editingStorage} onOpenChange={() => setEditingStorage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Storage Location</DialogTitle>
          </DialogHeader>
          {editingStorage && (
            <StorageForm storage={editingStorage} onSubmit={(s) => updateStorage(s as StorageLocation)} onCancel={() => setEditingStorage(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Storage Management Dialog */}
      <Dialog
        open={!!selectedStorageId}
        onOpenChange={(open) => {
          if (open) {
            loadData().then((data) => setWines(data.wines))
          } else {
            setSelectedStorageId(null)
          }
        }}
      >
        <DialogContent className="max-w-screen-2xl w-[98vw]">
          <DialogHeader>
            <DialogTitle>Manage Storage — {selectedStorage?.name}</DialogTitle>
            {selectedStorage && (
              <DialogDescription>
                <span className="mr-3">Dimensions: {selectedStorage.width} × {selectedStorage.height}</span>
                <span className="mr-3">Capacity: {selectedStorage.capacity}</span>
                <span className="mr-3">Occupied: {selectedStorage.wines.length}</span>
                <span>Available: {selectedStorage.capacity - selectedStorage.wines.length}</span>
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedStorage && (
            <StorageGrid storage={selectedStorage} wines={wines} onAddWine={addWineToStorage} onRemoveWine={removeWineFromStorage} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deleteConfirm?.name}"? This will remove all wine placements in this storage. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteStorage(deleteConfirm.id)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import/Export Dialog */}
      <Dialog open={showImportExport} onOpenChange={setShowImportExport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import/Export Storage Data</DialogTitle>
            <DialogDescription>Backup your storage configurations or import from a previous backup</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Button onClick={exportStorageData} className="w-full">Export Storage Configuration</Button>
              <p className="text-sm text-gray-500 mt-1">Download your storage data as JSON file</p>
            </div>
            <div>
              <Label htmlFor="import-storage-file">Import Storage Configuration</Label>
              <Input id="import-storage-file" type="file" accept=".json" onChange={importStorageData} className="mt-1" />
              <p className="text-sm text-gray-500 mt-1">Upload a previously exported JSON file</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StorageForm({
  storage,
  onSubmit,
  onCancel,
}: {
  storage?: StorageLocation
  onSubmit: (storage: StorageLocation | Omit<StorageLocation, 'id' | 'wines'>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: storage?.name || '',
    type: (storage?.type || 'rack') as StorageType,
    width: storage?.width || 6,
    height: storage?.height || 4,
    capacity: storage?.capacity || 24,
    description: storage?.description || '',
    visualStyle: storage?.visualStyle || {
      rackColor: '#8B4513',
      rackMaterial: 'wood' as const,
      backgroundColor: '#F5F5DC',
    },
  })

  useEffect(() => {
    setFormData((prev) => ({ ...prev, capacity: prev.width * prev.height }))
  }, [formData.width, formData.height])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (storage) onSubmit({ ...storage, ...formData })
    else onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Storage Name</Label>
        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="type">Storage Type</Label>
        <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value as StorageLocation['type'] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rack">Wine Rack</SelectItem>
            <SelectItem value="box">Storage Box</SelectItem>
            <SelectItem value="cellar">Wine Cellar</SelectItem>
            <SelectItem value="fridge">Wine Fridge</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="width">Width (bottles)</Label>
          <Input id="width" type="number" min={1} value={formData.width} onChange={(e) => setFormData({ ...formData, width: Number.parseInt(e.target.value || '1') })} />
        </div>
        <div>
          <Label htmlFor="height">Height (bottles)</Label>
          <Input id="height" type="number" min={1} value={formData.height} onChange={(e) => setFormData({ ...formData, height: Number.parseInt(e.target.value || '1') })} />
        </div>
      </div>
      <div>
        <Label htmlFor="capacity">Total Capacity</Label>
        <Input id="capacity" type="number" value={formData.capacity} readOnly className="bg-gray-50" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
      </div>
      <div className="space-y-4 p-4 border rounded-lg">
        <h4 className="font-medium">3D Visualization Style</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="rackColor">Rack Color</Label>
            <Input id="rackColor" type="color" value={formData.visualStyle.rackColor} onChange={(e) => setFormData({ ...formData, visualStyle: { ...formData.visualStyle, rackColor: e.target.value } })} />
          </div>
          <div>
            <Label htmlFor="rackMaterial">Material</Label>
            <Select value={formData.visualStyle.rackMaterial} onValueChange={(value: string) => setFormData({ ...formData, visualStyle: { ...formData.visualStyle, rackMaterial: value as 'wood' | 'metal' | 'plastic' } })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wood">Wood</SelectItem>
                <SelectItem value="metal">Metal</SelectItem>
                <SelectItem value="plastic">Plastic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="backgroundColor">Background</Label>
            <Input id="backgroundColor" type="color" value={formData.visualStyle.backgroundColor} onChange={(e) => setFormData({ ...formData, visualStyle: { ...formData.visualStyle, backgroundColor: e.target.value } })} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{storage ? 'Update' : 'Add'} Storage</Button>
      </div>
    </form>
  )
}

function StorageGrid({
  storage,
  wines,
  onAddWine,
  onRemoveWine,
}: {
  storage: StorageLocation
  wines: Wine[]
  onAddWine: (storageId: string, wineId: string, x: number, y: number) => void
  onRemoveWine: (storageId: string, x: number, y: number) => void
}) {
  const [selectedWine, setSelectedWine] = useState<string>('')
  // reserved for future filtering controls

  const getWineAtPosition = (x: number, y: number) => storage.wines.find((w) => w.x === x && w.y === y)

  const handlePositionClick = (x: number, y: number) => {
    const existingWine = getWineAtPosition(x, y)
    if (existingWine) {
      onRemoveWine(storage.id, x, y)
    } else if (selectedWine) {
      // Allow adding multiple bottles of the selected wine across different slots
      onAddWine(storage.id, selectedWine, x, y)
    }
  }

  const availableWines = useMemo(() => wines.filter((wine) => !storage.wines.some((w) => w.wineId === wine.id)), [wines, storage.wines])
  const winesInThisStorage = useMemo(() => wines.filter((wine) => storage.wines.some((w) => w.wineId === wine.id)), [wines, storage.wines])
  const allSelectableWines = useMemo(() => [...availableWines, ...winesInThisStorage], [availableWines, winesInThisStorage])

  const wineById = useMemo(() => new Map(wines.map((w) => [w.id, w])), [wines])
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const pos of storage.wines) {
      const w = wineById.get(pos.wineId)
      if (!w) continue
      const t = (w.type || 'unknown').toLowerCase()
      counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [storage.wines, wineById])
  const typeOrder = ['red', 'white', 'rosé', 'rose', 'sparkling', 'dessert']
  const typeEntries = useMemo(() => {
    const entries = Object.entries(typeCounts)
    entries.sort((a, b) => {
      const ia = typeOrder.indexOf(a[0])
      const ib = typeOrder.indexOf(b[0])
      if (ia === -1 && ib === -1) return a[0].localeCompare(b[0])
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
    return entries
  }, [typeCounts])

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Label htmlFor="wineSelect">Select Wine to Place</Label>
          <Select value={selectedWine} onValueChange={(value: string) => setSelectedWine(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a wine..." />
            </SelectTrigger>
            <SelectContent>
              {allSelectableWines.length === 0 && (
                <div className="px-2 py-1 text-sm text-gray-500">No wines available</div>
              )}
              {allSelectableWines.map((wine) => {
                const isInStorage = storage.wines.some((w) => w.wineId === wine.id)
                return (
                  <SelectItem key={wine.id} value={wine.id}>
                    {wine.name} ({wine.brand}) {isInStorage && '(currently placed)'}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-600">{selectedWine ? 'Click empty slot to place wine' : 'Click occupied slot to remove wine'}</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="rounded-xl border bg-white p-4">
            <div
              className="grid mx-auto"
              style={{
                gridTemplateColumns: `repeat(${storage.width}, 1fr)`,
                gap: '6px',
                width: '100%',
                maxWidth: `${Math.min(storage.width * 56, 960)}px`,
              }}
            >
              {Array.from({ length: storage.height }, (_, y) =>
                Array.from({ length: storage.width }, (_, x) => {
                  const wine = getWineAtPosition(x, y)
                  const wineData = wine ? wineById.get(wine.wineId) : undefined
                  const bottleColor = wineData?.visualStyle?.bottleColor || '#722F37'
                  const hasWine = Boolean(wine)
                  const classes = hasWine
                    ? 'text-white'
                    : selectedWine
                      ? 'bg-green-100 hover:bg-green-200 border-green-300'
                      : 'bg-white hover:bg-gray-100'
                  const style = hasWine ? ({ backgroundColor: bottleColor } as React.CSSProperties) : undefined
                  const tooltip = hasWine
                    ? `${wine?.wineName} • ${wineData?.brand ?? ''} ${wineData?.vintage ?? ''} (slot ${x + 1}, ${y + 1})\nClick to remove`
                    : `Position ${x + 1}, ${y + 1} - ${selectedWine ? 'Click to place wine' : 'Empty'}`
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`aspect-square border rounded-md cursor-pointer flex items-center justify-center text-[10px] transition-colors ${classes}`}
                      style={style}
                      onClick={() => handlePositionClick(x, y)}
                      title={tooltip}
                    >
                      {hasWine ? '🍷' : ''}
                    </div>
                  )
                })
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm mt-4">
            <div>
              <strong>Legend:</strong>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-800 rounded" /><span>Occupied (click to remove)</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border rounded" /><span>Empty</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 border border-green-300 rounded" /><span>Ready to place</span></div>
              </div>
            </div>
            <div>
              <strong>Storage Info:</strong>
              <div className="mt-2 space-y-1">
                <div>Capacity: {storage.capacity} bottles</div>
                <div>Occupied: {storage.wines.length} bottles</div>
                <div>Available: {storage.capacity - storage.wines.length} bottles</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <div className="font-medium text-sm mb-2">Bottle counts by type</div>
            {typeEntries.length === 0 ? (
              <div className="text-sm text-gray-500">No bottles placed</div>
            ) : (
              <div className="space-y-1 text-sm">
                {typeEntries.map(([type, count]) => (
                  <div key={type} className="flex justify-between"><span className="capitalize">{type}</span><span className="font-medium">{count}</span></div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border bg-white p-4 max-h-64 overflow-y-auto">
            <div className="font-medium text-sm mb-2">Placed Wines</div>
            {storage.wines.length === 0 ? (
              <div className="text-sm text-gray-500">No wines placed in this storage</div>
            ) : (
              <div className="space-y-1">
                {storage.wines.map((winePos, index) => {
                  const wineData = wineById.get(winePos.wineId)
                  return (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded border grid grid-cols-[1fr_auto] gap-1">
                      <div>
                        <div className="font-medium leading-tight">{winePos.wineName}</div>
                        <div className="text-gray-600 leading-tight">({winePos.x + 1}, {winePos.y + 1}) • {wineData?.brand ?? ''} {wineData?.vintage ?? ''}</div>
                      </div>
                      <div className="text-xs text-gray-500 self-center">{wineData?.type ?? ''}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

