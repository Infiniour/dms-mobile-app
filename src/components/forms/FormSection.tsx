import { StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '@/constants/theme';

type FormSectionProps = {
  title: string;
  children: React.ReactNode;
  titleColor: string;
};

export function FormSection({ title, children, titleColor }: FormSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingBottom: 12,
  },
});
