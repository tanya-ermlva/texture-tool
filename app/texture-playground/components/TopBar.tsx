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
  onShuffle: () => void
  exporting: boolean
}

const SIZES: Project['outputSize'][] = [512, 1024, 2048]

export default function TopBar({
  outputSize, onSizeChange,
  onExportFrame, onExportWebM, onExportMp4,
  onShuffle, exporting,
}: Props) {
  const [videoFormat, setVideoFormat] = useState<'webm' | 'mp4'>('webm')
  const [showVideoMenu, setShowVideoMenu] = useState(false)

  function handleVideoExport(fmt: 'webm' | 'mp4') {
    setVideoFormat(fmt)
    setShowVideoMenu(false)
    if (fmt === 'webm') onExportWebM()
    else onExportMp4()
  }

  const baseBtn: React.CSSProperties = {
    fontFamily: 'var(--font-geist)',
    fontSize: 14,
    borderRadius: 40,
    border: 'none',
    cursor: 'pointer',
    padding: '6px 12px',
  }

  const ghostBtn: React.CSSProperties = {
    ...baseBtn,
    background: 'rgba(98,90,34,0.06)',
    color: '#292929',
  }

  return (
    <div style={{
      position: 'absolute', top: 8, right: 8,
      background: 'rgba(98,90,34,0.06)', borderRadius: 32,
      padding: 8, display: 'flex', gap: 4, alignItems: 'center',
    }}>
      {/* Size select */}
      <select
        value={outputSize}
        onChange={e => onSizeChange(Number(e.target.value) as Project['outputSize'])}
        style={{
          fontFamily: 'var(--font-geist)',
          fontSize: 14,
          borderRadius: 40,
          border: '1px solid rgba(98,90,34,0.15)',
          cursor: 'pointer',
          padding: '6px 10px',
          background: 'rgba(98,90,34,0.06)',
          color: '#292929',
          appearance: 'none',
          WebkitAppearance: 'none',
          paddingRight: 22,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'%3E%3Cpath d=\'M1 1l4 4 4-4\' stroke=\'%23292929\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        {SIZES.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Shuffle button */}
      <button onClick={onShuffle} title="Shuffle" style={ghostBtn}>
        ⟳
      </button>

      {/* Export PNG */}
      <button onClick={onExportFrame} style={ghostBtn}>
        Export PNG
      </button>

      {/* Export video with dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => !exporting && setShowVideoMenu(v => !v)}
          disabled={exporting}
          style={{
            ...baseBtn,
            background: '#b2c248',
            color: '#292929',
            cursor: exporting ? 'wait' : 'pointer',
            opacity: exporting ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {exporting ? 'Exporting…' : (videoFormat === 'webm' ? 'WebM' : 'MP4')}
          {!exporting && <span style={{ fontSize: 10 }}>▾</span>}
        </button>

        {showVideoMenu && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            background: '#fff',
            border: '1px solid rgba(98,90,34,0.18)',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            zIndex: 10,
            overflow: 'hidden',
            minWidth: 90,
          }}>
            {(['webm', 'mp4'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => handleVideoExport(fmt)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: 'var(--font-geist)',
                  fontSize: 14,
                  padding: '8px 14px',
                  border: 'none',
                  background: videoFormat === fmt ? 'rgba(98,90,34,0.08)' : 'transparent',
                  color: '#292929',
                  cursor: 'pointer',
                }}
              >
                {fmt === 'webm' ? 'WebM' : 'MP4'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
