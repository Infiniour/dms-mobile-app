import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Typography, Grid } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { listMembers, addMember, removeMember, updateMemberRole } from '@/services';
import { resolvePrimaryShowroomId } from '@/utils/showroom';
import { SkeletonBox, BackButton, BottomSheet, FloatingField } from '@/components/ui';
import { useTabDataFetch } from '@/hooks/useTabDataFetch';
import { PERMISSIONS, usePermissions, type PermissionCheck } from '@/permissions';

type Role = 'employee' | 'manager';

type Member = {
  user_id: number;
  name: string | null;
  phone_number: string | null;
  role: string | null;
};

type MembersResponse = {
  data?: {
    members?: Member[];
    total?: number;
  };
};

export function ManageEmployeesScreen() {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { can } = usePermissions();
  const [employees, setEmployees] = useState<Member[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('employee');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [addError, setAddError] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<Role>('employee');
  const horizontalPadding = screenWidth < 360 ? 16 : Grid.columns.margin;

  const { isLoading, setIsLoading } = useTabDataFetch({
    onFocus: async ({ isCancelled }) => {
      const showroomId = await resolvePrimaryShowroomId();
      if (!showroomId || isCancelled()) {
        return;
      }

      const response = await listMembers({ showroomId });
      if (isCancelled()) {
        return;
      }

      const data = (response as unknown as MembersResponse)?.data;
      setEmployees(data?.members ?? []);
    },
  });

  const handleAddEmployee = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      setAddError('Please fill in all required fields');
      return;
    }

    setIsAddingEmployee(true);
    setAddError('');

    try {
      const showroomId = await resolvePrimaryShowroomId();
      if (!showroomId) {
        setAddError('No showroom found');
        return;
      }

      await addMember({
        showroomId,
        name: name.trim(),
        country_code: countryCode,
        phone_number: phoneNumber.trim(),
        role: selectedRole,
      });

      // Refresh the list
      setIsLoading(true);
      const response = await listMembers({ showroomId });
      const data = (response as unknown as MembersResponse)?.data;
      setEmployees(data?.members ?? []);
      setIsLoading(false);

      // Reset and close
      setName('');
      setCountryCode('91');
      setPhoneNumber('');
      setSelectedRole('employee');
      setAddError('');
      setShowAddSheet(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add employee');
    } finally {
      setIsAddingEmployee(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: number, employeeName: string) => {
    Alert.alert(
      'Remove Employee',
      `Are you sure you want to remove ${employeeName} from your team?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              const showroomId = await resolvePrimaryShowroomId();
              if (!showroomId) return;

              await removeMember({ showroomId, userId: employeeId });

              // Refresh the list
              setIsLoading(true);
              const response = await listMembers({ showroomId });
              const data = (response as unknown as MembersResponse)?.data;
              setEmployees(data?.members ?? []);
              setIsLoading(false);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove employee');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleUpdateRole = async (employeeId: number, newRole: Role, employeeName: string) => {
    Alert.alert(
      'Update Role',
      `Change ${employeeName}'s role to ${newRole === 'manager' ? 'Manager' : 'Sales Staff'}?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              const showroomId = await resolvePrimaryShowroomId();
              if (!showroomId) return;

              await updateMemberRole({ showroomId, userId: employeeId, role: newRole });

              // Refresh the list
              setIsLoading(true);
              const response = await listMembers({ showroomId });
              const data = (response as unknown as MembersResponse)?.data;
              setEmployees(data?.members ?? []);
              setIsLoading(false);
              setEditingMemberId(null);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update role');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      {/* Header with Back Button */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <BackButton />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        {/* Title & Description */}
        <Text style={[Typography.hero2, styles.title, { color: colors['on-surface'] }]}>
          Manage Employees
        </Text>
        <Text style={[Typography.body, styles.subtitle, { color: colors['on-surface-variant'] }]}>
          Add & manage your sales staff
        </Text>

        {/* Add Button */}
        {can(PERMISSIONS.EMPLOYEE_CREATE) ? (
          <Pressable
            onPress={() => setShowAddSheet(true)}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Ionicons name="add" size={24} color={colors['on-primary']} />
            <Text style={[styles.addButtonText, { color: colors['on-primary'] }]}>
              Add Employee
            </Text>
          </Pressable>
        ) : null}

        {isLoading ? (
          <>
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <View key={`skeleton-${index}`} style={styles.skeletonContainer}>
                  <EmployeeCardSkeleton />
                </View>
              ))}
          </>
        ) : employees.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors['surface-container-high'] }]}>
              <MaterialCommunityIcons name="account-plus-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors['on-surface'] }]}>
              No Employees Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors['on-surface-variant'] }]}>
              Start building your team by adding your first employee
            </Text>
          </View>
        ) : (
          <>
            {employees.map((employee) => (
              <View key={employee.user_id} style={styles.employeeItemContainer}>
                <EmployeeCard
                  employee={employee}
                  onDelete={handleDeleteEmployee}
                  onEditRole={handleUpdateRole}
                  editingMemberId={editingMemberId}
                  editingRole={editingRole}
                  onSetEditingMember={setEditingMemberId}
                  onSetEditingRole={setEditingRole}
                  can={can}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Add Employee Bottom Sheet */}
      <BottomSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        style={styles.fullHeightSheet}>
        <AddEmployeeBottomSheet
          onClose={() => setShowAddSheet(false)}
          onAdd={handleAddEmployee}
          name={name}
          setName={setName}
          countryCode={countryCode}
          setCountryCode={setCountryCode}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          isLoading={isAddingEmployee}
          error={addError}
          colors={colors}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

function AddEmployeeBottomSheet({
  onClose,
  onAdd,
  name,
  setName,
  countryCode,
  setCountryCode,
  phoneNumber,
  setPhoneNumber,
  selectedRole,
  setSelectedRole,
  isLoading,
  error,
  colors,
}: {
  onClose: () => void;
  onAdd: () => void;
  name: string;
  setName: (val: string) => void;
  countryCode: string;
  setCountryCode: (val: string) => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  selectedRole: Role;
  setSelectedRole: (val: Role) => void;
  isLoading: boolean;
  error: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <View>
          <Text style={[styles.sheetTitle, { color: colors['on-surface'] }]}>
            Add Employee
          </Text>
          <Text style={[styles.sheetSubtitle, { color: colors['on-surface-variant'] }]}>
            Invite a new team member to your showroom
          </Text>
        </View>
        <Pressable onPress={onClose} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons name="close" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {/* Form Section */}
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <FloatingField
            label="Full name"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
            autoCapitalize="words"
            error={Boolean(error)}
          />
          <Text style={[styles.helperText, { color: colors['on-surface-variant'] }]}>
            Employee's full name
          </Text>
        </View>

        <View style={styles.phoneRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <FloatingField
              label="Country code"
              value={countryCode}
              onChangeText={setCountryCode}
              keyboardType="number-pad"
              editable={!isLoading}
              error={Boolean(error)}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1.5 }]}>
            <FloatingField
              label="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!isLoading}
              error={Boolean(error)}
            />
          </View>
        </View>

        {/* Role Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors['on-surface'] }]}>
            Select Role *
          </Text>
          <View style={styles.roleOptions}>
            <RoleButton
              label="Sales Staff"
              selected={selectedRole === 'employee'}
              onPress={() => setSelectedRole('employee')}
              colors={colors}
              disabled={isLoading}
            />
            <RoleButton
              label="Manager"
              selected={selectedRole === 'manager'}
              onPress={() => setSelectedRole('manager')}
              colors={colors}
              disabled={isLoading}
            />
          </View>
        </View>

        {/* Role Description */}
        <View
          style={[
            styles.roleInfo,
            { backgroundColor: colors['surface-container-low'] },
          ]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <View style={styles.roleInfoText}>
            <Text style={[styles.roleInfoTitle, { color: colors['on-surface'] }]}>
              {selectedRole === 'manager' ? 'Manager' : 'Sales Staff'}
            </Text>
            <Text style={[styles.roleInfoDesc, { color: colors['on-surface-variant'] }]}>
              {selectedRole === 'manager'
                ? 'Can manage employees and access admin features'
                : 'Standard employee with basic access'}
            </Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors['error-container'] }]}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.sheetActions}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.cancelButton,
            {
              backgroundColor: colors['surface-container-high'],
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <Text style={[styles.cancelButtonText, { color: colors['on-surface'] }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onAdd}
          disabled={isLoading || !name.trim() || !phoneNumber.trim()}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor:
                isLoading || !name.trim() || !phoneNumber.trim() ? colors['surface-container-high'] : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <Ionicons
            name="add"
            size={22}
            color={
              isLoading || !name.trim() || !phoneNumber.trim()
                ? colors['on-surface-variant']
                : colors['on-primary']
            }
          />
          <Text
            style={[
              styles.addButtonText,
              {
                color:
                  isLoading || !name.trim() || !phoneNumber.trim()
                    ? colors['on-surface-variant']
                    : colors['on-primary'],
              },
            ]}>
            {isLoading ? 'Adding...' : 'Add Employee'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function RoleButton({
  label,
  selected,
  onPress,
  colors,
  disabled,
}: {
  label: string;
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

function EmployeeCard({
  employee,
  onDelete,
  onEditRole,
  editingMemberId,
  editingRole,
  onSetEditingMember,
  onSetEditingRole,
  can,
}: {
  employee: Member;
  onDelete: (employeeId: number, employeeName: string) => void;
  onEditRole: (employeeId: number, newRole: Role, employeeName: string) => void;
  editingMemberId: number | null;
  editingRole: Role;
  onSetEditingMember: (id: number | null) => void;
  onSetEditingRole: (role: Role) => void;
  can: PermissionCheck['can'];
}) {
  const { colors } = useTheme();
  const roleText = employee.role ? employee.role.charAt(0).toUpperCase() + employee.role.slice(1) : 'Staff';
  const isEditing = editingMemberId === employee.user_id;
  // The policies behind these decide the rest: not yourself, not the owner, and
  // a manager may only act on employees.
  const canEditRole = can(PERMISSIONS.EMPLOYEE_UPDATE, employee);
  const canDelete = can(PERMISSIONS.EMPLOYEE_DELETE, employee);

  return (
    <View
      style={[
        styles.employeeCard,
        {
          backgroundColor: colors['surface-container-lowest'],
          borderColor: colors.outline,
        },
      ]}>
      <View
        style={[
          styles.employeeAvatar,
          { backgroundColor: colors['surface-container-high'] },
        ]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {(employee.name || 'E')[0].toUpperCase()}
        </Text>
      </View>

      <View style={styles.employeeInfo}>
        <Text style={[styles.employeeName, { color: colors['on-surface'] }]} numberOfLines={1}>
          {employee.name || 'Unnamed Employee'}
        </Text>
        {isEditing ? (
          <View style={styles.roleEditOptions}>
            <Pressable
              onPress={() => {
                onSetEditingRole('employee');
                onEditRole(employee.user_id, 'employee', employee.name || 'Employee');
              }}
              style={({ pressed }) => [
                styles.roleEditButton,
                {
                  backgroundColor:
                    editingRole === 'employee' ? colors.primary : colors['surface-container-high'],
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.roleEditButtonText,
                  {
                    color:
                      editingRole === 'employee' ? colors['on-primary'] : colors['on-surface'],
                  },
                ]}>
                Staff
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSetEditingRole('manager');
                onEditRole(employee.user_id, 'manager', employee.name || 'Employee');
              }}
              style={({ pressed }) => [
                styles.roleEditButton,
                {
                  backgroundColor:
                    editingRole === 'manager' ? colors.primary : colors['surface-container-high'],
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.roleEditButtonText,
                  {
                    color:
                      editingRole === 'manager' ? colors['on-primary'] : colors['on-surface'],
                  },
                ]}>
                Manager
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.employeeRole, { color: colors['on-surface-variant'] }]} numberOfLines={1}>
            {roleText} • {employee.phone_number || 'No contact'}
          </Text>
        )}
      </View>

      <View style={styles.employeeActions}>
        {canEditRole ? (
          <Pressable
            onPress={() => {
              if (isEditing) {
                onSetEditingMember(null);
              } else {
                onSetEditingMember(employee.user_id);
                onSetEditingRole((employee.role as Role) || 'employee');
              }
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons
              name={isEditing ? 'close' : 'pencil-outline'}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        ) : null}
        {canDelete ? (
          <Pressable
            onPress={() => onDelete(employee.user_id, employee.name || 'Employee')}
            style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function EmployeeCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.employeeCard,
        {
          backgroundColor: colors['surface-container-lowest'],
          borderColor: colors.outline,
        },
      ]}>
      <SkeletonBox width={44} height={44} borderRadius={22} />

      <View style={styles.employeeInfo}>
        <SkeletonBox width="60%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width="70%" height={12} borderRadius={4} />
      </View>

      <View style={styles.employeeActions}>
        <SkeletonBox width={20} height={20} borderRadius={4} />
        <SkeletonBox width={20} height={20} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    ...Typography.screenTitle,
    fontSize: 16,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  skeletonContainer: {
    marginBottom: 12,
  },
  employeeItemContainer: {
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.title,
    fontSize: 18,
    lineHeight: 22,
  },
  emptySubtitle: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    ...Typography.screenTitle,
    fontSize: 18,
  },
  employeeInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  employeeName: {
    ...Typography.screenTitle,
    fontSize: 15,
    lineHeight: 18,
  },
  employeeRole: {
    ...Typography.body,
    fontSize: 12,
    lineHeight: 16,
  },
  roleEditOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  roleEditButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleEditButtonText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  employeeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  deleteButton: {
    marginLeft: 4,
  },
  fullHeightSheet: {
    minHeight: '100%',
  },
  sheetContent: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  sheetTitle: {
    ...Typography.title,
    fontSize: 24,
    lineHeight: 30,
  },
  sheetSubtitle: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  formSection: {
    gap: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...Typography.screenTitle,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Typography.body,
    fontSize: 16,
  },
  helperText: {
    ...Typography.caption,
    fontSize: 12,
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  roleCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleLabel: {
    ...Typography.screenTitle,
    fontSize: 15,
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  roleInfoText: {
    flex: 1,
    gap: 4,
  },
  roleInfoTitle: {
    ...Typography.screenTitle,
    fontSize: 14,
  },
  roleInfoDesc: {
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorText: {
    ...Typography.body,
    fontSize: 13,
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
  },
  cancelButtonText: {
    ...Typography.screenTitle,
    fontSize: 16,
    fontWeight: '600',
  },
});
