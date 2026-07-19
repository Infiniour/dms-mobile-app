import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Grid } from '@/constants/theme';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store';

const LOGO_SIZE = 112;
const FEATURE_ICON_SIZE = 24;

const features = [
  { icon: require('../../../../assets/icons/inventory.png'), label: 'Inventory' },
  { icon: require('../../../../assets/icons/invoices.png'), label: 'Invoices' },
  { icon: require('../../../../assets/icons/profit_tracking.png'), label: 'Profit tracking' },
] as const;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const setHasSeenOnboarding = useAuthStore((s) => s.setHasSeenOnboarding);

  const handleGetStarted = () => {
    setHasSeenOnboarding(true);
    router.push('/login');
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Image
            source={require('../../../../assets/icon.png')}
            style={styles.logo}
          />

          <View style={styles.headline}>
            <Text style={[Typography.hero, styles.title, { color: colors['on-background'] }]}>
              Dealer Management
            </Text>
            <Text
              style={[
                Typography.body,
                styles.subtitle,
                { color: colors['on-surface-variant'] },
              ]}>
              Manage your second-hand vehicle in one place
            </Text>
          </View>

          <View style={styles.featureRow}>
            {features.map((feature) => (
              <View
                key={feature.label}
                style={[
                  styles.featureCard,
                  { backgroundColor: colors['surface-container'] },
                ]}>
                <Image source={feature.icon} style={styles.featureIcon} />
                <Text
                  style={[
                    Typography.caption,
                    styles.featureLabel,
                    { color: colors['primary'] },
                  ]}>
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Button label="Get Started" onPress={handleGetStarted}  />
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
    paddingHorizontal: Grid.columns.margin,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  headline: {
    alignItems: 'center',
    gap: 8,
    maxWidth: 280,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  featureRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  featureIcon: {
    width: FEATURE_ICON_SIZE,
    height: FEATURE_ICON_SIZE,
  },
  featureLabel: {
    textAlign: 'center',
    fontFamily: Typography.caption.fontFamily,
    fontWeight: '500',
  },
});
