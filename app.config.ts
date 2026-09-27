import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Dealer Management',
  slug: 'dealer_management',
  version: '1.0.0',
  scheme: 'dealermanagement',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',

  experiments: {
    reactCompiler: true,
  },

  ios: {
    bundleIdentifier: 'org.name.dealermanagement',
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        'Dealer Management needs camera access so you can take showroom, vehicle, and document photos.',
    },
  },

  android: {
    package: 'com.dealermanagement',
    permissions: ['android.permission.CAMERA'],
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#f8f9ff',
    },
  },

  plugins: [
    'expo-router',
    '@maplibre/maplibre-react-native',
    'expo-secure-store',
    'expo-image',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Dealer Management needs photo library access so you can select showroom logo and banner images.',
        cameraPermission:
          'Dealer Management needs camera access so you can take showroom logo and banner photos.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Dealer Management uses your location to center the map when you pick your showroom.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#f8f9ff',
        image: './assets/splash-icon.png',
        imageWidth: 200,
        ios: {
          backgroundColor: '#f8f9ff',
          image: './assets/splash-icon.png',
          imageWidth: 200,
        },
        android: {
          backgroundColor: '#f8f9ff',
          image: './assets/splash-icon.png',
          imageWidth: 200,
        },
        dark: {
          image: './assets/splash-icon.png',
          backgroundColor: '#031427',
        },
      },
    ],
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Poppins-Regular.ttf',
          './assets/fonts/Poppins-Medium.ttf',
          './assets/fonts/Poppins-SemiBold.ttf',
          './assets/fonts/Poppins-Bold.ttf',
        ],
      },
    ],
  ],

  extra: {
    appEnv: process.env.APP_ENV ?? 'development',
    apiErrorAlertMode: process.env.EXPO_PUBLIC_API_ERROR_ALERT_MODE,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
    apiPlatform: process.env.EXPO_PUBLIC_API_PLATFORM ?? 'web',
  },
});
