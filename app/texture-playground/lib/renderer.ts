// app/texture-playground/lib/renderer.ts
'use client'
import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js'
import { drawBackground, drawGridLayer } from './draw'
import { buildFilters } from './filters'
import type { AdjustmentLayer, MidgroundLayer, FrameSnapshot, RendererAdapter } from './types'

function ensureChildAt(stage: Container, child: Container, index: number): void {
  if (child.parent === stage) {
    stage.setChildIndex(child, Math.min(index, stage.children.length - 1))
  } else {
    stage.addChildAt(child, Math.min(index, stage.children.length))
  }
}

export class PixiRenderer implements RendererAdapter {
  private app: Application | null = null
  private initialized = false
  private layerGraphics = new Map<string, Graphics | Sprite>()
  private layerUrls = new Map<string, string>()
  private pendingLoads = new Map<string, Promise<void>>()
  private size = 512
  private layersContainer: Container | null = null
  private displacementSprite: Sprite | null = null

  async init(host: HTMLElement, size: number): Promise<void> {
    if (this.app) return
    this.size = size
    const app = new Application()
    this.app = app
    await app.init({
      canvas: host as HTMLCanvasElement,
      width: size,
      height: size,
      antialias: true,
      backgroundColor: 0xffffff,
    })
    // destroy() may have been called while we awaited (React Strict Mode double-invoke)
    if (this.app !== app) return
    this.initialized = true

    // Wrap all content layers in a container so filters apply to the composite
    this.layersContainer = new Container()
    app.stage.addChild(this.layersContainer)

    // Generate a white-noise sprite for DisplacementFilter
    const noiseSize = 256
    const canvas = document.createElement('canvas')
    canvas.width = noiseSize
    canvas.height = noiseSize
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(noiseSize, noiseSize)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.floor(Math.random() * 256)
      imageData.data[i] = v
      imageData.data[i + 1] = v
      imageData.data[i + 2] = v
      imageData.data[i + 3] = 255
    }
    ctx.putImageData(imageData, 0, 0)
    const noiseTex = Texture.from(canvas)
    this.displacementSprite = new Sprite(noiseTex)
    if ('source' in noiseTex && noiseTex.source) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(noiseTex.source as any).addressMode = 'repeat'
    }
  }

  renderFrame(snapshot: FrameSnapshot): void {
    if (!this.initialized || !this.app || !this.layersContainer) return
    const container = this.layersContainer
    const size = this.size

    // Partition layers: content vs adjustment
    const contentLayers = snapshot.layers.filter((l) => l.kind !== 'adjustment')
    const adjustmentLayer = snapshot.layers.find((l) => l.kind === 'adjustment') as AdjustmentLayer | undefined

    // Track which layer ids appear in this snapshot
    const snapshotIds = new Set(contentLayers.map((l) => l.id))

    // Remove graphics for layers that no longer exist in this snapshot
    for (const id of [...this.layerGraphics.keys()]) {
      if (!snapshotIds.has(id)) {
        const g = this.layerGraphics.get(id)!
        container.removeChild(g)
        g.destroy()
        this.layerGraphics.delete(id)
        this.layerUrls.delete(id)
      }
    }

    // Also invalidate pending async loads for stale layer ids.
    // Without this, a texture that finishes loading after a frame switch
    // passes the layerUrls stale-check and injects into the wrong frame.
    for (const id of [...this.pendingLoads.keys()]) {
      if (!snapshotIds.has(id)) {
        this.pendingLoads.delete(id)
        this.layerUrls.delete(id)
      }
    }

    // Render layers bottom-to-top, then flush to canvas immediately
    contentLayers.forEach((layer, index) => {
      if (layer.kind === 'background') {
        let g = this.layerGraphics.get(layer.id) as Graphics | undefined
        if (!g) {
          g = new Graphics()
          this.layerGraphics.set(layer.id, g)
        }
        drawBackground(g, layer.color, size)
        ensureChildAt(container, g, index)
        return
      }

      if (layer.kind === 'grid') {
        let g = this.layerGraphics.get(layer.id) as Graphics | undefined
        if (!g) {
          g = new Graphics()
          this.layerGraphics.set(layer.id, g)
        }
        drawGridLayer(g, layer, size)
        ensureChildAt(container, g, index)
        return
      }

      if (layer.kind === 'midground') {
        if (!layer.src) {
          // Nothing selected — remove any existing sprite and clear the URL so
          // any in-flight Assets.load .then() callback fails its stale-check
          // and does not add the sprite after the user has already cleared it.
          const existing = this.layerGraphics.get(layer.id)
          if (existing) {
            container.removeChild(existing)
            existing.destroy()
            this.layerGraphics.delete(layer.id)
          }
          this.layerUrls.delete(layer.id)
          return
        }
        const existingSprite = this.layerGraphics.get(layer.id) as Sprite | undefined
        const prevUrl = this.layerUrls.get(layer.id)
        if (!existingSprite || prevUrl !== layer.src) {
          existingSprite?.destroy()
          this.layerGraphics.delete(layer.id)
          this.layerUrls.set(layer.id, layer.src)

          // Fast path: texture already in Assets cache (pre-warmed for export,
          // or previously loaded for this URL in another layer/frame). Create
          // the sprite synchronously so renderFrame is fully sync during export.
          const cachedTex = Assets.get<Texture>(layer.src)
          if (cachedTex) {
            const sprite = new Sprite(cachedTex)
            sprite.width = size * layer.scale
            sprite.height = size * layer.scale
            sprite.alpha = layer.opacity
            sprite.x = layer.x
            sprite.y = layer.y
            this.layerGraphics.set(layer.id, sprite)
            ensureChildAt(container, sprite, index)
            return
          }

          // Texture not cached — async load (live preview path)
          const capturedLayerId = layer.id
          const capturedSrc = layer.src
          const capturedApp = this.app
          const capturedScale = layer.scale
          const capturedOpacity = layer.opacity
          const capturedX = layer.x
          const capturedY = layer.y
          const loadPromise = Assets.load<Texture>(layer.src).then((tex) => {
            if (!capturedApp || !this.initialized) return
            // If the user switched to a different src while we were loading, discard
            if (this.layerUrls.get(capturedLayerId) !== capturedSrc) return
            const sprite = new Sprite(tex)
            sprite.width = size * capturedScale
            sprite.height = size * capturedScale
            sprite.alpha = capturedOpacity
            sprite.x = capturedX
            sprite.y = capturedY
            this.layerGraphics.set(capturedLayerId, sprite)
            // Add to container (exact index will be fixed on next renderFrame call)
            if (this.layersContainer) this.layersContainer.addChild(sprite)
            // Re-render now that the texture dimensions are real
            capturedApp.renderer.render(capturedApp.stage)
          }).catch((err) => {
            console.error(`[renderer] Failed to load midground texture: ${capturedSrc}`, err)
            // Clear the URL so the next renderFrame will retry
            if (this.layerUrls.get(capturedLayerId) === capturedSrc) {
              this.layerUrls.delete(capturedLayerId)
            }
          }).finally(() => {
            this.pendingLoads.delete(capturedLayerId)
          })
          this.pendingLoads.set(layer.id, loadPromise)
          return
        }
        // Texture already loaded — update transforms in place
        const sprite = existingSprite
        // scale: 1.0 = fill the canvas; scale: 1.5 = 150% of canvas size
        sprite.width = size * layer.scale
        sprite.height = size * layer.scale
        sprite.alpha = layer.opacity
        sprite.x = layer.x
        sprite.y = layer.y
        ensureChildAt(container, sprite, index)
        return
      }

      if (layer.kind === 'image') {
        const existingSprite = this.layerGraphics.get(layer.id) as Sprite | undefined
        const prevUrl = this.layerUrls.get(layer.id)
        let sprite = existingSprite
        if (!sprite || prevUrl !== layer.objectUrl) {
          existingSprite?.destroy()
          const tex = Texture.from(layer.objectUrl)
          sprite = new Sprite(tex)
          this.layerGraphics.set(layer.id, sprite)
          this.layerUrls.set(layer.id, layer.objectUrl)
        }
        sprite.alpha = layer.opacity
        sprite.scale.set(layer.scale)
        sprite.x = layer.x
        sprite.y = layer.y
        ensureChildAt(container, sprite, Math.min(index, container.children.length))
      }
    })

    // Apply adjustment layer filters to the composite container
    container.filters = adjustmentLayer ? buildFilters(adjustmentLayer.filters, this.displacementSprite) : []

    // Flush display-object changes to the WebGL canvas immediately.
    // Without this, rendering is deferred to the auto-ticker and the canvas
    // may be blank when read back during export.
    this.app.renderer.render(this.app.stage)
  }

  setSize(size: number): void {
    this.size = size
    if (!this.initialized || !this.app) return
    this.app.renderer.resize(size, size)
  }

  async exportPng(): Promise<Blob> {
    if (!this.app) throw new Error('Renderer not initialised')
    // Render synchronously, then immediately copy the WebGL canvas to a 2D
    // canvas before yielding to the event loop. The WebGL backbuffer is cleared
    // by the compositor on the next frame swap, so toBlob() on the WebGL canvas
    // directly (with an async callback) can read a blank buffer. The 2D canvas
    // copy is not subject to that clearing and is safe to read asynchronously.
    this.app.renderer.render(this.app.stage)
    const src = this.app.canvas as HTMLCanvasElement
    const copy = document.createElement('canvas')
    copy.width = src.width
    copy.height = src.height
    copy.getContext('2d')!.drawImage(src, 0, 0)
    return new Promise<Blob>((resolve, reject) =>
      copy.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
    )
  }

  async flushPendingLoads(): Promise<void> {
    if (this.pendingLoads.size === 0) return
    await Promise.all([...this.pendingLoads.values()])
  }

  async preWarmTextures(urls: string[]): Promise<void> {
    await Promise.all(urls.map(url => Assets.load(url)))
  }

  destroy(): void {
    this.initialized = false
    for (const g of [...this.layerGraphics.values()]) {
      try { g.destroy() } catch { /* ignore if not fully initialized */ }
    }
    this.layerGraphics.clear()
    this.layerUrls.clear()
    this.pendingLoads.clear()
    this.displacementSprite?.destroy()
    this.displacementSprite = null
    this.layersContainer = null  // app.destroy(true) handles actual cleanup
    const app = this.app
    this.app = null  // null first so init() detects destruction mid-await
    if (app) {
      try { app.destroy(true) } catch { /* may throw if destroyed before init resolved */ }
    }
  }
}
