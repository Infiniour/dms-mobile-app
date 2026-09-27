import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useNavigationTheme } from '@/hooks/useNavigationTheme';
import { getProfile } from '@/services';
import { useAuthStore } from '@/store';
import { resolveSetupDestination } from '@/utils/setupRouting';

// Gating (which group is even reachable) happens once in the root layout via
// Stack.Protected — this layout only has to lay out its own screens.
export default function AppLayout() {
  const navigationTheme = useNavigationTheme();
  const canEnterApp = useAuthStore((s) => s.canEnterApp);
  const setCanEnterApp = useAuthStore((s) => s.setCanEnterApp);

  // canEnterApp/role are persisted so a returning, fully-set-up user renders the
  // app immediately instead of bouncing through /(setup)/loading on every cold
  // start. Revalidate quietly in the background instead: if the cached state
  // turns out stale (role revoked, showroom removed…), flip canEnterApp off —
  // the root layout's guard swaps straight to /(setup)/loading on its own.
  useEffect(() => {
    if (!canEnterApp) {
      return;
    }

    let cancelled = false;

    getProfile()
      .then((response) => {
        if (cancelled) {
          return;
        }

        const profile = (response as unknown as { data?: Parameters<typeof resolveSetupDestination>[0] })
          ?.data;

        if (!profile) {
          return;
        }

        const destination = resolveSetupDestination(profile);

        if (destination.href !== '/(app)') {
          setCanEnterApp(false);
        }
      })
      .catch(() => {
        // Silent background revalidation — a real problem will surface on the
        // user's next explicit action instead of yanking them out mid-session.
      });

    return () => {
      cancelled = true;
    };
  }, [canEnterApp, setCanEnterApp]);

  // The tab bar lives one level down so that detail routes push over it with a
  // real stack transition instead of swapping in as hidden tabs.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: navigationTheme.colors.background },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="vehicle/[id]" />
      <Stack.Screen name="vehicle/add" />
    </Stack>
  );
}
