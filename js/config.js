// Fill in clientId after completing SETUP.md step 1 (Azure AD app registration).
// redirectUri should match the GitHub Pages URL exactly (e.g. https://<user>.github.io/rmc-time-tracker/).
export const MSAL_CONFIG = {
  clientId: '50750594-6c26-4fb2-a356-7c436dfe8e8b',
  authority: 'https://login.microsoftonline.com/common',
  redirectUri: window.location.origin + window.location.pathname,
};

export const GRAPH_SCOPES = ['Files.ReadWrite.AppFolder'];

export const DATA_FILE_NAME = 'timetracker-data.json';
