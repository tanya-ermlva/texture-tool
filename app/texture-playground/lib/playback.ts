// app/texture-playground/lib/playback.ts
import { useEffect, useRef } from 'react'
import { resolveFrame } from './resolve'
import type { Project, RendererAdapter } from './types'

export function usePlayback(
  adapter: RendererAdapter | null,
  project: Project,
  playing: boolean,
  onStop: () => void,
) {
  const stopRef = useRef(false)

  useEffect(() => {
    if (!playing || !adapter) return
    stopRef.current = false

    const activeAdapter = adapter  // capture non-null for use inside async runLoop
    let frameIdx = 0
    let rafId: number

    async function runLoop() {
      while (!stopRef.current) {
        const frame = project.frames[frameIdx % project.frames.length]
        const snapshot = resolveFrame(frame)
        activeAdapter.renderFrame(snapshot)
        const holdMs = (frame.durationFrames / project.fps) * 1000
        await new Promise<void>((resolve) => {
          const start = performance.now()
          function tick() {
            if (stopRef.current) { resolve(); return }
            if (performance.now() - start >= holdMs) { resolve(); return }
            rafId = requestAnimationFrame(tick)
          }
          rafId = requestAnimationFrame(tick)
        })
        frameIdx++
      }
      onStop()
    }

    runLoop()

    return () => {
      stopRef.current = true
      cancelAnimationFrame(rafId)
    }
  }, [playing]) // eslint-disable-line react-hooks/exhaustive-deps
}
