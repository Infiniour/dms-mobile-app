import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Grid } from '@/constants/theme';
import { BackButton, Button, TextField } from '@/components/ui';
import { OtpSheet } from './OtpSheet';

export function LoginScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOtpSheet, setShowOtpSheet] = useState(false);

  const handleGetOtp = () => {
    setShowOtpSheet(true);
  };

  const handleVerifyOtp = (_otp: string) => {
    setShowOtpSheet(false);
    router.replace('/(auth)/profile');
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <BackButton />

          <View style={styles.header}>
            <Text style={[Typography.hero, styles.title, { color: colors['on-background'] }]}>
              Enter your phone{'\n'}number
            </Text>
            <Text
              style={[
                Typography.body,
                styles.subtitle,
                { color: colors['on-surface-variant'] },
              ]}>
              We'll send a one-time password to verify your number
            </Text>
          </View>

          <TextField
            label="Phone number"
            labelIcon={
              <Ionicons name="call-outline" size={14} color={colors.primary} />
            }
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+91 XXXXX XXXXX"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />

          <View style={styles.footer}>
            <Button
              label="Get OTP"
              onPress={handleGetOtp}
              disabled={phoneNumber.trim().length === 0}
            />
            <Text style={[Typography.micro, styles.terms, { color: colors['on-surface-variant'] }]}>
              By continuing you agree to our{' '}
              <Text style={{ color: isDark ? colors['secondary-container'] : colors['primary-container'] }}>
                Terms of service
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <OtpSheet
        visible={showOtpSheet}
        phoneNumber={phoneNumber}
        onClose={() => setShowOtpSheet(false)}
        onVerify={handleVerifyOtp}
      />
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
  content: {
    flex: 1,
    paddingHorizontal: Grid.columns.margin,
    paddingTop: 50,
    paddingBottom: 24,
    gap: 24,
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
  footer: {
    marginTop: 'auto',
    gap: 16,
  },
  terms: {
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: Typography.micro.fontFamily,
  },
});
