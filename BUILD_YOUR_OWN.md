# Build your own copy

This app is [open source](README.md#this-app-is-free-to-reuse), and you're welcome to take these files and turn them into your own version, with your own branding, your own data, hosted under your own accounts.

This is not a one-click install. Getting your own copy fully working, so it can sync via your own Microsoft account, needs a few manual, one-time setup steps on accounts only you control.

### A GitHub account

A free GitHub account holds your copy of the code and hosts it via GitHub Pages, also free.

### An Azure AD app registration

This is free, via [portal.azure.com](https://portal.azure.com), and is what lets your copy of the app sign in with Microsoft and reach your own OneDrive. It takes about 10 minutes and is walked through step by step in this repo's [SETUP.md](SETUP.md).

### Your Microsoft account's cooperation

If you plan to sign in with a work or school account, your IT admin may need to approve, or consent to, the app the first time anyone in your organisation signs in. This is the same as any new sign-in-with-Microsoft app. Personal Microsoft accounts don't need admin approval, but currently have a separate syncing bug of their own, also covered in SETUP.md. A work or school account is what's known to work.

None of this is difficult, but it is real setup, not a copy-paste. The good news is that Claude, or another AI assistant, can walk you through every step above, one at a time, on your own accounts.

## The prompt

Copy the text below, paste it to Claude (claude.ai, the Claude Code CLI, or Claude in your IDE), and follow along.

```
I want to build my own copy of a time-tracking web app, based on an existing
open-source project. The original is at:
https://github.com/RMConsulting-nz/rmc-time-tracker

Please:
1. Read through that repo's files (index.html, styles.css, the js/ folder,
   README.md and SETUP.md) so you understand how it's built. It's
   dependency-light static HTML/JS/CSS with no build step, using Chart.js and
   MSAL.js loaded from a CDN, and syncing to OneDrive via Microsoft Graph.
2. Help me set up my own copy of it, end to end:
   - Create a new GitHub repository under my own account with these files
     (copied and, if I want, restyled/rebranded to my own name and colours).
   - Walk me through the Azure AD app registration step from SETUP.md so my
     copy can sign in with my own Microsoft account.
   - Walk me through turning on GitHub Pages for my new repo so it's live at
     my own URL.
   - Update js/config.js with my new Azure app's client ID.
3. Ask me at each step for anything only I can provide (my GitHub username,
   my Azure client ID once I've created it, my preferred branding/colours,
   etc.) rather than guessing.
4. Confirm with me before making any change that would be hard to undo (like
   overwriting existing files, if I already have something at that repo
   name).

I'm comfortable following instructions but haven't set up an Azure app
registration or GitHub Pages before, so please explain each step rather than
assuming I know the terminology.
```

That's enough context for Claude to fetch the repo, explain what it's looking at, and guide you through the rest interactively.
