// app/texture-playground/lib/types.ts

export type CompositionType =
  | 'dot-grid'
  | 'regular-grid'
  | 'variable-grid'
  | 'linear'
  | 'layered'
  | 'checkered'

export type BackgroundLayer = {
  id: string
  kind: 'background'
  color: string
}

export type GridLayer = {
  id: string
  kind: 'grid'
  composition: CompositionType
  spacing: number
  thickness: number
  dotSize: number
  opacity: number
  scale: number
}

export type ImageLayer = {
  id: string
  kind: 'image'
  file: File
  objectUrl: string
  scale: number
  x: number
  y: number
  opacity: number
}

export type MidgroundLayer = {
  id: string
  kind: 'midground'
  src: string | null  // '/textures/midground/1.png' or object URL; null = nothing selected
  label: string       // '1'–'11' for built-ins, filename for uploads, '' if unset
  opacity: number
  scale: number       // 1.0 = fills canvas exactly
  x: number           // pixel offset from top-left
  y: number
}

// ── Filter types ──────────────────────────────────────────────────────────────

export type FilterType =
  | 'noise' | 'blur' | 'pixelate' | 'displacement'
  | 'rgbsplit' | 'colormatrix' | 'halftone' | 'glow'

export type FilterEntry =
  | { type: 'noise';        enabled: boolean; intensity: number }
  | { type: 'blur';         enabled: boolean; strength: number }
  | { type: 'pixelate';     enabled: boolean; size: number }
  | { type: 'displacement'; enabled: boolean; scale: number }
  | { type: 'rgbsplit';     enabled: boolean; amount: number }
  | { type: 'colormatrix';  enabled: boolean; brightness: number; contrast: number; saturation: number; hue: number; invert: boolean }
  | { type: 'halftone';     enabled: boolean; scale: number; angle: number }
  | { type: 'glow';         enabled: boolean; distance: number; strength: number; color: string }

export type AdjustmentLayer = {
  id: string
  kind: 'adjustment'
  filters: FilterEntry[]
}

export type Layer = BackgroundLayer | GridLayer | ImageLayer | MidgroundLayer | AdjustmentLayer

// Used by LayerControls onChange callbacks — partial properties to apply to a layer
export type LayerOverride = Partial<Omit<GridLayer | BackgroundLayer | ImageLayer | MidgroundLayer, 'id' | 'kind' | 'file'>>

export type Frame = {
  id: string
  layers: Layer[]
  durationFrames: number
}

export type BaseComposition = {
  layers: Layer[]
}

export type Project = {
  frames: Frame[]
  outputSize: 512 | 1024 | 2048
  fps: number
  activeFrameId: string
}

// Derived for rendering — never stored
export type FrameSnapshot = {
  layers: Layer[]
  durationFrames: number
}

export interface RendererAdapter {
  init(host: HTMLElement, size: number): Promise<void>
  renderFrame(snapshot: FrameSnapshot): void
  setSize(size: number): void
  exportPng(): Promise<Blob>
  destroy(): void
}
