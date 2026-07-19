import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { SkeletonBox } from '@/components/ui';
import type { CategoryStat } from '../types';

type TopCategoriesProps = {
  categories: CategoryStat[];
  loading?: boolean;
};

export function TopCategories({ categories, loading }: TopCategoriesProps) {
  const { colors, isDark } = useTheme();
  const skeletonRows = Array.from({ length: categories.length || 3 }, (_, index) => index);
  const categoryIconBackground = isDark
    ? colors['surface-container']
    : colors['surface-container-high'];

  return (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="star-outline" size={18} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors['on-surface-variant'] }]}>
          Top Performing Categories
        </Text>
      </View>

      <View style={styles.categoryList}>
        {loading
          ? skeletonRows.map((row) => <CategoryRowSkeleton key={row} />)
          : categories.map((category) => (
          <View key={category.name} style={styles.categoryRow}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: categoryIconBackground },
              ]}>
              <MaterialCommunityIcons name={category.icon} size={20} color={colors.primary} />
            </View>

            <View style={styles.categoryText}>
              <Text style={[styles.categoryName, { color: colors['on-surface'] }]}>
                {category.name}
              </Text>
              <Text
                style={[
                  styles.categoryDescription,
                  { color: colors['on-surface-variant'] },
                ]}>
                {category.description}
              </Text>
            </View>

            <View style={styles.categoryAmount}>
              <Text style={[styles.categorySold, { color: colors['on-surface'] }]}>
                {category.sold}
              </Text>
              <Text style={[styles.categoryRevenue, { color: colors.tertiary }]}>
                {category.amount}
              </Text>
            </View>
          </View>
            ))}
      </View>
    </>
  );
}

function CategoryRowSkeleton() {
  return (
    <View style={styles.categoryRow}>
      <SkeletonBox width={40} height={40} borderRadius={10} />

      <View style={styles.categoryText}>
        <SkeletonBox width="38%" height={16} />
        <SkeletonBox width="62%" height={12} style={styles.categorySkeletonDetail} />
      </View>

      <View style={styles.categoryAmount}>
        <SkeletonBox width={48} height={16} />
        <SkeletonBox width={64} height={12} style={styles.categorySkeletonDetail} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 19,
  },
  sectionTitle: {
    ...Typography.screenTitle,
    fontSize: 16,
    lineHeight: 20,
  },
  categoryList: {
    gap: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    flex: 1,
    marginLeft: 15,
  },
  categoryName: {
    ...Typography.screenTitle,
    fontSize: 16,
    lineHeight: 19,
  },
  categoryDescription: {
    ...Typography.body,
    lineHeight: 17,
    marginTop: 6,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categorySold: {
    ...Typography.screenTitle,
    fontSize: 16,
    lineHeight: 19,
  },
  categoryRevenue: {
    ...Typography.body,
    lineHeight: 17,
    marginTop: 6,
  },
  categorySkeletonDetail: {
    marginTop: 8,
  },
});
