import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = 'primary',
  fullWidth = true,
  disabled,
  loading = false,
  style,
  ...pressableProps
}: ButtonProps) {
  const { colors, isDark } = useTheme();

  const variantStyles = {
    primary: {
      backgroundColor: isDark ? colors['secondary-container'] : colors.primary,
      textColor: isDark ? colors['on-surface'] : colors['on-primary'],
      borderColor: isDark ? colors['secondary-container'] : colors.primary,
    },
    secondary: {
      backgroundColor: colors['secondary-container'],
      textColor: colors['on-secondary-container'],
      borderColor: colors['secondary-container'],
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: isDark ? colors['on-surface'] : colors.primary,
      borderColor: isDark ? colors['outline-variant'] : colors.outline,
    },
  }[variant];

  return (
    <Pressable
      {...pressableProps}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
        },
        variant === 'outline' && styles.outline,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
          style={styles.loader}
        />
      ) : null}
      <Text
        style={[
          Typography.button,
          styles.label,
          { color: variantStyles.textColor },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  outline: {
    borderWidth: 1,
  },
  label: {
    fontFamily: Typography.button.fontFamily,
    fontWeight: '600',
  },
  loader: {
    transform: [{ scale: 0.85 }],
  },
});
