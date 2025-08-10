import * as React from 'react'

export function Card({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`rounded-lg border bg-white ${className ?? ''}`}>{children}</div>
}

export function CardHeader({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 border-b ${className ?? ''}`}>{children}</div>
}

export function CardContent({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 ${className ?? ''}`}>{children}</div>
}

export function CardTitle({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <h3 className={`font-semibold ${className ?? ''}`}>{children}</h3>
}

export function CardDescription({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <p className={`text-sm text-gray-500 ${className ?? ''}`}>{children}</p>
}

