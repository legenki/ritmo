# Ritmo

**Ritmo** is a generative graphics studio with four p5.js workspaces sharing the [Grafema](https://github.com/legenki/grafema) architecture and design system.

Live: [legenki.github.io/ritmo](https://legenki.github.io/ritmo/)

---

## Workspaces

### RITMO
Layered simplex-noise waves. Wave/stripe forms with HSLuv-generated palettes, three color-sorting modes (random / repeat / transition), gradient fills and strokes, dash patterns and 20 built-in presets.

### BORRO
Blurred form grids with shader post-processing. A grid of rounded rects or preset SVG shapes with per-form canvas blur and blend modes, composited through a gaussian blur framebuffer and a film-grain shader. Generative cosine palettes, 150 defined palettes (colorjs LCH interpolation) and 22 presets.

### COPO
Kaleidoscopic snowflake patterns. Thousands of shapes sampled on a grid, driven by 4D simplex noise with branch symmetry, swirl effects, pattern tiling and parametric or raster-image masks. 19 shape types, 1000 palettes, SVG export via paper.js and 29 presets.

### REFRAC
Image displacement studio. A source photo run through box / flow / sine displacement filter shaders and a refract-grid skew shader, with texture wrap modes and 14 presets.

---

## Architecture

Same as Grafema:

- **ES modules + p5.js instance mode** — each workspace is an isolated sketch (`{name}Sketch`) mounted via `new p5(sketch, container)`
- **Single-page, lazy-loaded** — workspaces are registered in `src/js/main.js`, code-split and fetched on first tab activation; heavy vendor libs (paper, colorjs, h264 encoder) load per workspace via `shared/utils/lazyLibs.js`
- **Shared design system** — `src/css/style.css` and the declarative `shared/ui/panelBuilder.js` control panels (SECTIONS data instead of Tweakpane)
- **localStorage autosave** per workspace, PNG/MP4 export everywhere, SVG export in Copo
- **Vite + PWA** — offline-capable, deployed to GitHub Pages via Actions

## Development

```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
npm run lint     # eslint, zero warnings enforced
```
