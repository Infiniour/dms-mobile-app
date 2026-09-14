import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui';
import { FontFamily, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { SelectOption } from '../data';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function FieldLabel({ label }: { label: string }) {
  const { colors } = useTheme();

  return (
    <Text style={[styles.fieldLabel, { color: colors['on-background'] }]}>{label}</Text>
  );
}

export function FormTextInput({
  style,
  ...inputProps
}: React.ComponentProps<typeof TextInput>) {
  const { colors } = useTheme();

  return (
    <TextInput
      {...inputProps}
      placeholderTextColor={colors['on-surface-variant']}
      style={[
        Typography.body,
        styles.formInput,
        {
          color: colors['on-surface'],
          borderColor: colors.outline,
          backgroundColor: colors.background,
        },
        style,
      ]}
    />
  );
}

export function IconTextInput({
  icon,
  style,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & { icon: IconName }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.inputWrap, { borderColor: colors.primary }]}>
      <Ionicons name={icon} size={23} color={colors.primary} />
      <TextInput
        {...inputProps}
        placeholderTextColor={colors['on-surface-variant']}
        style={[
          Typography.body,
          styles.input,
          {
            color: colors['on-surface'],
          },
          style,
        ]}
      />
    </View>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Adds a search box atop the sheet, for lists too long to scan by eye (e.g. states). */
  searchable?: boolean;
};

/**
 * Same footprint as FormTextInput (height, radius, border) so it drops into
 * the same field grid, but opens a BottomSheet of fixed options instead of
 * the keyboard — for fields the API only accepts an exact enum value for.
 *
 * `label` floats the same way FloatingField's text-input label does: it sits
 * where a placeholder would when nothing is selected, then shrinks onto the
 * border once a value is chosen (or the sheet is open) — no separate
 * FieldLabel needed above this, same as the text fields beside it.
 */
export function SelectField({ label, value, options, onChange, searchable }: SelectFieldProps) {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const visibleOptions =
    searchable && query.trim()
      ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
      : options;
  // Longer lists (e.g. year of manufacture, ~50 entries) need a capped,
  // scrollable sheet instead of an unbounded View that runs off-screen.
  const isLongList = options.length > 6;
  const isActive = isOpen || Boolean(selected);
  const animation = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isActive ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [animation, isActive]);

  const closeSheet = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        style={[
          styles.selectField,
          {
            borderColor: isOpen ? colors.primary : colors.outline,
            backgroundColor: colors.background,
          },
        ]}>
        <View style={styles.selectFieldTextArea}>
          <Animated.Text
            pointerEvents="none"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.selectFloatLabel,
              {
                top: animation.interpolate({ inputRange: [0, 1], outputRange: [28, 8] }),
                fontSize: animation.interpolate({ inputRange: [0, 1], outputRange: [15, 11] }),
                color: isOpen ? colors.primary : colors['on-surface-variant'],
              },
            ]}>
            {label}
          </Animated.Text>
          <Text
            style={[Typography.body, styles.selectFieldText, { color: colors['on-surface'] }]}
            numberOfLines={1}>
            {selected?.label ?? ''}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors['on-surface-variant']} />
      </Pressable>

      <BottomSheet visible={isOpen} onClose={closeSheet}>
        <Text style={[Typography.title, styles.sheetTitle, { color: colors['on-background'] }]}>
          {label}
        </Text>

        {searchable ? (
          <View
            style={[
              styles.searchBox,
              { borderColor: colors.outline, backgroundColor: colors.background },
            ]}>
            <Ionicons name="search" size={18} color={colors['on-surface-variant']} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${label.toLowerCase()}`}
              placeholderTextColor={colors['on-surface-variant']}
              autoCapitalize="none"
              autoCorrect={false}
              style={[Typography.body, styles.searchInput, { color: colors['on-surface'] }]}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors['on-surface-variant']} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {visibleOptions.length === 0 ? (
          <Text style={[Typography.body, styles.noResults, { color: colors['on-surface-variant'] }]}>
            No matches found.
          </Text>
        ) : isLongList ? (
          <ScrollView
            style={{ maxHeight: screenHeight * 0.5 }}
            contentContainerStyle={styles.sheetOptions}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator>
            {visibleOptions.map((option) => (
              <SelectOptionRow
                key={option.value}
                option={option}
                isSelected={option.value === value}
                onPress={() => {
                  closeSheet();
                  onChange(option.value);
                }}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.sheetOptions}>
            {visibleOptions.map((option) => (
              <SelectOptionRow
                key={option.value}
                option={option}
                isSelected={option.value === value}
                onPress={() => {
                  closeSheet();
                  onChange(option.value);
                }}
              />
            ))}
          </View>
        )}
      </BottomSheet>
    </>
  );
}

function SelectOptionRow({
  option,
  isSelected,
  onPress,
}: {
  option: SelectOption;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sheetOption,
        {
          backgroundColor: isSelected ? colors['surface-container'] : colors['surface-container-low'],
          borderColor: isSelected ? colors.primary : colors['outline-variant'],
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {option.icon ? (
        <View style={[styles.sheetOptionIcon, { backgroundColor: colors['surface-container'] }]}>
          <MaterialCommunityIcons name={option.icon} size={22} color={colors.primary} />
        </View>
      ) : null}
      <Text style={[Typography.body, styles.sheetOptionLabel, { color: colors['on-surface'] }]}>
        {option.label}
      </Text>
      {isSelected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
    </Pressable>
  );
}

export const formFieldStyles = StyleSheet.create({
  formFields: {
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 16,
  },
  fieldColumn: {
    flex: 1,
    gap: 8,
  },
});

const styles = StyleSheet.create({
  selectField: {
    minHeight: 77,
    borderRadius: 20,
    borderWidth: 1.4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectFieldTextArea: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  selectFloatLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: FontFamily.medium,
    includeFontPadding: false,
  },
  selectFieldText: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 18,
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.4,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  sheetOptions: {
    gap: 12,
  },
  sheetOption: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sheetOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionLabel: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: FontFamily.medium,
  },
  formInput: {
    minHeight: 77,
    borderRadius: 20,
    borderWidth: 1.4,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Typography.body.fontFamily,
  },
  inputWrap: {
    minHeight: 77,
    borderRadius: 20,
    borderWidth: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 20,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 0,
    fontFamily: Typography.body.fontFamily,
  },
});
