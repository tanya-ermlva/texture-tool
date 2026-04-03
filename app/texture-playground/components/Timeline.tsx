// app/texture-playground/components/Timeline.tsx
'use client'
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
}

export default function Timeline({
  frames, activeFrameId, fps, playing,
  onSelectFrame, onDeleteFrame, onDurationChange, onFpsChange,
  onPlay, onStop, onAddFrame,
}: Props) {
  return (
    <div style={{
      position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(98,90,34,0.06)', borderRadius: 20,
      padding: '18px 24px 8px',
      display: 'flex', alignItems: 'flex-start', gap: 6,
      whiteSpace: 'nowrap',
    }}>
      {/* Frame thumbnails */}
      {frames.map((frame) => (
        <div key={frame.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div
            onClick={() => onSelectFrame(frame.id)}
            style={{
              width: 54, height: 54, borderRadius: 12, cursor: 'pointer',
              border: `1px solid ${activeFrameId === frame.id ? '#d1e043' : 'rgba(71,67,42,0.2)'}`,
              position: 'relative', flexShrink: 0, overflow: 'hidden',
              background: (frame.layers.find(l => l.kind === 'background') as BackgroundLayer | undefined)?.color ?? '#444625',
            }}
          >
            {(() => {
              const mid = frame.layers.find(l => l.kind === 'midground') as MidgroundLayer | undefined
              return mid?.src ? (
                <img
                  src={mid.src}
                  alt=""
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover', opacity: mid.opacity,
                    mixBlendMode: 'multiply',
                  }}
                />
              ) : null
            })()}
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
      ))}

      {/* Add frame button */}
      <button
        onClick={onAddFrame}
        style={{
          width: 36, height: 36, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: '#f7f7f2', color: '#292929', fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, alignSelf: 'center',
          opacity: frames.length >= 5 ? 0.3 : 1,
          pointerEvents: frames.length >= 5 ? 'none' : 'auto',
        }}
      >+</button>

      {/* fps + play */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'center', marginLeft: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 9, color: '#72726e' }}>fps</span>
          <input
            type="number" value={fps} min={1} max={60}
            onChange={(e) => onFpsChange(Math.max(1, Math.min(60, Number(e.target.value))))}
            style={{
              width: 30, background: 'transparent', border: 'none',
              fontFamily: 'var(--font-geist-mono)', fontSize: 10, color: '#292929',
              textAlign: 'center', padding: 0,
            }}
          />
        </div>
        <button
          onClick={playing ? onStop : onPlay}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#b2c248', color: '#292929', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer', flexShrink: 0,
          }}
        >
          {playing ? '■' : '▶'}
        </button>
      </div>
    </div>
  )
}
