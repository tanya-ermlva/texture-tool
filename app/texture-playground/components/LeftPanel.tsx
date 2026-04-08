// app/texture-playground/components/LeftPanel.tsx
'use client'
import { useState } from 'react'
import type {
  FrameSnapshot, LayerOverride, FilterEntry, FilterType,
  BackgroundLayer, MidgroundLayer, GridLayer, AdjustmentLayer, CompositionType,
} from '../lib/types'
import ColorPicker from './controls/ColorPicker'
import MidgroundPicker from './controls/MidgroundPicker'
import FilterStack from './controls/FilterStack'
import CompositionPicker from './controls/CompositionPicker'
import CompositionIcon from './controls/CompositionIcon'
import FilterIcon from './controls/FilterIcon'

type Props = {
  snapshot: FrameSnapshot
  outputSize: number
  onLayerChange: (layerId: string, override: LayerOverride) => void
  onAddGridLayer: () => void
  onDeleteLayer: (layerId: string) => void
  onAddFilter: (entry: FilterEntry) => void
  onFilterChange: (filterType: FilterType, changes: Partial<FilterEntry>) => void
  onRemoveFilter: (filterType: FilterType) => void
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

// ── Swatch components ──────────────────────────────────────────────────────────

function Swatch({ color }: { color: string }) {
  return (
    <div style={{ width: 64, height: 64, borderRadius: 18, background: color, flexShrink: 0 }} />
  )
}

function TextureSwatchIcon({ composition }: { composition: CompositionType }) {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: 18,
      background: '#1a1a1a', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <CompositionIcon type={composition} size={26} color="#ffffff" />
    </div>
  )
}

function FilterSwatch({ filters }: { filters: FilterEntry[] }) {
  const active = filters.filter(f => f.enabled)
  if (active.length === 0) return <Swatch color="#F2F2F2" />
  const shown = active.slice(0, 4)
  const single = shown.length === 1
  return (
    <div style={{
      width: 64, height: 64, borderRadius: 18,
      background: '#b2c248', flexShrink: 0,
      display: 'flex', flexWrap: 'wrap',
      alignItems: 'center', justifyContent: 'center',
      gap: single ? 0 : 4,
      padding: single ? 0 : 10,
    }}>
      {shown.map(f => (
        <FilterIcon key={f.type} type={f.type} size={single ? 26 : 14} color="#1a1a1a" />
      ))}
    </div>
  )
}

function ImageSwatch({ src }: { src: string | null }) {
  if (!src) return <Swatch color="#F2F2F2" />
  return (
    <img
      src={src} alt=""
      style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'cover', flexShrink: 0, display: 'block' }}
    />
  )
}

// ── Row / ControlRow ───────────────────────────────────────────────────────────

type RowProps = {
  label: string
  open: boolean
  onToggle: () => void
  swatch: React.ReactNode
  children: React.ReactNode
}

function Row({ label, open, onToggle, swatch, children }: RowProps) {
  return (
    <div className="flex flex-col gap-0">
      <div
        onClick={onToggle}
        className={`group flex flex-row justify-between items-center p-[6px] border-[0.5px] border-ink/30 cursor-pointer select-none transition-[border-radius] duration-300 ease-out ${
          open ? 'rounded-[24px]' : 'rounded-[24px] hover:rounded-[999px]'
        }`}
      >
        <h4 className="pl-4 font-sans text-2xl font-normal text-ink">{label}</h4>
        <div>{swatch}</div>
      </div>
      {open && (
        <div style={{ padding: '12px 8px 20px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── LeftPanel ──────────────────────────────────────────────────────────────────

export default function LeftPanel({
  snapshot, outputSize, onLayerChange, onAddGridLayer, onDeleteLayer,
  onAddFilter, onFilterChange, onRemoveFilter,
}: Props) {
  const [open, setOpen] = useState<'filter' | 'texture' | 'image' | 'colour' | null>(null)

  const bgLayer   = snapshot.layers.find(l => l.kind === 'background') as BackgroundLayer
  const midLayer  = snapshot.layers.find(l => l.kind === 'midground')  as MidgroundLayer
  const gridLayer = snapshot.layers.find(l => l.kind === 'grid')       as GridLayer | undefined
  const adjLayer  = snapshot.layers.find(l => l.kind === 'adjustment') as AdjustmentLayer

  function toggle(k: 'filter' | 'texture' | 'image' | 'colour') {
    setOpen(prev => prev === k ? null : k)
  }

  return (
    <div className="flex flex-col gap-2 pt-4 overflow-y-auto">
      <Row
        label="Filter"
        open={open === 'filter'}
        onToggle={() => toggle('filter')}
        swatch={<FilterSwatch filters={adjLayer.filters} />}
      >
        <FilterStack
          layer={adjLayer}
          onAdd={onAddFilter}
          onChange={onFilterChange}
          onRemove={onRemoveFilter}
        />
      </Row>

      <Row
        label="Texture"
        open={open === 'texture'}
        onToggle={() => toggle('texture')}
        swatch={gridLayer
          ? <TextureSwatchIcon composition={gridLayer.composition} />
          : <Swatch color="#F2F2F2" />
        }
      >
        {gridLayer ? (
          <div>
            <CompositionPicker
              value={gridLayer.composition}
              onChange={(c) => onLayerChange(gridLayer.id, { composition: c })}
              onDeselect={() => onDeleteLayer(gridLayer.id)}
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
      </Row>

      <Row
        label="Image"
        open={open === 'image'}
        onToggle={() => toggle('image')}
        swatch={<ImageSwatch src={midLayer.src} />}
      >
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
            <Slider label="Scale"    value={midLayer.scale}                     min={0.5} max={3}             step={0.05}            onChange={(v) => onLayerChange(midLayer.id, { scale: v })} />
            <Slider label="Opacity"  value={Math.round(midLayer.opacity * 100)} min={0}   max={100}           step={1}    unit="%"   onChange={(v) => onLayerChange(midLayer.id, { opacity: v / 100 })} />
            <Slider label="X offset" value={midLayer.x}                         min={-outputSize / 2} max={outputSize / 2} step={1} unit="px" onChange={(v) => onLayerChange(midLayer.id, { x: v })} />
            <Slider label="Y offset" value={midLayer.y}                         min={-outputSize / 2} max={outputSize / 2} step={1} unit="px" onChange={(v) => onLayerChange(midLayer.id, { y: v })} />
          </div>
        )}
      </Row>

      <Row
        label="Colour"
        open={open === 'colour'}
        onToggle={() => toggle('colour')}
        swatch={<Swatch color={bgLayer.color} />}
      >
        <ColorPicker value={bgLayer.color} onChange={(color) => onLayerChange(bgLayer.id, { color })} />
      </Row>
    </div>
  )
}
