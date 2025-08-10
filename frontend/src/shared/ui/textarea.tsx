import * as React from 'react'

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`px-3 py-2 rounded border w-full ${props.className ?? ''}`} />
}

