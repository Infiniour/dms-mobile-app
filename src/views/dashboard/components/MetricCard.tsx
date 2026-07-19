import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { SkeletonBox } from '@/components/ui';
import type { MetricStat, MetricVariant } from '../types';

type MetricCardProps = MetricStat & {
  width?: number | `${number}%`;
  loading?: boolean;
};

export function MetricCard({
  title,
  value,
  detail,
  icon,
  variant = 'surface',
  compact,
  trend,
  progress,
  width,
  loading,
}: MetricCardProps) {
  const { colors, isDark } = useTheme();
  const cardColors = getCardColors(variant, colors, isDark);
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <View
      style={[
        styles.metricCard,
        compact ? styles.compactCard : styles.wideCard,
        { backgroundColor: cardColors.backgroundColor },
        width ? { width } : undefined,
      ]}>
      {loading ? (
        <CardSkeleton compact={compact} />
      ) : (
        <>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: cardColors.titleColor }]}>{title}</Text>
            <View style={[styles.iconBadge, { backgroundColor: cardColors.iconBackground }]}>
              <MaterialCommunityIcons name={icon} size={14} color={cardColors.iconColor} />
            </View>
          </View>

          <Text
            style={[
              styles.cardValue,
              compact ? styles.compactValue : styles.wideValue,
              { color: cardColors.valueColor },
            ]}>
            {value}
          </Text>

          {typeof progress === 'number' ? (
            <View style={[styles.progressTrack, { backgroundColor: colors['error-container'] }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: colors.error },
                ]}
              />
            </View>
          ) : null}

          {trend ? (
            <View
              style={[
                styles.trendPill,
                { backgroundColor: isPrimary ? 'transparent' : colors['surface-container-high'] },
              ]}>
              <Ionicons
                name="trending-up"
                size={compact ? 9 : 11}
                color={isPrimary ? cardColors.detailColor : colors.tertiary}
              />
              <Text
                style={[styles.trendText, { color: isPrimary ? cardColors.detailColor : colors.tertiary }]}>
                {trend}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.cardDetail,
                compact ? styles.compactDetail : undefined,
                { color: isDanger ? colors.error : cardColors.detailColor },
              ]}>
              {detail}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

function CardSkeleton({ compact }: Pick<MetricCardProps, 'compact'>) {
  return (
    <>
      <View style={styles.cardHeader}>
        <SkeletonBox width={compact ? '62%' : '34%'} height={16} />
        <SkeletonBox width={25} height={25} borderRadius={5} />
      </View>
      <SkeletonBox
        width={compact ? '58%' : '64%'}
        height={42}
        borderRadius={10}
        style={styles.valueSkeleton}
      />
      <SkeletonBox
        width={compact ? '54%' : '45%'}
        height={12}
        borderRadius={8}
        style={styles.detailSkeleton}
      />
    </>
  );
}

function getCardColors(
  variant: MetricVariant,
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean
) {
  const variants = {
    primary: {
      backgroundColor: isDark ? colors['secondary-container'] : colors.primary,
      titleColor: isDark ? colors['on-surface'] : colors['on-primary'],
      valueColor: isDark ? colors['on-surface'] : colors['on-primary'],
      detailColor: isDark ? colors['on-surface'] : colors['on-primary'],
      iconBackground: isDark ? colors['primary-container'] : colors['secondary-container'],
      iconColor: isDark ? colors['on-primary-container'] : colors['on-secondary-container'],
    },
    surface: {
      backgroundColor: isDark ? colors['surface-container-low'] : colors['surface-container-lowest'],
      titleColor: colors['on-surface-variant'],
      valueColor: colors['on-surface'],
      detailColor: colors['on-surface-variant'],
      iconBackground: isDark ? colors['surface-container'] : colors['surface-container-high'],
      iconColor: colors.primary,
    },
    blue: {
      backgroundColor: isDark ? colors['surface-container'] : colors['surface-container-high'],
      titleColor: colors['on-surface-variant'],
      valueColor: colors['on-surface'],
      detailColor: colors.primary,
      iconBackground: colors['surface-container-low'],
      iconColor: colors.primary,
    },
    green: {
      backgroundColor: isDark ? colors['tertiary-container'] : colors.tertiary,
      titleColor: isDark ? colors['on-tertiary-container'] : colors['on-tertiary'],
      valueColor: isDark ? colors['on-surface'] : colors['on-tertiary'],
      detailColor: isDark ? colors['on-tertiary-container'] : colors['on-tertiary'],
      iconBackground: colors['on-tertiary-container'],
      iconColor: colors.tertiary,
    },
    danger: {
      backgroundColor: colors['error-container'],
      titleColor: colors['on-error-container'],
      valueColor: colors['on-error-container'],
      detailColor: colors['on-error-container'],
      iconBackground: colors['error-container'],
      iconColor: colors['on-error-container'],
    },
  };

  return variants[variant];
}

const styles = StyleSheet.create({
  metricCard: {
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  wideCard: {
    width: '100%',
    minHeight: 144,
    marginBottom: 20,
  },
  compactCard: {
    minHeight: 144,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...Typography.screenTitle,
    lineHeight: 18,
  },
  iconBadge: {
    width: 25,
    height: 25,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontFamily: Typography.display.fontFamily,
    letterSpacing: -0.5,
  },
  wideValue: {
    fontSize: 40,
    lineHeight: 52,
    marginTop: 3,
  },
  compactValue: {
    fontSize: 40,
    lineHeight: 52,
    marginTop: 2,
  },
  valueSkeleton: {
    marginTop: 14,
  },
  detailSkeleton: {
    marginTop: 16,
  },
  cardDetail: {
    ...Typography.body,
    fontFamily: Typography.screenTitle.fontFamily,
    lineHeight: 16,
    marginTop: 10,
  },
  compactDetail: {
    marginTop: 6,
  },
  trendPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    marginTop: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  trendText: {
    ...Typography.body,
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 11,
    lineHeight: 14,
  },
  progressTrack: {
    height: 5,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
});
