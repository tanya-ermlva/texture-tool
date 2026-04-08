// app/texture-playground/components/controls/FilterStack.tsx
'use client'
import { useState } from 'react'
import type { AdjustmentLayer, FilterEntry, FilterType } from '../../lib/types'
import FilterControls from './FilterControls'
import FilterIcon from './FilterIcon'

type Props = {
  layer: AdjustmentLayer
  onAdd: (entry: FilterEntry) => void
  onChange: (filterType: FilterType, changes: Partial<FilterEntry>) => void
  onRemove: (filterType: FilterType) => void
}

const FILTER_DEFAULTS: Partial<Record<FilterType, FilterEntry>> = {
  noise:    { type: 'noise',    enabled: true, intensity: 0.35, seed: Math.random(), grainSize: 1 },
  rgbsplit: { type: 'rgbsplit', enabled: true, amount: 6 },
  glow:     { type: 'glow',     enabled: true, distance: 10, strength: 2, color: '#b2c248' },
}

const FILTER_LABELS: Partial<Record<FilterType, string>> = {
  noise: 'Grain', rgbsplit: 'RGB', glow: 'Glow',
}

const ALL_FILTERS: FilterType[] = ['noise', 'rgbsplit', 'glow']

export default function FilterStack({ layer, onAdd, onChange, onRemove }: Props) {
  const [expanded, setExpanded] = useState<FilterType | null>(null)
  const activeMap = new Map(layer.filters.map((f) => [f.type, f]))

  function handleTileClick(type: FilterType) {
    if (activeMap.has(type)) {
      // Already active — remove it (deselect)
      onRemove(type)
      if (expanded === type) setExpanded(null)
    } else {
      // Not active — add it and expand
      const def = FILTER_DEFAULTS[type]
      if (def) onAdd(def)
      setExpanded(type)
    }
  }

  const expandedEntry = expanded ? activeMap.get(expanded) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Tile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
        {ALL_FILTERS.map((type) => {
          const active = activeMap.has(type)
          const open = expanded === type
          return (
            <button
              key={type}
              onClick={() => handleTileClick(type)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                padding: '8px 4px 6px',
                background: open
                  ? 'rgba(178,194,72,0.2)'
                  : active
                  ? 'rgba(178,194,72,0.10)'
                  : 'rgba(98,90,34,0.06)',
                border: `1px solid ${open
                  ? 'rgba(178,194,72,0.6)'
                  : active
                  ? 'rgba(178,194,72,0.35)'
                  : 'rgba(71,67,42,0.1)'}`,
                borderRadius: 8, cursor: 'pointer',
              }}
            >
              <FilterIcon
                type={type}
                size={18}
                color={active ? '#b2c248' : '#72726e'}
              />
              <span style={{
                fontFamily: 'var(--font-geist)', fontSize: 9,
                color: active ? '#292929' : '#72726e',
                letterSpacing: '0.02em', lineHeight: 1,
              }}>
                {FILTER_LABELS[type] ?? type}
              </span>
            </button>
          )
        })}
      </div>

      {/* Expanded controls */}
      {expandedEntry && (
        <div style={{
          border: '1px solid rgba(71,67,42,0.15)',
          borderRadius: 8, overflow: 'hidden',
        }}>
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', background: 'rgba(98,90,34,0.06)',
          }}>
            <button
              onClick={() => onChange(expandedEntry.type, { enabled: !expandedEntry.enabled })}
              title={expandedEntry.enabled ? 'Disable' : 'Enable'}
              style={{
                width: 10, height: 10, borderRadius: '50%', padding: 0, border: 'none',
                background: expandedEntry.enabled ? '#b2c248' : 'rgba(71,67,42,0.2)',
                cursor: 'pointer', flexShrink: 0,
              }}
            />
            <span style={{
              fontFamily: 'var(--font-geist)', fontSize: 13,
              color: expandedEntry.enabled ? '#292929' : '#72726e',
              fontWeight: 500, flex: 1,
            }}>
              {FILTER_LABELS[expandedEntry.type]}
            </span>
            <button
              onClick={() => { onRemove(expandedEntry.type); setExpanded(null) }}
              style={{
                background: 'none', border: 'none', color: '#72726e',
                cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1,
              }}
              title="Remove filter"
            >×</button>
          </div>

          {/* Controls */}
          {expandedEntry.enabled && (
            <div style={{ padding: '8px 12px 4px', background: '#f7f7f2' }}>
              <FilterControls
                entry={expandedEntry}
                onChange={(changes) => onChange(expandedEntry.type, changes)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
