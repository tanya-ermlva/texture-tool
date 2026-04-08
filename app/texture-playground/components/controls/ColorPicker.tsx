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
    <div className="grid grid-cols-4 gap-4">
      {COLOURS.map((color) => {
        const selected = value.toLowerCase() === color.toLowerCase()
        return (
          <button
            key={color}
            onClick={() => onChange(color)}
            title={color}
            className="rounded-full aspect-square w-full cursor-pointer"
            style={{
              background: color,
              boxShadow: selected
                ? '0 0 0 2px #f7f7f2, 0 0 0 4px #d1e043'
                : '0 0 0 0.5px rgba(71,67,42,0.2)',
            }}
          />
        )
      })}
    </div>
  )
}
