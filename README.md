# Jan's Racing

Website for Jan's Racing Team, an ARCA Menards Series West team out of Glendora, CA, backed by Jan's Towing.

## Structure

- `index.html` — single-scroll site: start-lights intro, hero, team story, stats, drivers, garage (liveries), track marquee, history timeline, gallery + lightbox, Jan's Towing, partnerships, footer
- `assets/css/style.css` — design system: yellow/black livery tokens, italic speed type, skewed panels, animations, responsive breakpoints
- `assets/js/main.js` — start-lights loader, hero speed-streak canvas + speedometer, scroll progress, reveals, stat counters, timeline progress, mobile nav, lightbox
- `assets/img/` — logos, hibiscus marks, and race photography (full size + `-sm` thumbnails)

All motion respects `prefers-reduced-motion`. The start-lights intro plays once per browser session.

## Running locally

No build step. Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8080
```
