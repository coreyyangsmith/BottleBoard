import * as React from 'react'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-9 px-3 rounded border w-full ${props.className ?? ''}`} />
}

