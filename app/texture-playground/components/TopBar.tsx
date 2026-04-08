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
  exporting: boolean
}

const SIZES: Project['outputSize'][] = [512, 1024, 2048]

type VideoFormat = 'webm' | 'mp4' | 'png-seq'

const FORMAT_LABELS: Record<VideoFormat, string> = {
  'mp4': 'MP4',
  'webm': 'WebM',
  'png-seq': 'PNG sequence',
}

export default function TopBar({
  outputSize, onSizeChange,
  onExportFrame, onExportWebM, onExportMp4, onExportPngSequence,
  exporting,
}: Props) {
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('mp4')
  const [open, setOpen] = useState(false)

  function triggerExport(fmt: VideoFormat) {
    setOpen(false)
    if (fmt === 'mp4') onExportMp4()
    else if (fmt === 'webm') onExportWebM()
    else onExportPngSequence()
  }

  const shortLabel: Record<VideoFormat, string> = {
    'mp4': 'MP4',
    'webm': 'WebM',
    'png-seq': 'PNG seq',
  }

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0,
      padding: '20px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
    }}>
      {/* Single-frame PNG — small ghost */}
      <button
        onClick={onExportFrame}
        disabled={exporting}
        style={{
          background: 'none', border: 'none', cursor: exporting ? 'wait' : 'pointer',
          fontFamily: 'var(--font-geist)', fontSize: 12,
          color: 'rgba(41,41,41,0.35)',
          opacity: exporting ? 0.3 : 1,
          padding: 0,
        }}
      >
        PNG frame ↓
      </button>

      {/* Download video — big label, opens dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => !exporting && setOpen(o => !o)}
          style={{
            background: 'none', border: 'none',
            cursor: exporting ? 'wait' : 'pointer',
            fontFamily: 'var(--font-geist)',
            fontSize: 28,
            fontWeight: 500,
            color: exporting ? 'rgba(41,41,41,0.35)' : '#1a1a1a',
            letterSpacing: '-0.02em',
            padding: 0,
            lineHeight: 1,
          }}
        >
          {exporting ? 'Exporting…' : `Download ${shortLabel[videoFormat]} ↓`}
        </button>

        {open && (
          <div style={{
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
          }}>
            {/* Format */}
            <div style={{ padding: '10px 14px 6px', fontFamily: 'var(--font-geist)', fontSize: 11, color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Format
            </div>
            {(['mp4', 'webm', 'png-seq'] as VideoFormat[]).map(fmt => (
              <button
                key={fmt}
                onClick={() => { setVideoFormat(fmt); triggerExport(fmt) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left',
                  fontFamily: 'var(--font-geist)', fontSize: 14,
                  padding: '8px 14px', border: 'none',
                  background: videoFormat === fmt ? 'rgba(98,90,34,0.08)' : 'transparent',
                  color: '#1a1a1a', cursor: 'pointer',
                }}
              >
                <span>{FORMAT_LABELS[fmt]}</span>
                {videoFormat === fmt && <span style={{ color: '#b2c248', fontSize: 12 }}>↓</span>}
              </button>
            ))}

            {/* Size */}
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
