import { getProfile } from '@/services';
import { normalizeRole } from '@/permissions/permissions';
import { useAuthStore } from '@/store';

export type ShowroomRole = {
  showroom_id: number;
  showroom_name?: string | null;
  role?: string | null;
  /** Sent once the API resolves permissions server-side; ignored until then. */
  permissions?: string[] | null;
};

type ProfileData = {
  showroom_roles?: ShowroomRole[] | null;
};

/** The showroom a user acts on by default: the one they own, else the first they belong to. */
export function pickPrimaryShowroom(profile: ProfileData | null): ShowroomRole | null {
  const roles = profile?.showroom_roles ?? [];
  return roles.find((role) => role.role === 'owner') ?? roles[0] ?? null;
}

/**
 * The one place a profile response turns into showroom + role in the store.
 *
 * Every screen that fetches the profile should call this instead of setting the
 * showroom id on its own, so the id and the role can never disagree.
 */
export function syncShowroomFromProfile(profile: ProfileData | null): ShowroomRole | null {
  const showroom = pickPrimaryShowroom(profile);

  if (showroom?.showroom_id) {
    useAuthStore.getState().setPrimaryShowroom({
      showroomId: showroom.showroom_id,
      role: normalizeRole(showroom.role),
      permissions: showroom.permissions ?? null,
    });
  }

  return showroom;
}

/**
 * Resolves the showroom id every showroom-scoped endpoint needs.
 *
 * Returns the cached id when the store already has one, otherwise fetches the
 * profile once and caches it, so screens do not each re-derive it.
 */
export async function resolvePrimaryShowroomId(): Promise<number | undefined> {
  const { primaryShowroomId, primaryShowroomRole } = useAuthStore.getState();

  // Refetch when the role is missing: an id without a role means the app would
  // render with an empty permission set.
  if (primaryShowroomId && primaryShowroomRole) {
    return primaryShowroomId;
  }

  const response = await getProfile();
  const profile =
    (response as unknown as { data?: ProfileData })?.data ??
    (response as unknown as ProfileData);

  return syncShowroomFromProfile(profile ?? null)?.showroom_id ?? primaryShowroomId ?? undefined;
}
