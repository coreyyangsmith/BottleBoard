import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Wine, Package, Eye } from 'lucide-react'
import WineManagement from '@/modules/wine-manager/components/WineManagement'
import StorageManagement from '@/modules/wine-manager/components/StorageManagement'
import Visualization from '@/modules/wine-manager/components/Visualization'

export default function WineManagerApp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Wine Cellar Manager</h1>
          <p className="text-gray-600">Manage your wine collection, track fermentation, and visualize your cellar</p>
        </div>

        <Tabs defaultValue="wines" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="wines" className="flex items-center gap-2">
              <Wine className="w-4 h-4" />
              Wine Management
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Storage Management
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              3D Visualization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wines">
            <WineManagement />
          </TabsContent>

          <TabsContent value="storage">
            <StorageManagement />
          </TabsContent>

          <TabsContent value="visualization">
            <Visualization />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

