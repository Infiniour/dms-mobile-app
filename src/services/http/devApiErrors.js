const listeners = new Set();

function toText(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function compactHeaders(headers) {
  if (!headers) {
    return undefined;
  }

  return {
    'content-type': headers['content-type'] ?? headers['Content-Type'],
    'x-request-id': headers['x-request-id'] ?? headers['X-Request-Id'],
  };
}

export function subscribeDevApiErrors(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function publishDevApiError(error) {
  const payload = {
    ...error,
    method: error.method?.toUpperCase(),
    headers: compactHeaders(error.headers),
    bodyText: toText(error.body),
  };

  if (__DEV__) {
    console.log('Dev API error', payload);
  }

  listeners.forEach((listener) => {
    listener(payload);
  });
}
