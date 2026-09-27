import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type PaperInputProps = React.ComponentProps<typeof PaperTextInput>;

export type FloatingFieldHandle = {
  focus: () => void;
  blur: () => void;
};

type FloatingFieldProps = Omit<PaperInputProps, 'value' | 'theme' | 'mode' | 'left' | 'right' | 'ref'> & {
  label: string;
  icon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  value: string;
};

/**
 * Outlined field from React Native Paper. The library owns the floating
 * label and the touch target, so a tap anywhere on the box focuses it.
 */
export const FloatingField = forwardRef<FloatingFieldHandle, FloatingFieldProps>(
  function FloatingField(
    { label, icon, rightIcon, onRightIconPress, value, style, contentStyle, ...inputProps },
    ref
  ) {
    const { colors } = useTheme();
    const inputRef = useRef<FloatingFieldHandle>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
    }));

    return (
      <PaperTextInput
        {...inputProps}
        ref={inputRef as never}
        mode="outlined"
        label={label}
        value={value}
        textColor={colors['on-surface']}
        outlineColor={colors.outline}
        activeOutlineColor={colors.primary}
        cursorColor={colors.primary}
        selectionColor={colors.primary}
        style={[styles.field, { backgroundColor: colors.background }, style]}
        contentStyle={[styles.content, contentStyle]}
        outlineStyle={styles.outline}
        left={
          icon ? (
            <PaperTextInput.Icon
              icon={() => <Ionicons name={icon} size={20} color={colors.primary} />}
              forceTextInputFocus
            />
          ) : undefined
        }
        right={
          rightIcon ? (
            <PaperTextInput.Icon
              icon={() => (
                <Ionicons name={rightIcon} size={18} color={colors['on-surface-variant']} />
              )}
              forceTextInputFocus={!onRightIconPress}
              onPress={onRightIconPress}
            />
          ) : undefined
        }
      />
    );
  }
);

/** Shared metrics so dropdowns can match FloatingField height/radius. */
export const floatingFieldStyles = StyleSheet.create({
  field: {
    marginTop: 6,
  },
  content: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },
  outline: {
    borderRadius: 16,
    borderWidth: 1.4,
  },
});

const styles = floatingFieldStyles;
