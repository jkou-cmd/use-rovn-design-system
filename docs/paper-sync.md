# Explicit Paper template sync

Normal document generation uses local files only. Run this workflow only when the user requests adopting Paper design changes.

1. Read the Paper MCP guide, then confirm the intended file, page, and selection. The source file and 17 approved frames are recorded in `design/paper/README.md`. Do not adopt other frames or slide templates without instruction.
2. Capture exact inline-style JSX with `get_jsx` and inspect `get_computed_styles` for changed components. Save the original exports in `design/paper/selected/`. Export full-page PNG references with Paper's export tool into `design/paper/reference/`.
3. Use `get_fill_image` to identify source images and map them to local originals in `design/paper/assets.json`. That tool may flatten transparency or resize previews; for a missing transparent asset use a PNG export of the image node at sufficient scale. Preserve ToC/appendix composition and SVG logo paths. Never rely on signed Paper URLs at generation time.
4. Compare changed structure with the component paths in `src/browser.js`. A changed hierarchy requires updating slot extraction. Do not accept a successful JSX build as proof that component mappings still work.
5. `npm run build:templates` rebuilds the local bundle. The original JSX retains original values. At runtime, resolve PostScript-style font aliases to bundled family files and ceil fractional percentage line heights to whole CSS pixels, matching Paper's observed text layout. This was verified against the captured reference pages.
   Capture the two fallback symbols as well if they change; see `assets/paper/SOURCE.md`. Normalization is shared by the production and reference renderers.
6. Run `node scripts/verify-reference.mjs`, then `python3 scripts/compare-reference.py --check`. The comparison requires Pillow and NumPy; it converts Paper's Display P3 exports to sRGB before comparison. Inspect all changed frames visually, not just aggregate scores. Rasterization differences may remain across browsers/viewers; do not hide geometry or typography changes behind a large pixel tolerance.
7. Run `npm test` and render the component sample. Review every PDF page, links, typography, dark variants, image transparency, pagination, and source preservation. Update `docs/validation.md` with actual results and unresolved differences.
8. Record the template version and source hashes. Keep old templates available if consumers need to reproduce older documents. A future slide renderer should be a separate template adapter using the shared content model, not a rewrite of report styles.

`npm run build:templates` is local compilation, not a live Paper fetch. The MCP capture steps above are performed by the agent during an explicit sync.
