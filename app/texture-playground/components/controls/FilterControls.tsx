// app/texture-playground/components/controls/FilterControls.tsx
'use client'
import type { FilterEntry } from '../../lib/types'

type Props = {
  entry: FilterEntry
  onChange: (changes: Partial<FilterEntry>) => void
}

type SliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
}

function Slider({ label, value, min, max, step, unit = '', onChange }: SliderProps) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-geist)', fontSize: 11, color: '#72726e' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, color: '#292929' }}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#b2c248', cursor: 'pointer' }}
      />
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-geist)', fontSize: 11, color: '#72726e' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 28, height: 14, borderRadius: 7, padding: '0 2px',
          background: value ? 'rgba(178,194,72,0.15)' : 'rgba(71,67,42,0.08)',
          border: `1px solid ${value ? '#b2c248' : 'rgba(71,67,42,0.2)'}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: value ? 'flex-end' : 'flex-start',
          transition: 'all 0.15s',
        }}
      >
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: value ? '#b2c248' : 'rgba(71,67,42,0.4)',
          transition: 'all 0.15s',
        }} />
      </button>
    </div>
  )
}

export default function FilterControls({ entry, onChange }: Props) {
  switch (entry.type) {
    case 'noise':
      return <Slider label="Intensity" value={entry.intensity} min={0} max={1} step={0.01} onChange={(v) => onChange({ intensity: v })} />

    case 'blur':
      return <Slider label="Strength" value={entry.strength} min={0} max={20} step={0.5} unit="px" onChange={(v) => onChange({ strength: v })} />

    case 'pixelate':
      return <Slider label="Size" value={entry.size} min={1} max={50} step={1} unit="px" onChange={(v) => onChange({ size: v })} />

    case 'displacement':
      return <Slider label="Scale" value={entry.scale} min={0} max={100} step={1} onChange={(v) => onChange({ scale: v })} />

    case 'rgbsplit':
      return <Slider label="Amount" value={entry.amount} min={0} max={30} step={0.5} unit="px" onChange={(v) => onChange({ amount: v })} />

    case 'colormatrix':
      return (
        <div>
          <Slider label="Brightness" value={entry.brightness} min={0} max={2} step={0.02} onChange={(v) => onChange({ brightness: v })} />
          <Slider label="Contrast" value={entry.contrast} min={0} max={2} step={0.02} onChange={(v) => onChange({ contrast: v })} />
          <Slider label="Saturation" value={entry.saturation} min={0} max={2} step={0.02} onChange={(v) => onChange({ saturation: v })} />
          <Slider label="Hue" value={entry.hue} min={-180} max={180} step={1} unit="°" onChange={(v) => onChange({ hue: v })} />
          <Toggle label="Invert" value={entry.invert} onChange={(v) => onChange({ invert: v })} />
        </div>
      )

    case 'halftone':
      return (
        <div>
          <Slider label="Scale" value={entry.scale} min={1} max={20} step={0.5} unit="px" onChange={(v) => onChange({ scale: v })} />
          <Slider label="Angle" value={entry.angle} min={0} max={180} step={1} unit="°" onChange={(v) => onChange({ angle: v })} />
        </div>
      )

    case 'glow':
      return (
        <div>
          <Slider label="Distance" value={entry.distance} min={1} max={30} step={1} unit="px" onChange={(v) => onChange({ distance: v })} />
          <Slider label="Strength" value={entry.strength} min={0} max={10} step={0.1} onChange={(v) => onChange({ strength: v })} />
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-geist)', fontSize: 11, color: '#72726e', marginBottom: 4 }}>Colour</div>
            <input
              type="color" value={entry.color}
              onChange={(e) => onChange({ color: e.target.value })}
              style={{ width: '100%', height: 24, border: '1px solid rgba(71,67,42,0.2)', borderRadius: 4, cursor: 'pointer', background: 'none', padding: 0 }}
            />
          </div>
        </div>
      )
  }
}
