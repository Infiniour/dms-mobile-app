import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
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
 * Outlined field from React Native Paper.
 *
 * On Android, disabled / read-only fields skip Paper entirely — its outlined
 * label notch still cuts through text there. Editable Android fields keep Paper
 * but draw our own floated label chip.
 */
export const FloatingField = forwardRef<FloatingFieldHandle, FloatingFieldProps>(
  function FloatingField(
    {
      label,
      icon,
      rightIcon,
      onRightIconPress,
      value,
      style,
      contentStyle,
      multiline,
      editable = true,
      disabled = false,
      onFocus,
      onBlur,
      ...inputProps
    },
    ref
  ) {
    const { colors } = useTheme();
    const inputRef = useRef<FloatingFieldHandle>(null);
    const [focused, setFocused] = useState(false);
    const readOnly = disabled || editable === false;
    const hasValue = value.trim().length > 0;
    const floated = hasValue || focused;
    const useAndroidLabel = Platform.OS === 'android';
    // Android disabled: no Paper — custom outline avoids the broken notch.
    const useAndroidDisabledShell = useAndroidLabel && readOnly;

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (!readOnly) {
          inputRef.current?.focus();
        }
      },
      blur: () => inputRef.current?.blur(),
    }));

    if (useAndroidDisabledShell) {
      return (
        <View style={[styles.wrap, style]} accessibilityState={{ disabled: true }}>
          <View
            style={[
              styles.androidDisabledShell,
              multiline ? styles.androidDisabledMultiline : null,
              {
                backgroundColor: colors.background,
                borderColor: colors.outline,
              },
            ]}>
            {icon ? (
              <Ionicons
                name={icon}
                size={20}
                color={colors['on-surface-variant']}
                style={styles.androidDisabledIcon}
              />
            ) : null}
            <Text
              style={[
                styles.androidDisabledValue,
                multiline ? styles.androidDisabledValueMultiline : null,
                { color: colors['on-surface-variant'] },
                contentStyle as object,
              ]}
              numberOfLines={multiline ? undefined : 1}>
              {hasValue ? value : ' '}
            </Text>
            {rightIcon ? (
              <Ionicons
                name={rightIcon}
                size={18}
                color={colors['on-surface-variant']}
                style={styles.androidDisabledRightIcon}
              />
            ) : null}
          </View>
          <View pointerEvents="none" style={styles.androidLabelSlot}>
            <Text
              style={[
                styles.androidLabel,
                {
                  backgroundColor: colors.background,
                  color: colors['on-surface-variant'],
                },
              ]}
              numberOfLines={1}>
              {label}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View pointerEvents={readOnly ? 'none' : 'auto'} style={[styles.wrap, style]}>
        <PaperTextInput
          {...inputProps}
          ref={inputRef as never}
          mode="outlined"
          // Android: Paper's own floated label notches unreliably — we draw it.
          label={useAndroidLabel ? undefined : label}
          placeholder={useAndroidLabel && !floated ? label : inputProps.placeholder}
          value={value}
          multiline={multiline}
          disabled={false}
          editable={!readOnly}
          showSoftInputOnFocus={!readOnly}
          caretHidden={readOnly}
          textColor={readOnly ? colors['on-surface-variant'] : colors['on-surface']}
          outlineColor={colors.outline}
          activeOutlineColor={readOnly ? colors.outline : colors.primary}
          cursorColor={colors.primary}
          selectionColor={colors.primary}
          placeholderTextColor={colors['on-surface-variant']}
          style={[styles.field, { backgroundColor: colors.background }, readOnly ? styles.readOnly : null]}
          contentStyle={[
            styles.content,
            multiline ? styles.multilineContent : null,
            contentStyle,
          ]}
          outlineStyle={styles.outline}
          theme={{
            colors: {
              background: colors.background,
              onSurface: colors['on-surface'],
              onSurfaceVariant: colors['on-surface-variant'],
              primary: colors.primary,
              outline: colors.outline,
              error: colors.error,
            },
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          left={
            icon ? (
              <PaperTextInput.Icon
                icon={() => (
                  <Ionicons
                    name={icon}
                    size={20}
                    color={readOnly ? colors['on-surface-variant'] : colors.primary}
                  />
                )}
                forceTextInputFocus={!readOnly}
              />
            ) : undefined
          }
          right={
            rightIcon ? (
              <PaperTextInput.Icon
                icon={() => (
                  <Ionicons name={rightIcon} size={18} color={colors['on-surface-variant']} />
                )}
                forceTextInputFocus={!onRightIconPress && !readOnly}
                onPress={readOnly ? undefined : onRightIconPress}
              />
            ) : undefined
          }
        />

        {useAndroidLabel && floated ? (
          <View pointerEvents="none" style={styles.androidLabelSlot}>
            <Text
              style={[
                styles.androidLabel,
                {
                  backgroundColor: colors.background,
                  color: focused && !readOnly ? colors.primary : colors['on-surface-variant'],
                },
              ]}
              numberOfLines={1}>
              {label}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }
);

/** Shared metrics so dropdowns can match FloatingField height/radius. */
export const floatingFieldStyles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  field: {
    marginTop: 6,
  },
  readOnly: {
    opacity: Platform.OS === 'android' ? 1 : 0.92,
  },
  content: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },
  multilineContent: {
    minHeight: 64,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'top',
  },
  outline: {
    borderRadius: 16,
    borderWidth: 1.4,
  },
  androidLabelSlot: {
    position: 'absolute',
    top: 0,
    left: 12,
    zIndex: 2,
    elevation: 2,
  },
  androidLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 4,
    includeFontPadding: false,
  },
  androidDisabledShell: {
    marginTop: 6,
    minHeight: 56,
    borderWidth: 1.4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  androidDisabledMultiline: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 12,
  },
  androidDisabledIcon: {
    marginRight: 12,
  },
  androidDisabledRightIcon: {
    marginLeft: 8,
  },
  androidDisabledValue: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 22,
    includeFontPadding: false,
    paddingVertical: 14,
  },
  androidDisabledValueMultiline: {
    paddingVertical: 0,
  },
});

const styles = floatingFieldStyles;
