// app/texture-playground/lib/serialize.ts
'use client'
import type { Project, SerializedProject, ImageLayer, SerializedImageLayer, MidgroundLayer, Layer, SerializedLayer } from './types'

async function imageLayerToDataUrl(layer: ImageLayer): Promise<SerializedImageLayer> {
  // Convert objectUrl (blob URL) to base64 data URL
  const response = await fetch(layer.objectUrl)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({
      id: layer.id, kind: 'image',
      dataUrl: reader.result as string,
      scale: layer.scale, x: layer.x, y: layer.y, opacity: layer.opacity,
    })
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function midgroundLayerSrc(layer: MidgroundLayer): Promise<string | null> {
  if (!layer.src || !layer.src.startsWith('blob:')) return layer.src
  const response = await fetch(layer.src)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function serializeLayer(layer: Layer): Promise<SerializedLayer> {
  if (layer.kind === 'image') return imageLayerToDataUrl(layer)
  if (layer.kind === 'midground') {
    const src = await midgroundLayerSrc(layer)
    return { ...layer, src }
  }
  return layer
}

export async function serializeProject(project: Project): Promise<SerializedProject> {
  const frames = await Promise.all(
    project.frames.map(async (frame) => ({
      ...frame,
      layers: await Promise.all(frame.layers.map(serializeLayer)),
    }))
  )
  return { ...project, frames }
}

export function deserializeProject(serialized: SerializedProject): Project {
  return {
    ...serialized,
    frames: serialized.frames.map((frame) => ({
      ...frame,
      layers: frame.layers.map((layer): Layer => {
        if (layer.kind === 'image') {
          // dataUrl is used directly as objectUrl — PixiJS accepts data URLs
          return {
            id: layer.id, kind: 'image',
            file: new File([], layer.id), // placeholder File — not used after creation
            objectUrl: layer.dataUrl,
            scale: layer.scale, x: layer.x, y: layer.y, opacity: layer.opacity,
          }
        }
        return layer as Layer
      }),
    })),
  }
}
