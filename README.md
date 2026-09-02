# Time Tracker | On Purpose

Free, simple software for tracking billable client work and personal time, built by [Rachel Mackay | On Purpose](https://onpurpose.nz).

Live app: https://rmconsulting-nz.github.io/rmc-time-tracker/

## Track work across multiple priorities, for work or personal time

Start, pause, resume and stop timers for as many zones (your categories, one per project or type of work) as you like. Mark time as billable or not, add a reference for extra detail such as a client's initials or a staff name, or add an entry by hand afterwards. Review and filter everything in Logs, and see totals and breakdowns by day, week or month in Reports, with one shared legend across the donut and daily bar charts that you can click to show or hide a zone or reference.

It works as an installable app on your phone or computer, not just a page you visit. On a phone, open the link in your browser and add it to your home screen (iPhone: tap Share, then Add to Home Screen. Android: open the browser menu, then Add to Home Screen or Install app). On a computer, most browsers let you install it straight from the address bar, or you can save it to your favourites instead.

## This app was designed for Microsoft 365 work accounts

Without signing in, everything is stored only in your browser on that one device (`localStorage`). It's real, working storage, not a demo, but it only lives on that device and browser. It disappears if you clear your browser's site data, or if you're in a private or incognito window once that window's whole private session ends. That makes it a genuinely good way to try the app out with throwaway data before committing to it.

Signing in with a Microsoft work account also saves your data to a private app folder in your own OneDrive, which is what lets it sync across your devices. This is the only way to get syncing, since the app has no server of its own to sync through. Depending on how your organisation manages Microsoft 365, your IT admin may need to approve the app the first time anyone in it signs in.

Personal and family Microsoft accounts currently hit a platform-level bug that breaks this syncing. See [SETUP.md](SETUP.md) for the detail. A work or school account is what's known to work reliably.

## Your data never passes through a company server

Nothing here goes through a server run by Rachel or anyone else. It either stays local to your device, or, once you sign in, syncs directly between your device and your own OneDrive through Microsoft's own systems. The app only ever asks for access to its own small, sandboxed folder in your OneDrive, not your whole drive.

## This app is free to reuse

Time Tracker | On Purpose is open source under the [MIT licence](LICENSE). Anyone can take the code and build their own version from it, even with different branding, free of charge. The only condition is that they keep the original copyright notice inside the code itself; they don't have to credit Rachel anywhere in their own app. If you'd like to make your own copy, with your own branding, your own OneDrive, and your own hosting, see [BUILD_YOUR_OWN.md](BUILD_YOUR_OWN.md). It includes a ready-to-use prompt for Claude, and is upfront about the setup that takes.

Anyone setting this repo up for themselves, or forking it, should also read [SETUP.md](SETUP.md) for the one-time Azure AD and GitHub Pages steps.

## Get in touch with Rachel

Rachel Mackay | On Purpose
[onpurpose.nz](https://onpurpose.nz)
[rachel@onpurpose.nz](mailto:rachel@onpurpose.nz)

If you've found this useful, or built your own copy, Rachel would love to hear about it.
