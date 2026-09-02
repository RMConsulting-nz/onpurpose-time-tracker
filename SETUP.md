# Setup

The app code is dependency-light static HTML/JS/CSS — no build step. Two manual,
one-time steps are needed before it will work: an Azure AD app registration (so
the app can sign you in and reach your OneDrive), and turning on GitHub Pages.

## 1. Azure AD app registration

This lets the app sign in with your Microsoft account (MSAL.js, public-client SPA —
no backend, no secrets) and request permission to read/write its own data file in
your OneDrive.

1. Go to [portal.azure.com](https://portal.azure.com) (free) and sign in with the
   Microsoft account you use for OneDrive / M365.
2. Search for **App registrations** → **New registration**.
   - Name: `RMC Time Tracker` (or anything you like).
   - Supported account types: **Accounts in any organizational directory and
     personal Microsoft accounts** (or "personal Microsoft accounts only" if
     that's all you'll ever use).
   - Redirect URI: leave blank for now — added in the next step as type **SPA**.
   - Click **Register**.
3. Note the **Application (client) ID** on the app's Overview page — you'll paste
   this into the code shortly.
4. Go to **Authentication** → **Add a platform** → **Single-page application (SPA)**.
   - Redirect URI: your GitHub Pages URL, exactly as it will be served, e.g.
     `https://<your-username>.github.io/rmc-time-tracker/`
     (must match exactly, including the trailing slash).
   - Leave the default token settings; click **Configure**.
5. Go to **API permissions** → **Add a permission** → **Microsoft Graph** →
   **Delegated permissions** → search for and select **Files.ReadWrite.AppFolder**
   → **Add permissions**.
   - This scopes the app to only its own app folder in your OneDrive
     (`OneDrive/Apps/RMC Time Tracker`), not your whole drive.
   - No admin consent should be required for this permission on a personal
     Microsoft account; if prompted for a work/school account, click
     **Grant admin consent**.
6. Open `js/config.js` in this repo and paste your client ID into `clientId`:
   ```js
   export const MSAL_CONFIG = {
     clientId: 'PASTE-YOUR-AZURE-APP-CLIENT-ID-HERE', // <-- replace this
     ...
   };
   ```
   Commit and push that change.

## 2. Enable GitHub Pages

1. In this repo on GitHub, go to **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
3. Branch: select the branch this app is on (e.g. `main` after merging, or the
   working branch), folder `/ (root)`. Save.
4. GitHub will publish the site at `https://<your-username>.github.io/rmc-time-tracker/`
   after a minute or two — this is the URL to use as the redirect URI in step 1.4
   above (update it there if it doesn't match exactly what's registered).

Once both are done, open the site on your iPhone (Safari → Share → **Add to Home
Screen**, for an app-like icon) and on your computer, sign in with Microsoft, and
you're set — the first sign-in creates the data file in your OneDrive app folder,
pre-seeded with three zones and two contacts.

## Known limitation: personal/family Microsoft accounts

This app is designed for **work/school (Microsoft 365 organization)
accounts**. Personal and Family Microsoft accounts have sometimes failed to
sync, with a `serviceReadOnly` / "Database Is Read Only" error from Microsoft
Graph, on the very first sign-in.

The likely cause: OneDrive for work/school accounts runs on SharePoint's
infrastructure, while OneDrive Personal/Family runs on an older, separate
consumer backend. The feature this app relies on to create its own sandboxed
data folder (`Files.ReadWrite.AppFolder`'s automatic "AppFolder" creation)
appears to provision that folder asynchronously on that consumer backend, so
the very first attempt can hit a "not ready yet" error even though the folder
is being created behind the scenes. Manually creating folders/files in the
regular OneDrive web app works fine on personal accounts, it's specifically
Graph's automatic AppFolder creation that's affected.

In at least one case, signing out and back in again shortly after the first
failure resolved it: the app folder had already been created, so the second
attempt succeeded normally and has kept syncing since. This isn't yet
confirmed as a reliable fix rather than a one-off, so if you're on a personal
account and hit this error, it's worth trying again before assuming it won't
work. A work/school account remains what's known to work without this hiccup.

A more thorough fix is possible but requires broadening the requested
permission from `Files.ReadWrite.AppFolder` (sandboxed to this app's own
folder) to `Files.ReadWrite` (full access to the OneDrive), and having the
app manage a plain, ordinary folder itself instead of relying on the
AppFolder trick. That trade-off (broader access) hasn't been made.
