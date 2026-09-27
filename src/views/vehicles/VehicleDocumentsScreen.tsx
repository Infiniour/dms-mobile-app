import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { BackButton, BottomSheet, Button, CameraCaptureModal, useAppAlert } from '@/components/ui';
import { FontFamily, Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useFocusEffect } from 'expo-router';
import { addVehicleDocument, getVehicle } from '@/services';
import type { ApiVehicleDetail } from './apiMapper';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import {
  DOCUMENT_RULES,
  DOCUMENT_SLOTS,
  kindFromSource,
  type DocumentFile,
  type DocumentSlot,
} from './documents';

type VehicleDocumentsScreenProps = {
  vehicleId: string;
  vehicleName?: string;
  registration?: string;
};

/** Files keyed by slot. A slot holds many files because documents have pages. */
type DocumentsState = Record<string, DocumentFile[]>;

export function VehicleDocumentsScreen({
  vehicleId,
  vehicleName,
  registration,
}: VehicleDocumentsScreenProps) {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAppAlert();
  const { width: screenWidth } = useWindowDimensions();
  const [documents, setDocuments] = useState<DocumentsState>({});
  const [pickerSlot, setPickerSlot] = useState<DocumentSlot | null>(null);
  const [cameraSlot, setCameraSlot] = useState<DocumentSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  /** The server refuses document uploads once a vehicle is sold. */
  const [isSold, setIsSold] = useState(false);
  const [preview, setPreview] = useState<{
    uri: string;
    name: string;
    kind: 'image' | 'pdf' | 'other';
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      setIsLoading(true);

      getVehicle({ vehicleId })
        .then((response) => {
          if (cancelled) {
            return;
          }

          const responseData = response as unknown as { data?: ApiVehicleDetail };
          const detail = responseData?.data ?? (responseData as unknown as ApiVehicleDetail);

          setIsSold(detail?.basic?.current_status?.status === 'sold');
          // Replaces rather than merges: anything picked but not saved is gone
          // after a reload, and pretending otherwise would be a lie.
          setDocuments(toDocumentsState(detail?.documents));
        })
        .catch((error) => {
          if (!cancelled) {
            setErrorMessage(
              error instanceof Error ? error.message : 'Unable to load documents.'
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [vehicleId])
  );

  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;
  const cardBackground = isDark
    ? colors['surface-container-low']
    : colors['surface-container-lowest'];

  const totalFiles = Object.values(documents).reduce((sum, files) => sum + files.length, 0);
  // Only locally picked files are uploadable; anything with a remoteId is already stored.
  const pendingFiles = DOCUMENT_SLOTS.flatMap((slot) =>
    (documents[slot.type] ?? [])
      .filter((file) => file.remoteId === undefined)
      .map((file) => ({ slot, file }))
  );

  const handleSave = async () => {
    setErrorMessage('');
    setIsSaving(true);

    const failed: string[] = [];

    // One request per file: the endpoint takes a single file, so a multi-page
    // document is several calls sharing a document_type. Sequential rather than
    // parallel so a slow connection does not fire ten uploads at once.
    for (const { slot, file } of pendingFiles) {
      try {
        await addVehicleDocument(vehicleId, {
          documentType: slot.type,
          file: { uri: file.uri, name: file.name, type: mimeFor(file) },
        });
      } catch (error) {
        failed.push(error instanceof Error ? error.message : `${slot.label} failed`);
      }
    }

    setIsSaving(false);

    if (failed.length > 0) {
      // Partial success is normal here: the uploads that worked are already
      // stored, so the list is reloaded rather than left showing stale state.
      setErrorMessage(
        failed.length === pendingFiles.length
          ? failed[0]
          : `${failed.length} of ${pendingFiles.length} files failed to upload.`
      );
    } else {
      showAlert({
        title: 'Documents saved',
        message: `${pendingFiles.length} file${pendingFiles.length === 1 ? '' : 's'} uploaded.`,
        variant: 'success',
      });
    }

    await reloadDocuments();
  };

  const reloadDocuments = async () => {
    try {
      const response = await getVehicle({ vehicleId });
      const responseData = response as unknown as { data?: ApiVehicleDetail };
      const detail = responseData?.data ?? (responseData as unknown as ApiVehicleDetail);
      setDocuments(toDocumentsState(detail?.documents));
    } catch {
      // The upload result has already been reported; a failed refresh should
      // not overwrite it with a second, more confusing message.
    }
  };


  const addFiles = (slotType: string, files: DocumentFile[]) => {
    if (files.length === 0) {
      return;
    }

    setDocuments((current) => ({
      ...current,
      [slotType]: [...(current[slotType] ?? []), ...files],
    }));
  };

  const removeFile = (slotType: string, fileId: string) => {
    setDocuments((current) => ({
      ...current,
      [slotType]: (current[slotType] ?? []).filter((file) => file.id !== fileId),
    }));
  };

  const warnOversized = (skipped: number) => {
    if (skipped > 0) {
      showAlert({
        title: skipped === 1 ? 'File skipped' : `${skipped} files skipped`,
        message: `Each file must be under ${DOCUMENT_RULES.maxLabel}.`,
        variant: 'error',
      });
    }
  };

  const pickPdf = async (slot: DocumentSlot) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: DOCUMENT_RULES.mimeTypes,
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const accepted = result.assets.filter((asset) =>
      isWithinSize(asset.size ?? undefined, DOCUMENT_RULES.maxBytes)
    );
    warnOversized(result.assets.length - accepted.length);

    addFiles(
      slot.type,
      accepted.map((asset, index) => ({
        id: `${asset.uri}-${index}-${Date.now()}`,
        uri: asset.uri,
        name: asset.name || 'Document',
        kind: asset.mimeType === 'application/pdf' ? 'pdf' : 'image',
        size: asset.size ?? undefined,
      }))
    );
  };

  const pickImages = async (slot: DocumentSlot, source: 'gallery') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert({
        title: 'Permission needed',
        message: 'Allow photo access to attach document photos.',
        variant: 'error',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // Multi-select, because a document is usually more than one page.
      allowsMultipleSelection: true,
      quality: 0.9,
    });

    if (result.canceled) {
      return;
    }

    const accepted = result.assets.filter((asset) =>
      isWithinSize(asset.fileSize, DOCUMENT_RULES.maxBytes)
    );
    warnOversized(result.assets.length - accepted.length);

    const existing = documents[slot.type]?.length ?? 0;

    addFiles(
      slot.type,
      accepted.map((asset, index) => ({
        id: `${asset.uri}-${index}-${Date.now()}`,
        uri: asset.uri,
        name: asset.fileName || `${slot.label} page ${existing + index + 1}`,
        kind: 'image',
        size: asset.fileSize,
      }))
    );
  };

  const openPickerFor = (slot: DocumentSlot) => {
    setPickerSlot(slot);
  };

  const runPicker = async (action: 'files' | 'camera' | 'gallery') => {
    const slot = pickerSlot;
    setPickerSlot(null);

    if (!slot) {
      return;
    }

    if (action === 'files') {
      await pickPdf(slot);
      return;
    }

    if (action === 'camera') {
      setCameraSlot(slot);
      return;
    }

    await pickImages(slot, 'gallery');
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <BackButton />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors['on-surface'] }]}>Documents</Text>
        {vehicleName || registration ? (
          <Text style={[styles.subtitle, { color: colors['on-surface-variant'] }]}>
            {[vehicleName, registration].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        <Text style={[styles.countLine, { color: colors['on-surface-variant'] }]}>
          {isLoading
            ? 'Loading documents…'
            : totalFiles === 0
              ? 'No files attached yet'
              : `${totalFiles} file${totalFiles === 1 ? '' : 's'} attached`}
        </Text>

        {isSold ? (
          <View
            style={[styles.soldNotice, { backgroundColor: colors['error-container'] }]}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={colors['on-error-container']}
            />
            <Text style={[styles.soldText, { color: colors['on-error-container'] }]}>
              This vehicle is sold. Its documents can be viewed but no longer changed.
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        <View style={styles.slotList}>
          {DOCUMENT_SLOTS.map((slot) => (
            <DocumentCard
              key={slot.type}
              slot={slot}
              files={documents[slot.type] ?? []}
              background={cardBackground}
              locked={isSold}
              onAdd={() => openPickerFor(slot)}
              onRemove={(fileId) => removeFile(slot.type, fileId)}
              onView={(file) =>
                setPreview({
                  uri: file.uri,
                  name: file.name,
                  kind: file.kind,
                })
              }
            />
          ))}
        </View>

        <View
          style={[
            styles.infoNote,
            {
              backgroundColor: isDark ? colors['surface-container-low'] : colors['surface-container'],
            },
          ]}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={colors['on-surface-variant']}
            style={styles.infoIcon}
          />
          <Text style={[styles.infoText, { color: colors['on-surface-variant'] }]}>
            Add every page of a document. Accepted formats: {DOCUMENT_RULES.accepted}. Max{' '}
            {DOCUMENT_RULES.maxLabel} per file.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        <Button
          label={
            pendingFiles.length === 0
              ? 'Nothing to upload'
              : `Upload ${pendingFiles.length} file${pendingFiles.length === 1 ? '' : 's'}`
          }
          disabled={pendingFiles.length === 0 || isSaving || isSold}
          loading={isSaving}
          onPress={handleSave}
          style={styles.save}
        />
      </ScrollView>

      <BottomSheet visible={pickerSlot !== null} onClose={() => setPickerSlot(null)}>
        <Text style={[styles.sheetTitle, { color: colors['on-surface'] }]}>
          Add to {pickerSlot?.label ?? 'document'}
        </Text>
        <Text style={[styles.sheetHint, { color: colors['on-surface-variant'] }]}>
          Pick a PDF, or attach several photos at once for a multi-page document.
        </Text>

        <View style={styles.sheetActions}>
          <SheetAction
            icon="document-text-outline"
            label="Files"
            hint="PDF or images"
            onPress={() => runPicker('files')}
          />
          <SheetAction
            icon="images-outline"
            label="Gallery"
            hint="Select multiple pages"
            onPress={() => runPicker('gallery')}
          />
          <SheetAction
            icon="camera-outline"
            label="Camera"
            hint="Photograph a page"
            onPress={() => runPicker('camera')}
          />
        </View>
      </BottomSheet>

      <CameraCaptureModal
        visible={cameraSlot !== null}
        onClose={() => setCameraSlot(null)}
        onCapture={(photo) => {
          if (!cameraSlot) {
            return;
          }

          const existing = documents[cameraSlot.type]?.length ?? 0;
          addFiles(cameraSlot.type, [
            {
              id: `${photo.uri}-${Date.now()}`,
              uri: photo.uri,
              name: photo.fileName || `${cameraSlot.label} page ${existing + 1}`,
              kind: 'image',
            },
          ]);
        }}
      />

      <DocumentPreviewModal
        visible={preview !== null}
        onClose={() => setPreview(null)}
        uri={preview?.uri ?? ''}
        name={preview?.name ?? 'Document'}
        kind={preview?.kind ?? 'image'}
      />
    </SafeAreaView>
  );
}

function DocumentCard({
  slot,
  files,
  background,
  locked,
  onAdd,
  onRemove,
  onView,
}: {
  slot: DocumentSlot;
  files: DocumentFile[];
  background: string;
  /** Sold vehicles are read-only: the server rejects uploads against them. */
  locked: boolean;
  onAdd: () => void;
  onRemove: (fileId: string) => void;
  onView: (file: DocumentFile) => void;
}) {
  const { colors, isDark } = useTheme();
  const pendingCount = files.filter((file) => file.remoteId === undefined).length;

  return (
    <View
      style={[styles.card, { backgroundColor: background, borderColor: colors['outline-variant'] }]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.cardIcon,
            {
              backgroundColor: isDark
                ? colors['surface-container-high']
                : colors['surface-container'],
            },
          ]}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
        </View>

        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, { color: colors['on-surface'] }]} numberOfLines={1}>
            {slot.label}
          </Text>
          <Text
            style={[styles.cardHint, { color: colors['on-surface-variant'] }]}
            numberOfLines={1}>
            {files.length > 0
              ? `${files.length} page${files.length === 1 ? '' : 's'}${pendingCount > 0 ? ` · ${pendingCount} not uploaded` : ''}`
              : slot.hint}
          </Text>
        </View>
      </View>

      {files.length > 0 ? (
        <View style={styles.fileList}>
          {files.map((file) => {
            const isUploaded = file.remoteId !== undefined;

            return (
              <Pressable
                key={file.id}
                // Uploaded files open in-app; a locally picked one has nothing to open yet.
                onPress={isUploaded ? () => onView(file) : undefined}
                style={[styles.fileRow, { borderTopColor: colors['outline-variant'] }]}>
                <MaterialCommunityIcons
                  name={file.kind === 'pdf' ? 'file-pdf-box' : 'image-outline'}
                  size={18}
                  color={colors['on-surface-variant']}
                />
                <View style={styles.fileText}>
                  <Text style={[styles.fileName, { color: colors['on-surface'] }]} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={[styles.fileSize, { color: colors['on-surface-variant'] }]}>
                    {isUploaded
                      ? 'Uploaded · tap to view'
                      : file.size
                        ? `${formatSize(file.size)} · not uploaded`
                        : 'Not uploaded'}
                  </Text>
                </View>
                {isUploaded ? (
                  // The API has no delete-document endpoint, so an uploaded file
                  // cannot be removed — showing a bin here would be a dead control.
                  <Ionicons name="expand-outline" size={17} color={colors['on-surface-variant']} />
                ) : (
                  <Pressable
                    onPress={() => onRemove(file.id)}
                    hitSlop={8}
                    accessibilityLabel={`Remove ${file.name}`}>
                    <Ionicons name="trash-outline" size={18} color={colors['on-surface-variant']} />
                  </Pressable>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {locked ? null : (
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [
            styles.addButton,
            { borderColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Ionicons name="add" size={17} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>
            {files.length > 0 ? 'Add another page' : 'Add file'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function SheetAction({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sheetAction,
        {
          backgroundColor: isDark ? colors['surface-container-high'] : colors['surface-container'],
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <View style={styles.sheetActionText}>
        <Text style={[styles.sheetActionLabel, { color: colors['on-surface'] }]}>{label}</Text>
        <Text style={[styles.sheetActionHint, { color: colors['on-surface-variant'] }]}>{hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color={colors['on-surface-variant']} />
    </Pressable>
  );
}

/**
 * Turns the API's `{ type: [{ id, url }] }` into the screen's per-slot lists.
 * Only the three slots the screen offers are read; an unknown type in the
 * response is ignored rather than rendered without a home.
 */
function toDocumentsState(
  documents: ApiVehicleDetail['documents']
): Record<string, DocumentFile[]> {
  const next: Record<string, DocumentFile[]> = {};

  DOCUMENT_SLOTS.forEach((slot) => {
    const files = documents?.[slot.type] ?? [];

    next[slot.type] = files
      .filter((file) => Boolean(file?.url))
      .map((file, index) => ({
        id: `remote-${file.id}`,
        uri: file.url,
        name: `${slot.label} ${index + 1}`,
        kind: kindFromSource(file.url),
        remoteId: file.id,
      }));
  });

  return next;
}

function mimeFor(file: DocumentFile) {
  if (file.kind === 'pdf') {
    return 'application/pdf';
  }

  return file.uri.split('?')[0].toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
}

/** Size is not always reported by a picker; an unknown size is allowed through. */
function isWithinSize(size: number | undefined, maxBytes: number) {
  return size === undefined || size <= maxBytes;
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(Math.round(bytes / 1024), 1)} KB`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingTop: 12, paddingBottom: 4 },
  content: { paddingTop: 16, paddingBottom: 40 },
  title: {
    ...Typography.hero,
    fontSize: 26,
    includeFontPadding: false,
  },
  subtitle: {
    ...Typography.body,
    marginTop: 6,
  },
  countLine: {
    ...Typography.caption,
    marginTop: 6,
  },
  slotList: {
    gap: 12,
    marginTop: 22,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 19,
    includeFontPadding: false,
  },
  cardHint: {
    ...Typography.caption,
    fontSize: 11,
  },
  fileList: {
    marginTop: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fileText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  fileName: {
    ...Typography.body,
    fontSize: 12,
  },
  fileSize: {
    ...Typography.micro,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 11,
    paddingVertical: 10,
    marginTop: 12,
  },
  addButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    includeFontPadding: false,
  },
  infoNote: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  infoIcon: { marginTop: 1 },
  infoText: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 17,
    flex: 1,
  },
  save: { marginTop: 28 },
  loading: {
    paddingVertical: 28,
  },
  soldNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  soldText: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  errorText: {
    ...Typography.caption,
    fontSize: 12,
    flex: 1,
  },
  sheetTitle: {
    ...Typography.title,
    includeFontPadding: false,
  },
  sheetHint: {
    ...Typography.body,
    marginTop: 4,
  },
  sheetActions: {
    gap: 10,
    marginTop: 20,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  sheetActionText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  sheetActionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 19,
    includeFontPadding: false,
  },
  sheetActionHint: {
    ...Typography.caption,
    fontSize: 11,
  },
});
