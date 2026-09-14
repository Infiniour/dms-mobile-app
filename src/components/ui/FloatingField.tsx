import { forwardRef, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type FloatingFieldProps = Omit<React.ComponentProps<typeof TextInput>, 'value'> & {
  label: string;
  icon?: IconName;
  value: string;
};

/**
 * A label above the field AND an example value inside it ("Manufacturer" /
 * "Toyota") said the same thing twice. This floats the label as the
 * placeholder when the field is empty, then shrinks it onto the border once
 * focused or filled — so it's never showing two things at once, and the
 * label never disappears once you've typed a real value.
 */
export const FloatingField = forwardRef<TextInput, FloatingFieldProps>(function FloatingField(
  { label, icon, value, onChangeText, style, onFocus, onBlur, ...inputProps },
  ref
) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.length > 0;
  const animation = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isActive ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [animation, isActive]);

  return (
    <View
      style={[
        styles.floatWrap,
        {
          borderColor: isFocused ? colors.primary : colors.outline,
          backgroundColor: colors.background,
        },
      ]}>
      {icon ? <Ionicons name={icon} size={20} color={colors.primary} /> : null}
      <View style={styles.floatInputArea}>
        <Animated.Text
          pointerEvents="none"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            styles.floatLabel,
            {
              top: animation.interpolate({ inputRange: [0, 1], outputRange: [28, 8] }),
              fontSize: animation.interpolate({ inputRange: [0, 1], outputRange: [15, 11] }),
              color: isFocused ? colors.primary : colors['on-surface-variant'],
            },
          ]}>
          {label}
        </Animated.Text>
        <TextInput
          {...inputProps}
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[Typography.body, styles.floatInput, { color: colors['on-surface'] }, style]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  floatWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 77,
    borderRadius: 20,
    borderWidth: 1.4,
    paddingHorizontal: 16,
    gap: 12,
  },
  floatInputArea: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  floatLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: FontFamily.medium,
    includeFontPadding: false,
  },
  floatInput: {
    paddingVertical: 0,
    marginTop: 18,
    includeFontPadding: false,
  },
});
