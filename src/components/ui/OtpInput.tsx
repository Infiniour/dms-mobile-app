import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FontFamily, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const OTP_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

export function OtpInput({ value, onChange, autoFocus }: OtpInputProps) {
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleChange = (text: string) => {
    onChange(text.replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {Array.from({ length: OTP_LENGTH }).map((_, index) => {
        const digit = value[index];
        const isActive = index === value.length;

        return (
          <View
            key={index}
            style={[
              styles.cell,
              {
                borderColor: isDark
                  ? colors['on-surface']
                  : isActive
                    ? colors.primary
                    : colors.outline,
                backgroundColor: colors.background,
              },
            ]}>
            <Text
              style={[
                digit ? styles.digit : styles.dot,
                { color: colors['on-surface'] },
              ]}>
              {digit ?? '•'}
            </Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  cell: {
    flex: 1,
    height: 52,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    includeFontPadding: false,
  },
  dot: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    includeFontPadding: false,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
