import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type AddVehicleButtonProps = {
  onPress?: () => void;
};

export function AddVehicleButton({ onPress }: AddVehicleButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.addButton,
        { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 },
      ]}>
      <Ionicons name="add" size={24} color={colors.primary} />
      <Text style={[styles.addText, { color: colors.primary }]}>Add new vehicle</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addButton: {
    height: 58,
    borderWidth: 1.4,
    borderStyle: 'dotted',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addText: {
    ...Typography.screenTitle,
    fontSize: 15,
    lineHeight: 18,
  },
});
