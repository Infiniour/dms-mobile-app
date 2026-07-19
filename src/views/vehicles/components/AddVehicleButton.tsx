import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function AddVehicleButton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.addButton, { borderColor: colors.primary }]}>
      <Ionicons name="add" size={24} color={colors.primary} />
      <Text style={[styles.addText, { color: colors.primary }]}>Add new vehicle</Text>
    </View>
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
