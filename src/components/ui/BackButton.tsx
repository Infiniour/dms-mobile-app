import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type BackButtonProps = {
  onPress?: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const contentColor = isDark ? colors['on-surface'] : colors.primary;

  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      style={({ pressed }) => [styles.back, { opacity: pressed ? 0.7 : 1 }]}
      hitSlop={8}>
      <Ionicons name="arrow-back" size={18} color={contentColor} />
      <Text style={[Typography.screenTitle, styles.label, { color: contentColor }]}>
        Back
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Typography.screenTitle.fontFamily,
  },
});
