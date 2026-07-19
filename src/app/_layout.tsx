import { useEffect } from 'react';
import { ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNavigationTheme } from '@/hooks/useNavigationTheme';
import { useAuthStore } from '@/store';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const navigationTheme = useNavigationTheme();
  const router = useRouter();
  const segments = useSegments();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isLoggedIn) {
      if (!inAuthGroup) {
        router.replace('/(auth)');
      }
    } else {
      if (inAuthGroup) {
        router.replace('/(app)');
      }
    }
  }, [isLoggedIn, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: navigationTheme.colors.background },
      }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="vehicle/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const navigationTheme = useNavigationTheme();

  const [loaded, error] = useFonts({
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={navigationTheme.isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
