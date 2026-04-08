'use client'
import { useRef, useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import type { Project, RendererAdapter, Layer, CompositionType, GridLayer, ImageLayer, MidgroundLayer, LayerOverride, Frame, FilterEntry, FilterType } from './lib/types'
import CanvasPreview from './components/CanvasPreview'
import LeftPanel from './components/LeftPanel'
import TopBar from './components/TopBar'
import Timeline from './components/Timeline'
import PresetBar from './components/PresetBar'
import { resolveFrame } from './lib/resolve'
import { usePlayback } from './lib/playback'
import { exportWebMDeterministic, exportFramePng, exportMp4, exportPngSequence } from './lib/export'
import { useHistory } from './lib/useHistory'
import { serializeProject, deserializeProject } from './lib/serialize'

const COMPOSITIONS: CompositionType[] = [
  'dot-grid', 'regular-grid', 'variable-grid', 'linear', 'layered', 'checkered',
]

const RANDOM_FILTERS: FilterEntry[] = [
  { type: 'noise',        enabled: true, intensity: 0.35, seed: 0, grainSize: 1 },
  { type: 'rgbsplit',     enabled: true, amount: 6 },
  { type: 'displacement', enabled: true, scale: 30 },
  { type: 'glow',         enabled: true, distance: 10, strength: 2, color: '#b2c248' },
]

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function makeDefaultProject(): Project {
  const composition = pick(COMPOSITIONS)
  const filterEntry: FilterEntry = { ...pick(RANDOM_FILTERS) }
  if (filterEntry.type === 'noise') filterEntry.seed = Math.random()

  const gridLayer: GridLayer = {
    id: nanoid(6), kind: 'grid', composition,
    spacing: 20, thickness: 1, dotSize: 3, opacity: 1, scale: 1,
    color: '#1e1e1e',
  }

  const layers: Layer[] = [
    { id: 'bg',  kind: 'background', color: '#ff92e0' },
    { id: 'mid', kind: 'midground',  src: null, label: '', opacity: 1, scale: 1, x: 0, y: 0 },
    gridLayer,
    { id: 'adj', kind: 'adjustment', filters: [filterEntry] },
  ]

  return {
    frames: [{ id: 'f1', layers, durationFrames: 10 }],
    outputSize: 1024,
    fps: 24,
    activeFrameId: 'f1',
  }
}

function loadInitialProject(): Project {
  try {
    const raw = localStorage.getItem('texture-tool:autosave')
    if (raw) return deserializeProject(JSON.parse(raw))
  } catch { /* ignore */ }
  return makeDefaultProject()
}

export default function TexturePlaygroundClient() {
  const [initialProject] = useState(loadInitialProject)
  const { state: project, set: setProject, undo, redo, canUndo, canRedo } = useHistory<Project>(initialProject)
  const adapterRef = useRef<RendererAdapter | null>(null)
  const [adapter, setAdapter] = useState<RendererAdapter | null>(null)
  const activeFrame = project.frames.find(f => f.id === project.activeFrameId) ?? project.frames[0]
  const snapshot = resolveFrame(activeFrame)

  const [exporting, setExporting] = useState(false)
  const [playing, setPlaying] = useState(false)
  usePlayback(adapter, project, playing, () => setPlaying(false))

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  useEffect(() => {
    const t = setTimeout(async () => {
      const serialized = await serializeProject(project)
      localStorage.setItem('texture-tool:autosave', JSON.stringify(serialized))
    }, 500)
    return () => clearTimeout(t)
  }, [project])

  function handleLayerChange(layerId: string, override: LayerOverride) {
    setProject(p => ({
      ...p,
      frames: p.frames.map(f =>
        f.id !== p.activeFrameId ? f : {
          ...f,
          layers: f.layers.map(l => l.id === layerId ? { ...l, ...override } as Layer : l),
        }
      ),
    }))
  }

  function handleAddGridLayer(composition: CompositionType) {
    const newLayer: GridLayer = {
      id: nanoid(6), kind: 'grid', composition,
      spacing: 20, thickness: 1, dotSize: 3, opacity: 1, scale: 1,
      color: '#1e1e1e',
    }
    setProject(p => ({
      ...p,
      frames: p.frames.map(f => {
        if (f.id !== p.activeFrameId) return f
        const adjLayers = f.layers.filter(l => l.kind === 'adjustment')
        const contentLayers = f.layers.filter(l => l.kind !== 'adjustment')
        return { ...f, layers: [...contentLayers, newLayer, ...adjLayers] }
      }),
    }))
  }

  function handleDeleteLayer(layerId: string) {
    setProject(p => ({
      ...p,
      frames: p.frames.map(f => {
        if (f.id !== p.activeFrameId) return f
        const layer = f.layers.find(l => l.id === layerId)
        if (!layer || layer.kind === 'adjustment') return f  // guard
        if (layer.kind === 'image') URL.revokeObjectURL(layer.objectUrl)
        return { ...f, layers: f.layers.filter(l => l.id !== layerId) }
      }),
    }))
  }

  function handleAddImageLayer(file: File) {
    const objectUrl = URL.createObjectURL(file)
    const newLayer: ImageLayer = {
      id: nanoid(6), kind: 'image', file, objectUrl,
      scale: 1, x: 0, y: 0, opacity: 1,
    }
    setProject(p => ({
      ...p,
      frames: p.frames.map(f => {
        if (f.id !== p.activeFrameId) return f
        const adjLayers = f.layers.filter(l => l.kind === 'adjustment')
        const contentLayers = f.layers.filter(l => l.kind !== 'adjustment')
        return { ...f, layers: [...contentLayers, newLayer, ...adjLayers] }
      }),
    }))
  }

  function handleAddFilter(entry: FilterEntry) {
    setProject(p => ({
      ...p,
      frames: p.frames.map(f =>
        f.id !== p.activeFrameId ? f : {
          ...f,
          layers: f.layers.map(l =>
            l.kind === 'adjustment' ? { ...l, filters: [...l.filters, entry] } : l
          ),
        }
      ),
    }))
  }

  function handleFilterChange(filterType: FilterType, changes: Partial<FilterEntry>) {
    setProject(p => ({
      ...p,
      frames: p.frames.map(f =>
        f.id !== p.activeFrameId ? f : {
          ...f,
          layers: f.layers.map(l =>
            l.kind !== 'adjustment' ? l : {
              ...l,
              filters: l.filters.map(fe =>
                fe.type === filterType ? { ...fe, ...changes } as FilterEntry : fe
              ),
            }
          ),
        }
      ),
    }))
  }

  function handleRemoveFilter(filterType: FilterType) {
    setProject(p => ({
      ...p,
      frames: p.frames.map(f =>
        f.id !== p.activeFrameId ? f : {
          ...f,
          layers: f.layers.map(l =>
            l.kind !== 'adjustment' ? l : {
              ...l,
              filters: l.filters.filter(fe => fe.type !== filterType),
            }
          ),
        }
      ),
    }))
  }

  function handleAddToTimeline() {
    setProject(p => {
      if (p.frames.length >= 8) return p
      const currentFrame = p.frames.find(f => f.id === p.activeFrameId) ?? p.frames[0]
      const newFrame: Frame = {
        id: nanoid(6),
        layers: currentFrame.layers.map(l => ({ ...l, id: nanoid(6) })),
        durationFrames: currentFrame.durationFrames,
      }
      return {
        ...p,
        frames: [...p.frames, newFrame],
        activeFrameId: newFrame.id,
      }
    })
  }

  function handleDeleteFrame(frameId: string) {
    setProject(p => {
      const frame = p.frames.find(f => f.id === frameId)
      frame?.layers.forEach(l => { if (l.kind === 'image') URL.revokeObjectURL(l.objectUrl) })
      const frames = p.frames.filter(f => f.id !== frameId)
      return { ...p, frames, activeFrameId: frames[0]?.id ?? p.activeFrameId }
    })
  }

  function handleReorderFrames(fromId: string, toId: string) {
    setProject(p => {
      const frames = [...p.frames]
      const fromIdx = frames.findIndex(f => f.id === fromId)
      const toIdx = frames.findIndex(f => f.id === toId)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return p
      const [moved] = frames.splice(fromIdx, 1)
      frames.splice(toIdx, 0, moved)
      return { ...p, frames }
    })
  }

  function handleDurationChange(frameId: string, durationFrames: number) {
    setProject(p => ({
      ...p,
      frames: p.frames.map(f => f.id === frameId ? { ...f, durationFrames } : f),
    }))
  }

  async function handleExportFrame() {
    if (!adapterRef.current) return
    await exportFramePng(adapterRef.current)
  }

  async function handleExportWebM() {
    if (!adapterRef.current) return
    setExporting(true)
    try {
      await exportWebMDeterministic(adapterRef.current, project)
    } finally {
      setExporting(false)
    }
  }

  async function handleExportMp4() {
    if (!adapterRef.current) return
    setExporting(true)
    try {
      await exportMp4(adapterRef.current, project)
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPngSequence() {
    if (!adapterRef.current) return
    setExporting(true)
    try {
      await exportPngSequence(adapterRef.current, project)
    } finally {
      setExporting(false)
    }
  }

  // The canvas and timeline share the same CSS-computed size so they align:
  // width = min(canvas-area-width, available-height) using CSS min()
  // Left panel is 280px; timeline row is 88px; top padding is 20px
  const S = 'min(calc(100vw - 280px - 48px), calc(100vh - 88px - 40px))'

  return (
    <div
      style={{
        background: '#f2f2ec',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <LeftPanel
        snapshot={snapshot}
        outputSize={project.outputSize}
        onLayerChange={handleLayerChange}
        onAddGridLayer={() => handleAddGridLayer('dot-grid')}
        onDeleteLayer={handleDeleteLayer}
        onAddFilter={handleAddFilter}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
      />

      {/* Canvas area — grid: row1=canvas, row2=timeline */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateRows: '1fr 88px',
        alignItems: 'center',
        justifyItems: 'center',
        padding: '20px 24px 0',
        position: 'relative',
      }}>
        {/* Row 1: canvas square */}
        <div style={{
          width: S, height: S,
          borderRadius: 28,
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
        }}>
          <CanvasPreview
            snapshot={snapshot}
            outputSize={project.outputSize}
            onAdapterReady={(a) => { adapterRef.current = a; setAdapter(a) }}
          />
        </div>

        {/* Row 2: timeline (same width S) */}
        <div style={{ width: S, height: '100%' }}>
          <Timeline
            frames={project.frames}
            activeFrameId={project.activeFrameId}
            fps={project.fps}
            playing={playing}
            onSelectFrame={(id) => setProject(p => ({ ...p, activeFrameId: id }))}
            onDeleteFrame={handleDeleteFrame}
            onDurationChange={handleDurationChange}
            onFpsChange={(fps) => setProject(p => ({ ...p, fps }))}
            onPlay={() => setPlaying(true)}
            onStop={() => setPlaying(false)}
            onAddFrame={handleAddToTimeline}
            onReorderFrames={handleReorderFrames}
          />
        </div>

        {/* TopBar floats top-right */}
        <TopBar
          outputSize={project.outputSize}
          onSizeChange={(s) => setProject(p => ({ ...p, outputSize: s }))}
          onExportFrame={handleExportFrame}
          onExportWebM={handleExportWebM}
          onExportMp4={handleExportMp4}
          onExportPngSequence={handleExportPngSequence}
          exporting={exporting}
        />

        {/* PresetBar anchored bottom-left, overlays timeline's left spacer */}
        <div style={{
          position: 'absolute', bottom: 0, left: 24,
          height: 88,
          display: 'flex', alignItems: 'center',
          zIndex: 10,
        }}>
          <PresetBar project={project} onLoad={(p) => setProject(p)} />
        </div>
      </div>
    </div>
  )
}
