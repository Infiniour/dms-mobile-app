import { StyleSheet } from 'react-native';
import { FloatingField } from '@/components/ui';

type TextFieldProps = Omit<
  React.ComponentProps<typeof FloatingField>,
  'mode' | 'theme' | 'left'
>;

/**
 * Thin alias over FloatingField for older call sites that imported TextField.
 */
export function TextField({ style, ...inputProps }: TextFieldProps) {
  return <FloatingField {...inputProps} style={[styles.field, style]} />;
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 0,
  },
});
