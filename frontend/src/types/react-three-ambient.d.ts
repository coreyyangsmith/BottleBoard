// Minimal ambient types for dev to avoid type errors before installing libs
declare module '@react-three/fiber' {
  export const Canvas: any
  export function useFrame(cb: (state: any, delta?: number) => void): void
}

declare module '@react-three/drei' {
  export const OrbitControls: any
  export const Text: any
  export const Box: any
  export const Environment: any
  export const Html: any
}

declare module 'three' {
  export = any
}

declare module 'react' {
  // Augment React JSX intrinsic elements for three primitives
  namespace JSX {
    interface IntrinsicElements {
      group: any
      mesh: any
      planeGeometry: any
      cylinderGeometry: any
      meshStandardMaterial: any
      ambientLight: any
      pointLight: any
      fog: any
    }
  }
}

export {}

