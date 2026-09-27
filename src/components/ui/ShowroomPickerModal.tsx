import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Grid, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ShowroomRole = {
  showroom_id: number;
  external_showroom_id?: string | null;
  showroom_name?: string | null;
  role?: string | null;
};

type ShowroomPickerModalProps = {
  visible: boolean;
  showrooms: ShowroomRole[];
  isAssigning: boolean;
  onClose: () => void;
  onSelect: (showroom: ShowroomRole) => void;
};

export function ShowroomPickerModal({
  visible,
  showrooms,
  isAssigning,
  onClose,
  onSelect,
}: ShowroomPickerModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} disabled={isAssigning} />
        <View
          style={[
            styles.showroomModalCard,
            {
              backgroundColor: colors['surface-container-lowest'],
              borderColor: colors['outline-variant'],
            },
          ]}>
          <View style={[styles.showroomModalIcon, { backgroundColor: colors['surface-container'] }]}>
            <Ionicons name="storefront-outline" size={30} color={colors.primary} />
          </View>

          <Text style={[Typography.title, styles.showroomModalTitle, { color: colors['on-background'] }]}>
            Choose showroom
          </Text>
          <Text style={[Typography.body, styles.showroomModalSubtitle, { color: colors['on-surface'] }]}>
            Select where this vehicle should be listed.
          </Text>

          <View style={styles.showroomOptionList}>
            {showrooms.map((showroom) => (
              <Pressable
                key={showroom.showroom_id}
                onPress={() => onSelect(showroom)}
                disabled={isAssigning}
                style={({ pressed }) => [
                  styles.showroomOption,
                  {
                    backgroundColor: colors['surface-container-low'],
                    borderColor: colors['outline-variant'],
                    opacity: isAssigning ? 0.6 : pressed ? 0.86 : 1,
                  },
                ]}>
                <View style={styles.showroomOptionText}>
                  <Text style={[Typography.screenTitle, styles.showroomOptionName, { color: colors['on-background'] }]}>
                    {showroom.showroom_name || `Showroom ${showroom.showroom_id}`}
                  </Text>
                  <Text style={[Typography.caption, styles.showroomOptionMeta, { color: colors['on-surface-variant'] }]}>
                    {[showroom.external_showroom_id, showroom.role].filter(Boolean).join(' • ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Grid.columns.margin,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(3, 20, 39, 0.62)',
  },
  showroomModalCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  showroomModalIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showroomModalTitle: {
    textAlign: 'center',
    lineHeight: 27,
  },
  showroomModalSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  showroomOptionList: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  showroomOption: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  showroomOptionText: {
    flex: 1,
    gap: 4,
  },
  showroomOptionName: {
    lineHeight: 20,
  },
  showroomOptionMeta: {
    lineHeight: 15,
  },
});
