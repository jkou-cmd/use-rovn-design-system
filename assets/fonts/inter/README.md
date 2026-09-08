# Inter

Self-hosted Inter variable webfonts by Rasmus Andersson, with upright and italic styles and weights 100–900.

## Usage

Load the stylesheet (adjust the path to match your page):

```html
<link rel="stylesheet" href="assets/fonts/inter/inter.css">
```

Apply it to body text or interface elements:

```css
body {
  font-family: "Inter", system-ui, sans-serif;
  font-optical-sizing: auto;
}
```

For Libre Caslon Condensed headings, also load `assets/fonts/libre-caslon-condensed/libre-caslon-condensed.css` from your page and use `font-family: "Libre Caslon Condensed", Georgia, serif` on headings.
The project currently contains assets only; load these stylesheets when adding a page or application.
Keep the WOFF2 files alongside the stylesheet so its relative URLs resolve.

## Source and license

- Source: https://github.com/rsms/inter
- Upstream commit: `353b61b9f4430d5f420d56605a6e7993e0941470`
- Font files copied unchanged from `docs/font-files/`.
- License: SIL Open Font License 1.1; see [LICENSE.txt](./LICENSE.txt). Keep the license with redistributed fonts.
