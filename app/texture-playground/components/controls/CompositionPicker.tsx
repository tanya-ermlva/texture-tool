// app/texture-playground/components/controls/CompositionPicker.tsx
'use client'
import type { CompositionType } from '../../lib/types'
import CompositionIcon from './CompositionIcon'

const COMPOSITIONS: { id: CompositionType; label: string }[] = [
  { id: 'dot-grid',      label: 'Dot grid' },
  { id: 'regular-grid',  label: 'Regular' },
  { id: 'variable-grid', label: 'Variable' },
  { id: 'linear',        label: 'Linear' },
  { id: 'layered',       label: 'Layered' },
  { id: 'checkered',     label: 'Checkered' },
]

type Props = {
  value: CompositionType
  onChange: (c: CompositionType) => void
  onDeselect?: () => void
}

export default function CompositionPicker({ value, onChange, onDeselect }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
      {COMPOSITIONS.map(({ id, label }) => {
        const active = value === id
        return (
          <button
            key={id}
            onClick={() => active && onDeselect ? onDeselect() : onChange(id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '8px 4px 6px',
              background: active ? 'rgba(178,194,72,0.15)' : 'rgba(98,90,34,0.06)',
              border: `1px solid ${active ? 'rgba(178,194,72,0.5)' : 'rgba(71,67,42,0.1)'}`,
              borderRadius: 8, cursor: 'pointer',
            }}
          >
            <CompositionIcon type={id} size={18} color={active ? '#b2c248' : '#72726e'} />
            <span style={{
              fontFamily: 'var(--font-geist)', fontSize: 10,
              color: active ? '#292929' : '#72726e',
              letterSpacing: '0.02em', lineHeight: 1,
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
