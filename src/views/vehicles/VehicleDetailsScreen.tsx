import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui';
import { FontFamily, Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { PERMISSIONS, usePermissions } from '@/permissions';
import { ApiError, getVehicle } from '@/services';
import { mapApiVehicleDetailToItem, toApiStatus, type ApiVehicleDetail } from './apiMapper';
import { ChangeStatusSheet } from './components/ChangeStatusSheet';
import type { VehicleDocument, VehicleExpense, VehicleItem, VehicleStatus } from './types';

type VehicleDetailsScreenProps = {
  vehicleId: string;
};

const PHOTO_CHIP_COUNT = 4;

export function VehicleDetailsScreen({ vehicleId }: VehicleDetailsScreenProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { can } = usePermissions();
  const { width: screenWidth } = useWindowDimensions();
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;
  const [vehicle, setVehicle] = useState<VehicleItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false);

  /**
   * `silent` refetches in place after a write — a status change should update
   * the badge without throwing the whole screen back to a spinner. A silent
   * refetch also keeps the last good vehicle on screen if it fails, since the
   * write itself already succeeded and reports its own errors.
   */
  const loadVehicle = useCallback(
    async (options?: { silent?: boolean; isCancelled?: () => boolean }) => {
      const silent = options?.silent ?? false;
      const isCancelled = options?.isCancelled ?? (() => false);

      if (!silent) {
        setIsLoading(true);
        setErrorMessage('');
        setSelectedImageIndex(0);
      }

      try {
        const response = await getVehicle({ vehicleId });

        if (isCancelled()) {
          return;
        }

        const responseData = response as unknown as { data?: ApiVehicleDetail };
        const data = responseData?.data ?? (responseData as unknown as ApiVehicleDetail);
        setVehicle(mapApiVehicleDetailToItem(data));
      } catch (error) {
        if (isCancelled() || silent) {
          return;
        }

        const notFound = error instanceof ApiError && error.status === 404;
        setErrorMessage(
          notFound
            ? 'This vehicle may have been removed from inventory.'
            : error instanceof Error
              ? error.message
              : 'Unable to load this vehicle.'
        );
      } finally {
        if (!silent && !isCancelled()) {
          setIsLoading(false);
        }
      }
    },
    [vehicleId]
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      loadVehicle({ isCancelled: () => cancelled });

      return () => {
        cancelled = true;
      };
    }, [loadVehicle])
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}>
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <BackButton />
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle || errorMessage) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}>
        <View style={[styles.missingContent, { paddingHorizontal: horizontalPadding }]}>
          <BackButton />
          <Text style={[styles.title, { color: colors['on-surface'] }]}>Vehicle not found</Text>
          <Text style={[styles.bodyText, { color: colors['on-surface-variant'] }]}>
            {errorMessage || 'This vehicle may have been removed from inventory.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = getStatusColors(vehicle.status, colors, isDark);
  const heroBackground = colors['surface-container-high'];
  const chipBackground = colors['surface-container-high'];
  const outlineCardBackground = colors['surface-container-lowest'];
  const borderColor = colors.primary;
  const dividerColor = colors.primary;
  const specs = getVehicleSpecs(vehicle);
  // Optional sale fields are dropped rather than rendered as a label with an
  // empty value, so the card only ever shows what was actually recorded.
  const askingDelta = getAskingDelta(vehicle);
  const saleRows = vehicle.sale
    ? [
        // Kept alongside the sale so a sold vehicle still shows what it was
        // tagged at — formatted in full rupees to match, since `askingPrice`
        // itself is the abbreviated "₹5.5L" form used on cards.
        {
          label: 'Asking price',
          value:
            vehicle.askingPriceAmount !== undefined
              ? formatRupeeAmount(vehicle.askingPriceAmount)
              : '',
        },
        { label: 'Sold for', value: vehicle.sale.soldPrice },
        {
          label: 'Difference',
          value: askingDelta,
          valueColor: askingDelta.includes('below') ? colors.error : colors.tertiary,
        },
        { label: 'Sale date', value: vehicle.sale.saleDate },
        { label: 'Payment mode', value: vehicle.sale.paymentMode },
        { label: 'Buyer', value: vehicle.sale.buyerName },
        { label: 'Buyer phone', value: vehicle.sale.buyerPhone },
        { label: 'Buyer address', value: vehicle.sale.buyerAddress },
        { label: 'Sold by', value: vehicle.sale.soldBy },
        { label: 'Remarks', value: vehicle.sale.remarks },
      ].filter((row) => row.value.trim().length > 0)
    : [];

  // Against the real sale once there is one, so a sold vehicle stops reporting
  // the margin it might have made.
  const profit = vehicle.sale
    ? getProfitNote(vehicle.buyingPrice, vehicle.sale.soldPrice)
    : getProfitNote(vehicle.buyingPrice, vehicle.askingPrice);
  const totalPhotos = vehicle.photoCount ?? PHOTO_CHIP_COUNT;
  const visibleChipCount = Math.min(totalPhotos, PHOTO_CHIP_COUNT);
  const extraPhotos = Math.max(totalPhotos - PHOTO_CHIP_COUNT, 0);
  // Shared by the action tile and the Add button on the expenses card so the two
  // entry points cannot drift. Undefined when the user may not add expenses,
  // which is what hides both.
  const openAddExpense = can(PERMISSIONS.EXPENSE_CREATE)
    ? () =>
        router.push({
          pathname: '/vehicle/expense/[id]',
          // Carried along so the screen can name the vehicle without a second
          // fetch just to render its header card.
          params: {
            id: vehicle.id,
            name: vehicle.name,
            registration: vehicle.registration,
          },
        })
    : undefined;
  const openDocuments = can(PERMISSIONS.VEHICLE_UPDATE)
    ? () =>
        router.push({
          pathname: '/vehicle/documents/[id]',
          params: {
            id: vehicle.id,
            name: vehicle.name,
            registration: vehicle.registration,
          },
        })
    : undefined;

  // Every action here writes, so a read-only viewer gets the detail page with no
  // action row at all rather than a row of dead buttons.
  const actionItems = can(PERMISSIONS.VEHICLE_UPDATE)
    ? [
        {
          label: 'Edit',
          icon: 'square-edit-outline' as const,
          onPress: () =>
            router.push({ pathname: '/vehicle/edit/[id]', params: { id: vehicle.id } }),
        },
        {
          label: 'Change State',
          icon: 'swap-horizontal' as const,
          // A sold vehicle's state is settled by its sale record, so the tile
          // goes inert rather than offering to move it back into the garage.
          onPress:
            vehicle.status === 'Sold' ? undefined : () => setIsStatusSheetOpen(true),
        },
        // A vehicle can only be sold once it's actually "available" — still
        // being prepped ("In Garage") or checked over ("Inspection") isn't
        // ready yet. That case gets a tap-to-explain tile (muted, but still
        // responds) rather than going silently dead like the sold/no-permission
        // case, since the fix there is one tap away on Change State.
        {
          label: 'Sell',
          icon: 'tag-outline' as const,
          onPress: !can(PERMISSIONS.SALE_CREATE)
            ? undefined
            : vehicle.status === 'Sold'
              ? undefined
              : vehicle.status !== 'Available'
                ? () =>
                    Alert.alert(
                      'Not ready to sell',
                      'Mark this vehicle "Available" from Change State before selling it.'
                    )
                : () =>
                    router.push({
                      pathname: '/vehicle/sell/[id]',
                      params: {
                        id: vehicle.id,
                        name: vehicle.name,
                        registration: vehicle.registration,
                      },
                    }),
          muted: can(PERMISSIONS.SALE_CREATE) && vehicle.status !== 'Sold' && vehicle.status !== 'Available',
        },
        ...(openAddExpense ? [{ label: 'Add Expense', icon: 'plus' as const, onPress: openAddExpense }] : []),
      ]
    : [];

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
          {vehicle.imageUrls && vehicle.imageUrls.length > 0 ? (
            <Image
              source={{ uri: vehicle.imageUrls[selectedImageIndex] || vehicle.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
              recyclingKey={`${vehicle.id}-${selectedImageIndex}`}
            />
          ) : vehicle.imageUrl ? (
            <Image
              source={{ uri: vehicle.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={150}
              cachePolicy="memory-disk"
              recyclingKey={vehicle.id}
            />
          ) : (
            <MaterialCommunityIcons name={vehicle.icon} size={96} color={colors['on-surface-variant']} />
          )}
        </View>

        <View style={styles.photoChips}>
          {(vehicle.imageUrls || []).slice(0, PHOTO_CHIP_COUNT).map((imageUrl, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedImageIndex(index)}
              style={[
                styles.photoChip,
                {
                  backgroundColor: chipBackground,
                  borderColor: selectedImageIndex === index ? borderColor : 'transparent',
                  borderWidth: selectedImageIndex === index ? 2 : 0,
                  opacity: selectedImageIndex === index ? 1 : 0.6,
                },
              ]}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.photoChipImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </Pressable>
          ))}
          {extraPhotos > 0 ? (
            <View style={[styles.photoChip, styles.photoChipCount, { backgroundColor: chipBackground }]}>
              <Text style={[styles.photoChipCountText, { color: colors.primary }]}>+{extraPhotos}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors['on-surface'] }]}>{vehicle.name}</Text>
            <Text style={[styles.registrationText, { color: colors['on-surface'] }]}>
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
          {vehicle.sale ? (
            <PriceCard label="Sold for" value={vehicle.sale.soldPrice} note={profit} />
          ) : (
            <PriceCard label="Asking price" value={vehicle.askingPrice} note={profit} />
          )}
        </View>

        <View style={styles.actionsGrid}>
          {actionItems.map((item) => {
            const isInert = !item.onPress;
            // "muted" tiles still respond (to explain why), just don't look
            // ready — distinct from truly inert ones (sold, no permission).
            const looksDisabled = isInert || ('muted' in item && item.muted);
            const tileColor = looksDisabled ? colors['on-surface-variant'] : colors.primary;

            return (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                disabled={isInert}
                style={({ pressed }) => [
                  styles.actionTile,
                  {
                    backgroundColor: outlineCardBackground,
                    borderColor: looksDisabled ? colors['outline-variant'] : borderColor,
                    opacity: looksDisabled ? 0.5 : 1,
                  },
                  pressed && item.onPress ? styles.actionTilePressed : null,
                ]}>
                <MaterialCommunityIcons name={item.icon} size={20} color={tileColor} />
                <Text style={[styles.actionLabel, { color: looksDisabled ? tileColor : colors['on-surface'] }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {saleRows.length > 0 ? (
          <>
            <Text style={[styles.sectionKicker, { color: colors['on-surface-variant'] }]}>
              SALE DETAILS
            </Text>
            <View style={[styles.infoCard, { backgroundColor: outlineCardBackground, borderColor }]}>
              {saleRows.map((row, index) => (
                <DetailRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  valueColor={row.label === 'Buyer phone' ? colors.primary : row.valueColor}
                  showDivider={index < saleRows.length - 1}
                  dividerColor={dividerColor}
                  onPress={
                    row.label === 'Buyer phone'
                      ? () => Linking.openURL(`tel:${row.value.replace(/[^\d+]/g, '')}`)
                      : undefined
                  }
                />
              ))}
            </View>
          </>
        ) : null}

        <View style={[styles.specPanel, { backgroundColor: outlineCardBackground, borderColor }]}>
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
              <Text style={[styles.specLabel, { color: colors['on-surface'] }]}>
                {spec.label}
              </Text>
              <Text style={[styles.specValue, { color: colors['on-surface'] }]}>
                {spec.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionKicker, { color: colors['on-surface-variant'] }]}>MORE INFO</Text>
        <View style={[styles.infoCard, { backgroundColor: outlineCardBackground, borderColor }]}>
          <DetailRow label="Engine number" value={vehicle.engineNumber} showDivider dividerColor={dividerColor} />
          <DetailRow label="Chassis number" value={vehicle.chassisNumber} showDivider dividerColor={dividerColor} />
          <DetailRow label="Transmission" value={vehicle.transmission} showDivider dividerColor={dividerColor} />
          <DetailRow label="Color" value={vehicle.color} showDivider dividerColor={dividerColor} />
          <DetailRow label="Insurance valid till" value={vehicle.insuranceValidTill} />
        </View>

        <ExpenseSection expenses={vehicle.expenses} onAdd={openAddExpense} />

        <View style={styles.documentsHeader}>
          <Text style={[styles.sectionKicker, styles.documentsKicker, { color: colors['on-surface-variant'] }]}>
            DOCUMENTS
          </Text>
          {openDocuments ? (
            <Pressable onPress={openDocuments} hitSlop={8}>
              <Text style={[styles.manageLink, { color: colors.primary }]}>Manage</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.documentList}>
          {vehicle.documents.map((document) => (
            <DocumentRow
              key={document.type}
              document={document}
              onPress={openDocuments}
            />
          ))}
        </View>

      </ScrollView>

      <ChangeStatusSheet
        visible={isStatusSheetOpen}
        onClose={() => setIsStatusSheetOpen(false)}
        vehicleId={vehicle.id}
        currentStatus={toApiStatus(vehicle.status)}
        onUpdated={() => loadVehicle({ silent: true })}
      />
    </SafeAreaView>
  );
}

function PriceCard({ label, value, note }: { label: string; value: string; note?: string | null }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.priceCard,
        { backgroundColor: colors['surface-container'], borderColor: colors.primary },
      ]}>
      <Text style={[styles.priceLabel, { color: colors['on-surface'] }]}>{label}</Text>
      <Text style={[styles.priceValue, { color: colors['on-surface'] }]}>{value}</Text>
      {note ? <Text style={[styles.priceNote, { color: colors.tertiary }]}>{note}</Text> : null}
    </View>
  );
}

function DetailRow({
  label,
  value,
  showDivider,
  dividerColor,
  valueColor,
  onPress,
}: {
  label: string;
  value: string;
  showDivider?: boolean;
  dividerColor?: string;
  valueColor?: string;
  /** e.g. tap-to-call on a phone number — the row stays plain text without it. */
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.detailRow,
        showDivider && {
          borderBottomColor: dividerColor ?? colors['outline-variant'],
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}>
      <Text style={[styles.detailLabel, { color: colors['on-surface-variant'] }]}>{label}</Text>
      <View style={styles.detailValueRow}>
        <Text style={[styles.detailValue, { color: valueColor ?? colors['on-surface'] }]}>{value}</Text>
        {onPress ? <Ionicons name="call" size={14} color={colors.primary} /> : null}
      </View>
    </Pressable>
  );
}

function ExpenseSection({
  expenses,
  onAdd,
}: {
  expenses: VehicleExpense[];
  onAdd?: () => void;
}) {
  const { colors } = useTheme();
  const total = expenses.reduce((sum, expense) => sum + parseRupeeAmount(expense.amount), 0);

  return (
    <View
      style={[
        styles.expenseCard,
        { backgroundColor: colors['surface-container-lowest'], borderColor: colors.primary },
      ]}>
      <View style={styles.expenseHeader}>
        <Text style={[styles.sectionTitle, { color: colors['on-surface'] }]}>Vehicle Expenses</Text>
        {onAdd ? (
          <Pressable
            onPress={onAdd}
            hitSlop={8}
            style={({ pressed }) => [
              styles.addSmallButton,
              { backgroundColor: colors['surface-container-high'], opacity: pressed ? 0.7 : 1 },
            ]}>
            <MaterialCommunityIcons name="plus" size={12} color={colors.primary} />
            <Text style={[styles.addSmallText, { color: colors.primary }]}>Add</Text>
          </Pressable>
        ) : null}
      </View>
      {expenses.length === 0 ? (
        <Text style={[styles.expenseEmpty, { color: colors['on-surface-variant'] }]}>
          No expenses logged for this vehicle yet.
        </Text>
      ) : (
        expenses.map((expense) => (
          // Keyed by id, not by text: several expenses can share a description
          // and duplicate keys make React reuse the wrong rows.
          <ExpenseRow key={expense.id} expense={expense} dividerColor={colors.primary} />
        ))
      )}
      <DetailRow label="Total expenses" value={formatRupeeAmount(total)} valueColor={colors.error} />
    </View>
  );
}

function ExpenseRow({
  expense,
  dividerColor,
}: {
  expense: VehicleExpense;
  dividerColor: string;
}) {
  const { colors } = useTheme();
  // "City Motors · 20 Jun 2026", dropping either half when it is missing.
  const meta = [expense.paidTo, expense.date].filter(Boolean).join(' · ');

  return (
    <View
      style={[
        styles.expenseRow,
        { borderBottomColor: dividerColor, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      {/* minWidth 0 lets a long description shrink instead of pushing the
          amount out of the row entirely. */}
      <View style={styles.expenseRowText}>
        <Text style={[styles.expenseCategory, { color: colors['on-surface'] }]} numberOfLines={1}>
          {expense.category}
        </Text>
        {meta ? (
          <Text style={[styles.expenseMeta, { color: colors['on-surface-variant'] }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {expense.description ? (
          <Text
            style={[styles.expenseDescription, { color: colors['on-surface-variant'] }]}
            numberOfLines={2}>
            {expense.description}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.expenseAmount, { color: colors['on-surface'] }]}>{expense.amount}</Text>
    </View>
  );
}

function DocumentRow({
  document,
  onPress,
}: {
  document: VehicleDocument;
  /** Undefined for a viewer who may not edit — the row then just reports state. */
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const complete = document.status === 'complete';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.documentRow,
        { backgroundColor: colors['surface-container-lowest'], borderColor: colors.primary },
        pressed && onPress ? styles.actionTilePressed : null,
      ]}>
      <View style={styles.documentTitle}>
        <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
        <View style={styles.documentTitleText}>
          <Text
            style={[styles.documentLabel, { color: colors['on-surface'] }]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {document.label}
          </Text>
          <Text style={[styles.documentMeta, { color: colors['on-surface-variant'] }]}>
            {complete
              ? `${document.count} page${document.count === 1 ? '' : 's'} uploaded`
              : 'Not uploaded'}
          </Text>
        </View>
      </View>
      {complete ? (
        <MaterialCommunityIcons name="check-circle" size={19} color={colors.tertiary} />
      ) : onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={19} color={colors['on-surface-variant']} />
      ) : (
        <Text style={[styles.documentPending, { color: colors['on-surface-variant'] }]}>Pending</Text>
      )}
    </Pressable>
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

/** Blank when there is nothing to compare, or when it sold at exactly the asking price. */
function getAskingDelta(vehicle: VehicleItem) {
  const asking = vehicle.askingPriceAmount;
  const sold = vehicle.sale?.soldPriceAmount;

  if (asking === undefined || sold === undefined || asking === sold) {
    return '';
  }

  const difference = sold - asking;
  const formatted = formatRupeeAmount(Math.abs(difference));

  return difference < 0 ? `${formatted} below asking` : `${formatted} above asking`;
}

function formatRupeeAmount(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function parseLakhAmount(value: string) {
  const match = value.replace(/[₹,\s]/g, '').match(/^([\d.]+)\s*([lLcC]?)/);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);

  if (!Number.isFinite(amount)) {
    return null;
  }

  const unit = match[2]?.toLowerCase();

  if (unit === 'l') {
    return amount * 100000;
  }

  if (unit === 'c') {
    return amount * 10000000;
  }

  return amount;
}

function getProfitNote(buyingPrice: string, askingPrice: string) {
  const buying = parseLakhAmount(buyingPrice);
  const asking = parseLakhAmount(askingPrice);

  if (buying === null || asking === null) {
    return null;
  }

  const diff = asking - buying;

  if (diff === 0) {
    return null;
  }

  const formatted = `₹${Math.abs(diff).toLocaleString('en-IN')}`;
  return diff > 0 ? `${formatted} profit` : `${formatted} loss`;
}

function getStatusColors(
  status: VehicleStatus,
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean
) {
  const variants = {
    Available: {
      backgroundColor: colors['surface-container-high'],
      textColor: colors.primary,
    },
    Sold: {
      backgroundColor: colors['error-container'],
      textColor: colors['on-error-container'],
    },
    'In Garage': {
      backgroundColor: colors['surface-container-high'],
      textColor: colors['on-surface-variant'],
    },
    Inspection: {
      backgroundColor: colors['secondary-container'],
      textColor: colors['on-secondary-container'],
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 31,
    paddingTop: 17,
  },
  heroCard: {
    height: 179,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  photoChips: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  photoChip: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoChipImage: {
    width: '100%',
    height: '100%',
  },
  photoChipCount: {
    flexBasis: 0,
  },
  photoChipCountText: {
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 17,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 24,
    lineHeight: 29,
  },
  registrationText: {
    fontFamily: FontFamily.regular,
    fontSize: 17,
    lineHeight: 21,
    marginTop: 2,
  },
  bodyText: {
    ...Typography.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    lineHeight: 12,
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 17,
  },
  priceCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 10,
    borderWidth: 0.5,
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  priceLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 16,
  },
  priceValue: {
    fontFamily: FontFamily.medium,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 4,
  },
  priceNote: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
  },
  actionTile: {
    flex: 1,
    height: 65,
    borderRadius: 15,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionTilePressed: {
    opacity: 0.85,
  },
  actionLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    lineHeight: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  specPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 15,
    borderWidth: 0.5,
    marginTop: 13,
    overflow: 'hidden',
  },
  specCell: {
    width: '50%',
    minHeight: 82,
    paddingHorizontal: 17,
    paddingVertical: 16,
  },
  specLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 13,
  },
  specValue: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 18,
    marginTop: 8,
  },
  sectionKicker: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 17,
    marginBottom: 9,
    marginTop: 17,
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    minHeight: 51,
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 17,
    // Without these a long label takes the whole row and pushes the value
    // off the edge instead of wrapping.
    flexShrink: 1,
    minWidth: 0,
  },
  detailValue: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 18,
    flexShrink: 0,
    textAlign: 'right',
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  expenseCard: {
    borderRadius: 20,
    borderWidth: 0.5,
    marginTop: 18,
    overflow: 'hidden',
  },
  expenseHeader: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  addSmallButton: {
    height: 25,
    minWidth: 62,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14,
  },
  addSmallText: {
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 12,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  expenseRowText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  expenseCategory: {
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 14,
    lineHeight: 18,
  },
  expenseMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  expenseDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  expenseAmount: {
    fontFamily: Typography.screenTitle.fontFamily,
    fontSize: 14,
    lineHeight: 18,
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
  expenseEmpty: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  documentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentsKicker: {
    flex: 1,
  },
  manageLink: {
    ...Typography.caption,
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  documentTitleText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  documentMeta: {
    ...Typography.caption,
    fontSize: 11,
  },
  documentList: {
    gap: 10,
  },
  documentRow: {
    height: 59,
    borderRadius: 15,
    borderWidth: 0.5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentTitle: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 16,
  },
  documentLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 18,
  },
  documentPending: {
    ...Typography.caption,
    fontSize: 11,
  },
  missingContent: {
    flex: 1,
    paddingTop: 18,
  },
});
