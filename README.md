# Rōvn document system

Generate branded PDFs from Markdown or DOCX using the supplied Paper report templates. Includes a shared skill for Claude Code and Codex, local fonts/images, fixed component styles, measured pagination, automatic contents, footnotes, references, and dark-page scheduling.

## Setup

Requires Node.js 22 or newer. The repository is public; agents can clone and set it up without GitHub authentication.

```sh
git clone https://github.com/jkou-cmd/use-rovn-design-system.git
cd use-rovn-design-system
```

```sh
npm ci
npm run setup
```

Open this repository in Claude Code and invoke `/use-rovn-design-system path/to/document.md`. In Codex, invoke `$use-rovn-design-system` and provide the document path. The canonical skill is in `.agents/skills/`; the Claude entry point is in `.claude/skills/`.

No Paper connection is required to generate a document. After setup, bundled assets work offline. No paid model API is called by the renderer; the invoking agent handles optional content editing and component selection.

## Using it with agents

Start Claude Code or Codex in this checkout after setup. Give the agent the document path and preferences in the same request:

- Claude Code: `/use-rovn-design-system /absolute/path/report.md — choose suitable Lucide icons and turn dark pages off`
- Codex: `$use-rovn-design-system Turn /absolute/path/report.md into a PDF with suitable Lucide icons and dark pages on.`

For another agent with file and command access, use:

> Read `/absolute/path/use-rovn-design-system/.agents/skills/use-rovn-design-system/SKILL.md` and follow it to create a branded PDF from `/absolute/path/report.md`. Choose suitable Lucide callout icons. Turn occasional dark pages off. Use the renderer in that checkout and review every page.

Keep the whole repository available: copying only `SKILL.md` omits required templates, code, fonts, and images. An agent working in another project can read the skill by absolute path and run the renderer from this checkout. A chat-only agent needs a local runner with filesystem/shell access. Paper MCP is needed only for explicit design updates. This is a repository skill and CLI, not a hosted MCP server.

To update a clean checkout, run `git pull --ff-only` and `npm ci`; rerun `npm run setup` when Playwright changes. If the skill does not appear after cloning, start a new agent session from this folder.

## Icons and dark pages

Tell the agent the desired icon meaning and dark-page preference in plain language. Explicit component control is also available:

```json
{"type":"callout","variant":4,"icon":"shield-check","title":"Privacy","text":"Keep the supplied documents secure."}
```

Use any installed [Lucide](https://lucide.dev/guide/static) icon name, `auto`, or `none`. Search names with `node scripts/list-icons.mjs shield`. Icon SVGs are embedded locally; no CDN is needed.

```sh
npm run render -- document.md --dark-pages off
npm run render -- document.md --dark-pages on
```

Or put `darkPages: false` in the Markdown's YAML frontmatter. Prepared JSON uses `"options": { "darkPages": false }`. The CLI overrides the document setting. Dark pages are on by default; turning them off keeps every body page light and preserves pagination.

## Web imagery

Agents may find and download additional imagery from the web when it matches the Rōvn mood: warm, atmospheric, natural/botanical imagery with soft light. Cover and section headers stay amber; ToC and appendix artwork stays fixed. Chosen images are downloaded and embedded, with source and attribution details retained beside the prepared document. See [custom imagery fields](docs/document-model.md) for the renderer format.

## Direct CLI

```sh
npm run render -- examples/sample.md --screenshots
npm run render -- path/to/document.docx --out output/pdf/report.pdf
```

Each render produces a PDF, self-contained editable HTML, and `.qa.json`. `--screenshots` also writes page PNGs. A prepared content model gives the skill control over richer components:

```sh
npm run render -- document.md --prepare output/working/document.rovn.json
npm run render -- output/working/document.rovn.json --out output/pdf/document.pdf
```

Preparation embeds source images, so the prepared JSON can be relocated without breaking document-relative paths. See [the content model](docs/document-model.md) for component fields and limitations.

## Design contract

- US Letter, 816 × 1056 CSS pixels, with the exact Paper typography, grid, colors, SVGs, and component treatments.
- Unnumbered cover, ToC numbered 1, main sections A/B/C and subsections A1/A2.
- Main sections start on new pages with amber image headers. ToC and appendix artwork stays fixed.
- Cover subtitle, eyebrow, summary, and small print appear only when supplied.
- With dark pages enabled, approximately 20–25% of body pages are dark, spread without adjacent dark pages. Cover, ToC, and appendix are excluded; fewer than four body pages get no dark pages. Integer rounding applies when the range cannot be met exactly.
- Content can grow and continue across pages; typography does not shrink. The renderer fails on missing assets, unsupported content, content lost during pagination, or unfit components.

Template capture and comparison live in `design/paper/`. Read [Paper sync](docs/paper-sync.md) before adopting design changes. [Validation](docs/validation.md) records the current evidence and limits. Future slide formats can share content and assets while adding their own approved layouts.

Lucide attribution is in `licenses/lucide.txt`. Font licenses are bundled under `assets/fonts/`. Supplied brand imagery is included for this project's use; this repository does not grant additional redistribution rights to imagery.
