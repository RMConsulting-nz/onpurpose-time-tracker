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
