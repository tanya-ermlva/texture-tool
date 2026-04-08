'use client'
import { useState, useRef, useEffect } from 'react'
import type { Project } from '../lib/types'
import type { SerializedProject } from '../lib/types'
import { serializeProject, deserializeProject } from '../lib/serialize'

type Preset = { id: string; name: string; project: SerializedProject }

const STORAGE_KEY = 'texture-tool:presets'

function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function savePresets(presets: Preset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

type Props = {
  project: Project
  onLoad: (project: Project) => void
}

export default function PresetBar({ project, onLoad }: Props) {
  const [presets, setPresets] = useState<Preset[]>(loadPresets)
  const [activeId, setActiveId] = useState<string | null>(() => loadPresets()[0]?.id ?? null)
  const [open, setOpen] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  // Auto-save current project into the active preset whenever project changes
  useEffect(() => {
    if (!activeId) return
    const t = setTimeout(async () => {
      const serialized = await serializeProject(project)
      setPresets(prev => {
        const next = prev.map(p => p.id === activeId ? { ...p, project: serialized } : p)
        savePresets(next)
        return next
      })
    }, 600)
    return () => clearTimeout(t)
  }, [project, activeId])

  function updatePresets(next: Preset[]) {
    setPresets(next)
    savePresets(next)
  }

  async function handleSelectPreset(id: string) {
    const preset = presets.find(p => p.id === id)
    if (!preset) return
    setActiveId(id)
    setOpen(false)
    onLoad(deserializeProject(preset.project))
  }

  async function handleAddNew() {
    const name = `Preset ${presets.length + 1}`
    const serialized = await serializeProject(project)
    const preset: Preset = { id: crypto.randomUUID(), name, project: serialized }
    const next = [...presets, preset]
    updatePresets(next)
    setActiveId(preset.id)
    setOpen(false)
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this preset?')) return
    const next = presets.filter(p => p.id !== id)
    updatePresets(next)
    if (activeId === id) setActiveId(next[0]?.id ?? null)
  }

  async function handleExport() {
    const preset = presets.find(p => p.id === activeId)
    const name = preset?.name ?? 'preset'
    const serialized = await serializeProject(project)
    const data = JSON.stringify({ name, version: 1, project: serialized }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${name}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const name = data.name ?? file.name.replace('.json', '')
      const serializedProject: SerializedProject = data.project ?? data
      const preset: Preset = { id: crypto.randomUUID(), name, project: serializedProject }
      const next = [...presets, preset]
      updatePresets(next)
      setActiveId(preset.id)
      onLoad(deserializeProject(serializedProject))
    } catch (err) {
      console.error('Failed to import preset', err)
    }
    e.target.value = ''
    setOpen(false)
  }

  const activeIndex = presets.findIndex(p => p.id === activeId)
  const displayNum = activeIndex >= 0
    ? String(activeIndex + 1).padStart(2, '0')
    : '--'

  // Row style for iOS action sheet items
  const sheetRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    padding: '0 20px',
    height: 44,
    fontFamily: 'var(--font-geist)', fontSize: 17,
    color: '#1a1a1a', cursor: 'pointer',
    background: 'transparent', border: 'none', width: '100%',
    textAlign: 'left',
    borderTop: '0.5px solid rgba(0,0,0,0.12)',
    gap: 12,
  }

  return (
    <>
      {/* ▼ 01 trigger */}
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: 4,
          fontFamily: 'var(--font-geist-mono)',
        }}
      >
        <span style={{ fontSize: 11, color: 'rgba(41,41,41,0.4)', lineHeight: 1 }}>▼</span>
        <span style={{
          fontSize: 22, fontWeight: 500, color: '#1a1a1a',
          letterSpacing: '-0.02em', lineHeight: 1,
        }}>
          {displayNum}
        </span>
      </button>

      {/* iOS-style modal sheet */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 8px 8px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: '#f2f2f7',
              borderRadius: 14,
              overflow: 'hidden',
              transform: 'translateY(0)',
              transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 20px 10px',
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-geist)', fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                Presets
              </div>
              <div style={{ fontFamily: 'var(--font-geist)', fontSize: 12, color: '#8e8e93', marginTop: 2 }}>
                {presets.length === 0 ? 'No presets saved' : `${presets.length} preset${presets.length !== 1 ? 's' : ''}`}
              </div>
            </div>

            {/* Preset list */}
            {presets.length > 0 && (
              <div style={{ background: '#fff', marginTop: 8, borderRadius: 12, overflow: 'hidden', margin: '8px 0 0' }}>
                {presets.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center',
                      height: 44,
                      background: p.id === activeId ? 'rgba(98,90,34,0.05)' : '#fff',
                      borderTop: i > 0 ? '0.5px solid rgba(0,0,0,0.1)' : undefined,
                    }}
                  >
                    <button
                      onClick={() => handleSelectPreset(p.id)}
                      style={{
                        flex: 1, height: '100%', background: 'none', border: 'none',
                        padding: '0 20px', textAlign: 'left', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-geist-mono)', fontSize: 11,
                        color: '#8e8e93', flexShrink: 0, minWidth: 22,
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontFamily: 'var(--font-geist)', fontSize: 17, color: '#1a1a1a', flex: 1 }}>
                        {p.name}
                      </span>
                      {p.id === activeId && (
                        <span style={{ color: '#b2c248', fontSize: 14 }}>✓</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ff3b30', fontSize: 13, padding: '0 16px 0 8px',
                        fontFamily: 'var(--font-geist)', height: '100%',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', margin: '8px 0 0' }}>
              <button
                onClick={handleAddNew}
                style={{ ...sheetRow, borderTop: 'none', color: '#007aff' }}
              >
                <span style={{ fontSize: 20, lineHeight: 1, marginRight: 2 }}>+</span>
                New preset
              </button>
              <button
                onClick={() => importRef.current?.click()}
                style={sheetRow}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>↑</span>
                Import
              </button>
              <button
                onClick={handleExport}
                style={sheetRow}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>↓</span>
                Export current
              </button>
            </div>

            {/* Cancel */}
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', margin: '8px 0 0' }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  ...sheetRow, borderTop: 'none',
                  justifyContent: 'center', fontWeight: 600,
                  color: '#007aff', fontSize: 17,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
    </>
  )
}
