import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'dms.deviceId';

let cachedDeviceId = null;

export function getApiPlatform() {
  if (Platform.OS === 'ios') {
    return 'ios_mobile';
  }

  if (Platform.OS === 'android') {
    return 'android_mobile';
  }

  return 'web';
}

function generateDeviceId() {
  const random = Math.random().toString(36).slice(2);
  return `${getApiPlatform()}-${Date.now()}-${random}`;
}

function isCurrentDeviceIdFormat(deviceId) {
  const platform = getApiPlatform();

  return deviceId.startsWith(`${platform}-`);
}

export async function getDeviceId() {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (stored && isCurrentDeviceIdFormat(stored)) {
    cachedDeviceId = stored;
    return stored;
  }

  const deviceId = generateDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  cachedDeviceId = deviceId;

  return deviceId;
}
