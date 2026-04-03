// app/texture-playground/lib/filters.ts
import {
  NoiseFilter,
  BlurFilter,
  ColorMatrixFilter,
  DisplacementFilter,
  type Filter,
  type Sprite,
} from 'pixi.js'
import { PixelateFilter } from 'pixi-filters/pixelate'
import { GlowFilter } from 'pixi-filters/glow'
import { RGBSplitFilter } from 'pixi-filters/rgb-split'
// HalftoneFilter does not exist in pixi-filters v6; DotFilter is the equivalent
// (black-and-white halftone dots, same scale + angle params)
import { DotFilter } from 'pixi-filters/dot'
import type { FilterEntry } from './types'

export function buildFilters(
  entries: FilterEntry[],
  displacementSprite: Sprite | null,
): Filter[] {
  return entries
    .filter((e) => e.enabled)
    .flatMap((entry): Filter[] => {
      switch (entry.type) {
        case 'noise':
          return [new NoiseFilter({ noise: entry.intensity, seed: Math.random() })]

        case 'blur':
          return [new BlurFilter({ strength: entry.strength })]

        case 'pixelate':
          return [new PixelateFilter(entry.size)]

        case 'displacement': {
          if (!displacementSprite) return []
          return [new DisplacementFilter({ sprite: displacementSprite, scale: entry.scale })]
        }

        case 'rgbsplit':
          return [new RGBSplitFilter({
            red: { x: -entry.amount, y: 0 },
            green: { x: 0, y: 0 },
            blue: { x: entry.amount, y: 0 },
          })]

        case 'colormatrix': {
          const f = new ColorMatrixFilter()
          f.brightness(entry.brightness, false)
          f.contrast(entry.contrast, false)
          f.saturate(entry.saturation - 1, false)  // saturate() takes delta, not absolute
          f.hue(entry.hue, false)
          if (entry.invert) f.negative(false)
          return [f]
        }

        // pixi-filters v6 has no HalftoneFilter; DotFilter is the halftone equivalent
        case 'halftone':
          return [new DotFilter({ scale: entry.scale, angle: entry.angle })]

        case 'glow':
          return [new GlowFilter({
            distance: entry.distance,
            outerStrength: entry.strength,
            // GlowFilter accepts ColorSource — pass hex number parsed from string
            color: parseInt(entry.color.replace('#', ''), 16),
            quality: 0.5,
          })]
      }
    })
}
