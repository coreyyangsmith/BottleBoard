import type { StorageLocation, Wine, WinePosition } from '@/shared/types/wine'
import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Box, Environment, Html } from '@react-three/drei'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Minimize, Play, Pause, SkipBack, SkipForward, Grid, ImageIcon } from 'lucide-react'
import * as THREE from 'three'
import { loadData, saveStorageLocations, saveWines } from '@/lib/dataStore'

export default function Visualization() {
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [selectedStorage, setSelectedStorage] = useState<string>('')
  const [wines, setWines] = useState<Wine[]>([])
  const [showImportExport, setShowImportExport] = useState(false)
  const [viewMode, setViewMode] = useState<'3d' | 'gallery'>('3d')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [orbitSpeed, setOrbitSpeed] = useState(0.5)
  const [autoOrbit, setAutoOrbit] = useState(false)

  const [selectedShelf, setSelectedShelf] = useState(0)
  const [currentWineIndex, setCurrentWineIndex] = useState(0)
  const [galleryAutoPlay, setGalleryAutoPlay] = useState(false)
  const [gallerySpeed, setGallerySpeed] = useState(3000)

  const [sceneSettings, setSceneSettings] = useState({
    environment: 'warehouse',
    ambientIntensity: 0.4,
    pointLightIntensity: 1.0,
    pointLightPosition: [10, 10, 10] as [number, number, number],
    backgroundColor: '#1a1a1a',
    fogEnabled: false,
    fogColor: '#404040',
    fogNear: 5,
    fogFar: 50,
    cameraFov: 60,
    shadows: true,
  })

  const [gallerySettings, setGallerySettings] = useState({
    environment: 'studio',
    ambientIntensity: 0.6,
    pointLightIntensity: 1.0,
    pointLightPosition: [5, 5, 5] as [number, number, number],
    backgroundColor: '#2a2a2a',
    fogEnabled: false,
    fogColor: '#404040',
    fogNear: 2,
    fogFar: 20,
    cameraFov: 60,
    shadows: true,
  })

  const environmentOptions = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'city', label: 'City' },
    { value: 'dawn', label: 'Dawn' },
    { value: 'forest', label: 'Forest' },
    { value: 'lobby', label: 'Lobby' },
    { value: 'night', label: 'Night' },
    { value: 'park', label: 'Park' },
    { value: 'studio', label: 'Studio' },
    { value: 'sunset', label: 'Sunset' },
    { value: 'warehouse', label: 'Warehouse' },
  ]

  const fullscreenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData().then((data) => {
      setStorageLocations(data.storageLocations)
      setWines(data.wines)
      if (data.storageLocations.length > 0) setSelectedStorage(data.storageLocations[0].id)
    })
  }, [])

  useEffect(() => {
    if (galleryAutoPlay && viewMode === 'gallery') {
      const current = storageLocations.find((s) => s.id === selectedStorage)
      if (current) {
        const shelfWines = getWinesOnShelf(current, selectedShelf)
        if (shelfWines.length > 0) {
          const interval = setInterval(() => {
            setCurrentWineIndex((prev) => (prev + 1) % shelfWines.length)
          }, gallerySpeed)
          return () => clearInterval(interval)
        }
      }
    }
    return undefined
  }, [galleryAutoPlay, gallerySpeed, selectedShelf, selectedStorage, storageLocations, viewMode])

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (fullscreenRef.current?.requestFullscreen) fullscreenRef.current.requestFullscreen()
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
    setIsFullscreen((prev) => !prev)
  }

  const exportVisualizationData = () => {
    const data = {
      storageLocations,
      wines: wines.map((wine) => ({
        id: wine.id,
        name: wine.name,
        brand: wine.brand,
        type: wine.type,
        vintage: wine.vintage,
        visualStyle: wine.visualStyle,
        labelImage: wine.labelImage,
      })),
      exportDate: new Date().toISOString(),
      version: '1.0',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wine-visualization-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importVisualizationData = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        if (data.wines) {
          // merge visual props + labelImage into existing wines
          const updatedWines = wines.map((wine) => {
            const importedWine = data.wines.find((w: Wine) => w.id === wine.id)
            if (importedWine) {
              return { ...wine, visualStyle: importedWine.visualStyle, labelImage: importedWine.labelImage }
            }
            return wine
          })
          setWines(updatedWines)
          void saveWines(updatedWines)
        }
        setShowImportExport(false)
      } catch {
        // eslint-disable-next-line no-alert
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const getWinesOnShelf = (storage: StorageLocation, shelfIndex: number) => {
    return storage.wines.filter((wine) => wine.y === shelfIndex)
  }

  const currentStorage = storageLocations.find((s) => s.id === selectedStorage)
  const shelfWines = currentStorage ? getWinesOnShelf(currentStorage, selectedShelf) : []
  const currentWine = shelfWines[currentWineIndex]
  const currentWineData = currentWine ? wines.find((w) => w.id === currentWine.wineId) : null

  const nextWine = () => {
    if (shelfWines.length > 0) setCurrentWineIndex((prev) => (prev + 1) % shelfWines.length)
  }

  const prevWine = () => {
    if (shelfWines.length > 0) setCurrentWineIndex((prev) => (prev - 1 + shelfWines.length) % shelfWines.length)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wine Cellar Visualization</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant={viewMode === '3d' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('3d')}>
              <Grid className="w-4 h-4 mr-1" />
              3D View
            </Button>
            <Button variant={viewMode === 'gallery' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('gallery')}>
              <ImageIcon className="w-4 h-4 mr-1" />
              Gallery
            </Button>
          </div>
          <Button variant="outline" onClick={() => setShowImportExport(true)}>
            Import/Export
          </Button>
          <Select value={selectedStorage} onValueChange={(value: string) => setSelectedStorage(value)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select storage location..." />
            </SelectTrigger>
            <SelectContent>
              {storageLocations.map((storage) => (
                <SelectItem key={storage.id} value={storage.id}>
                  {storage.name} ({storage.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentStorage ? (
        <div ref={fullscreenRef} className={isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}>
          {viewMode === '3d' ? (
            <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'} gap-6`}>
              <div className={isFullscreen ? 'col-span-1' : 'lg:col-span-3'}>
                <Card className={isFullscreen ? 'h-screen' : ''}>
                  <CardHeader className={isFullscreen ? 'absolute top-4 left-4 z-10 bg-black/50 rounded' : ''}>
                    <CardTitle className={`flex items-center justify-between ${isFullscreen ? 'text-white' : ''}`}>
                      {currentStorage.name}
                      <div className="flex items-center gap-2">
                        <Badge className={isFullscreen ? 'bg-white text-black' : ''}>{currentStorage.type}</Badge>
                        <Button size="sm" variant="outline" onClick={toggleFullscreen}>
                          {isFullscreen ? <Minimize className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={isFullscreen ? 'h-full p-0' : ''}>
                    <div className={`w-full ${isFullscreen ? 'h-full' : 'h-[600px]'} bg-gray-900 rounded-lg overflow-hidden`}>
                      <Canvas camera={{ position: [10, 10, 10], fov: sceneSettings.cameraFov }} shadows={sceneSettings.shadows}>
                        <Suspense fallback={null}>
                          <Environment preset={sceneSettings.environment as any} />
                          <ambientLight intensity={sceneSettings.ambientIntensity} />
                          <pointLight position={sceneSettings.pointLightPosition} intensity={sceneSettings.pointLightIntensity} castShadow={sceneSettings.shadows} />
                          {sceneSettings.fogEnabled && (
                            // @ts-expect-error drei/fiber fog attach typing
                            <fog attach="fog" color={sceneSettings.fogColor} near={sceneSettings.fogNear} far={sceneSettings.fogFar} />
                          )}
                          <WineRack storage={currentStorage} wines={wines} />
                          <OrbitControls enablePan enableZoom enableRotate autoRotate={autoOrbit} autoRotateSpeed={orbitSpeed} />
                        </Suspense>
                      </Canvas>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {!isFullscreen && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Scene Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant={autoOrbit ? 'default' : 'outline'} onClick={() => setAutoOrbit(!autoOrbit)}>
                          {autoOrbit ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <span className="text-sm">Auto Orbit</span>
                      </div>

                      <div>
                        <Label className="text-sm">Orbit Speed</Label>
                        <Slider value={[orbitSpeed]} onValueChange={(value: number[]) => setOrbitSpeed(value[0])} max={3} min={0.1} step={0.1} className="mt-2" />
                        <div className="text-xs text-gray-500 mt-1">{orbitSpeed.toFixed(1)}x</div>
                      </div>

                      <div>
                        <Label className="text-sm">Environment</Label>
                        <Select value={sceneSettings.environment} onValueChange={(value: string) => setSceneSettings({ ...sceneSettings, environment: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {environmentOptions.map((env) => (
                              <SelectItem key={env.value} value={env.value}>
                                {env.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">Ambient Light</Label>
                        <Slider value={[sceneSettings.ambientIntensity]} onValueChange={(value: number[]) => setSceneSettings({ ...sceneSettings, ambientIntensity: value[0] })} max={2} min={0} step={0.1} className="mt-2" />
                        <div className="text-xs text-gray-500 mt-1">{sceneSettings.ambientIntensity.toFixed(1)}</div>
                      </div>

                      <div>
                        <Label className="text-sm">Point Light Intensity</Label>
                        <Slider value={[sceneSettings.pointLightIntensity]} onValueChange={(value: number[]) => setSceneSettings({ ...sceneSettings, pointLightIntensity: value[0] })} max={3} min={0} step={0.1} className="mt-2" />
                        <div className="text-xs text-gray-500 mt-1">{sceneSettings.pointLightIntensity.toFixed(1)}</div>
                      </div>

                      <div>
                        <Label className="text-sm">Camera FOV</Label>
                        <Slider value={[sceneSettings.cameraFov]} onValueChange={(value: number[]) => setSceneSettings({ ...sceneSettings, cameraFov: value[0] })} max={120} min={30} step={5} className="mt-2" />
                        <div className="text-xs text-gray-500 mt-1">{sceneSettings.cameraFov}°</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="shadows" checked={sceneSettings.shadows} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSceneSettings({ ...sceneSettings, shadows: e.target.checked })} className="rounded" />
                        <Label htmlFor="shadows" className="text-sm">Enable Shadows</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="fog" checked={sceneSettings.fogEnabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSceneSettings({ ...sceneSettings, fogEnabled: e.target.checked })} className="rounded" />
                        <Label htmlFor="fog" className="text-sm">Enable Fog</Label>
                      </div>

                      {sceneSettings.fogEnabled && (
                        <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                          <div>
                            <Label className="text-sm">Fog Color</Label>
                            <Input type="color" value={sceneSettings.fogColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSceneSettings({ ...sceneSettings, fogColor: e.target.value })} className="mt-1 h-8" />
                          </div>
                          <div>
                            <Label className="text-sm">Fog Near</Label>
                            <Slider value={[sceneSettings.fogNear]} onValueChange={(value: number[]) => setSceneSettings({ ...sceneSettings, fogNear: value[0] })} max={20} min={1} step={1} className="mt-1" />
                            <div className="text-xs text-gray-500">{sceneSettings.fogNear}</div>
                          </div>
                          <div>
                            <Label className="text-sm">Fog Far</Label>
                            <Slider value={[sceneSettings.fogFar]} onValueChange={(value: number[]) => setSceneSettings({ ...sceneSettings, fogFar: value[0] })} max={100} min={10} step={5} className="mt-1" />
                            <div className="text-xs text-gray-500">{sceneSettings.fogFar}</div>
                          </div>
                        </div>
                      )}

                      <Button onClick={toggleFullscreen} className="w-full">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Fullscreen
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Storage Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Dimensions:</span>
                        <span className="font-medium">{currentStorage.width} × {currentStorage.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Capacity:</span>
                        <span className="font-medium">{currentStorage.capacity} bottles</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Occupied:</span>
                        <span className="font-medium">{currentStorage.wines.length} bottles</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className="font-medium">{currentStorage.capacity - currentStorage.wines.length} bottles</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isFullscreen && (
                <div className="absolute top-4 right-4 bg-black/50 rounded p-4 text-white max-h-96 overflow-y-auto">
                  <div className="space-y-3 w-64">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={autoOrbit ? 'default' : 'outline'} onClick={() => setAutoOrbit(!autoOrbit)}>
                        {autoOrbit ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <span className="text-sm">Auto Orbit</span>
                    </div>

                    <div>
                      <Label className="text-sm text-white">Environment</Label>
                      <Select value={sceneSettings.environment} onValueChange={(value: string) => setSceneSettings({ ...sceneSettings, environment: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {environmentOptions.map((env) => (
                            <SelectItem key={env.value} value={env.value}>
                              {env.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm text-white">Ambient Light: {sceneSettings.ambientIntensity.toFixed(1)}</Label>
                      <Slider value={[sceneSettings.ambientIntensity]} onValueChange={(value: number[]) => setSceneSettings({ ...sceneSettings, ambientIntensity: value[0] })} max={2} min={0} step={0.1} className="mt-1" />
                    </div>

                    <div>
                      <Label className="text-sm text-white">Point Light: {sceneSettings.pointLightIntensity.toFixed(1)}</Label>
                      <Slider value={[sceneSettings.pointLightIntensity]} onValueChange={(value: number[]) => setSceneSettings({ ...sceneSettings, pointLightIntensity: value[0] })} max={3} min={0} step={0.1} className="mt-1" />
                    </div>

                    <div>
                      <Label className="text-sm text-white">Speed: {orbitSpeed.toFixed(1)}x</Label>
                      <Slider value={[orbitSpeed]} onValueChange={(value: number[]) => setOrbitSpeed(value[0])} max={3} min={0.1} step={0.1} className="mt-1" />
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="fullscreen-shadows" checked={sceneSettings.shadows} onChange={(e) => setSceneSettings({ ...sceneSettings, shadows: e.target.checked })} className="rounded" />
                      <Label htmlFor="fullscreen-shadows" className="text-sm text-white">Shadows</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="fullscreen-fog" checked={sceneSettings.fogEnabled} onChange={(e) => setSceneSettings({ ...sceneSettings, fogEnabled: e.target.checked })} className="rounded" />
                      <Label htmlFor="fullscreen-fog" className="text-sm text-white">Fog</Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Gallery Mode
            <div className={`grid ${isFullscreen ? 'grid-cols-2 h-screen' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
              <div className={isFullscreen ? 'h-full' : ''}>
                <Card className={isFullscreen ? 'h-full' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Wine Gallery</CardTitle>
                    <Button size="sm" variant="outline" onClick={toggleFullscreen}>
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </Button>
                  </CardHeader>
                  <CardContent className={isFullscreen ? 'h-full pb-20' : ''}>
                    <div className={`w-full ${isFullscreen ? 'h-full' : 'h-[500px]'} bg-gray-900 rounded-lg overflow-hidden`}>
                      {currentWineData ? (
                        <Canvas camera={{ position: [3, 2, 3], fov: gallerySettings.cameraFov }} shadows={gallerySettings.shadows}>
                          <Suspense fallback={null}>
                            <Environment preset={gallerySettings.environment as any} />
                            <ambientLight intensity={gallerySettings.ambientIntensity} />
                            <pointLight position={gallerySettings.pointLightPosition} intensity={gallerySettings.pointLightIntensity} castShadow={gallerySettings.shadows} />
                            {gallerySettings.fogEnabled && (
                              // @ts-expect-error drei/fiber fog attach typing
                              <fog attach="fog" color={gallerySettings.fogColor} near={gallerySettings.fogNear} far={gallerySettings.fogFar} />
                            )}
                            <GalleryWineBottle wine={currentWineData} />
                            <OrbitControls enablePan={false} enableZoom enableRotate autoRotate autoRotateSpeed={1} />
                          </Suspense>
                        </Canvas>
                      ) : (
                        <div className="flex items-center justify-center h-full text-white">
                          <p>No wine selected or shelf empty</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className={`space-y-4 ${isFullscreen ? 'overflow-y-auto' : ''}`}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gallery Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                    <div>
                      <Label>Select Shelf</Label>
                      <Select value={selectedShelf.toString()} onValueChange={(value: string) => { setSelectedShelf(Number.parseInt(value)); setCurrentWineIndex(0) }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: currentStorage.height }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              Shelf {i + 1} ({getWinesOnShelf(currentStorage, i).length} wines)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={prevWine} disabled={shelfWines.length === 0}>
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant={galleryAutoPlay ? 'default' : 'outline'} onClick={() => setGalleryAutoPlay(!galleryAutoPlay)} disabled={shelfWines.length === 0}>
                        {galleryAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" onClick={nextWine} disabled={shelfWines.length === 0}>
                        <SkipForward className="w-4 h-4" />
                      </Button>
                      <span className="text-sm">{shelfWines.length > 0 ? `${currentWineIndex + 1} / ${shelfWines.length}` : '0 / 0'}</span>
                    </div>

                    <div>
                      <Label className="text-sm">Auto-play Speed</Label>
                      <Slider value={[gallerySpeed]} onValueChange={(value) => setGallerySpeed(value[0] as number)} max={10000} min={1000} step={500} className="mt-2" />
                      <div className="text-xs text-gray-500 mt-1">{gallerySpeed / 1000}s per wine</div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-3">Scene Settings</h4>
                      <div>
                        <Label className="text-sm">Environment</Label>
                        <Select value={gallerySettings.environment} onValueChange={(value: string) => setGallerySettings({ ...gallerySettings, environment: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {environmentOptions.map((env) => (
                              <SelectItem key={env.value} value={env.value}>
                                {env.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">Ambient Light</Label>
                        <Slider value={[gallerySettings.ambientIntensity]} onValueChange={(value: number[]) => setGallerySettings({ ...gallerySettings, ambientIntensity: value[0] })} max={2} min={0} step={0.1} className="mt-2" />
                        <div className="text-xs text-gray-500 mt-1">{gallerySettings.ambientIntensity.toFixed(1)}</div>
                      </div>

                      <div>
                        <Label className="text-sm">Point Light Intensity</Label>
                        <Slider value={[gallerySettings.pointLightIntensity]} onValueChange={(value: number[]) => setGallerySettings({ ...gallerySettings, pointLightIntensity: value[0] })} max={3} min={0} step={0.1} className="mt-2" />
                        <div className="text-xs text-gray-500 mt-1">{gallerySettings.pointLightIntensity.toFixed(1)}</div>
                      </div>

                      <div>
                        <Label className="text-sm">Camera FOV</Label>
                        <Slider value={[gallerySettings.cameraFov]} onValueChange={(value: number[]) => setGallerySettings({ ...gallerySettings, cameraFov: value[0] })} max={120} min={30} step={5} className="mt-2" />
                        <div className="text-xs text-gray-500 mt-1">{gallerySettings.cameraFov}°</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="gallery-shadows" checked={gallerySettings.shadows} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGallerySettings({ ...gallerySettings, shadows: e.target.checked })} className="rounded" />
                        <Label htmlFor="gallery-shadows" className="text-sm">Enable Shadows</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="gallery-fog" checked={gallerySettings.fogEnabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGallerySettings({ ...gallerySettings, fogEnabled: e.target.checked })} className="rounded" />
                        <Label htmlFor="gallery-fog" className="text-sm">Enable Fog</Label>
                      </div>

                      {gallerySettings.fogEnabled && (
                        <div className="space-y-2 pl-4 border-l-2 border-gray-200 mt-2">
                          <div>
                            <Label className="text-sm">Fog Color</Label>
                            <Input type="color" value={gallerySettings.fogColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGallerySettings({ ...gallerySettings, fogColor: e.target.value })} className="mt-1 h-8" />
                          </div>
                          <div>
                            <Label className="text-sm">Fog Near</Label>
                            <Slider value={[gallerySettings.fogNear]} onValueChange={(value: number[]) => setGallerySettings({ ...gallerySettings, fogNear: value[0] })} max={10} min={0.5} step={0.5} className="mt-1" />
                            <div className="text-xs text-gray-500">{gallerySettings.fogNear}</div>
                          </div>
                          <div>
                            <Label className="text-sm">Fog Far</Label>
                            <Slider value={[gallerySettings.fogFar]} onValueChange={(value: number[]) => setGallerySettings({ ...gallerySettings, fogFar: value[0] })} max={50} min={5} step={2.5} className="mt-1" />
                            <div className="text-xs text-gray-500">{gallerySettings.fogFar}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {currentWineData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{currentWineData.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Brand:</span>
                          <div>{currentWineData.brand}</div>
                        </div>
                        <div>
                          <span className="font-medium">Vintage:</span>
                          <div>{currentWineData.vintage}</div>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>
                          <div className="capitalize">{currentWineData.type}</div>
                        </div>
                        <div>
                          <span className="font-medium">ABV:</span>
                          <div>{currentWineData.abv}%</div>
                        </div>
                      </div>

                      {currentWineData.flavors && currentWineData.flavors.length > 0 && (
                        <div>
                          <span className="font-medium text-sm">Flavors:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentWineData.flavors.map((flavor, index) => (
                              <Badge key={index} variant="outline" className="text-xs">{flavor}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentWineData.notes && (
                        <div>
                          <span className="font-medium text-sm">Notes:</span>
                          <p className="text-sm text-gray-600 mt-1">{currentWineData.notes}</p>
                        </div>
                      )}

                      {currentWineData.labelImage && (
                        <div>
                          <span className="font-medium text-sm">Label:</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={currentWineData.labelImage} alt={`${currentWineData.name} label`} className="w-full h-32 object-cover rounded mt-1" />
                        </div>
                      )}

                      <div>
                        <span className="font-medium text-sm">Position:</span>
                        <div className="text-sm">Shelf {selectedShelf + 1}, Position {(currentWine?.x || 0) + 1}</div>
                      </div>

                      <div>
                        <span className="font-medium text-sm">Bottle Style:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-4 h-4 rounded border" style={{ backgroundColor: currentWineData.visualStyle?.bottleColor }} />
                          <span className="text-sm capitalize">{currentWineData.visualStyle?.bottleShape || 'standard'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No storage locations found. Create some storage locations first to visualize your wine collection.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showImportExport} onOpenChange={setShowImportExport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import/Export Visualization Data</DialogTitle>
            <DialogDescription>Backup your visualization settings or import from a previous backup</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Button onClick={exportVisualizationData} className="w-full">Export Visualization Data</Button>
              <p className="text-sm text-gray-500 mt-1">Download storage and wine visualization settings</p>
            </div>
            <div>
              <Label htmlFor="import-viz-file">Import Visualization Data</Label>
              <Input id="import-viz-file" type="file" accept=".json" onChange={importVisualizationData} className="mt-1" />
              <p className="text-sm text-gray-500 mt-1">Upload a previously exported visualization file</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function WineRack({ storage, wines }: { storage: StorageLocation; wines: Wine[] }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05
    }
  })

  const cubbySizeX = 0.25
  const cubbySizeY = 0.35
  const rackWidth = storage.width * cubbySizeX
  const rackHeight = storage.height * cubbySizeY
  const rackDepth = 0.35

  const getRackMaterialColor = () => {
    switch (storage.visualStyle.rackMaterial) {
      case 'metal':
        return '#C0C0C0'
      case 'plastic':
        return '#F0F0F0'
      default:
        return storage.visualStyle.rackColor
    }
  }

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -3]} rotation={[0, 0, 0]}>
        <planeGeometry args={[15, 10]} />
        <meshStandardMaterial color={storage.visualStyle.backgroundColor} />
      </mesh>

      <Box position={[0, -rackHeight / 2 - 0.1, 0]} args={[rackWidth + 0.1, 0.05, rackDepth + 0.1]}>
        <meshStandardMaterial color={getRackMaterialColor()} />
      </Box>

      <Box position={[0, 0, -rackDepth / 2 - 0.025]} args={[rackWidth + 0.1, rackHeight + 0.1, 0.05]}>
        <meshStandardMaterial color={getRackMaterialColor()} />
      </Box>

      {Array.from({ length: storage.height + 1 }, (_, i) => (
        <Box key={`shelf-${i}`} position={[0, i * cubbySizeY - rackHeight / 2, 0]} args={[rackWidth + 0.1, 0.02, rackDepth]}>
          <meshStandardMaterial color={storage.visualStyle.rackColor} />
        </Box>
      ))}

      {Array.from({ length: storage.width + 1 }, (_, i) => (
        <Box key={`divider-${i}`} position={[i * cubbySizeX - rackWidth / 2, 0, 0]} args={[0.02, rackHeight + 0.1, rackDepth]}>
          <meshStandardMaterial color={getRackMaterialColor()} />
        </Box>
      ))}

      {storage.wines.map((winePos, index) => {
        const wine = wines.find((w) => w.id === winePos.wineId)
        const x = winePos.x * cubbySizeX - rackWidth / 2 + cubbySizeX / 2
        const y = winePos.y * cubbySizeY - rackHeight / 2 + cubbySizeY / 2
        const z = -rackDepth / 4
        return <WineBottle key={index} position={[x, y, z]} wine={wine ?? undefined} winePos={winePos} />
      })}

      <Text position={[0, rackHeight / 2 + 0.3, 0]} fontSize={0.2} color="#333" anchorX="center" anchorY="middle">
        {storage.name}
      </Text>
    </group>
  )
}

function WineBottle({ position, wine, winePos }: { position: [number, number, number]; wine?: Wine; winePos: WinePosition }) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Group>(null)

  const labelTexture = useMemo(() => {
    if (wine?.labelImage) {
      const loader = new THREE.TextureLoader()
      const texture = loader.load(wine.labelImage)
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(1, 1)
      return texture
    }
    return null
  }, [wine?.labelImage])

  function getBottleGeometry(shape: string) {
    switch (shape) {
      case 'burgundy':
        return {
          bodySegments: [
            { radius: 0.06, height: 0.05, y: -0.125 },
            { radius: 0.06, height: 0.08, y: -0.08 },
            { radius: 0.065, height: 0.08, y: -0.02 },
            { radius: 0.06, height: 0.06, y: 0.04 },
            { radius: 0.055, height: 0.04, y: 0.08 },
          ],
          neckRadius: 0.025,
          neckHeight: 0.12,
          neckY: 0.16,
        }
      case 'champagne':
        return {
          bodySegments: [
            { radius: 0.07, height: 0.06, y: -0.13 },
            { radius: 0.07, height: 0.08, y: -0.08 },
            { radius: 0.075, height: 0.08, y: -0.02 },
            { radius: 0.07, height: 0.06, y: 0.04 },
            { radius: 0.06, height: 0.04, y: 0.08 },
          ],
          neckRadius: 0.028,
          neckHeight: 0.1,
          neckY: 0.15,
        }
      case 'german':
        return {
          bodySegments: [
            { radius: 0.05, height: 0.06, y: -0.15 },
            { radius: 0.05, height: 0.1, y: -0.08 },
            { radius: 0.052, height: 0.1, y: 0.02 },
            { radius: 0.05, height: 0.08, y: 0.1 },
            { radius: 0.045, height: 0.05, y: 0.16 },
          ],
          neckRadius: 0.022,
          neckHeight: 0.14,
          neckY: 0.23,
        }
      default:
        return {
          bodySegments: [
            { radius: 0.055, height: 0.05, y: -0.125 },
            { radius: 0.055, height: 0.1, y: -0.075 },
            { radius: 0.055, height: 0.08, y: 0.005 },
            { radius: 0.055, height: 0.06, y: 0.065 },
            { radius: 0.05, height: 0.03, y: 0.105 },
          ],
          neckRadius: 0.025,
          neckHeight: 0.12,
          neckY: 0.165,
        }
    }
  }

  const bottleGeometry = wine?.visualStyle ? getBottleGeometry(wine.visualStyle.bottleShape) : getBottleGeometry('standard')
  const bottleColor = wine?.visualStyle?.bottleColor || getWineColor(wine?.type || 'red')
  const labelColor = wine?.visualStyle?.labelColor || '#FFFFFF'

  return (
    <group ref={meshRef} position={position} rotation={[0, Math.PI, 0]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {bottleGeometry.bodySegments.map((segment: any, index: number) => (
        <mesh key={index} position={[0, segment.y, 0]}>
          <cylinderGeometry args={[segment.radius, segment.radius, segment.height, 16]} />
          <meshStandardMaterial color={bottleColor} />
        </mesh>
      ))}

      {labelTexture && (
        <mesh position={[0, 0, 0]}>
          {(() => {
            const wrap = Math.max(0.01, Math.min(1, wine?.visualStyle?.labelWrapFraction ?? 1 / 3))
            const thetaLength = 2 * Math.PI * wrap
            const thetaStart = Math.PI / 2 - thetaLength / 2
            return (
              <cylinderGeometry args={[0.058, 0.058, 0.15, 32, 1, false, thetaStart, thetaLength]} />
            )
          })()}
          <meshStandardMaterial map={labelTexture} transparent opacity={0.9} />
        </mesh>
      )}

      <mesh position={[0, bottleGeometry.neckY, 0]}>
        <cylinderGeometry args={[bottleGeometry.neckRadius, bottleGeometry.neckRadius, bottleGeometry.neckHeight, 12]} />
        <meshStandardMaterial color={bottleColor} />
      </mesh>

      <mesh position={[0, bottleGeometry.neckY + bottleGeometry.neckHeight / 2 + 0.02, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.04, 8]} />
        <meshStandardMaterial color="#D2691E" />
      </mesh>

      <mesh position={[0, bottleGeometry.neckY + bottleGeometry.neckHeight / 2 + 0.01, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.06, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {!labelTexture && (
        <Text position={[0, 0, 0.06]} fontSize={0.04} color={labelColor} anchorX="center" anchorY="middle" rotation={[0, 0, 0]}>
          {winePos.wineName.substring(0, 6)}
        </Text>
      )}

      {hovered && (
        <Html position={[0, 0.3, 0]} center>
          <div className="bg-black text-white p-2 rounded text-xs whitespace-nowrap pointer-events-none">
            <div className="font-bold">{winePos.wineName}</div>
            {wine && (
              <>
                <div>
                  {wine.brand} • {wine.vintage}
                </div>
                <div>
                  Position: ({winePos.x + 1}, {winePos.y + 1})
                </div>
                {wine.visualStyle && <div className="capitalize">{wine.visualStyle.bottleShape} bottle</div>}
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

function GalleryWineBottle({ wine }: { wine: Wine }) {
  const meshRef = useRef<THREE.Group>(null)

  const labelTexture = useMemo(() => {
    if (wine?.labelImage) {
      const loader = new THREE.TextureLoader()
      const texture = loader.load(wine.labelImage)
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(1, 1)
      return texture
    }
    return null
  }, [wine?.labelImage])

  function getBottleGeometry(shape: string) {
    const scale = 2.5
    switch (shape) {
      case 'burgundy':
        return {
          bodySegments: [
            { radius: 0.12 * scale, height: 0.1 * scale, y: -0.25 * scale },
            { radius: 0.12 * scale, height: 0.16 * scale, y: -0.16 * scale },
            { radius: 0.13 * scale, height: 0.16 * scale, y: -0.04 * scale },
            { radius: 0.12 * scale, height: 0.12 * scale, y: 0.08 * scale },
            { radius: 0.11 * scale, height: 0.08 * scale, y: 0.16 * scale },
          ],
          neckRadius: 0.05 * scale,
          neckHeight: 0.24 * scale,
          neckY: 0.32 * scale,
        }
      case 'champagne':
        return {
          bodySegments: [
            { radius: 0.14 * scale, height: 0.12 * scale, y: -0.26 * scale },
            { radius: 0.14 * scale, height: 0.16 * scale, y: -0.16 * scale },
            { radius: 0.15 * scale, height: 0.16 * scale, y: -0.04 * scale },
            { radius: 0.14 * scale, height: 0.12 * scale, y: 0.08 * scale },
            { radius: 0.12 * scale, height: 0.08 * scale, y: 0.16 * scale },
          ],
          neckRadius: 0.056 * scale,
          neckHeight: 0.2 * scale,
          neckY: 0.3 * scale,
        }
      case 'german':
        return {
          bodySegments: [
            { radius: 0.1 * scale, height: 0.12 * scale, y: -0.3 * scale },
            { radius: 0.1 * scale, height: 0.2 * scale, y: -0.16 * scale },
            { radius: 0.104 * scale, height: 0.2 * scale, y: 0.04 * scale },
            { radius: 0.1 * scale, height: 0.16 * scale, y: 0.2 * scale },
            { radius: 0.09 * scale, height: 0.1 * scale, y: 0.32 * scale },
          ],
          neckRadius: 0.044 * scale,
          neckHeight: 0.28 * scale,
          neckY: 0.46 * scale,
        }
      default:
        return {
          bodySegments: [
            { radius: 0.11 * scale, height: 0.1 * scale, y: -0.25 * scale },
            { radius: 0.11 * scale, height: 0.2 * scale, y: -0.15 * scale },
            { radius: 0.11 * scale, height: 0.16 * scale, y: 0.01 * scale },
            { radius: 0.11 * scale, height: 0.12 * scale, y: 0.13 * scale },
            { radius: 0.1 * scale, height: 0.06 * scale, y: 0.21 * scale },
          ],
          neckRadius: 0.05 * scale,
          neckHeight: 0.24 * scale,
          neckY: 0.33 * scale,
        }
    }
  }

  const bottleGeometry = wine?.visualStyle ? getBottleGeometry(wine.visualStyle.bottleShape) : getBottleGeometry('standard')
  const bottleColor = wine?.visualStyle?.bottleColor || getWineColor(wine?.type || 'red')
  const labelColor = wine?.visualStyle?.labelColor || '#FFFFFF'

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {bottleGeometry.bodySegments.map((segment: any, index: number) => (
        <mesh key={index} position={[0, segment.y, 0]}>
          <cylinderGeometry args={[segment.radius, segment.radius, segment.height, 16]} />
          <meshStandardMaterial color={bottleColor} />
        </mesh>
      ))}

      {labelTexture && (
        <mesh position={[0, 0, 0]}>
          {(() => {
            const wrap = Math.max(0.01, Math.min(1, wine?.visualStyle?.labelWrapFraction ?? 1 / 3))
            const thetaLength = 2 * Math.PI * wrap
            const thetaStart = Math.PI / 2 - thetaLength / 2
            return (
              <cylinderGeometry args={[0.29, 0.29, 0.4, 48, 1, false, thetaStart, thetaLength]} />
            )
          })()}
          <meshStandardMaterial map={labelTexture} transparent opacity={0.9} />
        </mesh>
      )}

      <mesh position={[0, bottleGeometry.neckY, 0]}>
        <cylinderGeometry args={[bottleGeometry.neckRadius, bottleGeometry.neckRadius, bottleGeometry.neckHeight, 12]} />
        <meshStandardMaterial color={bottleColor} />
      </mesh>

      <mesh position={[0, bottleGeometry.neckY + bottleGeometry.neckHeight / 2 + 0.05, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.1, 8]} />
        <meshStandardMaterial color="#D2691E" />
      </mesh>

      <mesh position={[0, bottleGeometry.neckY + bottleGeometry.neckHeight / 2 + 0.025, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.15, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {!labelTexture && (
        <Text position={[0, 0, 0.3]} fontSize={0.12} color={labelColor} anchorX="center" anchorY="middle" rotation={[0, 0, 0]}>
          {wine?.name?.substring(0, 12) || 'Wine'}
        </Text>
      )}
    </group>
  )
}

function getWineColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'red':
      return '#722F37'
    case 'white':
      return '#F7E7CE'
    case 'rosé':
    case 'rose':
      return '#FFB6C1'
    case 'sparkling':
      return '#F0F8FF'
    case 'dessert':
      return '#DAA520'
    default:
      return '#722F37'
  }
}

