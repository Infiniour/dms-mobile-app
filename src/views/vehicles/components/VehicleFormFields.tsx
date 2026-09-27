import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet, FloatingField } from '@/components/ui';
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

type FormTextInputProps = Omit<
  React.ComponentProps<typeof FloatingField>,
  'label' | 'icon' | 'rightIcon'
> & {
  label: string;
};

export function FormTextInput({ label, style, ...inputProps }: FormTextInputProps) {
  return <FloatingField label={label} {...inputProps} style={style} />;
}

export function IconTextInput({
  icon,
  label,
  style,
  ...inputProps
}: FormTextInputProps & { icon: IconName }) {
  return <FloatingField label={label} icon={icon} {...inputProps} style={style} />;
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Adds a search box atop the sheet, for lists too long to scan by eye (e.g. states). */
  searchable?: boolean;
  /** Blocks opening the sheet — used for sold / immutable fields. */
  disabled?: boolean;
};

/**
 * Same Paper outlined size as FloatingField. Opens a sheet of fixed options
 * instead of the keyboard — used wherever a form needs a dropdown.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  searchable,
  disabled = false,
}: SelectFieldProps) {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const visibleOptions =
    searchable && query.trim()
      ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
      : options;
  const isLongList = options.length > 6;

  const closeSheet = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      <Pressable
        onPress={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}>
        <View pointerEvents="none">
          <FloatingField
            label={label}
            value={selected?.label ?? ''}
            // Outer Pressable owns the tap; pointerEvents blocks the input.
            editable={!disabled}
            disabled={disabled}
            rightIcon={disabled ? undefined : 'chevron-down'}
          />
        </View>
      </Pressable>

      <BottomSheet visible={isOpen} onClose={closeSheet}>
        <Text style={[Typography.title, styles.sheetTitle, { color: colors['on-background'] }]}>
          {label}
        </Text>

        {searchable ? (
          <FloatingField
            label={`Search ${label.toLowerCase()}`}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            rightIcon={query ? 'close-circle' : 'search'}
            onRightIconPress={query ? () => setQuery('') : undefined}
            style={styles.searchField}
          />
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
  fieldLabel: {
    fontSize: 15,
    lineHeight: 19,
    fontFamily: FontFamily.medium,
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  searchField: {
    marginBottom: 16,
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  sheetOptions: {
    gap: 12,
  },
  sheetOption: {
    minHeight: 56,
    borderRadius: 16,
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
});
