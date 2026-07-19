import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { Typography, Grid } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store';

export default function AccountTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const fullName = useAuthStore((s) => s.fullName);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View>
          <Text style={[styles.title, { color: colors['on-background'] }]}>Account</Text>
          <Text style={[styles.subtitle, { color: colors['on-surface-variant'] }]}>
            {fullName || 'Dealer profile and settings'}
          </Text>
        </View>

        <Button label="Logout" variant="outline" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Grid.columns.margin,
    paddingTop: 48,
    paddingBottom: 118,
  },
  title: {
    ...Typography.hero,
    lineHeight: 36,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
  },
});
