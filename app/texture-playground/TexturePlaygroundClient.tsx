'use client'
import { useRef, useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import type { Project, RendererAdapter, Layer, CompositionType, GridLayer, ImageLayer, MidgroundLayer, LayerOverride, Frame, FilterEntry, FilterType } from './lib/types'
import CanvasPreview from './components/CanvasPreview'
import LeftPanel from './components/LeftPanel'
import TopBar from './components/TopBar'
import Timeline from './components/Timeline'
import PresetBar from './components/PresetBar'
import MetaData from './components/MetaData'
import { resolveFrame } from './lib/resolve'
import { usePlayback } from './lib/playback'
import { exportWebMDeterministic, exportFramePng, exportMp4, exportPngSequence } from './lib/export'
import { useHistory } from './lib/useHistory'
import { serializeProject, deserializeProject } from './lib/serialize'

const COMPOSITIONS: CompositionType[] = [
  'dot-grid', 'regular-grid', 'variable-grid', 'linear', 'layered',
]

const RANDOM_FILTERS: FilterEntry[] = [
  { type: 'noise',    enabled: true, intensity: 0.35, seed: 0, grainSize: 1 },
  { type: 'rgbsplit', enabled: true, amount: 6 },
  { type: 'glow',     enabled: true, distance: 10, strength: 2, color: '#b2c248' },
]

const BG_COLORS = ['#ff92e0', '#b2c248', '#4791e2', '#ee9212', '#a291ce', '#e5eacd', '#444625']

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const TEXTURE_COUNT = 9
const SCALES = [1.0, 1.2, 1.5]

function randOffset() { return Math.round((Math.random() * 40) - 20) }

function makeDefaultProject(): Project {
  const compositions = shuffle(COMPOSITIONS).slice(0, 3)
  const bgColor = pick(BG_COLORS)
  const textureIndices = shuffle(Array.from({ length: TEXTURE_COUNT }, (_, i) => i + 1)).slice(0, 3)

  const frames: Frame[] = compositions.map((composition, i) => {
    const filterEntry: FilterEntry = { ...pick(RANDOM_FILTERS) }
    if (filterEntry.type === 'noise') filterEntry.seed = Math.random()

    const gridLayer: GridLayer = {
      id: nanoid(6), kind: 'grid', composition,
      spacing: 20, thickness: 1, dotSize: 3, opacity: 1, scale: 1,
      color: '#1e1e1e',
    }

    return {
      id: nanoid(6),
      layers: [
        { id: nanoid(6), kind: 'background', color: bgColor },
        {
          id: nanoid(6), kind: 'midground',
          src: `/textures/midground/${textureIndices[i]}.png`,
          label: `${textureIndices[i]}.png`,
          opacity: 1, scale: pick(SCALES), x: randOffset(), y: randOffset(),
        },
        gridLayer,
        { id: nanoid(6), kind: 'adjustment', filters: [filterEntry] },
      ],
      durationFrames: 10,
    }
  })

  return {
    frames,
    outputSize: 1024,
    fps: 24,
    activeFrameId: frames[0].id,
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
      if (e.key === ' ' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        setPlaying(p => !p)
        return
      }
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

  return (
    <div className="grid grid-cols-[378px_1fr] grid-rows-1 w-screen h-screen p-4 gap-2 bg-white">

      {/* Left column */}
      <div className="flex flex-col h-full">
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
        <div className="mt-auto self-start pb-4 flex flex-col gap-3">
          <div
            className="group flex flex-row items-center gap-3 cursor-pointer px-2"
            onClick={() => setProject(makeDefaultProject())}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setProject(makeDefaultProject())}
          >
            <div className="bg-ink rounded-full size-6 xl:size-10 flex-shrink-0 group-hover:bg-pink transition-colors" />
            <span className="font-sans text-display xl:text-display-lg font-normal text-ink leading-none group-hover:text-pink transition-colors">
              ↺
            </span>
          </div>
          <PresetBar project={project} onLoad={(p) => setProject(p)} />
        </div>
      </div>

      {/* Right column — canvas + timeline */}
      <div className="flex flex-col h-full bg-stone">
        <TopBar
          outputSize={project.outputSize}
          onSizeChange={(s) => setProject(p => ({ ...p, outputSize: s }))}
          onExportFrame={handleExportFrame}
          onExportWebM={handleExportWebM}
          onExportMp4={handleExportMp4}
          onExportPngSequence={handleExportPngSequence}
          exporting={exporting}
        />

        {/* Canvas — square, centered, fills remaining height */}
        <div className="relative flex-1 flex items-center justify-center p-6 min-h-0">
          <div className="aspect-square h-full max-h-full rounded-[24px] overflow-hidden">
            <CanvasPreview
              snapshot={snapshot}
              outputSize={project.outputSize}
              onAdapterReady={(a) => { adapterRef.current = a; setAdapter(a) }}
            />
          </div>
          <div className="absolute bottom-6 right-4">
            <MetaData
              fps={project.fps}
              framesEach={activeFrame.durationFrames}
              compositions={project.frames.length}
            />
          </div>
        </div>

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
