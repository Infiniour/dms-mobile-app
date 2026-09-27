import { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLogout } from '@/hooks/useLogout';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Grid } from '@/constants/theme';
import { Button, FloatingField } from '@/components/ui';
import { useAuthStore } from '@/store';
import { getProfile, updateProfile } from '@/services';
import { resolveSetupDestination } from '@/utils/setupRouting';

type ProfileResponse = {
  data?: Parameters<typeof resolveSetupDestination>[0] & {
    name?: string | null;
    country_code?: string | null;
    phone_number?: string | null;
  };
};

export function ProfileSetupScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoggingOut, logout } = useLogout();
  const setStoredFullName = useAuthStore((s) => s.setFullName);
  const setCanEnterApp = useAuthStore((s) => s.setCanEnterApp);
  const setProfileContact = useAuthStore((s) => s.setProfileContact);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const lastNameRef = useRef<TextInput>(null);
  const canContinue = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleLogout = () => {
    Keyboard.dismiss();
    Alert.alert('Log out?', 'You can finish setting up your profile later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleContinue = async () => {
    const nextName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

    if (!nextName || !canContinue || isSaving) {
      return;
    }

    Keyboard.dismiss();
    setErrorMessage('');
    setIsSaving(true);

    try {
      await updateProfile({ name: nextName });
      setStoredFullName(nextName);

      const response = await getProfile();
      const profile = (response as unknown as ProfileResponse).data;

      if (!profile) {
        throw new Error('Profile data missing from server response.');
      }

      setProfileContact({
        countryCode: profile.country_code ?? undefined,
        phoneNumber: profile.phone_number ?? undefined,
      });

      const destination = resolveSetupDestination(profile);
      setCanEnterApp(destination.canEnterApp);
      router.replace(destination.href);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top']}>
      <KeyboardAwareScrollView
        style={styles.flex}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[Typography.hero, styles.title, { color: colors['on-background'] }]}>
              Welcome!
            </Text>
            <Pressable
              onPress={handleLogout}
              disabled={isLoggingOut}
              hitSlop={8}
              style={({ pressed }) => [
                styles.logoutButton,
                {
                  borderColor: colors.outline,
                  opacity: pressed || isLoggingOut ? 0.6 : 1,
                },
              ]}>
              <Ionicons name="log-out-outline" size={16} color={colors['on-surface-variant']} />
            </Pressable>
          </View>
          <Text
            style={[
              Typography.body,
              styles.subtitle,
              { color: colors['on-surface-variant'] },
            ]}>
            Set up your profile to get started
          </Text>
        </View>

        <View style={styles.fields}>
          <FloatingField
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoComplete="given-name"
            textContentType="givenName"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />
          <FloatingField
            ref={lastNameRef}
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoComplete="family-name"
            textContentType="familyName"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        {errorMessage ? (
          <Text style={[Typography.caption, styles.errorText, { color: colors.error }]}>
            {errorMessage}
          </Text>
        ) : null}
      </KeyboardAwareScrollView>

      <KeyboardStickyView
        offset={{ closed: 0, opened: insets.bottom }}
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!canContinue || isSaving}
          loading={isSaving}
        />
      </KeyboardStickyView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Grid.columns.margin,
    paddingTop: 50,
    paddingBottom: 16,
    gap: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  logoutButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    gap: 15,
    paddingTop: 20,
  },
  title: {
    lineHeight: 36,
  },
  subtitle: {
    paddingBottom: 20,
    lineHeight: 20,
  },
  fields: {
    gap: 20,
  },
  footer: {
    paddingHorizontal: Grid.columns.margin,
    paddingTop: 10,
  },
  errorText: {
    marginTop: -12,
    lineHeight: 17,
  },
});
