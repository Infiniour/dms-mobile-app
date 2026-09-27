import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SkeletonBox } from '@/components/ui';

export function VehicleCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors['surface-container-lowest'],
          borderColor: colors.primary,
        },
      ]}>
      <SkeletonBox width="100%" height={4} borderRadius={0} />
      <View style={[styles.imageWrapper, { backgroundColor: colors['surface-container-high'] }]}>
        <SkeletonBox width={60} height={60} borderRadius={12} />
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.titleWrapper}>
            <SkeletonBox width="70%" height={16} borderRadius={4} />
            <SkeletonBox width="50%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
          <SkeletonBox width={60} height={24} borderRadius={12} />
        </View>

        <SkeletonBox width="80%" height={12} borderRadius={4} />

        <View style={styles.priceRow}>
          <View>
            <SkeletonBox width={40} height={10} borderRadius={3} />
            <SkeletonBox width={60} height={18} borderRadius={4} style={{ marginTop: 3 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function VehicleCardCompactSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.compactCard,
        {
          backgroundColor: colors['surface-container-lowest'],
          borderColor: colors.primary,
        },
      ]}>
      <SkeletonBox width={70} height={60} borderRadius={12} />

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <View style={styles.nameCol}>
            <SkeletonBox width="65%" height={14} borderRadius={4} />
            <SkeletonBox width="50%" height={10} borderRadius={4} style={{ marginTop: 2 }} />
          </View>
          <SkeletonBox width={50} height={20} borderRadius={10} />
        </View>

        <SkeletonBox width="75%" height={10} borderRadius={4} />

        <View style={styles.footer}>
          <SkeletonBox width={50} height={13} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  imageWrapper: {
    width: '100%',
    height: 136,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleWrapper: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
