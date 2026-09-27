import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, FloatingField } from '@/components/ui';
import { Typography, Grid } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { addMember } from '@/services';
import { resolvePrimaryShowroomId } from '@/utils/showroom';

type Role = 'employee' | 'manager';

export function AddEmployeeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('employee');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    phoneNumber.replace(/\D/g, '').length === 10;

  const handleAddEmployee = async () => {
    if (!canSubmit) {
      setError('Please fill in first name, last name, and a 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const showroomId = await resolvePrimaryShowroomId();
      if (!showroomId) {
        setError('No showroom found');
        return;
      }

      await addMember({
        showroomId,
        name: [firstName.trim(), lastName.trim()].join(' '),
        country_code: countryCode,
        phone_number: phoneNumber.trim(),
        role: selectedRole,
      });

      // Success - go back
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      {/* Header with Back Button */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={[styles.title, { color: colors['on-surface'] }]}>
            Add Employee
          </Text>
          <Text style={[styles.subtitle, { color: colors['on-surface-variant'] }]}>
            Invite a new team member
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.nameRow}>
          <View style={[styles.section, styles.nameColumn]}>
            <FloatingField
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              editable={!isLoading}
              autoCapitalize="words"
            />
          </View>
          <View style={[styles.section, styles.nameColumn]}>
            <FloatingField
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              editable={!isLoading}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.phoneRow}>
          <View style={[styles.section, { flex: 1 }]}>
            <FloatingField
              label="Country code"
              value={countryCode}
              onChangeText={setCountryCode}
              keyboardType="number-pad"
              editable={!isLoading}
            />
          </View>

          <View style={[styles.section, { flex: 1.5 }]}>
            <FloatingField
              label="Phone number"
              value={phoneNumber}
              onChangeText={(value) => setPhoneNumber(value.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Role Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors['on-surface'] }]}>
            Assign Role
          </Text>
          <View style={styles.roleOptions}>
            <RoleButton
              label="Sales Staff"
              value="employee"
              selected={selectedRole === 'employee'}
              onPress={() => setSelectedRole('employee')}
              colors={colors}
              disabled={isLoading}
            />
            <RoleButton
              label="Manager"
              value="manager"
              selected={selectedRole === 'manager'}
              onPress={() => setSelectedRole('manager')}
              colors={colors}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors['error-container'] }]}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <Button
          label="Add Employee"
          onPress={handleAddEmployee}
          loading={isLoading}
          disabled={isLoading || !canSubmit}
          style={styles.addButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleButton({
  label,
  value,
  selected,
  onPress,
  colors,
  disabled,
}: {
  label: string;
  value: Role;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.roleButton,
        {
          backgroundColor: selected ? colors.primary : colors['surface-container-lowest'],
          borderColor: selected ? colors.primary : colors.outline,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View
        style={[
          styles.roleCheckbox,
          {
            borderColor: selected ? colors['on-primary'] : colors.primary,
            backgroundColor: selected ? colors['on-primary'] : 'transparent',
          },
        ]}>
        {selected && <Ionicons name="checkmark" size={14} color={colors.primary} />}
      </View>
      <Text
        style={[
          styles.roleLabel,
          {
            color: selected ? colors['on-primary'] : colors['on-surface'],
          },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    ...Typography.title,
    fontSize: 21,
    lineHeight: 26,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 24,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameColumn: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...Typography.screenTitle,
    fontSize: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    ...Typography.screenTitle,
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorText: {
    ...Typography.body,
    fontSize: 13,
    flex: 1,
  },
  addButton: {
    marginTop: 8,
  },
});
