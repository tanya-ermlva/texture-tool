// app/texture-playground/lib/filters.ts
import {
  DisplacementFilter,
  type Filter,
  type Sprite,
} from 'pixi.js'
import { GlowFilter }     from 'pixi-filters/glow'
import { RGBSplitFilter } from 'pixi-filters/rgb-split'
import { GaussianNoiseFilter } from './GaussianNoiseFilter'
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
          return [new GaussianNoiseFilter(
            entry.intensity,
            entry.seed,
            entry.grainSize ?? 1,
          )]

        case 'displacement': {
          if (!displacementSprite) return []
          return [new DisplacementFilter({ sprite: displacementSprite, scale: entry.scale })]
        }

        case 'rgbsplit':
          return [new RGBSplitFilter({
            red:   { x: -entry.amount, y: 0 },
            green: { x: 0,            y: 0 },
            blue:  { x:  entry.amount, y: 0 },
          })]

        case 'glow':
          return [new GlowFilter({
            distance:      entry.distance,
            outerStrength: entry.strength,
            color:         parseInt(entry.color.replace('#', ''), 16),
            quality:       0.5,
          })]
      }
    })
}
