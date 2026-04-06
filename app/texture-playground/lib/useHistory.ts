import { useRef, useState } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export function useHistory<T>(initial: T, maxSteps = 20) {
  const historyRef = useRef<HistoryState<T>>({
    past: [],
    present: initial,
    future: [],
  })

  // Used only to trigger re-renders
  const [, rerender] = useState(0)
  const forceUpdate = () => rerender(n => n + 1)

  function set(next: T | ((prev: T) => T)) {
    const h = historyRef.current
    const nextValue = typeof next === 'function' ? (next as (prev: T) => T)(h.present) : next
    const newPast = [...h.past, h.present]
    if (newPast.length > maxSteps) newPast.splice(0, newPast.length - maxSteps)
    historyRef.current = { past: newPast, present: nextValue, future: [] }
    forceUpdate()
  }

  function undo() {
    const h = historyRef.current
    if (h.past.length === 0) return
    const prev = h.past[h.past.length - 1]
    historyRef.current = {
      past: h.past.slice(0, -1),
      present: prev,
      future: [h.present, ...h.future],
    }
    forceUpdate()
  }

  function redo() {
    const h = historyRef.current
    if (h.future.length === 0) return
    const next = h.future[0]
    historyRef.current = {
      past: [...h.past, h.present],
      present: next,
      future: h.future.slice(1),
    }
    forceUpdate()
  }

  return {
    state: historyRef.current.present,
    set,
    undo,
    redo,
    get canUndo() { return historyRef.current.past.length > 0 },
    get canRedo() { return historyRef.current.future.length > 0 },
  }
}
