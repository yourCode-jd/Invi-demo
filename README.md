# Premium Interactive Wedding Invitations

A lightweight, dependency-free collection of responsive wedding-invitation demos. It is designed as a reusable front-end foundation for customer invitations while keeping all sample names, dates, venues, maps, and RSVP responses clearly fictional.

## Technology stack

- Semantic HTML5
- Modern CSS (custom properties, responsive layouts, reduced-motion support)
- Vanilla JavaScript
- GSAP and ScrollTrigger, loaded from CDN only by the Moonlit Coast cinematic template
- Google Apps Script + Google Sheets reference implementation for optional RSVP storage

No package manager, build step, framework, paid builder, or private credentials are required.

## Local development

Serve the project from its root so all local assets and ES-independent scripts resolve correctly:

```bash
python3 -m http.server 5500
```

Then open one of these local pages:

- `http://localhost:5500/` — Template 01, Botanical Wedding
- `http://localhost:5500/royal-punjabi.html?demo=gursewak-simran` — Template 02, Royal Punjabi Wedding
- `http://localhost:5500/cinematic-invitation.html` — Template 03, Moonlit Coast

Template 01 supports `?demo=aarav-meera`, `?demo=vivaan-anaya`, and `?demo=arjun-isha`. Its built-in selector can switch among compatible local demos.

## Project structure

```text
.
├── index.html                         # Template 01 public entry point
├── royal-punjabi.html                 # Template 02 public entry point
├── cinematic-invitation.html          # Template 03 public entry point
├── assets/
│   └── moonlit-coast/                 # Original local cinematic image assets
├── config/
│   ├── invitations.js                 # Template 01/02 fictional customer registry
│   └── moonlit-coast.js               # Template 03 fictional configuration
├── scripts/
│   ├── botanical.js                   # Template 01 renderer, RSVP adapter, countdown
│   ├── royal-punjabi.js               # Template 02 renderer, RSVP adapter, countdown
│   └── moonlit-coast.js               # Template 03 renderer and motion system
├── styles/
│   ├── botanical.css                  # Template 01 visual system
│   ├── envelope.css                   # Template 01 envelope behavior
│   ├── config.css                     # Template 01 configuration controls
│   ├── royal-punjabi.css              # Template 02 isolated styles
│   ├── moonlit-coast.css              # Template 03 visual system
│   ├── moonlit-polish.css             # Template 03 structural overrides
│   └── moonlit-motion.css             # Template 03 motion-layer styles
├── docs/
│   └── cinematic-motion-storyboard.md # Template 03 motion plan
└── integrations/
    └── google-apps-script/            # Optional RSVP backend and deployment guide
```

## Features

- Three visually isolated invitation templates
- Config-driven fictional couples, dates, schedules, venues, colors, and optional music
- Botanical envelope opening, Royal Punjabi darbar opening, and Moonlit Coast cinematic experience
- Live countdowns, event schedules, map links, preview selectors, and responsive layouts
- RSVP forms with native validation, explicit demo behavior, duplicate-safe client request IDs, timeout/error handling, and optional HTTPS backend support
- Accessible keyboard controls and `prefers-reduced-motion` fallbacks
- Original Moonlit Coast artwork stored locally; no placeholder image URLs

## RSVP integration

The front end never contains Google credentials or spreadsheet access. Each template remains in safe demo mode while its `rsvp.endpoint` is empty; it clearly states that nothing is sent or saved.

For production RSVP storage, follow [the Apps Script deployment guide](integrations/google-apps-script/README.md), verify a real test row in the customer-owned Sheet, and only then configure that invitation’s HTTPS `/exec` endpoint.

## Validation and current status

- Static asset paths and all three public entry points are maintained after the folder cleanup.
- JavaScript syntax checks and whitespace validation are the available code-level checks for this buildless project.
- Templates 01 and 02 remain feature-isolated from the Moonlit Coast styles and motion code.
- Current development work: Template 03 includes a documented cinematic-motion pass. Its final physical-device touch/recording QA remains a recommended follow-up because the local Chromium automation environment intermittently blocks remote touch emulation.

## Completed work

- Config-driven Botanical and Royal Punjabi templates with local demo switching
- Google Apps Script RSVP backend source and deployment documentation
- Isolated Moonlit Coast cinematic invitation with local artwork and GSAP-based scene motion
- Folder organization, stable public entry points, and updated path references

## Remaining production tasks

- Perform customer-device QA and record acceptance videos for each template
- Create and deploy a customer-owned Google Sheet/App Script endpoint per live invitation
- Replace fictional content, maps, optional music, and visual assets with approved customer material
- Deploy the static files to the chosen hosting provider
