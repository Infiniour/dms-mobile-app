import { useEffect } from 'react';
import Constants from 'expo-constants';
import { useAppAlert } from '@/components/ui';
import { subscribeDevApiErrors } from '@/services/http/devApiErrors';

type ApiErrorAlertMode = 'dev' | 'staging' | 'prod';
type DevApiError = {
  message?: string;
  method?: string;
  url?: string;
  status?: number | null;
  bodyText?: string;
  headers?: {
    'content-type'?: string;
    'x-request-id'?: string;
  };
};

function truncate(text: string, maxLength = 1200) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function formatDevApiError(error: DevApiError) {
  const lines = [
    `${error.method ?? 'API'} ${error.url ?? ''}`.trim(),
    `Status: ${error.status ?? 'network/setup error'}`,
  ];

  if (error.message) {
    lines.push(`Message: ${error.message}`);
  }

  if (error.headers?.['x-request-id']) {
    lines.push(`Request ID: ${error.headers['x-request-id']}`);
  }

  if (error.bodyText) {
    lines.push('', 'Response:', truncate(error.bodyText));
  }

  return lines.filter(Boolean).join('\n');
}

function getDevApiErrorMessage(error: DevApiError) {
  return `${error.method ?? 'API'} ${error.url ?? ''}`.trim();
}

function getDevApiErrorDetails(error: DevApiError) {
  return formatDevApiError(error);
}

function getApiErrorAlertMode(): ApiErrorAlertMode {
  const configuredMode = Constants.expoConfig?.extra?.apiErrorAlertMode;

  if (isApiErrorAlertMode(configuredMode)) {
    return configuredMode;
  }

  const appEnv = Constants.expoConfig?.extra?.appEnv;

  if (appEnv === 'staging') {
    return 'staging';
  }

  if (appEnv === 'production') {
    return 'prod';
  }

  return __DEV__ ? 'dev' : 'prod';
}

function isApiErrorAlertMode(value: unknown): value is ApiErrorAlertMode {
  return value === 'dev' || value === 'staging' || value === 'prod';
}

function formatStagingDetails(error: DevApiError) {
  const lines = [
    `Status: ${error.status ?? 'network/setup error'}`,
    error.message ? `Message: ${error.message}` : '',
  ];

  return lines.filter(Boolean).join('\n');
}

function getSafeMessage() {
  return 'Something went wrong. Please try again.';
}

export function DevApiErrorReporter() {
  const { showAlert } = useAppAlert();

  useEffect(() => {
    const showError = (error: DevApiError) => {
      const mode = getApiErrorAlertMode();

      if (mode === 'prod') {
        showAlert({
          title: 'Request failed',
          message: getSafeMessage(),
          variant: 'error',
        });
        return;
      }

      if (mode === 'staging') {
        showAlert({
          title: 'API request failed',
          message: getDevApiErrorMessage(error),
          details: formatStagingDetails(error),
          variant: 'error',
        });
        return;
      }

      showAlert({
        title: 'Dev API Error',
        message: getDevApiErrorMessage(error),
        details: getDevApiErrorDetails(error),
        variant: 'error',
      });
    };

    return subscribeDevApiErrors(showError);
  }, [showAlert]);

  return null;
}
