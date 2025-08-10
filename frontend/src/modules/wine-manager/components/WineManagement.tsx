import React, { useEffect, useMemo, useState } from 'react'
import type { FermentationLog, Wine, BottleShape } from '@/shared/types/wine'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { loadData, saveFermentationLogs, saveWines } from '@/lib/dataStore'

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 text-xs rounded text-white ${className ?? ''}`}>{children}</span>
}

function getStatusColor(status?: Wine['status']) {
  switch (status) {
    case 'fermenting':
      return 'bg-yellow-500'
    case 'aging':
      return 'bg-blue-500'
    case 'ready':
      return 'bg-green-600'
    case 'bottled':
      return 'bg-purple-600'
    default:
      return 'bg-gray-500'
  }
}

export default function WineManagement() {
  const [wines, setWines] = useState<Wine[]>([])
  const [fermentationLogs, setFermentationLogs] = useState<FermentationLog[]>([])
  const [isAddingWine, setIsAddingWine] = useState(false)
  const [editingWine, setEditingWine] = useState<Wine | null>(null)
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [showImportExport, setShowImportExport] = useState(false)

  useEffect(() => {
    // Initial load from dev API or local fallback
    loadData().then((data) => {
      setWines(data.wines)
      setFermentationLogs(data.fermentationLogs)
    })
  }, [])

  const addWine = (wineData: Omit<Wine, 'id'>) => {
    const newWine: Wine = {
      ...wineData,
      id: Date.now().toString(),
    }
    setWines((prev) => [...prev, newWine])
    setIsAddingWine(false)
    void saveWines([...wines, newWine])
  }

  const updateWine = (updatedWine: Wine) => {
    setWines((prev) => prev.map((w) => (w.id === updatedWine.id ? updatedWine : w)))
    setEditingWine(null)
    void saveWines(
      wines.map((w) => (w.id === updatedWine.id ? updatedWine : w))
    )
  }

  const confirmDelete = (id: string, name: string) => setDeleteConfirm({ id, name })

  const deleteWine = (id: string) => {
    setWines((prev) => prev.filter((w) => w.id !== id))
    setFermentationLogs((prev) => prev.filter((log) => log.wineId !== id))
    setDeleteConfirm(null)
    void saveWines(wines.filter((w) => w.id !== id))
    void saveFermentationLogs(fermentationLogs.filter((log) => log.wineId !== id))
  }

  const exportData = () => {
    const data = {
      wines,
      fermentationLogs,
      exportDate: new Date().toISOString(),
      version: '1.0',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wine-collection-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse((e.target?.result as string) || '{}')
        if (data.wines) {
          setWines(data.wines)
          void saveWines(data.wines)
        }
        if (data.fermentationLogs) {
          setFermentationLogs(data.fermentationLogs)
          void saveFermentationLogs(data.fermentationLogs)
        }
        setShowImportExport(false)
      } catch {
        // eslint-disable-next-line no-alert
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const addFermentationLog = (logData: Omit<FermentationLog, 'id'>) => {
    const newLog: FermentationLog = { ...logData, id: Date.now().toString() }
    setFermentationLogs((prev) => {
      const next = [...prev, newLog]
      void saveFermentationLogs(next)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wine Collection</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportExport(true)}>Import/Export</Button>
          <Button onClick={() => setIsAddingWine(true)}>Add Wine Batch</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wines.map((wine) => (
          <Card key={wine.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{wine.name}</CardTitle>
                  <CardDescription>
                    {wine.brand} • {wine.vintage}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(wine.status)}>{wine.status ?? 'unknown'}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium">{wine.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>ABV:</span>
                  <span className="font-medium">{wine.abv}%</span>
                </div>
                {typeof wine.currentSG === 'number' && (
                  <div className="flex justify-between">
                    <span>Current SG:</span>
                    <span className="font-medium">{wine.currentSG}</span>
                  </div>
                )}
                {Array.isArray(wine.flavors) && wine.flavors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {wine.flavors.map((flavor, index) => (
                      <span key={index} className="text-xs px-2 py-0.5 rounded border bg-gray-50">{flavor}</span>
                    ))}
                  </div>
                )}
              </div>
              {wine.labelImage && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={wine.labelImage} alt={`${wine.name} label`} className="w-full h-24 object-cover rounded" />
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setSelectedWine(wine)}>Track</Button>
                <Button variant="outline" onClick={() => setEditingWine(wine)}>Edit</Button>
                <Button variant="outline" onClick={() => confirmDelete(wine.id, wine.name)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isAddingWine && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Wine Batch</CardTitle>
            <CardDescription>Enter details for your new wine batch</CardDescription>
          </CardHeader>
          <CardContent>
            <WineForm onSubmit={addWine} onCancel={() => setIsAddingWine(false)} />
          </CardContent>
        </Card>
      )}

      {editingWine && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Wine Batch</CardTitle>
          </CardHeader>
          <CardContent>
            <WineForm
              wine={editingWine}
              onSubmit={(w) => updateWine(w as Wine)}
              onCancel={() => setEditingWine(null)}
            />
          </CardContent>
        </Card>
      )}

      {selectedWine && (
        <Card>
          <CardHeader>
            <CardTitle>Fermentation Tracking - {selectedWine.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <FermentationTracker
              wine={selectedWine}
              logs={fermentationLogs.filter((log) => log.wineId === selectedWine.id)}
              onAddLog={addFermentationLog}
            />
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setSelectedWine(null)}>Close</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {deleteConfirm && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Delete</CardTitle>
            <CardDescription>
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button onClick={() => deleteWine(deleteConfirm.id)}>Delete</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showImportExport && (
        <Card>
          <CardHeader>
            <CardTitle>Import/Export Data</CardTitle>
            <CardDescription>Backup your wine collection or import from a previous backup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Button onClick={exportData} className="w-full">Export Wine Collection</Button>
                <p className="text-sm text-gray-500 mt-1">Download your data as JSON file</p>
              </div>
              <div>
                <Label htmlFor="import-file">Import Wine Collection</Label>
                <Input id="import-file" type="file" accept=".json" onChange={importData} className="mt-1" />
                <p className="text-sm text-gray-500 mt-1">Upload a previously exported JSON file</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowImportExport(false)}>Close</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function WineForm({
  wine,
  onSubmit,
  onCancel,
}: {
  wine?: Wine
  onSubmit: (wine: Wine | Omit<Wine, 'id'>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: wine?.name || '',
    brand: wine?.brand || '',
    type: wine?.type || '',
    vintage: wine?.vintage || '',
    startDate: wine?.startDate || new Date().toISOString().split('T')[0],
    currentSG: wine?.currentSG ?? 1.0,
    targetSG: wine?.targetSG ?? 0.996,
    abv: wine?.abv ?? 0,
    status: (wine?.status || 'fermenting') as NonNullable<Wine['status']>,
    notes: wine?.notes || '',
    flavors: Array.isArray(wine?.flavors) ? wine?.flavors.join(', ') : '',
    storageLocation: wine?.storageLocation || '',
    labelImage: wine?.labelImage || '',
    visualStyle: wine?.visualStyle || {
      bottleColor: '#722F37',
      bottleShape: 'standard' as BottleShape,
      labelColor: '#FFFFFF',
      labelWrapFraction: 1/3,
    },
  })

  const [abvAuto, setAbvAuto] = useState(true)

  const computeAbv = (current: number, target: number) => {
    const delta = (Number.isFinite(current) ? current : 0) - (Number.isFinite(target) ? target : 0)
    const abv = Math.max(0, delta * 131.25)
    return Math.round(abv * 10) / 10
  }

  useEffect(() => {
    if (!abvAuto) return
    setFormData((prev) => {
      const calc = computeAbv(prev.currentSG, prev.targetSG)
      return calc === prev.abv ? prev : { ...prev, abv: calc }
    })
  }, [formData.currentSG, formData.targetSG, abvAuto])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setFormData((prev) => ({ ...prev, labelImage: (e.target?.result as string) || '' }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const wineData: Omit<Wine, 'id'> | Wine = {
      ...formData,
      flavors: formData.flavors
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
    } as unknown as Omit<Wine, 'id'>

    if (wine) {
      onSubmit({ ...(wineData as Omit<Wine, 'id'>), id: wine.id })
    } else {
      onSubmit(wineData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Wine Name</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="brand">Brand/Winery</Label>
          <Input id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} required />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <select id="type" className="h-9 px-3 rounded border w-full" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
            <option value="">Select type</option>
            <option value="red">Red Wine</option>
            <option value="white">White Wine</option>
            <option value="rosé">Rosé</option>
            <option value="sparkling">Sparkling</option>
            <option value="dessert">Dessert Wine</option>
          </select>
        </div>
        <div>
          <Label htmlFor="vintage">Vintage</Label>
          <Input id="vintage" value={formData.vintage} onChange={(e) => setFormData({ ...formData, vintage: e.target.value })} placeholder="2024" />
        </div>
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label htmlFor="currentSG">Current SG</Label>
          <Input id="currentSG" type="number" step="0.001" value={formData.currentSG} onChange={(e) => setFormData({ ...formData, currentSG: Number.parseFloat(e.target.value || '0') })} />
        </div>
        <div>
          <Label htmlFor="targetSG">Target SG</Label>
          <Input id="targetSG" type="number" step="0.001" value={formData.targetSG} onChange={(e) => setFormData({ ...formData, targetSG: Number.parseFloat(e.target.value || '0') })} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="abv">ABV %</Label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={abvAuto}
                onChange={(e) => setAbvAuto(e.target.checked)}
              />
              Auto from SG
            </label>
          </div>
          <Input
            id="abv"
            type="number"
            step="0.1"
            value={formData.abv}
            onChange={(e) => {
              setAbvAuto(false)
              setFormData({ ...formData, abv: Number.parseFloat(e.target.value || '0') })
            }}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="h-9 px-3 rounded border w-full"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as NonNullable<Wine['status']> })}
          >
            <option value="fermenting">Fermenting</option>
            <option value="aging">Aging</option>
            <option value="ready">Ready</option>
            <option value="bottled">Bottled</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="flavors">Flavors (comma-separated)</Label>
        <Input id="flavors" value={formData.flavors} onChange={(e) => setFormData({ ...formData, flavors: e.target.value })} placeholder="fruity, oaky, dry, sweet" />
      </div>

      <div>
        <Label htmlFor="labelImage">Label Image</Label>
        <Input id="labelImage" type="file" accept="image/*" onChange={handleImageUpload} className="mt-1" />
        {formData.labelImage && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={formData.labelImage} alt="Wine label" className="w-20 h-20 object-cover rounded" />
          </div>
        )}
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <h4 className="font-medium">3D Visualization Style</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="bottleColor">Bottle Color</Label>
            <Input
              id="bottleColor"
              type="color"
              value={formData.visualStyle.bottleColor}
              onChange={(e) => setFormData({ ...formData, visualStyle: { ...formData.visualStyle, bottleColor: e.target.value } })}
            />
          </div>
          <div>
            <Label htmlFor="bottleShape">Bottle Shape</Label>
            <select
              id="bottleShape"
              className="h-9 px-3 rounded border w-full"
              value={formData.visualStyle.bottleShape}
              onChange={(e) => setFormData({ ...formData, visualStyle: { ...formData.visualStyle, bottleShape: e.target.value as BottleShape } })}
            >
              <option value="standard">Standard</option>
              <option value="burgundy">Burgundy</option>
              <option value="champagne">Champagne</option>
              <option value="german">German</option>
            </select>
          </div>
          <div>
            <Label htmlFor="labelColor">Label Color</Label>
            <Input
              id="labelColor"
              type="color"
              value={formData.visualStyle.labelColor}
              onChange={(e) => setFormData({ ...formData, visualStyle: { ...formData.visualStyle, labelColor: e.target.value } })}
            />
          </div>
          <div>
            <Label htmlFor="labelWrap">Label Wrap (0.1 - 1.0)</Label>
            <input
              id="labelWrap"
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={formData.visualStyle.labelWrapFraction ?? 1/3}
              onChange={(e) => setFormData({ ...formData, visualStyle: { ...formData.visualStyle, labelWrapFraction: parseFloat(e.target.value) } })}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{((formData.visualStyle.labelWrapFraction ?? 1/3) * 100).toFixed(0)}% circumference</div>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes about this batch..." />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{wine ? 'Update' : 'Add'} Wine</Button>
      </div>
    </form>
  )
}

function FermentationTracker({
  wine,
  logs,
  onAddLog,
}: {
  wine: Wine
  logs: FermentationLog[]
  onAddLog: (log: Omit<FermentationLog, 'id'>) => void
}) {
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    sg: typeof wine.currentSG === 'number' ? wine.currentSG : 1.0,
    temperature: 20,
    notes: '',
  })

  const startingSG = useMemo(() => (logs.length > 0 ? logs[0].sg : (wine.currentSG ?? newLog.sg)), [logs, wine.currentSG, newLog.sg])
  const currentSGValue = useMemo(
    () => (logs.length > 0 ? logs[logs.length - 1].sg : (wine.currentSG ?? newLog.sg)),
    [logs, wine.currentSG, newLog.sg]
  )
  const targetSG = wine.targetSG ?? currentSGValue
  const progressPct = useMemo(() => {
    const numerator = startingSG - currentSGValue
    const denominator = startingSG - targetSG
    if (denominator <= 0) return 0
    const pct = Math.round((numerator / denominator) * 100)
    return Math.min(100, Math.max(0, Number.isFinite(pct) ? pct : 0))
  }, [startingSG, currentSGValue, targetSG])

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault()
    onAddLog({ ...newLog, wineId: wine.id })
    setNewLog((prev) => ({ ...prev, date: new Date().toISOString().split('T')[0], notes: '' }))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Fermentation Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={newLog.date} onChange={(e) => setNewLog({ ...newLog, date: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="sg">Specific Gravity</Label>
                <Input id="sg" type="number" step="0.001" value={newLog.sg} onChange={(e) => setNewLog({ ...newLog, sg: Number.parseFloat(e.target.value || '0') })} />
              </div>
              <div>
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input id="temperature" type="number" value={newLog.temperature} onChange={(e) => setNewLog({ ...newLog, temperature: Number.parseFloat(e.target.value || '0') })} />
              </div>
              <div>
                <Label htmlFor="logNotes">Notes</Label>
                <Textarea id="logNotes" value={newLog.notes} onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })} placeholder="Observations, changes, etc." />
              </div>
              <Button type="submit" className="w-full">Add Reading</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fermentation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Starting SG:</span>
                <span className="font-medium">{startingSG}</span>
              </div>
              <div className="flex justify-between">
                <span>Current SG:</span>
                <span className="font-medium">{currentSGValue}</span>
              </div>
              <div className="flex justify-between">
                <span>Target SG:</span>
                <span className="font-medium">{targetSG}</span>
              </div>
              <div className="flex justify-between">
                <span>Progress:</span>
                <span className="font-medium">{progressPct}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fermentation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No fermentation readings yet</p>
            ) : (
              [...logs]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((log) => (
                  <div key={log.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{new Date(log.date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-600">SG: {log.sg} • Temp: {log.temperature}°C</div>
                      {log.notes && <div className="text-sm text-gray-500 mt-1">{log.notes}</div>}
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

