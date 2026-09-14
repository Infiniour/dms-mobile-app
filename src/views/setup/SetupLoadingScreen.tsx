import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getProfile } from '@/services';
import { useAuthStore } from '@/store';
import { resolveSetupDestination } from '@/utils/setupRouting';
import type { ShowroomRole } from '@/utils/showroom';

type ProfileData = {
  name?: string | null;
  country_code?: string | null;
  phone_number?: string | null;
  required_name?: boolean;
  has_showrooms?: boolean;
  has_vehicles?: boolean;
  showroom_roles?: ShowroomRole[] | null;
};

type ProfileResponse = {
  data?: ProfileData;
};

export function SetupLoadingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const setIsLoggedIn = useAuthStore((s) => s.setIsLoggedIn);
  const setCanEnterApp = useAuthStore((s) => s.setCanEnterApp);
  const setFullName = useAuthStore((s) => s.setFullName);
  const setProfileContact = useAuthStore((s) => s.setProfileContact);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    setProfileLoaded(false);

    try {
      const response = await getProfile();
      const profile = (response as unknown as ProfileResponse).data;

      if (!profile) {
        throw new Error('Profile data missing from server response.');
      }

      if (profile.name) {
        setFullName(profile.name);
      }

      setProfileContact({
        countryCode: profile.country_code ?? undefined,
        phoneNumber: profile.phone_number ?? undefined,
      });

      setProfileLoaded(true);

      const destination = resolveSetupDestination(profile);
      setCanEnterApp(destination.canEnterApp);
      router.replace(destination.href);
    } catch (error) {
      setCanEnterApp(false);

      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 401) {
        setIsLoggedIn(false);
        router.replace('/(auth)');
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'Unable to load profile.');
    } finally {
      setIsLoading(false);
    }
  }, [router, setCanEnterApp, setFullName, setIsLoggedIn, setProfileContact]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={[styles.loaderCircle, { backgroundColor: colors['surface-container'] }]}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Text style={[Typography.hero2, { color: errorMessage ? colors.error : colors.primary }]}>
              {errorMessage ? '!' : 'OK'}
            </Text>
          )}
        </View>

        <View style={styles.copy}>
          <Text style={[Typography.hero, styles.title, { color: colors['on-background'] }]}>
            {isLoading ? 'Checking your profile' : profileLoaded ? 'Profile loaded' : 'Profile check failed'}
          </Text>
          <Text style={[Typography.body, styles.subtitle, { color: colors['on-surface-variant'] }]}>
            {errorMessage || 'We are finding the next setup step for your account.'}
          </Text>
        </View>

        {errorMessage ? (
          <Button label="Try Again" onPress={loadProfile} loading={isLoading} />
        ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Grid.columns.margin,
    gap: 28,
  },
  loaderCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 12,
  },
  title: {
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
