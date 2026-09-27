# Permissions

How the app decides what a user can see and do.

## The one rule

**Screens ask for capabilities, never for roles.**

```ts
// ✅ do this
if (can(PERMISSIONS.VEHICLE_CREATE)) { ... }

// ❌ never this
if (role === 'employee') { ... }
```

Roles change constantly; the set of things the app can *do* changes slowly. If you
write `role === 'employee'` in a screen, then adding role #4 means hunting through
every screen. If you write `can('vehicle:create')`, adding a role is one line in one
table.

A permission is always `resource:action` — `vehicle:read`, `employee:delete`,
`showroom:update`.

This also solves "same role, read on one screen, write on another" for free. It isn't
a special case, it's just which keys are in that role's set.

## Files

| File | Holds |
|---|---|
| `permissions.ts` | Permission keys, the role → permission table, `resolvePermissions` |
| `policies.ts` | Rules that depend on *which* record is being acted on |
| `routes.ts` | One manifest driving both the tab bar and the route guards |
| `usePermissions.ts` | The `can()` hook |
| `RequirePermission.tsx` | The screen guard component |

## Using it

### In a component — hide an action

```tsx
const { can } = usePermissions();

{can(PERMISSIONS.VEHICLE_CREATE) ? <AddButton /> : null}
```

**Hide, don't disable.** An action the user can *never* perform should be absent — a
greyed-out button reads as broken. Disabled is for something they *could* do but not
right now (form incomplete, request in flight).

### On a row or card — ask about the specific record

```tsx
{can(PERMISSIONS.EMPLOYEE_DELETE, member) ? <DeleteButton /> : null}
```

Passing a second argument runs the policy for that permission (see below). Without
it, you're asking "could I ever do this?"

### On a screen — the actual guard

```tsx
export default function EmployeesRoute() {
  return (
    <RequirePermission permission={PERMISSIONS.EMPLOYEE_READ}>
      <ManageEmployeesScreen />
    </RequirePermission>
  );
}
```

Hiding a tab is cosmetic — a deep link or a stray `router.push` still mounts the
screen. **Every restricted screen needs this wrapper.** The tab manifest is UX; this
is the rule.

## How to: add a new role

This is the case the whole design exists for. Say you're adding `accountant`.

1. **`permissions.ts`** — add it to the `Role` union:

   ```ts
   export type Role = 'owner' | 'manager' | 'employee' | 'accountant';
   ```

2. Build its set by composing an existing one:

   ```ts
   const ACCOUNTANT_PERMISSIONS: Permission[] = [
     ...EMPLOYEE_PERMISSIONS,
     PERMISSIONS.REPORTS_READ,
   ];
   ```

3. Register it:

   ```ts
   export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
     employee: EMPLOYEE_PERMISSIONS,
     accountant: ACCOUNTANT_PERMISSIONS,
     manager: MANAGER_PERMISSIONS,
     owner: OWNER_PERMISSIONS,
   };
   ```

4. Teach `normalizeRole` the new string so the API value is accepted.

That's it. Tabs, guards, and every button update themselves, because they all read
`can()`. **No screen files change.**

## How to: add a new permission

1. Add the key to `PERMISSIONS`.
2. Add it to whichever role sets should have it.
3. Use it — `can(...)` in components, `RequirePermission` on screens.

Careful with composition: `MANAGER_PERMISSIONS` spreads `EMPLOYEE_PERMISSIONS`, so
anything you add to employee flows up to manager and owner. To give a permission to
manager *only*, add it in the manager list, not the employee one.

## How to: add a new screen

1. Add a row to `ROUTE_PERMISSIONS` in `routes.ts` (`null` = everyone signed in).
2. Wrap the route in `RequirePermission`.

Both steps, always. The manifest exists so a screen can't be visible-but-unguarded.

## How to: add a tab

1. Add a row to `TAB_PERMISSIONS` keyed by the file name (`vehicles`, `sales`, …).
2. Pass `href: tabHref('yourtab')` in `(tabs)/_layout.tsx`.
3. Wrap the screen in `RequirePermission`.

## How to: a rule that depends on the record

When "can edit" depends on *which* thing — "only vehicles they added", "managers
can't remove other managers" — do **not** invent a permission like
`vehicle:updateOwn`. Those multiply forever.

