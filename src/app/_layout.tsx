import { useEffect, useMemo, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemeProvider, Stack } from 'expo-router';
import {
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  configureFonts,
} from 'react-native-paper';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { enableFreeze } from 'react-native-screens';
import { DevApiErrorReporter } from '@/components/dev/DevApiErrorReporter';
import { AppAlertProvider } from '@/components/ui';
import { useNavigationTheme } from '@/hooks/useNavigationTheme';
import { useSession } from '@/hooks/useSession';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store';

// Stop off-screen tabs and stack screens from re-rendering while hidden.
enableFreeze(true);

SplashScreen.preventAutoHideAsync();

const paperFonts = configureFonts({ config: { fontFamily: 'Poppins-Regular' } });

function ThemedPaperProvider({ children }: { children: ReactNode }) {
  const { colors, isDark } = useTheme();
  const theme = useMemo(() => {
    const base = isDark ? MD3DarkTheme : MD3LightTheme;

    return {
      ...base,
      fonts: paperFonts,
      colors: {
        ...base.colors,
        primary: colors.primary,
        onPrimary: colors['on-primary'],
        primaryContainer: colors['primary-container'],
        background: colors.background,
        surface: colors.background,
        onSurface: colors['on-surface'],
        onSurfaceVariant: colors['on-surface-variant'],
        outline: colors.outline,
        error: colors.error,
      },
    };
  }, [colors, isDark]);

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}

/**
 * The single place that decides which route group is reachable.
 *
 * Every group used to gate itself independently (its own `useSession` +
 * `<Redirect>`), which meant a login or setup step could bounce through two or
 * three layouts before landing — each one re-evaluating and redirecting again.
 * `Stack.Protected` evaluates all three branches here, once, so switching
 * `hasTokens`/`canEnterApp` swaps the active branch directly with no
 * intermediate redirect hop and no flash.
 */
function RootNavigator() {
  const navigationTheme = useNavigationTheme();
  const { isLoading, hasTokens } = useSession();
  const canEnterApp = useAuthStore((s) => s.canEnterApp);

  if (isLoading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: navigationTheme.colors.background }]}>
        <ActivityIndicator size="large" color={navigationTheme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: navigationTheme.colors.background },
      }}>
      {/*
        These three swap on auth/setup state, not a user tapping into a new
        screen — e.g. verifying OTP closes a native bottom sheet at the same
        time the group switches, and a slide-in here fights that dismiss
        animation and reads as a double navigation. Fading instead lets
        whatever's already animating (like the sheet close) be the only
        visible motion.
      */}
      <Stack.Protected guard={!hasTokens}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      </Stack.Protected>

      <Stack.Protected guard={hasTokens && !canEnterApp}>
        <Stack.Screen name="(setup)" options={{ animation: 'fade' }} />
      </Stack.Protected>

      <Stack.Protected guard={hasTokens && canEnterApp}>
        <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
      </Stack.Protected>
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
    // Recommended by react-native-gesture-handler for any app using
    // gesture-driven navigation, regardless of which library consumes it.
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemedPaperProvider>
            <ThemeProvider value={navigationTheme}>
              <AppAlertProvider>
                <StatusBar style={navigationTheme.isDark ? 'light' : 'dark'} />
                <RootNavigator />
                <DevApiErrorReporter />
              </AppAlertProvider>
            </ThemeProvider>
          </ThemedPaperProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
