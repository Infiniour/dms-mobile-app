import axios from 'axios';
import Constants from 'expo-constants';
import { getApiPlatform, getDeviceId } from './deviceId';
import { publishDevApiError } from './devApiErrors';
import { clearTokens, getTokens, setTokens } from './tokenStorage';

const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || '';
const apiPlatform = getApiPlatform();

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = details.status ?? null;
    this.body = details.body ?? null;
  }
}

function getErrorMessage(body, status) {
  if (body?.error?.message) {
    return body.error.message;
  }

  if (body?.message) {
    return body.message;
  }

  return `API request failed (${status ?? 'network error'})`;
}

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': apiPlatform,
  },
  // Repeatable query params (e.g. status, type) must serialize as plain
  // repeated keys ("status=a&status=b"), not axios's default bracket
  // notation ("status[]=a&status[]=b"), to match the API's expected format.
  paramsSerializer: { indexes: null },
});

httpClient.interceptors.request.use(async (config) => {
  if (!apiBaseUrl) {
    const error = new ApiError('Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL in .env.');

    publishDevApiError({
      message: error.message,
      method: config.method,
      url: config.url,
      status: error.status,
      body: error.body,
    });

    throw error;
  }

  config.headers['X-Device-Id'] = await getDeviceId();

  const requiresAuth = config.meta?.auth !== false;

  if (requiresAuth) {
    const tokens = await getTokens();

    if (tokens) {
      config.headers.Authorization = `${tokens.tokenType} ${tokens.accessToken}`;
    }
  }

  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const tokens = await getTokens();

  if (!tokens?.refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(
      `${apiBaseUrl}/api/v1/auth/refresh-token`,
      { refreshToken: tokens.refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Platform': apiPlatform,
          'X-Device-Id': await getDeviceId(),
        },
      }
    );

    const nextTokens = response.data?.data;
    await setTokens(nextTokens);

    return nextTokens;
  } catch {
    await clearTokens();
    return null;
  }
}

httpClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { config, response } = error;
    const requiresAuth = config?.meta?.auth !== false;

    if (response?.status === 401 && requiresAuth && !config._retry) {
      config._retry = true;
      // Share one in-flight refresh across concurrent 401s. Clear only when that
      // refresh settles — clearing after the first await let later 401s start a
      // second refresh and break single-use refresh-token rotation.
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const nextTokens = await refreshPromise;

      if (nextTokens) {
        config.headers.Authorization = `${nextTokens.tokenType} ${nextTokens.accessToken}`;
        return httpClient(config);
      }
    }

    const apiError = new ApiError(getErrorMessage(response?.data, response?.status), {
      status: response?.status ?? null,
      body: response?.data ?? null,
    });

    if (config?.meta?.reportErrors !== false) {
      publishDevApiError({
        message: apiError.message,
        method: config?.method,
        url: config?.url,
        status: apiError.status,
        body: apiError.body,
        headers: response?.headers,
      });
    }

    throw apiError;
  }
);
