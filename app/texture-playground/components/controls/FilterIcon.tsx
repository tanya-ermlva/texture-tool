// app/texture-playground/components/controls/FilterIcon.tsx
import type { FilterType } from '../../lib/types'

type Props = {
  type: FilterType
  size?: number
  color?: string
}

export default function FilterIcon({ type, size = 18, color = 'currentColor' }: Props) {
  const s = { stroke: color, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (type) {
    case 'noise':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <circle cx={3}  cy={3}  r={1.2} fill={color} opacity={0.9} />
          <circle cx={9}  cy={2}  r={0.8} fill={color} opacity={0.5} />
          <circle cx={14} cy={5}  r={1}   fill={color} opacity={0.7} />
          <circle cx={6}  cy={7}  r={0.7} fill={color} opacity={0.4} />
          <circle cx={13} cy={9}  r={1.2} fill={color} opacity={0.8} />
          <circle cx={2}  cy={11} r={0.8} fill={color} opacity={0.6} />
          <circle cx={8}  cy={13} r={1}   fill={color} opacity={0.9} />
          <circle cx={11} cy={14} r={0.7} fill={color} opacity={0.5} />
          <circle cx={4}  cy={15} r={1}   fill={color} opacity={0.7} />
        </svg>
      )

    case 'displacement':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M1 5 C3.5 2, 6 8, 8 5 S12 2, 15 5"     {...s} strokeWidth={1.2} />
          <path d="M1 10 C3.5 7, 6 13, 8 10 S12 7, 15 10" {...s} strokeWidth={1.2} />
          <path d="M1 15 C3.5 12, 6 16, 8 14 S12 12, 15 15" {...s} strokeWidth={0.6} opacity={0.4} />
        </svg>
      )

    case 'rgbsplit':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <circle cx={6}  cy={8} r={4.5} fill="#e05" opacity={0.45} />
          <circle cx={10} cy={8} r={4.5} fill="#0ae" opacity={0.45} />
          <circle cx={8}  cy={8} r={4.5} fill="#8f0" opacity={0.2} />
        </svg>
      )

    case 'glow':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <circle cx={8} cy={8} r={2.5} fill={color} />
          <circle cx={8} cy={8} r={5}   stroke={color} strokeWidth={1}   opacity={0.4} />
          <circle cx={8} cy={8} r={7}   stroke={color} strokeWidth={0.5} opacity={0.18} />
        </svg>
      )
  }
}
