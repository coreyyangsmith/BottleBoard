import * as React from 'react'

type ButtonVariant = 'default' | 'outline'

export function Button({
  children,
  className,
  variant = 'default',
  ...props
}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>) {
  const variantClass = variant === 'outline' ? 'border' : 'bg-gray-900 text-white'
  return (
    <button {...props} className={`h-9 px-3 rounded ${variantClass} ${className ?? ''}`.trim()}>
      {children}
    </button>
  )
}

