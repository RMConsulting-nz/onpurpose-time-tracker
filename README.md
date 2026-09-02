# Time Tracker — On Purpose

A free, simple app for tracking billable client work and personal time — built
by [Rachel Mackay | On Purpose](https://onpurpose.nz).

**Live app:** https://rmconsulting-nz.github.io/rmc-time-tracker/

## What it does

- Start/pause/resume/stop timers for as many **zones** (your categories — one
  per client, project, or type of work) as you like.
- Mark time as billable or not, attach it to a contact, add manual entries.
- Filter and review everything in **Logs**, and see totals and breakdowns by
  day/week/month in **Reports** (donut + daily bar chart, both driven by one
  shared legend you can click to hide/show a zone or contact).
- Works as an installable app (PWA) on your phone or desktop — no app store.

## Signing in with Microsoft

The app works two ways:

- **Not signed in:** everything is stored only in your browser on that one
  device (`localStorage`). It's real, working local storage — not a demo —
  but it only lives on that device/browser, and disappears if you clear your
  browser's site data (or if you're in a private/incognito window, once that
  window's whole private session ends). This is a genuinely good way to try
  the app out with throwaway data before committing to it.
- **Signed in with a Microsoft account:** your data is also saved to a private
  app folder in your own OneDrive, which is what makes it sync across your
  devices. **This is the only way to get syncing** — the app doesn't have any
  server of its own, so without a Microsoft sign-in there's nothing to sync
  through.
  - Personal/family Microsoft accounts currently have a platform-level bug
    that breaks this sync (see [SETUP.md](SETUP.md) for details) — a
    work/school (Microsoft 365) account is what's known to work reliably.

## Your data & privacy

Nothing here ever passes through a server run by Rachel or anyone else. It's
either purely local to your device, or — once you sign in — synced directly
between your device and your own OneDrive via Microsoft's own Graph API. The
app only ever requests access to its own small, sandboxed folder in your
OneDrive, not your whole drive.

## Open source

This project is open source under the [MIT license](LICENSE) — free to use,
copy, or build your own copy from. If you'd like to make your own version
(your own branding, your own OneDrive, your own hosting), see
[BUILD_YOUR_OWN.md](BUILD_YOUR_OWN.md) — it includes a ready-to-use prompt for
Claude plus what to expect from the setup.

Contributors setting this repo up for themselves (or forking it) should also
read [SETUP.md](SETUP.md) for the one-time Azure AD + GitHub Pages steps.

## Contact

**Rachel Mackay | On Purpose**
🌐 [onpurpose.nz](https://onpurpose.nz)
✉️ [rachel@onpurpose.nz](mailto:rachel@onpurpose.nz)
