import { normalizeRole } from '@/permissions';
import { syncShowroomFromProfile, type ShowroomRole } from '@/utils/showroom';

export type SetupProfileData = {
  required_name?: boolean;
  has_showrooms?: boolean;
  has_vehicles?: boolean;
  showroom_roles?: ShowroomRole[] | null;
};

export type SetupDestination = {
  href: '/(setup)/profile' | '/(setup)/welcome' | '/(setup)/welcome?step=vehicle' | '/(app)';
  canEnterApp: boolean;
};

/**
 * The one place profile data turns into "where should this user land next".
 * Shared by the loading dispatcher and any screen that already has fresh
 * profile data and wants to skip bouncing back through it.
 */
export function resolveSetupDestination(profile: SetupProfileData): SetupDestination {
  if (profile.required_name) {
    return { href: '/(setup)/profile', canEnterApp: false };
  }

  if (!profile.has_showrooms) {
    return { href: '/(setup)/welcome', canEnterApp: false };
  }

  if (!profile.has_vehicles) {
    return { href: '/(setup)/welcome?step=vehicle', canEnterApp: false };
  }

  const showroom = syncShowroomFromProfile(profile);

  // The app layout sends anyone without a role back to the loading screen, so
  // entering with an unresolved role would ping-pong forever. Stop with a retry instead.
  if (!normalizeRole(showroom?.role)) {
    throw new Error('We could not determine your access for this showroom.');
  }

  return { href: '/(app)', canEnterApp: true };
}
