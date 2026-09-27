import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getDashboard, listMembers } from '@/services';
import { resolvePrimaryShowroomId } from '@/utils/showroom';
import { SkeletonBox } from '@/components/ui';
import { useTabDataFetch } from '@/hooks/useTabDataFetch';

type DashboardData = {
  sales_summary?: { net_profit?: number };
  expense_summary?: { total_expenses?: number };
};

export function AdminPanelScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);

  const { isLoading } = useTabDataFetch({
    onFocus: async ({ isCancelled }) => {
      const showroomId = await resolvePrimaryShowroomId();

      // Fetch dashboard data for this month
      const dashResponse = await getDashboard({
        duration: '1m',
        showroomId,
      });
      if (isCancelled()) {
        return;
      }

      const dashData = (dashResponse as unknown as { data?: DashboardData })?.data;
      setDashboardData(dashData ?? null);

      // Fetch employee count
      if (showroomId) {
        const membersResponse = await listMembers({ showroomId });
        if (isCancelled()) {
          return;
        }

        const total = (membersResponse as unknown as { data?: { total?: number } })?.data?.total;
        setEmployeeCount(typeof total === 'number' ? total : null);
      }
    },
  });

  const profit = dashboardData?.sales_summary?.net_profit ?? 0;
  const expenses = dashboardData?.expense_summary?.total_expenses ?? 0;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: Grid.columns.margin }]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.title, { color: colors['on-surface'] }]}>
          Admin Panel
        </Text>
        <Text style={[styles.subtitle, { color: colors['on-surface-variant'] }]}>
          Manage transactions, inventory & expenses
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <AdminStatCard
            title="This Month"
            value={formatCurrency(profit)}
            label="profit"
            icon="trending-up"
            variant="primary"
            loading={isLoading}
          />
          <AdminStatCard
            title="Expenses"
            value={formatCurrency(expenses)}
            label=""
            icon="cash-multiple"
            variant="danger"
            loading={isLoading}
          />
        </View>

        {/* Action Card */}
        <Pressable onPress={() => router.push('/employees')}>
          <AdminActionCard
            icon="people-outline"
            title="Manage Employees"
            subtitle="Sales staff access & Permissions"
            count={employeeCount ?? 0}
            loading={isLoading}
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function AdminStatCard({
  title,
  value,
  label,
  icon,
  variant = 'surface',
  loading = false,
}: {
  title: string;
  value: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  variant?: 'primary' | 'surface' | 'danger';
  loading?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const cardStyles = getStatCardStyles(variant, colors, isDark);

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: cardStyles.backgroundColor, borderColor: cardStyles.borderColor },
      ]}>
      {loading ? (
        <>
          <View style={styles.statHeader}>
            <SkeletonBox width="50%" height={14} borderRadius={4} />
            <SkeletonBox width={20} height={20} borderRadius={4} />
          </View>
          <SkeletonBox width="60%" height={28} borderRadius={6} style={styles.valueSkeleton} />
          <SkeletonBox width="40%" height={12} borderRadius={4} />
        </>
      ) : (
        <>
          <View style={styles.statHeader}>
            <Text style={[Typography.screenTitle, { color: cardStyles.textColor, fontSize: 13 }]}>
              {title}
            </Text>
            <View style={[styles.statIcon, { backgroundColor: cardStyles.iconBackground }]}>
              <MaterialCommunityIcons name={icon} size={14} color={cardStyles.iconColor} />
            </View>
          </View>
          <Text style={[Typography.display, styles.statValue, { color: cardStyles.valueColor }]}>
            {value}
          </Text>
          <Text style={[Typography.screenTitle, { color: cardStyles.textColor, fontSize: 12 }]}>
            {label}
          </Text>
        </>
      )}
    </View>
  );
}

function AdminActionCard({
  icon,
  title,
  subtitle,
  count,
  badge,
  loading = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  count?: number;
  badge?: string;
  loading?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.actionCard,
        {
          backgroundColor: colors['surface-container-lowest'],
          borderColor: colors.outline,
        },
      ]}>
      {loading ? (
        <>
          <SkeletonBox width={44} height={44} borderRadius={12} />
          <View style={styles.actionTextContent}>
            <SkeletonBox width="60%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonBox width="80%" height={12} borderRadius={4} />
          </View>
          <SkeletonBox width={32} height={32} borderRadius={10} />
        </>
      ) : (
        <>
          <View style={[styles.actionIcon, { backgroundColor: colors['surface-container-high'] }]}>
            <Ionicons name={icon} size={24} color={colors.primary} />
          </View>

          <View style={styles.actionTextContent}>
            <Text style={[Typography.screenTitle, { color: colors['on-surface'], fontSize: 15 }]}>
              {title}
            </Text>
            <Text style={[Typography.body, { color: colors['on-surface-variant'], fontSize: 13 }]}>
              {subtitle}
            </Text>
          </View>

          {count !== undefined ? (
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors['surface-container-high'] },
              ]}>
              <Text style={[Typography.screenTitle, { color: colors.primary, fontSize: 13 }]}>
                {count}
              </Text>
            </View>
          ) : badge ? (
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors['error-container'] },
              ]}>
              <Text style={[Typography.screenTitle, { color: colors.error, fontSize: 13 }]}>
                {badge}
              </Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors['on-surface-variant']} />
          )}
        </>
      )}
    </View>
  );
}

function getStatCardStyles(
  variant: 'primary' | 'surface' | 'danger',
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean
) {
  const styles = {
    primary: {
      backgroundColor: isDark ? colors['secondary-container'] : colors.primary,
      textColor: isDark ? colors['on-surface'] : colors['on-primary'],
      valueColor: isDark ? colors['on-surface'] : colors['on-primary'],
      borderColor: isDark ? colors['secondary-container'] : colors.primary,
      iconBackground: isDark ? colors['primary-container'] : colors['secondary-container'],
      iconColor: isDark ? colors['on-primary-container'] : colors['on-secondary-container'],
    },
    surface: {
      backgroundColor: colors['surface-container-lowest'],
      textColor: colors['on-surface-variant'],
      valueColor: colors['on-surface'],
      borderColor: colors.outline,
      iconBackground: colors['surface-container-high'],
      iconColor: colors.primary,
    },
    danger: {
      backgroundColor: colors['error-container'],
      textColor: colors['on-error-container'],
      valueColor: colors['on-error-container'],
      borderColor: colors.error,
      iconBackground: colors['error-container'],
      iconColor: colors['on-error-container'],
    },
  };

  return styles[variant];
}

function formatCurrency(value?: number) {
  if (typeof value !== 'number') {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 24,
    paddingBottom: 118,
    gap: 20,
  },
  title: {
    ...Typography.title,
    fontSize: 21,
    lineHeight: 26,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 18,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statIcon: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  valueSkeleton: {
    marginTop: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextContent: {
    flex: 1,
    gap: 2,
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
