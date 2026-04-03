// app/texture-playground/components/controls/ColorPicker.tsx
'use client'

const COLOURS = [
  '#444625', '#788d16', '#b2c349', '#e5eacd',
  '#ee9212', '#4791e2', '#ff92e0', '#a291ce',
]

type Props = {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
      {COLOURS.map((color) => {
        const selected = value.toLowerCase() === color.toLowerCase()
        return (
          <button
            key={color}
            onClick={() => onChange(color)}
            title={color}
            style={{
              background: '#f7f7f2',
              border: selected ? '2px solid #d1e043' : '0.5px solid rgba(71,67,42,0.2)',
              borderRadius: '50%', padding: 1,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: color }} />
          </button>
        )
      })}
    </div>
  )
}