Add a policy in `policies.ts` instead:

```ts
export const POLICIES: Partial<Record<Permission, Policy>> = {
  [PERMISSIONS.EMPLOYEE_DELETE]: (member, context) => {
    if (isSelf(member, context) || member.role === 'owner') return false;
    if (context.role === 'manager') return member.role === 'employee';
    return true;
  },
};
```

Two things to know:

- A policy runs **only after** the flat permission check passes. It can narrow
  access, never grant it.
- A policy only runs when a caller passes a subject: `can(perm, subject)`. The
  no-argument form skips policies — which is correct for nav and route guards,
  since they have no record in hand yet.

## Current matrix

| Permission | employee | manager | owner |
|---|:---:|:---:|:---:|
| `dashboard:read` | – | ✓ | ✓ |
| `vehicle:read` | ✓ | ✓ | ✓ |
| `vehicle:create` | – | ✓ | ✓ |
| `vehicle:update` | – | ✓ | ✓ |
| `vehicle:delete` | – | – | ✓ |
| `employee:read` | – | ✓ | ✓ |
| `employee:create` | – | ✓ | ✓ |
| `employee:update` | – | – | ✓ |
| `employee:delete` | – | ✓ | ✓ |
| `expense:create` | – | ✓ | ✓ |
| `sale:read` | – | ✓ | ✓ |
| `sale:create` | – | ✓ | ✓ |
| `showroom:read` | ✓ | ✓ | ✓ |
| `showroom:update` | – | ✓ | ✓ |
| `reports:read` | – | ✓ | ✓ |
| `tags:read` | – | ✓ | ✓ |
| `tags:update` | – | ✓ | ✓ |
| `notification:read` | – | ✓ | ✓ |

This mirrors what the API enforces: managers may add members and edit the showroom,
only owners may change a member's role.

`reports:read` is granted but currently drives no screen — the Reports tab was
replaced by the Sales Panel (`sale:read`). It is kept for a reporting screen
later rather than being removed and re-added.

**What each role sees:**

- **employee** — Vehicles (read-only) and Account (theme + sign out). Two tabs.
- **manager** — everything except deleting vehicles and changing member roles.
- **owner** — everything.

## Where the role comes from

`primaryShowroomRole` in `authStore`. Role is **per showroom** (the API returns
`showroom_roles[]`), so it's set together with the showroom id via
`setPrimaryShowroom` — never separately, or the two can disagree.

`syncShowroomFromProfile()` in `utils/showroom.ts` is the **only** place a profile
response becomes showroom + role. If you add a screen that fetches the profile, call
that instead of setting the id yourself.

Load order on a cold start:

```
SetupLoadingScreen  →  getProfile()  →  syncShowroomFromProfile()  →  canEnterApp
                                                                        ↓
(app)/_layout       →  no role? back to the loader  →  <Tabs> renders
```

The layout refuses to render tabs without a role. Otherwise a restricted user sees
the full navigation for a frame and can tap through it.

The role is **not persisted** — it's refetched every cold start. A stale cached role
must never be the thing that grants access.

## Gotchas

- **`href: null` is cosmetic.** It hides a tab; the route still exists and still
  mounts. `RequirePermission` is what actually blocks.
- **The server is the authority.** All of this is UI convenience. The backend already
  enforces the real rules and will return 403 regardless of what the client thinks.
  Never treat the client's opinion of the role as a security boundary.
- **Unknown role → empty set.** Deny by default. A bug should read as "I can't see
  it", never as unearned access.
- **Redirect targets must be reachable.** `RequirePermission` defaults to
  `SAFE_ROUTE` (Account), which has no permission requirement and so can't loop. If
  you pass a custom `redirectTo`, make sure the user can actually open it.

## Coming later: server-provided permissions

`resolvePermissions()` already prefers a `permissions` array on the showroom role and
falls back to the local table only when the API doesn't send one. Unknown keys are
ignored, so the backend can add permissions before the app knows their names.

The day the API returns:

```json
{ "showroom_id": 12, "role": "owner", "permissions": ["vehicle:read", ...] }
```

…it starts working with no app change. That's the goal — permission changes become
config, not an app-store release. Until then the local table is the source of truth.
