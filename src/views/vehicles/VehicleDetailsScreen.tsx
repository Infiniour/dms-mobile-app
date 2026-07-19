import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui';
import { Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { vehicleInventory } from './data';
import type { VehicleDocument, VehicleExpense, VehicleItem, VehicleStatus } from './types';

type VehicleDetailsScreenProps = {
  vehicleId: string;
};

export function VehicleDetailsScreen({ vehicleId }: VehicleDetailsScreenProps) {
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;
  const vehicle = vehicleInventory.find((item) => item.id === vehicleId);

  if (!vehicle) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}>
        <View style={[styles.missingContent, { paddingHorizontal: horizontalPadding }]}>
          <BackButton />
          <Text style={[styles.title, { color: colors['on-surface'] }]}>Vehicle not found</Text>
          <Text style={[styles.bodyText, { color: colors['on-surface-variant'] }]}>
            This vehicle may have been removed from inventory.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = getStatusColors(vehicle.status, colors, isDark);
  const heroBackground = isDark ? colors['surface-container-high'] : colors['surface-container-high'];
  const cardBackground = colors['surface-container'];
  const dividerColor = colors['outline-variant'];
  const specs = getVehicleSpecs(vehicle);
  const actionItems = [
    { label: 'Edit', icon: 'square-edit-outline' as const },
    { label: 'Change status', icon: 'swap-horizontal' as const },
    { label: 'Sell', icon: 'tag-outline' as const },
    { label: 'Add Expense', icon: 'plus' as const },
  ];

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <BackButton />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: heroBackground }]}>
          <MaterialCommunityIcons name={vehicle.icon} size={96} color={colors['on-surface-variant']} />
          <View style={[styles.favoriteButton, { borderColor: colors.outline }]}>
            <MaterialCommunityIcons name="heart-outline" size={16} color={colors.primary} />
          </View>
        </View>

        <View style={styles.imageTabs}>
          {[
            { label: 'Front', icon: 'car-side' as const, active: true },
            { label: 'Side', icon: 'car-estate' as const },
            { label: 'Back', icon: 'car-back' as const },
            { label: 'Interior', icon: 'steering' as const },
          ].map((item) => (
            <View
              key={item.label}
              style={[
                styles.imageTab,
                { backgroundColor: item.active ? colors['surface-container-high'] : cardBackground },
              ]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={18}
                color={item.active ? colors['on-surface'] : colors['on-surface-variant']}
              />
              <Text
                style={[
                  styles.imageTabLabel,
                  { color: item.active ? colors['on-surface'] : colors['on-surface-variant'] },
                ]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors['on-surface'] }]}>{vehicle.name}</Text>
            <Text style={[styles.bodyText, { color: colors['on-surface-variant'] }]}>
              {vehicle.registration}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColors.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusColors.textColor }]}>
              {vehicle.status}
            </Text>
          </View>
        </View>

        <View style={styles.priceGrid}>
          <PriceCard label="Buying price" value={vehicle.buyingPrice} />
          <PriceCard label="Asking price" value={vehicle.askingPrice} />
        </View>

        <View style={styles.actionsGrid}>
          {actionItems.map((item) => (
            <View
              key={item.label}
              style={[styles.actionTile, { backgroundColor: colors['surface-container'] }]}>
              <MaterialCommunityIcons name={item.icon} size={18} color={colors['on-surface']} />
              <Text style={[styles.actionLabel, { color: colors['on-surface-variant'] }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.specPanel, { backgroundColor: cardBackground }]}>
          {specs.map((spec, index) => (
            <View
              key={spec.label}
              style={[
                styles.specCell,
                {
                  borderBottomColor: dividerColor,
                  borderRightColor: dividerColor,
                  borderBottomWidth: index < 2 ? StyleSheet.hairlineWidth : 0,
                  borderRightWidth: index % 2 === 0 ? StyleSheet.hairlineWidth : 0,
                },
              ]}>
              <Text style={[styles.specLabel, { color: colors['on-surface-variant'] }]}>
                {spec.label}
              </Text>
              <Text style={[styles.specValue, { color: colors['on-surface'] }]}>
                {spec.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.locationCard, { backgroundColor: cardBackground }]}>
          <View>
            <Text style={[styles.specLabel, { color: colors['on-surface-variant'] }]}>
              Current location
            </Text>
            <View style={styles.locationValue}>
              <MaterialCommunityIcons name="map-marker" size={15} color={colors['on-surface']} />
              <Text style={[styles.locationText, { color: colors['on-surface'] }]}>
                {vehicle.lotLocation}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color={colors['on-surface']} />
        </View>

        <Text style={[styles.sectionKicker, { color: colors['on-surface-variant'] }]}>MORE INFO</Text>
        <View style={[styles.infoCard, { backgroundColor: cardBackground }]}>
          <DetailRow label="Engine number" value={vehicle.engineNumber} showDivider />
          <DetailRow label="Chassis number" value={vehicle.chassisNumber} showDivider />
          <DetailRow label="Transmission" value={vehicle.transmission} showDivider />
          <DetailRow label="Color" value={vehicle.color} showDivider />
          <DetailRow label="Insurance valid till" value={vehicle.insuranceValidTill} />
        </View>

        <ExpenseSection expenses={vehicle.expenses} />

        <Text style={[styles.sectionKicker, { color: colors['on-surface-variant'] }]}>DOCUMENTS</Text>
        <View style={styles.documentList}>
          {vehicle.documents.map((document) => (
            <DocumentRow key={document.label} document={document} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PriceCard({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.priceCard, { backgroundColor: colors['surface-container'] }]}>
      <Text style={[styles.priceLabel, { color: colors['on-surface-variant'] }]}>{label}</Text>
      <Text style={[styles.priceValue, { color: colors['on-surface'] }]}>{value}</Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  showDivider,
}: {
  label: string;
  value: string;
  showDivider?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.detailRow,
        showDivider && {
          borderBottomColor: colors['outline-variant'],
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}>
      <Text style={[styles.detailLabel, { color: colors['on-surface-variant'] }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors['on-surface'] }]}>{value}</Text>
    </View>
  );
}

function ExpenseSection({ expenses }: { expenses: VehicleExpense[] }) {
  const { colors } = useTheme();
  const total = expenses.reduce((sum, expense) => sum + parseRupeeAmount(expense.amount), 0);

  return (
    <View style={[styles.expenseCard, { backgroundColor: colors['surface-container'] }]}>
      <View style={styles.expenseHeader}>
        <Text style={[styles.sectionTitle, { color: colors['on-surface'] }]}>Vehicle Expenses</Text>
        <View style={[styles.addSmallButton, { backgroundColor: colors['on-surface'] }]}>
          <MaterialCommunityIcons name="plus" size={12} color={colors.background} />
          <Text style={[styles.addSmallText, { color: colors.background }]}>Add</Text>
        </View>
      </View>
      {expenses.map((expense) => (
        <DetailRow key={expense.label} label={expense.label} value={expense.amount} showDivider />
      ))}
      <DetailRow label="Total expenses" value={formatRupeeAmount(total)} />
    </View>
  );
}

function DocumentRow({ document }: { document: VehicleDocument }) {
  const { colors } = useTheme();
  const complete = document.status === 'complete';

  return (
    <View style={[styles.documentRow, { backgroundColor: colors['surface-container'] }]}>
      <View style={styles.documentTitle}>
        <MaterialCommunityIcons
          name="file-document-outline"
          size={16}
          color={colors['on-surface-variant']}
        />
        <Text style={[styles.documentLabel, { color: colors['on-surface'] }]}>
          {document.label}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={complete ? 'check' : 'alert-outline'}
        size={19}
        color={complete ? colors.tertiary : colors.error}
      />
    </View>
  );
}

function getVehicleSpecs(vehicle: VehicleItem) {
  const [year = '-', kilometers = '-', fuel = '-'] = vehicle.meta.split(' · ');

  return [
    { label: 'Year', value: year },
    { label: 'Odometer', value: kilometers.replace('K', ',000') },
    { label: 'Fuel', value: fuel },
    { label: 'Owner', value: vehicle.owner },
  ];
}

function parseRupeeAmount(amount: string) {
  return Number(amount.replace(/[₹,]/g, ''));
}

function formatRupeeAmount(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getStatusColors(
  status: VehicleStatus,
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean
) {
  const variants = {
    Available: {
      backgroundColor: isDark ? colors['tertiary-container'] : colors['tertiary-fixed'],
      textColor: isDark ? colors['on-tertiary-container'] : colors['on-tertiary-fixed'],
    },
    Sold: {
      backgroundColor: colors['error-container'],
      textColor: colors['on-error-container'],
    },
    'In Repair': {
      backgroundColor: colors['surface-container-high'],
      textColor: colors['on-surface-variant'],
    },
  };

  return variants[status];
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 31,
    paddingTop: 17,
  },
  heroCard: {
    height: 177,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  favoriteButton: {
    position: 'absolute',
    right: 13,
    top: 13,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTabs: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
  },
  imageTab: {
    flex: 1,
    height: 47,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTabLabel: {
    ...Typography.micro,
    marginTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 17,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...Typography.title,
    fontSize: 19,
    lineHeight: 24,
  },
  bodyText: {
    ...Typography.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: {
    ...Typography.caption,
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 8,
    lineHeight: 10,
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 17,
  },
  priceCard: {
    flex: 1,
    height: 83,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  priceLabel: {
    ...Typography.caption,
    fontSize: 10,
    lineHeight: 12,
  },
  priceValue: {
    ...Typography.title,
    fontSize: 24,
    lineHeight: 31,
    marginTop: 5,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
  },
  actionTile: {
    flex: 1,
    height: 69,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionLabel: {
    ...Typography.micro,
    fontSize: 8,
    lineHeight: 10,
    marginTop: 7,
    textAlign: 'center',
  },
  specPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 10,
    marginTop: 13,
    overflow: 'hidden',
  },
  specCell: {
    width: '50%',
    minHeight: 73,
    paddingHorizontal: 17,
    paddingVertical: 14,
  },
  specLabel: {
    ...Typography.caption,
    fontSize: 9,
    lineHeight: 11,
  },
  specValue: {
    ...Typography.screenTitle,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 8,
  },
  locationCard: {
    borderRadius: 10,
    minHeight: 63,
    marginTop: 13,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 7,
  },
  locationText: {
    ...Typography.body,
    fontSize: 12,
    lineHeight: 15,
  },
  sectionKicker: {
    ...Typography.caption,
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 10,
    lineHeight: 13,
    marginBottom: 9,
    marginTop: 17,
  },
  infoCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionTitle: {
    ...Typography.screenTitle,
    fontSize: 12,
    lineHeight: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 15,
    minHeight: 44,
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    ...Typography.caption,
    fontSize: 10,
    lineHeight: 13,
  },
  detailValue: {
    ...Typography.caption,
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 10,
    lineHeight: 13,
    flexShrink: 1,
    textAlign: 'right',
  },
  expenseCard: {
    borderRadius: 10,
    marginTop: 18,
    overflow: 'hidden',
  },
  expenseHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  addSmallButton: {
    height: 24,
    minWidth: 62,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  addSmallText: {
    ...Typography.caption,
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 10,
  },
  documentList: {
    gap: 10,
  },
  documentRow: {
    height: 47,
    borderRadius: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentLabel: {
    ...Typography.screenTitle,
    fontSize: 12,
    lineHeight: 15,
  },
  missingContent: {
    flex: 1,
    paddingTop: 18,
  },
});
