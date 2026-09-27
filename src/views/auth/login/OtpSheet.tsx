import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/theme';
import { BottomSheet, Button, OtpInput } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { setTokens, verifyOtp } from '@/services';

const RESEND_SECONDS = 28;

type VerifyOtpData = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  required_name?: boolean;
};

type OtpSheetProps = {
  visible: boolean;
  phoneNumber: string;
  requestId: string;
  initialOtp?: string;
  onClose: () => void;
  onVerify: (data: VerifyOtpData) => void;
};

function maskPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');

  if (digits.length <= 4) {
    return '+91 XXXXX XXXXX';
  }

  return `+91 XXXXX X${digits.slice(-4)}`;
}

export function OtpSheet({
  visible,
  phoneNumber,
  requestId,
  initialOtp = '',
  onClose,
  onVerify,
}: OtpSheetProps) {
  const { colors, isDark } = useTheme();
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Drives OtpInput's autoFocus. Set from the sheet's real onDidPresent
  // event rather than visible, since visible flips true as soon as
  // present() is called — before the native sheet's presentation animation
  // has actually finished and its content can accept keyboard focus.
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsSheetOpen(false);
      return;
    }

    setOtp(initialOtp.replace(/\D/g, '').slice(0, 6));
    setErrorMessage('');
    setSecondsLeft(RESEND_SECONDS);
  }, [initialOtp, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  const handleVerify = async () => {
    if (otp.length !== 6 || !requestId || isVerifying) {
      return;
    }

    setErrorMessage('');
    setIsVerifying(true);

    try {
      const response = await verifyOtp({ requestId, otpCode: otp });
      const data = response?.data ?? response;

      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error('Verification succeeded but no session was returned. Please try again.');
      }

      await setTokens(data);
      onVerify(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to verify OTP.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} onOpen={() => setIsSheetOpen(true)}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: isDark ? colors['on-primary-container'] : colors['surface-container'],
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          hitSlop={8}>
          <Ionicons
            name="close"
            size={16}
            color={isDark ? colors['secondary-container'] : colors.primary}
          />
        </Pressable>
      </View>

      <Text style={[Typography.title, styles.title, { color: colors['on-background'] }]}>
        Verify OTP
      </Text>
      <Text
        style={[
          Typography.body,
          styles.subtitle,
          { color: colors['on-surface-variant'] },
        ]}>
        Enter the 6-digit code sent to {maskPhoneNumber(phoneNumber)}
      </Text>

      <View style={styles.otpInput}>
        <OtpInput value={otp} onChange={setOtp} autoFocus={isSheetOpen} />
      </View>

      <Text style={[Typography.body, styles.resend, { color: colors['on-surface-variant'] }]}>
        Didn't receive it?{' '}
        <Text style={{ color: isDark ? colors['secondary-container'] : colors['primary-container'] }}>
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend'}
        </Text>
      </Text>

      {errorMessage ? (
        <Text style={[Typography.caption, styles.errorText, { color: colors.error }]}>
          {errorMessage}
        </Text>
      ) : null}

      <Button
        label="Verify"
        onPress={handleVerify}
        disabled={otp.length !== 6 || !requestId || isVerifying}
        loading={isVerifying}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  otpInput: {
    marginBottom: 24,
  },
  resend: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 17,
  },
});
