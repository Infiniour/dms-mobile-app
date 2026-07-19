import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Typography, FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type TextFieldProps = TextInputProps & {
  label: string;
  labelIcon?: ReactNode;
};

export function TextField({ label, labelIcon, style, ...inputProps }: TextFieldProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        {labelIcon ? <View style={styles.labelIconWrap}>{labelIcon}</View> : null}
        <Text
          style={[
            styles.label,
            { color: colors.primary },
          ]}>
          {label}
        </Text>
      </View>
      <TextInput
        {...inputProps}
        placeholderTextColor={colors.outline}
        style={[
          styles.input,
          {
            color: colors['on-surface'],
            backgroundColor: colors.background,
            borderColor: isDark ? colors['outline-variant'] : colors.outline,
            fontFamily: Typography.body.fontFamily,
            fontSize: Typography.body.fontSize,
          },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 14,
  },
  labelIconWrap: {
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: FontFamily.semibold,
    fontSize: Typography.micro.fontSize,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  input: {
    borderWidth: 1,
    borderRadius: 20,
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
