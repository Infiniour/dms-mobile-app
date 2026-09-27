import { Stack } from 'expo-router';
import { useNavigationTheme } from '@/hooks/useNavigationTheme';

// Gating (which group is even reachable) happens once in the root layout via
// Stack.Protected — this layout only has to lay out its own screens.
export default function AuthLayout() {
  const navigationTheme = useNavigationTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: navigationTheme.colors.background },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
