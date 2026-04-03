// app/texture-playground/components/controls/CompositionIcon.tsx
import type { CompositionType } from '../../lib/types'

export type LayerIconType = CompositionType | 'background' | 'image' | 'adjustment' | 'midground'

type Props = {
  type: LayerIconType
  size?: number
  color?: string
}

export default function CompositionIcon({ type, size = 16, color = 'currentColor' }: Props) {
  const s = { stroke: color, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (type) {
    case 'dot-grid':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          {([3, 8, 13] as number[]).flatMap(x =>
            ([3, 8, 13] as number[]).map(y => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={1.5} fill={color} />
            ))
          )}
        </svg>
      )

    case 'regular-grid':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          {[4, 8, 12].map(x => <line key={`v${x}`} x1={x} y1={1} x2={x} y2={15} {...s} strokeWidth={1} />)}
          {[4, 8, 12].map(y => <line key={`h${y}`} x1={1} y1={y} x2={15} y2={y} {...s} strokeWidth={1} />)}
        </svg>
      )

    case 'variable-grid':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <line x1={3}  y1={1} x2={3}  y2={15} {...s} strokeWidth={2} />
          <line x1={8}  y1={1} x2={8}  y2={15} {...s} strokeWidth={0.75} />
          <line x1={13} y1={1} x2={13} y2={15} {...s} strokeWidth={0.75} />
          <line x1={1} y1={3}  x2={15} y2={3}  {...s} strokeWidth={2} />
          <line x1={1} y1={8}  x2={15} y2={8}  {...s} strokeWidth={0.75} />
          <line x1={1} y1={13} x2={15} y2={13} {...s} strokeWidth={0.75} />
        </svg>
      )

    case 'linear':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <line x1={1} y1={3}  x2={15} y2={3}  {...s} strokeWidth={2} />
          <line x1={1} y1={7}  x2={15} y2={7}  {...s} strokeWidth={0.75} />
          <line x1={1} y1={10} x2={15} y2={10} {...s} strokeWidth={0.75} />
          <line x1={1} y1={13} x2={15} y2={13} {...s} strokeWidth={0.75} />
        </svg>
      )

    case 'layered':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <line x1={5}  y1={1} x2={5}  y2={15} {...s} strokeWidth={1.5} opacity={0.9} />
          <line x1={11} y1={1} x2={11} y2={15} {...s} strokeWidth={1.5} opacity={0.9} />
          <line x1={1} y1={5}  x2={15} y2={5}  {...s} strokeWidth={1.5} opacity={0.9} />
          <line x1={1} y1={11} x2={15} y2={11} {...s} strokeWidth={1.5} opacity={0.9} />
          <line x1={2}  y1={1} x2={2}  y2={15} {...s} strokeWidth={0.5} opacity={0.4} />
          <line x1={8}  y1={1} x2={8}  y2={15} {...s} strokeWidth={0.5} opacity={0.4} />
          <line x1={14} y1={1} x2={14} y2={15} {...s} strokeWidth={0.5} opacity={0.4} />
          <line x1={1} y1={2}  x2={15} y2={2}  {...s} strokeWidth={0.5} opacity={0.4} />
          <line x1={1} y1={8}  x2={15} y2={8}  {...s} strokeWidth={0.5} opacity={0.4} />
          <line x1={1} y1={14} x2={15} y2={14} {...s} strokeWidth={0.5} opacity={0.4} />
        </svg>
      )

    case 'checkered':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <rect x={1} y={1} width={6.5} height={6.5} fill={color} />
          <rect x={8.5} y={8.5} width={6.5} height={6.5} fill={color} />
          <rect x={8.5} y={1} width={6.5} height={6.5} stroke={color} strokeWidth={0.75} />
          <rect x={1} y={8.5} width={6.5} height={6.5} stroke={color} strokeWidth={0.75} />
        </svg>
      )

    case 'background':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <rect x={2} y={2} width={12} height={12} rx={2} fill={color} opacity={0.35} />
          <rect x={2} y={2} width={12} height={12} rx={2} stroke={color} strokeWidth={1} />
        </svg>
      )

    case 'image':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <rect x={1} y={3} width={14} height={10} rx={1.5} stroke={color} strokeWidth={1} />
          <circle cx={5} cy={6.5} r={1.5} fill={color} opacity={0.8} />
          <path d="M1 10.5 L5.5 7.5 L9 10 L12 8 L15 10.5" {...s} strokeWidth={1} />
        </svg>
      )

    case 'midground':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <rect x={1} y={3} width={14} height={10} rx={1.5} fill={color} opacity={0.25} />
          <rect x={1} y={3} width={14} height={10} rx={1.5} stroke={color} strokeWidth={1} />
          <path d="M3 6 Q6 8 9 6 T15 6" {...s} strokeWidth={0.75} />
        </svg>
      )

    case 'adjustment':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M8 2 L9.5 6.5 L14 6.5 L10.5 9.5 L12 14 L8 11 L4 14 L5.5 9.5 L2 6.5 L6.5 6.5 Z"
            stroke={color} strokeWidth={1} strokeLinejoin="round" fill="none" />
        </svg>
      )
  }
}
