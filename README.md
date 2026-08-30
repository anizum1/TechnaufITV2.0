# Technauf — technauf.com

Static marketing website for Technauf (HTML/CSS/JS, no build step).

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` | Home page |
| `services.html`, `case-studies.html`, `contact.html`, `resources.html`, `checklist.html` | Main site pages |
| `guide-*.html` | Long-form guide pages |
| `privacy.html`, `terms.html` | Legal pages |
| `css/`, `js/`, `assets/`, `Technauf Pictures/` | Styles, scripts, images |
| `sitemap.xml`, `robots.txt` | SEO files |

## Local preview

No dependencies or build required — open `index.html` directly, or serve the
folder to get correct relative paths:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Publishing changes

The site is served by GitHub Pages from this repository. To publish an update:

1. Edit the HTML/CSS/JS files.
2. Commit and push to the branch GitHub Pages is configured to build from
   (Settings → Pages → "Build and deployment" → Branch — normally `main`).
3. Pages rebuilds automatically; the live site updates within a few minutes.

When adding a new page, also add its URL to `sitemap.xml` and link it from the
site navigation.
