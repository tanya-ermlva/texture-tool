'use client'
import { useState, useRef } from 'react'
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
  const [activeId, setActiveId] = useState<string | null>(presets[0]?.id ?? null)
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [open, setOpen] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

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

  async function handleSaveNew() {
    const name = newName.trim()
    if (!name) return
    const serialized = await serializeProject(project)
    const preset: Preset = { id: crypto.randomUUID(), name, project: serialized }
    const next = [...presets, preset]
    updatePresets(next)
    setActiveId(preset.id)
    setAddingNew(false)
    setNewName('')
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
  }

  const activePreset = presets.find(p => p.id === activeId)

  const btnStyle = (base?: React.CSSProperties): React.CSSProperties => ({
    background: 'none', border: '1px solid rgba(71,67,42,0.15)', borderRadius: 8,
    color: '#aaaaaa', fontSize: 14, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '0 8px', height: 34, flexShrink: 0,
    ...base,
  })

  return (
    <div style={{ borderTop: '1px solid rgba(71,67,42,0.1)', paddingTop: 8, position: 'relative' }}>
      {/* Dropdown + import/export row */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {/* Custom dropdown trigger */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            flex: 1, background: 'rgba(98,90,34,0.06)', border: '1px solid rgba(71,67,42,0.15)',
            borderRadius: 8, padding: '0 10px', height: 34, fontSize: 13, color: '#292929',
            fontFamily: 'var(--font-geist)', cursor: 'pointer', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span>{activePreset?.name ?? 'No preset'}</span>
          <span style={{ color: '#aaa', fontSize: 10 }}>▾</span>
        </button>
        <button onClick={() => importRef.current?.click()} style={btnStyle()} title="Import preset">↑</button>
        <button onClick={handleExport} style={btnStyle()} title="Export preset">↓</button>
        <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid rgba(71,67,42,0.15)',
          borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          overflow: 'hidden', marginBottom: 4, zIndex: 100,
          fontFamily: 'var(--font-geist)', fontSize: 13,
        }}>
          {presets.map(p => (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', padding: '7px 12px',
                background: p.id === activeId ? 'rgba(98,90,34,0.06)' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => handleSelectPreset(p.id)}
            >
              <span style={{ flex: 1, color: '#292929' }}>{p.name}</span>
              {p.id === activeId && <span style={{ color: '#b2c248', marginRight: 8, fontSize: 11 }}>✓</span>}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
              >✕</button>
            </div>
          ))}

          {/* Add new preset row */}
          {addingNew ? (
            <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderTop: '1px solid rgba(71,67,42,0.08)' }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveNew(); if (e.key === 'Escape') { setAddingNew(false); setNewName('') } }}
                placeholder="Preset name…"
                style={{
                  flex: 1, border: '1px solid rgba(71,67,42,0.2)', borderRadius: 6,
                  padding: '4px 8px', fontSize: 13, fontFamily: 'var(--font-geist)', outline: 'none',
                }}
              />
              <button onClick={handleSaveNew} style={{ border: 'none', background: '#b2c248', borderRadius: 6, padding: '4px 10px', fontSize: 13, cursor: 'pointer', color: '#292929', fontFamily: 'var(--font-geist)' }}>Save</button>
            </div>
          ) : (
            <div
              onClick={() => setAddingNew(true)}
              style={{ padding: '7px 12px', color: '#b2c248', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid rgba(71,67,42,0.08)' }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> new preset
            </div>
          )}
        </div>
      )}
    </div>
  )
}
