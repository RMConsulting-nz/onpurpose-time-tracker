// Fill in clientId after completing SETUP.md step 1 (Azure AD app registration).
// redirectUri should match the GitHub Pages URL exactly (e.g. https://<user>.github.io/rmc-time-tracker/).
export const MSAL_CONFIG = {
  clientId: 'PASTE-YOUR-AZURE-APP-CLIENT-ID-HERE',
  authority: 'https://login.microsoftonline.com/common',
  redirectUri: window.location.origin + window.location.pathname,
};

export const GRAPH_SCOPES = ['Files.ReadWrite.AppFolder'];

export const DATA_FILE_NAME = 'timetracker-data.json';
