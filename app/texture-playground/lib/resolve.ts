// app/texture-playground/lib/resolve.ts

import type { Frame, FrameSnapshot } from './types'

export function resolveFrame(frame: Frame): FrameSnapshot {
  return { layers: frame.layers, durationFrames: frame.durationFrames }
}
