# Paper design capture

Source: https://app.paper.design/file/01M0CHJM5K1AGXGCG2NP449W97/8-0

Captured from the user's 17 selected frames on the Doc Brand Kit page. Files in `selected/` are original inline-style JSX exports from Paper MCP, including original sample copy and Paper asset URLs. These are unmodified design references. `assets.json` maps every image URL to a bundled local file; `scripts/build-templates.mjs` compiles them into the versioned local renderer bundle.

## Frame map

| Role | Light / base | Dark |
| --- | --- | --- |
| Cover | OC9-0 | — |
| Table of contents | SHE-0 | — |
| Section opener, text and lists | TTI-0 | P5W-0 |
| Continuation, footnotes, tables, links and code | U0I-0 | QDS-0 |
| Section opener and callout variants | TW7-0 | PVO-0 |
| Blocks | UBS-0 | RO3-0 |
| More blocks and footnotes | U4R-0 | S28-0 |
| Section opener and image band | TZ3-0 | QRC-0 |
| Image column | U9A-0 | SEW-0 |
| Appendix and sources | OR2-0 | — |

## Observed design constraints

- All selected pages are 816 × 1056 CSS pixels, equivalent to US Letter at 96 CSS pixels per inch.
- Main structure uses a 116 px left column and 700 px main region, with 24 px main-region horizontal padding.
- Typography uses Crimson Pro, Inter, and Fragment Mono. All three families and their licenses are bundled in the repository.
- Light ground is #F9F4EA; dark ground is #1B1814. Theme variants have explicit foreground, surface, border, and accent values. Do not implement dark mode by automatic color inversion.
- Original inline SVG logos/icons are retained in JSX exports.
- Fifteen distinct Paper image asset URLs occur in the selection; all are mapped locally, including two transparent cutouts exported from Paper.
- User requires approximately 20–25% of eligible content pages to be dark; cover, contents and appendix pages are excluded from the denominator.

## Confirmed product decisions

- The skill may restructure and lightly edit input, preserving all facts.
- Initial distribution is a shared repository supporting Claude Code and Codex.
- Generation uses versioned local templates. Paper changes are adopted through explicit syncs, rather than reading the live file during each generation.
- Components may grow vertically and content may continue onto additional pages while preserving the defined typography, spacing, and page grid.
- The AI may select suitable component variants and turn source content into cards, comparisons, callouts, and other designed layouts.
- Correct inconsistent sample section letters and prevent orphaned headings while preserving visual styling.
- Include cover subtitle, eyebrow, and summary only when supplied in the input; do not invent these fields.
- The AI may choose decorative images from the bundled assets or find additional web imagery matching the existing mood, including when the input has no images. Web images are reviewed, downloaded and embedded locally, with provenance retained.
- Cover imagery may vary. Both cover images and section-header images must use amber-colored imagery.
- Preserve the exact ToC and appendix artwork and composition across generated documents.
- Every main section begins on a new page with an amber image header.
- Main sections use sequential letters A, B, C, D, E, etc.; subsections use their section letter plus a sequential number (A1, A2, A3, etc.).
- The cover has no printed page number. Printed page numbering begins at 1 on the ToC. Generated contents links and references must resolve to the correct physical PDF pages while displaying the printed page numbers.

## Version 1 defaults

- Markdown is the primary input; DOCX is also supported. Deeper headings are unnumbered subheadings. Unsupported structures fail visibly.
- Missing title uses the source heading or filename; missing author is omitted; date defaults to today and version to 1. Empty optional cover slots retain the composition.
- Supplied charts and screenshots are contained rather than cropped; decorative imagery may use the template crop.
- Footnotes appear on cited pages; explicit references form an appendix. Ordinary hyperlinks do not automatically become references.
- Dark pages are spread without adjacency, aiming for 20–25% of body pages. Fewer than four body pages get none; impossible integer fractions use the nearest count to 22.5%.
- Original Paper percentage line heights resolve to whole pixels by rounding up; this behavior is reproduced by the runtime and reference renderer.

Future slide templates should share brand assets and document content representation with PDFs while defining their own page geometry and layout rules. No slide designs have been adopted from unselected frames.
