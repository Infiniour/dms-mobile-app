import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/theme';
import { BottomSheet, Button, OtpInput } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

const RESEND_SECONDS = 28;

type OtpSheetProps = {
  visible: boolean;
  phoneNumber: string;
  onClose: () => void;
  onVerify: (otp: string) => void;
};

function maskPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');

  if (digits.length <= 4) {
    return '+91 XXXXX XXXXX';
  }

  return `+91 XXXXX X${digits.slice(-4)}`;
}

export function OtpSheet({ visible, phoneNumber, onClose, onVerify }: OtpSheetProps) {
  const { colors, isDark } = useTheme();
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setOtp('');
    setSecondsLeft(RESEND_SECONDS);
  }, [visible]);

  useEffect(() => {
    if (!visible || secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, secondsLeft]);

  const handleVerify = () => {
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
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
        <OtpInput value={otp} onChange={setOtp} autoFocus={visible} />
      </View>

      <Text style={[Typography.body, styles.resend, { color: colors['on-surface-variant'] }]}>
        Didn't receive it?{' '}
        <Text style={{ color: isDark ? colors['secondary-container'] : colors['primary-container'] }}>
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend'}
        </Text>
      </Text>

      <Button label="Verify" onPress={handleVerify} disabled={otp.length !== 6} />
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
});
