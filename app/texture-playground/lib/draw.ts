// app/texture-playground/lib/draw.ts
import { Graphics } from 'pixi.js'
import type { GridLayer } from './types'

export function drawBackground(g: Graphics, color: string, size: number): void {
  g.clear()
  g.rect(0, 0, size, size).fill(color)
}

export function drawDotGrid(g: Graphics, layer: GridLayer, size: number): void {
  g.clear()
  const { spacing, dotSize, opacity, scale } = layer
  const step = spacing * scale
  const radius = (dotSize / 2) * scale
  g.alpha = opacity
  for (let x = step / 2; x < size; x += step) {
    for (let y = step / 2; y < size; y += step) {
      g.circle(x, y, radius).fill(layer.color)
    }
  }
}

export function drawRegularGrid(g: Graphics, layer: GridLayer, size: number): void {
  g.clear()
  const { spacing, thickness, opacity, scale } = layer
  const step = spacing * scale
  g.alpha = opacity
  for (let x = 0; x <= size; x += step) {
    g.moveTo(x, 0).lineTo(x, size).stroke({ color: layer.color, width: thickness * scale })
  }
  for (let y = 0; y <= size; y += step) {
    g.moveTo(0, y).lineTo(size, y).stroke({ color: layer.color, width: thickness * scale })
  }
}

export function drawVariableGrid(g: Graphics, layer: GridLayer, size: number): void {
  g.clear()
  const { spacing, thickness, opacity, scale } = layer
  const step = spacing * scale
  const thickWeight = thickness * scale * 2
  const thinWeight = thickness * scale * 0.5
  g.alpha = opacity
  let idx = 0
  for (let x = 0; x <= size; x += step) {
    const w = idx % 3 === 0 ? thickWeight : thinWeight
    g.moveTo(x, 0).lineTo(x, size).stroke({ color: layer.color, width: w })
    idx++
  }
  idx = 0
  for (let y = 0; y <= size; y += step) {
    const w = idx % 3 === 0 ? thickWeight : thinWeight
    g.moveTo(0, y).lineTo(size, y).stroke({ color: layer.color, width: w })
    idx++
  }
}

export function drawLinear(g: Graphics, layer: GridLayer, size: number): void {
  g.clear()
  const { spacing, thickness, opacity, scale } = layer
  const step = spacing * scale
  const thickWeight = thickness * scale * 2
  const thinWeight = thickness * scale * 0.5
  g.alpha = opacity
  // horizontal stripes; rhythm: 1 thick per 4 thin
  let idx = 0
  for (let y = 0; y <= size; y += step) {
    const w = idx % 4 === 0 ? thickWeight : thinWeight
    g.moveTo(0, y).lineTo(size, y).stroke({ color: layer.color, width: w })
    idx++
  }
}

export function drawLayered(g: Graphics, layer: GridLayer, size: number): void {
  g.clear()
  const { spacing, thickness, opacity, scale } = layer
  const coarseStep = spacing * scale * 2
  const fineStep = spacing * scale
  g.alpha = opacity
  // coarse grid at 60% opacity
  const coarseAlpha = 0.6
  for (let x = 0; x <= size; x += coarseStep) {
    g.moveTo(x, 0).lineTo(x, size).stroke({ color: layer.color, width: thickness * scale, alpha: coarseAlpha })
  }
  for (let y = 0; y <= size; y += coarseStep) {
    g.moveTo(0, y).lineTo(size, y).stroke({ color: layer.color, width: thickness * scale, alpha: coarseAlpha })
  }
  // fine grid offset at 35% opacity
  const fineAlpha = 0.35
  const offset = fineStep / 2
  for (let x = offset; x <= size; x += fineStep) {
    g.moveTo(x, 0).lineTo(x, size).stroke({ color: layer.color, width: (thickness * scale) / 2, alpha: fineAlpha })
  }
  for (let y = offset; y <= size; y += fineStep) {
    g.moveTo(0, y).lineTo(size, y).stroke({ color: layer.color, width: (thickness * scale) / 2, alpha: fineAlpha })
  }
}

export function drawCheckered(g: Graphics, layer: GridLayer, size: number): void {
  g.clear()
  const { spacing, opacity, scale } = layer
  const cell = spacing * scale
  g.alpha = opacity
  for (let row = 0; row * cell < size; row++) {
    for (let col = 0; col * cell < size; col++) {
      if ((row + col) % 2 === 0) {
        g.rect(col * cell, row * cell, cell, cell).fill(layer.color)
      }
    }
  }
}

export function drawGridLayer(g: Graphics, layer: GridLayer, size: number): void {
  switch (layer.composition) {
    case 'dot-grid':      return drawDotGrid(g, layer, size)
    case 'regular-grid':  return drawRegularGrid(g, layer, size)
    case 'variable-grid': return drawVariableGrid(g, layer, size)
    case 'linear':        return drawLinear(g, layer, size)
    case 'layered':       return drawLayered(g, layer, size)
    case 'checkered':     return drawCheckered(g, layer, size)
  }
}
