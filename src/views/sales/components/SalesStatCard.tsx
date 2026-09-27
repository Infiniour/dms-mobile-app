import { StyleSheet, Text, View } from 'react-native';
import { FontFamily, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { SkeletonBox } from '@/components/ui';

type SalesStatCardProps = {
  value: number;
  label: string;
  loading?: boolean;
};

export function SalesStatCard({ value, label, loading = false }: SalesStatCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark
            ? colors['surface-container-low']
            : colors['surface-container-lowest'],
          borderColor: isDark ? colors['outline-variant'] : colors['outline-variant'],
        },
      ]}>
      {loading ? (
        <SkeletonBox width={36} height={26} borderRadius={6} />
      ) : (
        <Text style={[styles.value, { color: colors['on-surface'] }]}>{value}</Text>
      )}
      <Text style={[styles.label, { color: colors['on-surface-variant'] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  value: {
    fontFamily: FontFamily.semibold,
    fontSize: 24,
    lineHeight: 28,
    includeFontPadding: false,
  },
  label: {
    ...Typography.caption,
    fontSize: 12,
  },
});
