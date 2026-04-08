# Texture Tool — Presets, Persistence & Round 2 Features

**Date:** 2026-04-06  
**Status:** Approved  
**Context:** Tool is published for the Granola brand identity team (illustrators). Primary outputs are PNG and MP4. No redesign — features bolt onto the existing architecture.

---

## Round 1 — Presets & Persistence

### Storage layer

Two `localStorage` keys:

| Key | Value |
|-----|-------|
| `texture-tool:autosave` | Serialised `Project` JSON — written on every state change (debounced 500 ms) |
| `texture-tool:presets` | `Array<{ id: string, name: string, project: SerializedProject }>` |

On app load: if `texture-tool:autosave` exists, restore it as the initial project state.

### Serialisation — handling non-portable layer data

`ImageLayer` stores a `File` object and an `objectUrl` (blob URL) — neither survives a page reload.  
`MidgroundLayer.src` for uploaded files is also an `objectUrl`.

**Solution:** introduce `SerializedProject` — a plain-JSON form used for storage and export:

- `ImageLayer` → serialised as `SerializedImageLayer`: drop `file`, store `dataUrl: string` (base64). `objectUrl` is reconstructed from `dataUrl` on load using `URL.createObjectURL(fetch(dataUrl).blob())` or simply assigned directly (PixiJS accepts data URLs).
- `MidgroundLayer.src` — if it starts with `blob:`, convert to base64 data URL before saving. Built-in paths (`/textures/midground/…`) are already portable.
- All other layer types (background, grid, adjustment) are already fully serialisable.

Helper functions: `serializeProject(project) → SerializedProject` and `deserializeProject(serialized) → Project`.

### Preset bar — pinned to bottom of left panel

Below all accordion sections, separated by a hairline border. Does **not** scroll with the panel.

```
[ dropdown: "morning"  ▾ ] [ ↑ ] [ ↓ ]
```

- **Dropdown** — full-width (minus two small icon buttons). Lists all named presets.  
  - Selecting a preset loads it; subsequent edits auto-save into that preset via the debounced autosave (the preset in localStorage is updated on the same write cycle).
  - Bottom of list: **`+ new preset`** — prompts inline (a small text input replacing the option) for a name, saves current state as a new preset, switches to it.
  - Each preset row has a faint `✕` on hover to delete (with a `window.confirm` guard).
- **↑ (Import)** — ghost icon button; opens a file picker accepting `.json`; reads the file, adds it as a new preset (uses the embedded `name` field), switches to it.
- **↓ (Export)** — ghost icon button; downloads the active preset as `[name].json`.

### JSON export format

```jsonc
{
  "name": "morning",
  "version": 1,
  "project": { /* SerializedProject */ }
}
```

`version` field included for future migration tolerance.

---

## Round 2 — Feature Improvements

### TopBar redesign — more minimal

Replace the three 512/1024/2048 radio buttons with a single `<select>` dropdown.  
Reorder and slim down all controls:

```
[ 1024 ▾ ]  [ ⟳ ]  [ Export PNG ]  [ WebM ▾ ]
                                      ├ WebM
                                      └ MP4
```

- Size dropdown: `512 / 1024 / 2048` — same values, no visual change to selection behaviour.
- **⟳ Shuffle** — see below.
- **Export PNG** — small, minimal ghost button (no background fill).
- **Export video** — a small button with a `▾` revealing a mini dropdown: `WebM` / `MP4`. Default to last-used format. While exporting, the button shows "Exporting…" and is disabled.

### Undo / Redo

**`useHistory` hook** wrapping project state:

```ts
function useHistory<T>(initial: T, maxSteps = 20): {
  state: T
  set: (next: T) => void   // replaces setState everywhere
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}
```

Internally: `past: T[]`, `present: T`, `future: T[]`.  
`set()` pushes `present` onto `past` (capped at 20), clears `future`, sets new `present`.  
`undo()` pops from `past`, pushes `present` to `future`.  
`redo()` pops from `future`, pushes `present` to `past`.

**Keyboard shortcuts** registered in `TexturePlaygroundClient` via `useEffect` on `document`:
- `Cmd+Z` / `Ctrl+Z` → undo
- `Cmd+Shift+Z` / `Ctrl+Shift+Z` → redo

Undo/redo does **not** interact with the autosave debounce — autosave fires on the resulting state regardless.

### MP4 export

Alongside the existing `exportWebMDeterministic`, add `exportMp4`:

- Same WebCodecs pipeline, change codec from `vp09.00.10.08` to `avc1.42001f` (H.264 Baseline).
- Muxer: `webm-muxer` does not support MP4. Use `mp4-muxer` (same author, same API surface — `ArrayBufferTarget`, `addVideoChunk`).
- Output file: `texture.mp4`.

`mp4-muxer` is a new dependency to add.

### Grid colour control

Add `color: string` to `GridLayer` type. Default: `'#1e1e1e'`.

In the Texture section of `LeftPanel`, when a grid layer is active, render the existing `ColorPicker` component below the composition picker. The chosen colour replaces the hardcoded `LINE_COLOR` constant.

In `draw.ts`: each draw function receives `layer.color` and passes it to `.fill()` / `.stroke()`.  
Colour is stored as a hex string; PixiJS `Graphics` accepts hex strings directly.

### Shuffle / Randomise

A `⟳` button in the TopBar. On click, generates a new random `Frame` state for the active frame:

- **Background**: picks a random colour from `COLOURS` (the existing 8-swatch palette).
- **Grid** (if present): random `composition` from `CompositionType`, `spacing` 8–80, `thickness` 0.5–6, `dotSize` 1–12, `opacity` 0.3–1, `scale` 0.8–2.
- **Midground**: random built-in from `BUILT_INS` (1–9), random `opacity` 0.4–1, `scale` 0.9–1.5, `x`/`y` within ±100px.
- **Filters**: keeps the existing filter stack but randomises each enabled filter's numeric parameters within their slider bounds.
- Shuffle creates a new history entry (undoable).

### Drag to reorder frames in Timeline

HTML5 drag-and-drop on timeline thumbnails:

- Each frame `div` gets `draggable={true}`, `onDragStart` (stores dragged `id`), `onDragOver` (shows a drop indicator), `onDrop` (reorders `project.frames` array).
- A thin highlight line between thumbnails indicates the drop target.
- Reorder is a single `setProject` call → creates a history entry → auto-saves.

---

## What's explicitly out of scope

- GIF export
- Duplicate frame button (the `+` frame button already clones the active frame)
- Drag-to-pan on canvas (sliders remain)
- Displacement sprite re-roll

---

## Implementation order

1. Serialisation helpers (`serializeProject` / `deserializeProject`)
2. `useHistory` hook
3. Autosave + preset bar UI
4. TopBar redesign (size dropdown, shuffle, export refactor)
5. MP4 export (`mp4-muxer`)
6. Grid colour
7. Frame drag-to-reorder
