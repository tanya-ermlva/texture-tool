// app/texture-playground/components/TopBar.tsx
'use client'
import { useState } from 'react'
import type { Project } from '../lib/types'

type Props = {
  outputSize: Project['outputSize']
  onSizeChange: (s: Project['outputSize']) => void
  onExportFrame: () => void
  onExportWebM: () => void
  onExportMp4: () => void
  onExportPngSequence: () => void
  onRandomize: () => void
  exporting: boolean
}

const SIZES: Project['outputSize'][] = [512, 1024, 2048]
type VideoFormat = 'webm' | 'mp4' | 'png-seq' | 'png-frame'

const FORMAT_LABELS: Record<VideoFormat, string> = {
  mp4: 'MP4',
  webm: 'WebM',
  'png-seq': 'PNG sequence',
  'png-frame': 'PNG frame',
}

export default function TopBar({
  outputSize, onSizeChange,
  onExportFrame, onExportWebM, onExportMp4, onExportPngSequence,
  onRandomize, exporting,
}: Props) {
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('mp4')
  const [open, setOpen] = useState(false)

  const shortLabel: Record<VideoFormat, string> = {
    mp4: 'MP4',
    webm: 'WebM',
    'png-seq': 'PNG seq',
    'png-frame': 'PNG frame',
  }

  function triggerExport(fmt: VideoFormat) {
    setOpen(false)
    if (fmt === 'mp4') onExportMp4()
    else if (fmt === 'webm') onExportWebM()
    else if (fmt === 'png-seq') onExportPngSequence()
    else onExportFrame()
  }

  return (
    <div className="flex justify-between items-center p-4">
      <div
        className="group flex flex-row items-center gap-3 cursor-pointer"
        onClick={onRandomize}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onRandomize()}
      >
        <div className="bg-ink rounded-full size-6 xl:size-10 flex-shrink-0 group-hover:bg-pink transition-colors" />
        <span className="font-sans text-display xl:text-display-lg font-normal text-ink leading-none group-hover:text-pink transition-colors">↺</span>
      </div>

      <div className="relative">
        {/* Main download button — group on wrapper div so SVG fill inherits group-hover */}
        <div
          className="group flex items-center gap-[0.08em] cursor-pointer"
          style={{ opacity: exporting ? 0.4 : 1, pointerEvents: exporting ? 'none' : 'auto' }}
          onClick={() => !exporting && setOpen(o => !o)}
        >
          <span className="font-sans text-display xl:text-display-lg font-normal text-ink group-hover:text-pink transition-colors">
            {exporting ? 'Exporting…' : `Download ${shortLabel[videoFormat]}`}
          </span>
          {!exporting && (
            <svg width="32" height="32" viewBox="0 0 46 46" fill="none">
              <path
                d="M25.5762 36.4806C24.4312 38.5065 21.5688 38.5065 20.4238 36.4806L6.90298 12.5581C5.758 10.5323 7.18922 8 9.47919 8L36.5208 8C38.8108 8 40.242 10.5323 39.097 12.5581L25.5762 36.4806Z"
                className="fill-ink group-hover:fill-pink transition-colors"
              />
            </svg>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              background: '#fff',
              border: '1px solid rgba(71,67,42,0.12)',
              borderRadius: 14,
              boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
              zIndex: 50,
              overflow: 'hidden',
              minWidth: 180,
            }}
          >
            <div style={{ padding: '10px 14px 6px', fontFamily: 'var(--font-geist)', fontSize: 11, color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Format
            </div>
            {(['mp4', 'webm', 'png-seq', 'png-frame'] as VideoFormat[]).map(fmt => (
              <button
                key={fmt}
                onClick={() => { setVideoFormat(fmt); triggerExport(fmt) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left',
                  fontFamily: 'var(--font-geist)', fontSize: 14,
                  padding: '8px 14px', border: 'none',
                  background: videoFormat === fmt ? 'rgba(98,90,34,0.08)' : 'transparent',
                  color: '#312E2E', cursor: 'pointer',
                }}
              >
                <span>{FORMAT_LABELS[fmt]}</span>
                {videoFormat === fmt && <span style={{ color: '#b2c248', fontSize: 12 }}>↓</span>}
              </button>
            ))}

            <div style={{ borderTop: '1px solid rgba(71,67,42,0.08)', padding: '10px 14px 6px', fontFamily: 'var(--font-geist)', fontSize: 11, color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Size
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '4px 14px 12px' }}>
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => onSizeChange(s)}
                  style={{
                    flex: 1, padding: '6px 0', border: 'none', borderRadius: 8,
                    background: outputSize === s ? '#1a1a1a' : 'rgba(98,90,34,0.07)',
                    color: outputSize === s ? '#fff' : '#292929',
                    fontFamily: 'var(--font-geist-mono)', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
