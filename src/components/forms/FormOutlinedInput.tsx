import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FloatingField } from '@/components/ui';
import type { KeyboardTypeOptions } from 'react-native';

type FormOutlinedInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  editable?: boolean;
  multiline?: boolean;
};

/**
 * Same Paper outlined field as FormInput. Kept as a separate export so
 * existing sell/review screens do not need a rename.
 */
export function FormOutlinedInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  multiline,
}: FormOutlinedInputProps) {
  return (
    <FloatingField
      label={label}
      icon={icon}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      editable={editable}
      multiline={multiline}
      style={styles.field}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 4,
  },
});
