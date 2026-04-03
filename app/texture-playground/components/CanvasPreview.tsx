// app/texture-playground/components/CanvasPreview.tsx
'use client'
import { useEffect, useRef } from 'react'
import { PixiRenderer } from '../lib/renderer'
import type { RendererAdapter, FrameSnapshot } from '../lib/types'

type Props = {
  snapshot: FrameSnapshot
  outputSize: 512 | 1024 | 2048
  onAdapterReady: (adapter: RendererAdapter) => void
  frameLabel: string
}

export default function CanvasPreview({ snapshot, outputSize, onAdapterReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const adapterRef = useRef<RendererAdapter | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const renderer = new PixiRenderer()
    adapterRef.current = renderer
    renderer.init(canvasRef.current, outputSize).then(() => {
      onAdapterReady(renderer)
      renderer.renderFrame(snapshot)
    })
    return () => {
      renderer.destroy()
      adapterRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    adapterRef.current?.setSize(outputSize)
  }, [outputSize])

  useEffect(() => {
    adapterRef.current?.renderFrame(snapshot)
  }, [snapshot])

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <canvas
        ref={canvasRef}
        style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain', borderRadius: 32 }}
      />
    </div>
  )
}
