# Interactive Wedding Invitation Demo

Three fictional invitation configurations are included: Aarav & Meera (Jaipur), Vivaan & Anaya (Udaipur), and Arjun & Isha (Alibaug).

## Run locally

Option A: open `index.html` in a browser.

Option B (recommended): from this folder, run:

```bash
python3 -m http.server 5500
```

Then open http://localhost:5500

## Local demo previews

Use the fixed **Demo preview** selector, or open one of these URLs directly:

- `http://localhost:5500/?demo=aarav-meera`
- `http://localhost:5500/?demo=vivaan-anaya`
- `http://localhost:5500/?demo=arjun-isha`

## Features
- Layered CSS envelope reveal animation (card, liner, flap, seal and front)
- Responsive premium botanical layout from 320px through desktop
- Live countdown for an explicitly fictional event date
- Fictional event schedule and placeholder maps search
- RSVP adapter with safe local demo mode, server-confirmed success states, retry-safe submission IDs, and error handling
- Accessible form labels and reduced-motion support
- Config-driven customer details, schedules, colour tokens, photo metadata, music settings, and RSVP settings
- Local preview selector for switching between fictional customers

## Reuse this template

- Add or update a customer object in `invitation.config.js`. This is the only file that should hold customer-specific names, date/time, venue, schedule, optional photo metadata, colours, and music settings.
- Keep the wedding date as an ISO string with the couple's local UTC offset.
- `script.js` renders the active configuration selected by `?demo=<config-id>`.
- Set `rsvp.endpoint` only when a real HTTPS endpoint is available. With an empty endpoint, the form remains an explicit local demo and never sends or stores data. The supplied Google Sheets backend setup is in `google-apps-script/README.md`.

## File structure

- `invitation.config.js` — fictional customer configuration registry
- `script.js` — configuration renderer, countdown, existing envelope trigger, and RSVP transport adapter
- `index.html` — reusable semantic template
- `styles.css` — approved visual design system
- `envelope.css` — approved envelope and countdown component behavior
- `config.css` — local configuration preview control and RSVP status colors
- `google-apps-script/Code.gs` — reusable Google Apps Script RSVP receiver
- `google-apps-script/README.md` — Sheet schema, deployment, configuration, and verification steps

## RSVP integration

The site does not include a production endpoint or any Google credentials. To go live, deploy the supplied Apps Script code, verify a test row in the customer-owned Sheet, then place its `/exec` URL in the appropriate configuration’s `rsvp.endpoint`. Until then, the browser explicitly labels the interaction as a demo and does not send data.

## Notes
No paid builder required. Fonts load from Google Fonts when online and fall back to system fonts offline.
