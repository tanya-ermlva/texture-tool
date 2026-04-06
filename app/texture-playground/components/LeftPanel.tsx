// app/texture-playground/components/LeftPanel.tsx
'use client'
import { useState } from 'react'
import type {
  FrameSnapshot, LayerOverride, FilterEntry, FilterType,
  BackgroundLayer, MidgroundLayer, GridLayer, AdjustmentLayer,
} from '../lib/types'
import ColorPicker from './controls/ColorPicker'
import MidgroundPicker from './controls/MidgroundPicker'
import FilterStack from './controls/FilterStack'
import CompositionPicker from './controls/CompositionPicker'
import PresetBar from './PresetBar'
import type { Project } from '../lib/types'

type Props = {
  snapshot: FrameSnapshot
  outputSize: number
  onLayerChange: (layerId: string, override: LayerOverride) => void
  onAddGridLayer: () => void
  onAddFilter: (entry: FilterEntry) => void
  onFilterChange: (filterType: FilterType, changes: Partial<FilterEntry>) => void
  onRemoveFilter: (filterType: FilterType) => void
  project: Project
  onLoadPreset: (project: Project) => void
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
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-geist)', fontSize: 13, color: '#72726e' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 13, color: '#292929' }}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#b2c248', cursor: 'pointer' }}
      />
    </div>
  )
}

type SectionProps = {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

function Section({ title, open, onToggle, children }: SectionProps) {
  return (
    <div style={{ background: 'rgba(98,90,34,0.06)', borderRadius: 12, overflow: 'hidden' }}>
      <div
        onClick={onToggle}
        style={{
          padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontFamily: 'var(--font-geist)', fontSize: 18, color: '#292929' }}>{title}</span>
        <span style={{ fontSize: 22, color: '#292929', lineHeight: 1 }}>{open ? '–' : '+'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 24px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function LeftPanel({
  snapshot, outputSize, onLayerChange, onAddGridLayer,
  onAddFilter, onFilterChange, onRemoveFilter,
  project, onLoadPreset,
}: Props) {
  const [open, setOpen] = useState({ filters: false, texture: false, midground: true, colour: true })

  const bgLayer = snapshot.layers.find(l => l.kind === 'background') as BackgroundLayer
  const midLayer = snapshot.layers.find(l => l.kind === 'midground') as MidgroundLayer
  const gridLayer = snapshot.layers.find(l => l.kind === 'grid') as GridLayer | undefined
  const adjLayer = snapshot.layers.find(l => l.kind === 'adjustment') as AdjustmentLayer

  function toggle(k: keyof typeof open) {
    setOpen(o => {
      const wasOpen = o[k]
      return { filters: false, texture: false, midground: false, colour: false, [k]: !wasOpen }
    })
  }

  return (
    <div style={{
      width: 300, padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
      overflowY: 'auto', flexShrink: 0, height: '100vh', boxSizing: 'border-box',
    }}>

      <Section title="Filters" open={open.filters} onToggle={() => toggle('filters')}>
        <FilterStack
          layer={adjLayer}
          onAdd={onAddFilter}
          onChange={onFilterChange}
          onRemove={onRemoveFilter}
        />
      </Section>

      <Section title="Texture" open={open.texture} onToggle={() => toggle('texture')}>
        {gridLayer ? (
          <div>
            <CompositionPicker
              value={gridLayer.composition}
              onChange={(c) => onLayerChange(gridLayer.id, { composition: c })}
            />
            <div style={{ height: 16 }} />
            <Slider label="Spacing" value={gridLayer.spacing} min={4} max={120} step={1} unit="px" onChange={(v) => onLayerChange(gridLayer.id, { spacing: v })} />
            {gridLayer.composition === 'dot-grid' && (
              <Slider label="Dot size" value={gridLayer.dotSize} min={1} max={20} step={0.5} unit="px" onChange={(v) => onLayerChange(gridLayer.id, { dotSize: v })} />
            )}
            {gridLayer.composition !== 'dot-grid' && gridLayer.composition !== 'checkered' && (
              <Slider label="Thickness" value={gridLayer.thickness} min={0.5} max={8} step={0.5} unit="px" onChange={(v) => onLayerChange(gridLayer.id, { thickness: v })} />
            )}
            <Slider label="Scale" value={gridLayer.scale} min={0.5} max={3} step={0.05} onChange={(v) => onLayerChange(gridLayer.id, { scale: v })} />
            <Slider label="Opacity" value={Math.round(gridLayer.opacity * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => onLayerChange(gridLayer.id, { opacity: v / 100 })} />
            <div style={{ marginTop: 8 }}>
              <span style={{ fontFamily: 'var(--font-geist)', fontSize: 13, color: '#72726e', display: 'block', marginBottom: 8 }}>Colour</span>
              <ColorPicker
                value={gridLayer.color}
                onChange={(color) => onLayerChange(gridLayer.id, { color })}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={onAddGridLayer}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none',
              background: 'rgba(98,90,34,0.08)', color: '#292929',
              fontFamily: 'var(--font-geist)', fontSize: 14, cursor: 'pointer',
            }}
          >+ Add texture layer</button>
        )}
      </Section>

      <Section title="Midground Texture" open={open.midground} onToggle={() => toggle('midground')}>
        <MidgroundPicker
          layer={midLayer}
          onChange={(changes) => onLayerChange(midLayer.id, changes)}
          onUpload={(file) => {
            const url = URL.createObjectURL(file)
            onLayerChange(midLayer.id, { src: url, label: file.name })
          }}
        />
        {midLayer.src && (
          <div style={{ marginTop: 16 }}>
            <Slider label="Scale" value={midLayer.scale} min={0.5} max={3} step={0.05} onChange={(v) => onLayerChange(midLayer.id, { scale: v })} />
            <Slider label="Opacity" value={Math.round(midLayer.opacity * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => onLayerChange(midLayer.id, { opacity: v / 100 })} />
            <Slider label="X offset" value={midLayer.x} min={-outputSize / 2} max={outputSize / 2} step={1} unit="px" onChange={(v) => onLayerChange(midLayer.id, { x: v })} />
            <Slider label="Y offset" value={midLayer.y} min={-outputSize / 2} max={outputSize / 2} step={1} unit="px" onChange={(v) => onLayerChange(midLayer.id, { y: v })} />
          </div>
        )}
      </Section>

      <Section title="Colour bg" open={open.colour} onToggle={() => toggle('colour')}>
        <ColorPicker value={bgLayer.color} onChange={(color) => onLayerChange(bgLayer.id, { color })} />
      </Section>

      <div style={{ flex: 1 }} />
      <PresetBar project={project} onLoad={onLoadPreset} />

    </div>
  )
}
