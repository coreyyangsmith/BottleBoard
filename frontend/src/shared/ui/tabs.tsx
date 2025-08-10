// Minimal shadcn/ui-compatible Tabs shim to keep code compiling.
// Replace with real shadcn/ui Tabs in your project.
import * as React from 'react'

type TabsContextState = {
  value: string
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextState | null>(null)

type TabsRootProps = React.PropsWithChildren<{
  defaultValue: string
  className?: string
}>

export function Tabs({ children, className, defaultValue }: TabsRootProps) {
  const [value, setValue] = React.useState(defaultValue)
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={className}>{children}</div>
}

export function TabsTrigger({ children, className, value }: React.PropsWithChildren<{ className?: string; value: string }>) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) return null
  const isActive = ctx.value === value
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={`${className ?? ''} ${isActive ? 'data-[active]:font-semibold' : ''}`}
      data-active={isActive ? '' : undefined}
    >
      {children}
    </button>
  )
}

export function TabsContent({ children, className, value }: React.PropsWithChildren<{ className?: string; value: string }>) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) return null
  if (ctx.value !== value) return null
  return <div className={className}>{children}</div>
}

