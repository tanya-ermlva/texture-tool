'use client'
import { useRef, useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import type { Project, RendererAdapter, Layer, CompositionType, GridLayer, ImageLayer, MidgroundLayer, LayerOverride, Frame, FilterEntry, FilterType } from './lib/types'
import CanvasPreview from './components/CanvasPreview'
import LeftPanel from './components/LeftPanel'
import TopBar from './components/TopBar'
import Timeline from './components/Timeline'
import { resolveFrame } from './lib/resolve'
import { usePlayback } from './lib/playback'
import { exportWebMDeterministic, exportFramePng, exportMp4 } from './lib/export'
import { useHistory } from './lib/useHistory'
import { serializeProject, deserializeProject } from './lib/serialize'

const DEFAULT_LAYERS: Layer[] = [
  { id: 'bg',  kind: 'background',  color: '#ff92e0' },
  { id: 'mid', kind: 'midground',   src: null, label: '', opacity: 1, scale: 1, x: 0, y: 0 },
  { id: 'adj', kind: 'adjustment',  filters: [] },
]

const DEFAULT_PROJECT: Project = {
  frames: [
    { id: 'f1', layers: DEFAULT_LAYERS, durationFrames: 5 },
  ],
  outputSize: 1024,
  fps: 30,
  activeFrameId: 'f1',
}

function loadInitialProject(): Project {
  try {
    const raw = localStorage.getItem('texture-tool:autosave')
    if (raw) return deserializeProject(JSON.parse(raw))
  } catch { /* ignore */ }
  return DEFAULT_PROJECT
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
      if (p.frames.length >= 5) return p
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

  const SHUFFLE_COLOURS = ['#444625', '#788d16', '#b2c349', '#e5eacd', '#ee9212', '#4791e2', '#ff92e0', '#a291ce']
  const SHUFFLE_COMPOSITIONS: CompositionType[] = ['dot-grid', 'regular-grid', 'variable-grid', 'linear', 'layered', 'checkered']
  const MIDGROUND_SRCS = Array.from({ length: 9 }, (_, i) => `/textures/midground/${i + 1}.png`)

  function rnd(min: number, max: number) { return Math.random() * (max - min) + min }
  function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

  function handleShuffle() {
    setProject(p => {
      const activeFrame = p.frames.find(f => f.id === p.activeFrameId) ?? p.frames[0]
      const newLayers = activeFrame.layers.map((layer): Layer => {
        if (layer.kind === 'background') return { ...layer, color: pick(SHUFFLE_COLOURS) }
        if (layer.kind === 'grid') return {
          ...layer,
          composition: pick(SHUFFLE_COMPOSITIONS),
          spacing: Math.round(rnd(8, 80)),
          thickness: Math.round(rnd(0.5, 6) * 2) / 2,
          dotSize: Math.round(rnd(1, 12) * 2) / 2,
          opacity: Math.round(rnd(0.3, 1) * 100) / 100,
          scale: Math.round(rnd(0.8, 2) * 100) / 100,
        }
        if (layer.kind === 'midground') return {
          ...layer,
          src: pick(MIDGROUND_SRCS),
          label: String(MIDGROUND_SRCS.indexOf(pick(MIDGROUND_SRCS)) + 1),
          opacity: Math.round(rnd(0.4, 1) * 100) / 100,
          scale: Math.round(rnd(0.9, 1.5) * 100) / 100,
          x: Math.round(rnd(-100, 100)),
          y: Math.round(rnd(-100, 100)),
        }
        if (layer.kind === 'adjustment') return {
          ...layer,
          filters: layer.filters.map(fe => {
            if (fe.type === 'noise') return { ...fe, intensity: Math.round(rnd(0.1, 0.8) * 10) / 10, seed: Math.random() }
            if (fe.type === 'blur') return { ...fe, strength: Math.round(rnd(1, 10)) }
            if (fe.type === 'pixelate') return { ...fe, size: Math.round(rnd(2, 20)) }
            if (fe.type === 'displacement') return { ...fe, scale: Math.round(rnd(5, 80)) }
            if (fe.type === 'rgbsplit') return { ...fe, amount: Math.round(rnd(1, 15)) }
            return fe
          }),
        }
        return layer
      })
      return {
        ...p,
        frames: p.frames.map(f =>
          f.id !== p.activeFrameId ? f : { ...f, layers: newLayers }
        ),
      }
    })
  }

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
        onAddFilter={handleAddFilter}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        project={project}
        onLoadPreset={(p) => setProject(p)}
      />

      {/* Canvas area — TopBar and Timeline float inside this */}
      <div style={{ flex: 1, position: 'relative' }}>
        <CanvasPreview
          snapshot={snapshot}
          outputSize={project.outputSize}
          onAdapterReady={(a) => { adapterRef.current = a; setAdapter(a) }}
        />
        <TopBar
          outputSize={project.outputSize}
          onSizeChange={(s) => setProject(p => ({ ...p, outputSize: s }))}
          onExportFrame={handleExportFrame}
          onExportWebM={handleExportWebM}
          onExportMp4={handleExportMp4}
          onShuffle={handleShuffle}
          exporting={exporting}
        />
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
    </div>
  )
}
