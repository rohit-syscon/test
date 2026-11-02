# Project conventions

This file tells Artin's AI (and people) how this project is built. Edit it
freely; the AI reads it before every change.

- Next.js App Router with TypeScript. Pages live in `app/`.
- Page sections are components in `components/sections/`, one per file,
  taking their text and links as props. Pages compose sections.
- Style with literal Tailwind classes (`className="px-6 py-24"`), not
  computed strings, so the visual builder can edit them.
- Colors, fonts and spacing come from the tokens in `app/globals.css`.
  Use token classes (`bg-brand`, `text-muted`) rather than raw hex values.
- Keep secrets in environment variables. Never prefix a secret with
  `NEXT_PUBLIC_`; that ships it to every visitor's browser.
- This project is one website. Pages made in code live in `app/`; pages
  made in Artin's page builder are written by Artin into
  `content/pages/<path>.json` (and the site's header, footer and settings
  into `content/site.json`). Change those in the page builder, not here.
  A page in code at the same address as a builder page takes its place.
- The site's header and footer come from the page builder and wrap every
  page through `<ArtinSiteFrame>` in `app/layout.tsx`. Keep it, and don't
  add a second header or footer to a page.
