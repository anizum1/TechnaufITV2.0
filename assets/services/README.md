# Service category images

Drop the five category banner photos in this folder using these exact
filenames. The services carousel picks them up automatically — no code
change needed. If a file is missing, that card falls back to a brand
gradient, so the site never looks broken.

| Filename            | Category                 | Suggested subject                                  |
|---------------------|--------------------------|----------------------------------------------------|
| `cloud.jpg`         | Cloud Solutions          | Abstract cloud / data connections, blue tones       |
| `security.jpg`      | Cybersecurity            | Security operations centre, monitoring dashboards   |
| `network.jpg`       | Network Infrastructure   | Patch panel with ethernet cabling                   |
| `infrastructure.jpg`| Infrastructure & Servers | Engineer racking a server                           |
| `consulting.jpg`    | Consulting               | Client strategy meeting / boardroom                 |

**Specs**

- Aspect ratio 16:9 (the card crops to this)
- 1200–1600px wide is plenty; keep each file under ~300 KB
- `.jpg` expected. To use `.webp` or `.png`, update the `src` in
  `services.html` (search for `assets/services/`)

Alt text is already written for each image in `services.html` — update it
there if you swap in a photo showing something different.
