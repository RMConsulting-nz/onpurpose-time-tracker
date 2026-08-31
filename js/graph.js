// Microsoft Graph access via MSAL.js (public-client SPA, no backend/secrets).
// Data lives in a single JSON file in the app's OneDrive special folder (approot),
// created on first run. Reads/writes use ETag / If-Match for optimistic concurrency.
import { MSAL_CONFIG, GRAPH_SCOPES, DATA_FILE_NAME } from './config.js';

const GRAPH_ROOT = 'https://graph.microsoft.com/v1.0';
const FILE_PATH = `/me/drive/special/approot:/${DATA_FILE_NAME}`;

let msalApp = null;
let account = null;

export function seedData() {
  const now = new Date().toISOString();
  return {
    zones: [
      { id: 'zone-client-post', name: 'Client Work (post contract)', color: '#C4472C', order: 0, archived: false },
      { id: 'zone-client-pre', name: 'Client Work (pre contract)', color: '#147D80', order: 1, archived: false },
      { id: 'zone-leads', name: 'Leads & Marketing', color: '#E0A02E', order: 2, archived: false },
    ],
    contacts: [
      { id: 'contact-kdh', name: 'KDH', archived: false },
      { id: 'contact-hwc', name: 'HWC', archived: false },
    ],
    entries: [],
    runningTimer: null,
    _meta: { createdAt: now },
  };
}

function getMsal() {
  if (!msalApp) {
    msalApp = new msal.PublicClientApplication({
      auth: {
        clientId: MSAL_CONFIG.clientId,
        authority: MSAL_CONFIG.authority,
        redirectUri: MSAL_CONFIG.redirectUri,
      },
      cache: {
        cacheLocation: 'localStorage',
      },
    });
  }
  return msalApp;
}

export async function initAuth() {
  const app = getMsal();
  await app.initialize();
  const result = await app.handleRedirectPromise();
  if (result && result.account) {
    account = result.account;
  } else {
    const accounts = app.getAllAccounts();
    if (accounts.length > 0) account = accounts[0];
  }
  return account;
}

export function getAccount() {
  return account;
}

export function isSignedIn() {
  return !!account;
}

export async function signIn() {
  const app = getMsal();
  const result = await app.loginPopup({ scopes: GRAPH_SCOPES });
  account = result.account;
  return account;
}

export async function signOut() {
  const app = getMsal();
  await app.logoutPopup({ account });
  account = null;
}

async function getToken() {
  const app = getMsal();
  if (!account) throw new Error('Not signed in');
  try {
    const result = await app.acquireTokenSilent({ scopes: GRAPH_SCOPES, account });
    return result.accessToken;
  } catch (err) {
    const result = await app.acquireTokenPopup({ scopes: GRAPH_SCOPES, account });
    return result.accessToken;
  }
}

async function graphFetch(path, options = {}) {
  const token = await getToken();
  const headers = Object.assign(
    { Authorization: `Bearer ${token}` },
    options.headers || {}
  );
  return fetch(`${GRAPH_ROOT}${path}`, Object.assign({}, options, { headers }));
}

// Fetches the data file's metadata (including eTag) and content.
// Returns { data, etag } or { data: null, etag: null } if the file doesn't exist yet.
export async function fetchRemote() {
  const metaRes = await graphFetch(FILE_PATH);
  if (metaRes.status === 404) {
    return { data: null, etag: null };
  }
  if (!metaRes.ok) {
    throw new Error(`Failed to read app data metadata (${metaRes.status})`);
  }
  const meta = await metaRes.json();
  const contentRes = await graphFetch(`${FILE_PATH}:/content`);
  if (!contentRes.ok) {
    throw new Error(`Failed to read app data content (${contentRes.status})`);
  }
  const data = await contentRes.json();
  return { data, etag: meta.eTag };
}

// Creates the data file for the first time (no If-Match — the file must not already exist).
export async function createRemote(data) {
  const res = await graphFetch(`${FILE_PATH}:/content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Failed to create app data file (${res.status})`);
  }
  const meta = await res.json();
  return { data, etag: meta.eTag };
}

// Writes the data file, failing with a conflict error if the remote eTag has moved on.
export async function saveRemote(data, etag) {
  const res = await graphFetch(`${FILE_PATH}:/content`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'If-Match': etag,
    },
    body: JSON.stringify(data),
  });
  if (res.status === 412) {
    const err = new Error('Conflict: app data changed elsewhere');
    err.isConflict = true;
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Failed to save app data (${res.status})`);
  }
  const meta = await res.json();
  return { data, etag: meta.eTag };
}
