import { useState } from 'react';
import { View, Text, StyleSheet, Keyboard } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Grid } from '@/constants/theme';
import { BackButton, Button, TextField } from '@/components/ui';
import { sendOtp } from '@/services';
import { useAuthStore } from '@/store';
import { OtpSheet } from './OtpSheet';

type SendOtpResponse = {
  data?: {
    requestId?: string;
    otpCode?: string;
  };
  requestId?: string;
  otpCode?: string;
};

export function LoginScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const setIsLoggedIn = useAuthStore((s) => s.setIsLoggedIn);
  const setCanEnterApp = useAuthStore((s) => s.setCanEnterApp);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [requestId, setRequestId] = useState('');
  const [initialOtp, setInitialOtp] = useState('');
  const [showOtpSheet, setShowOtpSheet] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isValidPhoneNumber = phoneNumber.length === 10;

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value.replace(/\D/g, '').slice(0, 10));
  };

  const handleGetOtp = async () => {
    if (!isValidPhoneNumber || isSendingOtp) {
      return;
    }

    setErrorMessage('');
    setIsSendingOtp(true);

    try {
      const response = await sendOtp({ countryCode: '91', phoneNumber });
      const responseData = response as unknown as SendOtpResponse;
      const nextRequestId = responseData.data?.requestId ?? responseData.requestId;
      const nextOtpCode = responseData.data?.otpCode ?? responseData.otpCode ?? '';

      if (!nextRequestId) {
        throw new Error('OTP request id missing from server response.');
      }

      setRequestId(nextRequestId);
      setInitialOtp(nextOtpCode.replace(/\D/g, '').slice(0, 6));
      setShowOtpSheet(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = (data: { required_name?: boolean }) => {
    // No explicit Keyboard.dismiss() here — the native sheet's own dismiss
    // (triggered by setShowOtpSheet below) already takes the keyboard down
    // with it. Dismissing it separately added a second, competing motion on
    // top of the sheet closing and the screen fade.
    setIsLoggedIn(true);
    setCanEnterApp(false);
    setShowOtpSheet(false);
    // Skip the /(setup)/loading dispatcher when verify-otp already told us the
    // name is required — avoids a visible bounce through it on first login.
    router.replace(data.required_name ? '/(setup)/profile' : '/(setup)/loading');
  };

  const handleCloseOtpSheet = () => {
    Keyboard.dismiss();
    setShowOtpSheet(false);
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={8}>
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
            onChangeText={handlePhoneNumberChange}
            placeholder="XXXXX XXXXX"
            keyboardType="number-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={10}
          />

          {errorMessage ? (
            <Text style={[Typography.caption, styles.errorText, { color: colors.error }]}>
              {errorMessage}
            </Text>
          ) : null}

          <View style={styles.footer}>
            <Button
              label="Get OTP"
              onPress={handleGetOtp}
              disabled={!isValidPhoneNumber || isSendingOtp}
              loading={isSendingOtp}
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
        requestId={requestId}
        initialOtp={initialOtp}
        onClose={handleCloseOtpSheet}
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
  errorText: {
    marginTop: -12,
    lineHeight: 17,
  },
  terms: {
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: Typography.micro.fontFamily,
  },
});
