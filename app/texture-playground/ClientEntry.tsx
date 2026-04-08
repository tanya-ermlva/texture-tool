'use client'
import dynamic from 'next/dynamic'

// ssr: false must be declared inside a Client Component.
// The tool uses WebGL, localStorage, blob URLs — none available on the server.
const TexturePlaygroundClient = dynamic(
  () => import('./TexturePlaygroundClient'),
  { ssr: false }
)

export default function ClientEntry() {
  return <TexturePlaygroundClient />
}
