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
    <div className="relative flex items-center justify-center py-3 px-4">

      {/* Frame pills + add button — centered */}
      <div className="flex items-end gap-2 max-w-[600px] w-full">
        {frames.map((frame) => {
          const bg = (frame.layers.find(l => l.kind === 'background') as BackgroundLayer | undefined)?.color ?? '#444625'
          const mid = frame.layers.find(l => l.kind === 'midground') as MidgroundLayer | undefined
          const active = frame.id === activeFrameId

          return (
            <div key={frame.id} className="flex-1 flex flex-col items-center gap-1 min-w-0">
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
                className={`w-full h-[76px] rounded-[24px] cursor-pointer relative overflow-hidden transition-shadow ${
                  active ? 'ring-[1.5px] ring-ink shadow-[inset_0_0_0_6px_white]' : ''
                } ${dragOverId === frame.id ? 'ring-[2px] ring-ink' : ''}`}
                style={{ background: bg }}
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
                      position: 'absolute', top: 4, right: 4,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.8)', border: 'none',
                      color: '#72726e', fontSize: 10, cursor: 'pointer',
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
                className="w-full bg-transparent border-none text-center text-meta text-ink/40 p-0"
                style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 9 }}
                title="Duration in frames"
              />
            </div>
          )
        })}

        {/* Add frame button */}
        <button
          onClick={onAddFrame}
          disabled={frames.length >= 8}
          className="w-[76px] h-[76px] bg-white rounded-[24px] hover:rounded-[999px] transition-[border-radius] duration-300 ease-out flex items-center justify-center flex-shrink-0 disabled:opacity-30"
        >
          <img src="/plus.svg" className="w-6 h-6" alt="Add frame" />
        </button>
      </div>

      {/* fps + play — pinned to right */}
      <div className="absolute right-4 flex items-center gap-3">
        <select
          value={fps}
          onChange={(e) => onFpsChange(Number(e.target.value))}
          style={{
            background: 'transparent', border: 'none',
            fontFamily: 'var(--font-geist-mono)', fontSize: 11,
            color: 'rgba(41,41,41,0.45)',
            cursor: 'pointer', padding: 0, appearance: 'none', WebkitAppearance: 'none',
          }}
        >
          {[12, 24, 30, 60].map(f => (
            <option key={f} value={f}>{f} fps</option>
          ))}
        </select>

        {playing ? (
          <button
            onClick={onStop}
            className="w-[76px] h-[76px] rounded-full bg-ink flex items-center justify-center flex-shrink-0"
          >
            <span className="text-white text-xl">■</span>
          </button>
        ) : (
          <button onClick={onPlay} className="flex-shrink-0">
            <img src="/play.svg" className="w-[76px] h-[76px]" alt="Play" />
          </button>
        )}
      </div>
    </div>
  )
}
