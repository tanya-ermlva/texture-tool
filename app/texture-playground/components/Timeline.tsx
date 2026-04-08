// app/texture-playground/components/Timeline.tsx
'use client'
import { useState } from 'react'
import type { Frame, BackgroundLayer, MidgroundLayer } from '../lib/types'

type Props = {
  frames: Frame[]
  activeFrameId: string
  fps: number
  playing: boolean
  onSelectFrame: (id: string) => void
  onDeleteFrame: (id: string) => void
  onDurationChange: (id: string, frames: number) => void
  onFpsChange: (fps: number) => void
  onPlay: () => void
  onStop: () => void
  onAddFrame: () => void
  onReorderFrames: (fromId: string, toId: string) => void
}

export default function Timeline({
  frames, activeFrameId, fps, playing,
  onSelectFrame, onDeleteFrame, onDurationChange, onFpsChange,
  onPlay, onStop, onAddFrame, onReorderFrames,
}: Props) {
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center',
    }}>
      {/* Left spacer — reserved for PresetBar overlay */}
      <div style={{ flex: '0 0 100px' }} />

      {/* Center: frame pills */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 6, overflow: 'hidden',
      }}>
        {frames.map((frame) => {
          const bg = (frame.layers.find(l => l.kind === 'background') as BackgroundLayer | undefined)?.color ?? '#444625'
          const mid = frame.layers.find(l => l.kind === 'midground') as MidgroundLayer | undefined
          const active = frame.id === activeFrameId

          return (
            <div
              key={frame.id}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}
            >
              <div
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('frameId', frame.id) }}
                onDragOver={(e) => { e.preventDefault(); setDragOverId(frame.id) }}
                onDragLeave={() => setDragOverId(null)}
                onDragEnd={() => setDragOverId(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  const fromId = e.dataTransfer.getData('frameId')
                  if (fromId !== frame.id) onReorderFrames(fromId, frame.id)
                  setDragOverId(null)
                }}
                onClick={() => onSelectFrame(frame.id)}
                style={{
                  width: 54, height: 54,
                  borderRadius: 16,
                  cursor: 'pointer',
                  border: `1.5px solid ${active ? '#d1e043' : 'rgba(71,67,42,0.18)'}`,
                  outline: dragOverId === frame.id ? '2px solid #d1e043' : undefined,
                  position: 'relative',
                  overflow: 'hidden',
                  background: bg,
                }}
              >
                {mid?.src && (
                  <img
                    src={mid.src}
                    alt=""
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      opacity: mid.opacity,
                      mixBlendMode: 'multiply',
                    }}
                  />
                )}
                {frames.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteFrame(frame.id) }}
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 14, height: 14, borderRadius: '50%',
                      background: '#f7f7f2', border: '1px solid rgba(71,67,42,0.2)',
                      color: '#72726e', fontSize: 9, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, lineHeight: 1,
                    }}
                  >×</button>
                )}
              </div>
              <input
                type="number"
                value={frame.durationFrames}
                min={1} max={120}
                onChange={(e) => onDurationChange(frame.id, Math.max(1, Number(e.target.value)))}
                style={{
                  width: 54, background: 'transparent', border: 'none',
                  fontFamily: 'var(--font-geist-mono)', fontSize: 9, color: '#72726e',
                  textAlign: 'center', padding: 0,
                }}
                title="Duration in frames"
              />
            </div>
          )
        })}

        <button
          onClick={onAddFrame}
          style={{
            width: 36, height: 36, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'rgba(98,90,34,0.07)', color: '#292929', fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            opacity: frames.length >= 8 ? 0.3 : 1,
            pointerEvents: frames.length >= 8 ? 'none' : 'auto',
          }}
        >+</button>
      </div>

      {/* Right: fps + play */}
      <div style={{
        flex: '0 0 100px',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
      }}>
        <select
          value={fps}
          onChange={(e) => onFpsChange(Number(e.target.value))}
          style={{
            background: 'transparent', border: 'none',
            fontFamily: 'var(--font-geist-mono)', fontSize: 11, color: 'rgba(41,41,41,0.45)',
            cursor: 'pointer', padding: 0, appearance: 'none', WebkitAppearance: 'none',
          }}
        >
          {[12, 24, 30, 60].map(f => (
            <option key={f} value={f}>{f} fps</option>
          ))}
        </select>

        <button
          onClick={playing ? onStop : onPlay}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#1a1a1a', color: '#f7f7f2', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, cursor: 'pointer', flexShrink: 0,
          }}
        >
          {playing ? '■' : '▶'}
        </button>
      </div>
    </div>
  )
}
