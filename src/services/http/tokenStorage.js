import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'dms.accessToken';
const REFRESH_TOKEN_KEY = 'dms.refreshToken';
const EXPIRES_IN_KEY = 'dms.expiresIn';
const TOKEN_TYPE_KEY = 'dms.tokenType';

// SecureStore reads hit the keychain/keystore, and `getTokens` runs on every
// API request and every navigation guard. Keeping the resolved value in memory
// turns all of those into synchronous lookups after the first read.
let cachedTokens = null;
let isPrimed = false;
let primingPromise = null;
const listeners = new Set();

function publish() {
  listeners.forEach((listener) => listener(cachedTokens));
}

/** Subscribe to token changes. Returns an unsubscribe function. */
export function subscribeTokens(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Synchronous read of the in-memory cache. Returns `undefined` when the cache
 * has not been primed yet, which callers must treat as "unknown", not "absent".
 */
export function peekTokens() {
  return isPrimed ? cachedTokens : undefined;
}

async function readFromStore() {
  const [accessToken, refreshToken, expiresIn, tokenType] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(EXPIRES_IN_KEY),
    SecureStore.getItemAsync(TOKEN_TYPE_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: expiresIn ? Number(expiresIn) : null,
    tokenType: tokenType ?? 'Bearer',
  };
}

export async function getTokens() {
  if (isPrimed) {
    return cachedTokens;
  }

  // Concurrent callers during boot share a single keychain read.
  primingPromise =
    primingPromise ??
    readFromStore().then((tokens) => {
      cachedTokens = tokens;
      isPrimed = true;
      primingPromise = null;
      return tokens;
    });

  return primingPromise;
}

export async function setTokens({ accessToken, refreshToken, expiresIn, tokenType }) {
  cachedTokens = {
    accessToken,
    refreshToken,
    expiresIn: expiresIn ?? null,
    tokenType: tokenType ?? 'Bearer',
  };
  isPrimed = true;
  publish();

  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    SecureStore.setItemAsync(EXPIRES_IN_KEY, String(expiresIn ?? '')),
    SecureStore.setItemAsync(TOKEN_TYPE_KEY, tokenType ?? 'Bearer'),
  ]);
}

export async function clearTokens() {
  cachedTokens = null;
  isPrimed = true;
  publish();

  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(EXPIRES_IN_KEY),
    SecureStore.deleteItemAsync(TOKEN_TYPE_KEY),
  ]);
}
