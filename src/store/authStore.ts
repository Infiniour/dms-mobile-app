import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Role } from '@/permissions/permissions';

interface AuthState {
  hasSeenOnboarding: boolean;
  isLoggedIn: boolean;
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  canEnterApp: boolean;
  primaryShowroomId: number | null;
  /** Role in the primary showroom, persisted so a returning user skips the setup check on cold start. */
  primaryShowroomRole: Role | null;
  /** Permission list from the API, when it sends one. Overrides the local table. */
  permissions: string[] | null;
  setHasSeenOnboarding: (seen: boolean) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setCanEnterApp: (canEnter: boolean) => void;
  setFullName: (name: string) => void;
  setProfileContact: (contact: { countryCode?: string; phoneNumber?: string }) => void;
  setPrimaryShowroomId: (showroomId: number | null) => void;
  setPrimaryShowroom: (showroom: {
    showroomId: number | null;
    role: Role | null;
    permissions?: string[] | null;
  }) => void;
  completeProfile: (name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      isLoggedIn: false,
      fullName: '',
      countryCode: '',
      phoneNumber: '',
      canEnterApp: false,
      primaryShowroomId: null,
      primaryShowroomRole: null,
      permissions: null,
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
      setIsLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
      setCanEnterApp: (canEnter) => set({ canEnterApp: canEnter }),
      setFullName: (name) => set({ fullName: name }),
      setProfileContact: ({ countryCode, phoneNumber }) =>
        set((state) => ({
          countryCode: countryCode ?? state.countryCode,
          phoneNumber: phoneNumber ?? state.phoneNumber,
        })),
      setPrimaryShowroomId: (showroomId) => set({ primaryShowroomId: showroomId }),
      // Showroom and role move together: the role is per showroom, so setting
      // one without the other is always a bug.
      setPrimaryShowroom: ({ showroomId, role, permissions }) =>
        set({
          primaryShowroomId: showroomId,
          primaryShowroomRole: role,
          permissions: permissions ?? null,
        }),
      completeProfile: (name) => set({ fullName: name, isLoggedIn: true }),
      logout: () =>
        set({
          isLoggedIn: false,
          canEnterApp: false,
          fullName: '',
          countryCode: '',
          phoneNumber: '',
          primaryShowroomId: null,
          primaryShowroomRole: null,
          permissions: null,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
        isLoggedIn: state.isLoggedIn,
        fullName: state.fullName,
        countryCode: state.countryCode,
        phoneNumber: state.phoneNumber,
        canEnterApp: state.canEnterApp,
        primaryShowroomId: state.primaryShowroomId,
        primaryShowroomRole: state.primaryShowroomRole,
        permissions: state.permissions,
      }),
    }
  )
);
