import { useColorScheme } from 'react-native';
import { Colors, type ColorScheme } from '@/constants/theme';
import { useThemeStore } from '@/store';

export function useTheme() {
  const systemScheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themePreference = useThemeStore((s) => s.themePreference);
  const scheme: ColorScheme = themePreference === 'system' ? systemScheme : themePreference;

  return {
    scheme,
    colors: Colors[scheme],
    isDark: scheme === 'dark',
  };
}
