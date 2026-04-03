// app/texture-playground/components/TopBar.tsx
'use client'
import type { Project } from '../lib/types'

type Props = {
  outputSize: Project['outputSize']
  onSizeChange: (s: Project['outputSize']) => void
  onExportFrame: () => void
  onExportWebM: () => void
  exporting: boolean
}

const SIZES: Project['outputSize'][] = [512, 1024, 2048]

export default function TopBar({ outputSize, onSizeChange, onExportFrame, onExportWebM, exporting }: Props) {
  return (
    <div style={{
      position: 'absolute', top: 8, right: 8,
      background: 'rgba(98,90,34,0.06)', borderRadius: 32,
      padding: 8, display: 'flex', gap: 4, alignItems: 'center',
    }}>
      {SIZES.map(s => (
        <button key={s} onClick={() => onSizeChange(s)} style={{
          fontFamily: 'var(--font-geist-mono)', fontSize: 12,
          padding: '6px 10px', borderRadius: 40, border: 'none', cursor: 'pointer',
          background: outputSize === s ? 'rgba(98,90,34,0.10)' : 'transparent',
          color: outputSize === s ? '#292929' : '#72726e',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: outputSize === s ? '#292929' : 'transparent',
            border: outputSize === s ? 'none' : '1px solid #72726e',
            display: 'inline-block',
          }} />
          {s}
        </button>
      ))}
      <button onClick={onExportFrame} style={{
        fontFamily: 'var(--font-geist)', fontSize: 16,
        padding: '12px 16px', borderRadius: 40, border: 'none', cursor: 'pointer',
        background: 'rgba(98,90,34,0.06)', color: '#292929',
      }}>
        Export png
      </button>
      <button
        onClick={onExportWebM}
        disabled={exporting}
        style={{
          fontFamily: 'var(--font-geist)', fontSize: 16,
          padding: '12px 16px', borderRadius: 40, border: 'none',
          background: '#b2c248', color: '#292929',
          cursor: exporting ? 'wait' : 'pointer', opacity: exporting ? 0.6 : 1,
        }}
      >
        {exporting ? 'Exporting…' : 'Export video'}
      </button>
    </div>
  )
}
