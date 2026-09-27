import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FloatingField } from '@/components/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type FormInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: IconName;
  iconColor?: string;
  backgroundColor?: string;
  borderBottomColor?: string;
  labelColor?: string;
  inputColor?: string;
  placeholderColor?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address' | 'number-pad' | 'phone-pad';
  editable?: boolean;
  required?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

/**
 * Shared form field — Paper outlined input so every screen gets the same
 * floating label and full-box tap target.
 */
export function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = 'default',
  editable = true,
  required = false,
  autoCapitalize,
}: FormInputProps) {
  return (
    <FloatingField
      label={required ? `${label} *` : label}
      icon={icon}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      editable={editable}
      autoCapitalize={autoCapitalize}
      style={styles.field}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 4,
  },
});
