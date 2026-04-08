// app/texture-playground/components/MetaData.tsx
type Props = { fps: number; framesEach: number; compositions: number }

export default function MetaData({ fps, framesEach, compositions }: Props) {
  return (
    <div className="flex flex-col items-end text-meta font-bold uppercase gap-1">
      <span className="text-ink">{fps} FPS</span>
      <span className="text-ink">{framesEach} FRAMES EACH</span>
      <span className="text-ink">{compositions} COMPOSITIONS</span>
    </div>
  )
}
