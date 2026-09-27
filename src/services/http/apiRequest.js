import { httpClient } from './client';

function buildConfig({ auth = true, meta, ...config }) {
  return {
    ...config,
    meta: {
      ...meta,
      auth,
    },
  };
}

export function apiRequest({ url, method = 'GET', data, params, auth = true, ...config }) {
  return httpClient.request(
    buildConfig({
      ...config,
      url,
      method,
      data,
      params,
      auth,
    })
  );
}

export const api = {
  request: apiRequest,
  get: (url, options = {}) => apiRequest({ ...options, url, method: 'GET' }),
  post: (url, data, options = {}) => apiRequest({ ...options, url, data, method: 'POST' }),
  put: (url, data, options = {}) => apiRequest({ ...options, url, data, method: 'PUT' }),
  patch: (url, data, options = {}) => apiRequest({ ...options, url, data, method: 'PATCH' }),
  delete: (url, options = {}) => apiRequest({ ...options, url, method: 'DELETE' }),
};
