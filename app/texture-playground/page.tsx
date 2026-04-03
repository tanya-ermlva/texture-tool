// app/texture-playground/page.tsx
import type { Metadata } from 'next'
import TexturePlaygroundClient from './TexturePlaygroundClient'

export const metadata: Metadata = {
  title: 'Texture Playground',
  robots: { index: false },
}

export default function TexturePage() {
  return <TexturePlaygroundClient />
}
