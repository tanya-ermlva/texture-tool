// app/texture-playground/lib/export.ts
import type { Project, RendererAdapter } from './types'
import { resolveFrame } from './resolve'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Fast preview export (MediaRecorder) ──────────────────────────────────────

export async function exportWebMFast(
  canvas: HTMLCanvasElement,
  adapter: RendererAdapter,
  project: Project,
): Promise<void> {
  const stream = canvas.captureStream(project.fps)
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  recorder.start()

  // Play exactly one full cycle
  for (const frame of project.frames) {
    const snapshot = resolveFrame(frame)
    adapter.renderFrame(snapshot)
    await new Promise<void>((resolve) => setTimeout(resolve, (frame.durationFrames / project.fps) * 1000))
  }

  recorder.stop()
  await new Promise<void>((resolve) => { recorder.onstop = () => resolve() })
  downloadBlob(new Blob(chunks, { type: 'video/webm' }), 'texture-preview.webm')
}

// ── Deterministic export (WebCodecs + webm-muxer) ────────────────────────────

export async function exportWebMDeterministic(
  adapter: RendererAdapter,
  project: Project,
): Promise<void> {
  const { Muxer, ArrayBufferTarget } = await import('webm-muxer')
  const { outputSize, fps, frames } = project

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: { codec: 'V_VP9', width: outputSize, height: outputSize, frameRate: fps },
  })

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta ?? undefined),
    error: (e) => { throw e },
  })
  encoder.configure({ codec: 'vp09.00.10.08', width: outputSize, height: outputSize, bitrate: 4_000_000 })

  let timestampUs = 0
  const frameDurationUs = (1 / fps) * 1_000_000

  for (const frame of frames) {
    const snapshot = resolveFrame(frame)
    adapter.renderFrame(snapshot)

    // Extract via Pixi's render target — safe across await boundaries, unlike
    // reading the WebGL display buffer which is cleared after each frame swap.
    const blob = await adapter.exportPng()
    const bitmap = await createImageBitmap(blob)

    for (let tick = 0; tick < frame.durationFrames; tick++) {
      const videoFrame = new VideoFrame(bitmap, { timestamp: timestampUs, duration: frameDurationUs })
      encoder.encode(videoFrame, { keyFrame: tick === 0 })
      videoFrame.close()
      timestampUs += frameDurationUs
    }
    bitmap.close()
  }

  await encoder.flush()
  muxer.finalize()

  downloadBlob(new Blob([target.buffer], { type: 'video/webm' }), 'texture.webm')
}

// ── MP4 export (WebCodecs + mp4-muxer) ───────────────────────────────────────

export async function exportMp4(
  adapter: RendererAdapter,
  project: Project,
): Promise<void> {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer')
  const { outputSize, fps, frames } = project

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    fastStart: 'in-memory',
    video: { codec: 'avc', width: outputSize, height: outputSize, frameRate: fps },
  })

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta ?? undefined),
    error: (e) => { throw e },
  })
  encoder.configure({ codec: 'avc1.42001f', width: outputSize, height: outputSize, bitrate: 4_000_000 })

  let timestampUs = 0
  const frameDurationUs = (1 / fps) * 1_000_000

  for (const frame of frames) {
    const snapshot = resolveFrame(frame)
    adapter.renderFrame(snapshot)
    const blob = await adapter.exportPng()
    const bitmap = await createImageBitmap(blob)

    for (let tick = 0; tick < frame.durationFrames; tick++) {
      const videoFrame = new VideoFrame(bitmap, { timestamp: timestampUs, duration: frameDurationUs })
      encoder.encode(videoFrame, { keyFrame: tick === 0 })
      videoFrame.close()
      timestampUs += frameDurationUs
    }
    bitmap.close()
  }

  await encoder.flush()
  muxer.finalize()

  downloadBlob(new Blob([target.buffer], { type: 'video/mp4' }), 'texture.mp4')
}

// ── PNG frame export ──────────────────────────────────────────────────────────

export async function exportFramePng(adapter: RendererAdapter): Promise<void> {
  const blob = await adapter.exportPng()
  downloadBlob(blob, 'texture-frame.png')
}
