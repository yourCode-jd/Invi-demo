# Interactive Wedding Invitation Demo

Original fictional concept: Aarav & Meera · December 12, 2026 · Jaipur.

## Run locally

Option A: open `index.html` in a browser.

Option B (recommended): from this folder, run:

```bash
python3 -m http.server 5500
```

Then open http://localhost:5500

## Features
- Layered CSS envelope reveal animation (card, liner, flap, seal and front)
- Responsive premium botanical layout from 320px through desktop
- Live countdown for an explicitly fictional event date
- Fictional event schedule and placeholder maps search
- Functional client-side RSVP demo (no network submission or data storage)
- Accessible form labels and reduced-motion support

## Reuse this template

- Update the names, date, venue and schedule in `index.html`.
- Update `weddingDate` in `script.js` using an ISO date with the couple's local UTC offset.
- Adjust the design tokens at the top of `styles.css` to create a new colourway.
- The RSVP is intentionally client-only: it displays a local confirmation and never saves or submits data.

## Codex next iteration
- Move event information into `invitation.json` (names, date, venue, timings, background style).
- Add real optional RSVP handling using an approved form service or server endpoint; never imply local demo data has been saved.
- Add optional user-triggered music with pause/mute (browsers block unsolicited autoplay).
- Add QA at 320, 375, 430, 768, 1024 and 1440px.
- Test reveal/animation keyboard interaction and mobile performance.

## Notes
No paid builder required. Fonts load from Google Fonts when online and fall back to system fonts offline.
