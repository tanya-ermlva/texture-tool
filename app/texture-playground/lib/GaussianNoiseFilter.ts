// app/texture-playground/lib/GaussianNoiseFilter.ts
//
// Film-grain filter — two key improvements over PixiJS's built-in noise:
//
// 1. Gaussian distribution (Box-Muller): grain clusters near zero with rare
//    strong spikes, exactly like photographic grain. The original uses uniform
//    distribution which looks like TV static.
//
// 2. "Hash without Sine" (Dave_Hoskins) instead of fract(sin(dot(...))):
//    the sine-based hash has visible frequency artifacts (banding) in GLSL.
//    This float-only hash uses cascaded fract(p * constant) + dot — no trig,
//    no integer types — giving a much flatter spectrum and broad GPU compat.
//    Reference: https://www.shadertoy.com/view/4djSRW
//
// 3. Bilinear smoothstep interpolation for coarse grain: instead of hard grid
//    cell boundaries, grain samples are blended across cell edges with
//    smoothstep, producing organic soft-blob shapes like real large-grain film.
//
import { Filter, GlProgram } from 'pixi.js'

const VERTEX = `
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}
vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}
void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`

const FRAGMENT = `
precision highp float;

in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;   // injected by PixiJS: (w, h, 1/w, 1/h)

uniform float uIntensity;  // 0..1  — grain strength
uniform float uSeed;       // 0..1  — per-frame seed for animation
uniform float uGrainSize;  // 1..12 — grain blob size in pixels

// ── Hash without Sine (Dave_Hoskins) ─────────────────────────────────────────
// Float-only, no trig, no integer types — works on WebGL1 + WebGL2.
// Cascaded fract(p * irrational-ish constant) + dot avalanches bits across
// dimensions, breaking up the grid regularity of simpler hashes.
vec2 cellRandom(vec2 cell) {
    // Fold seed into position so each animated frame has an unrelated grid
    vec2 p = cell + vec2(uSeed * 127.1, uSeed * 311.7);
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

// Box-Muller: (u1, u2) uniform → one Gaussian sample (μ=0, σ=1)
float gaussianSample(vec2 cell) {
    vec2 uv = cellRandom(cell);
    float u1 = max(uv.x, 1e-5);
    return sqrt(-2.0 * log(u1)) * cos(6.28318530718 * uv.y);
}

void main() {
    vec4 color = texture(uTexture, vTextureCoord);

    // Texture-space pixel coordinate (correct at every export resolution)
    vec2 px = vTextureCoord * uInputSize.xy;

    float grain;

    if (uGrainSize < 1.5) {
        // ── Fine grain: one independent Gaussian sample per pixel ─────────────
        grain = gaussianSample(px);

    } else {
        // ── Coarse grain: bilinear blend of Gaussian samples at cell corners ──
        // Using smoothstep for C¹-continuous blending eliminates the hard cell
        // boundaries that made the old floor() approach look like a grid.
        vec2 cellPx = px / uGrainSize;
        vec2 ci     = floor(cellPx);          // integer cell origin
        vec2 cf     = fract(cellPx);          // position within cell [0,1]
        vec2 blend  = smoothstep(0.0, 1.0, cf);

        float g00 = gaussianSample(ci);
        float g10 = gaussianSample(ci + vec2(1.0, 0.0));
        float g01 = gaussianSample(ci + vec2(0.0, 1.0));
        float g11 = gaussianSample(ci + vec2(1.0, 1.0));

        grain = mix(mix(g00, g10, blend.x),
                    mix(g01, g11, blend.x),
                    blend.y);

        // Bilinear blending reduces variance by ~0.6x — compensate so
        // the intensity slider feels the same across all grain sizes.
        grain *= 1.6;
    }

    // Scale: intensity=1.0 → ~8% max channel shift (matches film grain feel)
    grain *= uIntensity * 0.08;

    color.rgb = clamp(color.rgb + grain, 0.0, 1.0);
    finalColor = color;
}
`

export class GaussianNoiseFilter extends Filter {
  declare _uniforms: { uIntensity: number; uSeed: number; uGrainSize: number }

  constructor(intensity = 0.25, seed = Math.random(), grainSize = 1.0) {
    const glProgram = GlProgram.from({
      vertex: VERTEX,
      fragment: FRAGMENT,
      name: 'gaussian-noise-filter',
    })

    super({
      glProgram,
      resources: {
        noiseUniforms: {
          uIntensity: { value: intensity,  type: 'f32' },
          uSeed:      { value: seed,       type: 'f32' },
          uGrainSize: { value: grainSize,  type: 'f32' },
        },
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._uniforms = (this.resources.noiseUniforms as any).uniforms
  }

  get intensity(): number { return this._uniforms.uIntensity }
  set intensity(v: number) { this._uniforms.uIntensity = v }

  get seed(): number { return this._uniforms.uSeed }
  set seed(v: number) { this._uniforms.uSeed = v }

  get grainSize(): number { return this._uniforms.uGrainSize }
  set grainSize(v: number) { this._uniforms.uGrainSize = v }
}
