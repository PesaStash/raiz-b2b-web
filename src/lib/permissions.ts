export type AccountRole = "owner" | "admin" | "developer";
/** The profile endpoint serializes `active` as 0/1; other endpoints use booleans. */
export type ActiveFlag = boolean | 0 | 1;
export type PermissionProfile = {
  role?: AccountRole;
  active?: ActiveFlag;
  effective_permissions?: string[] | Record<string, boolean>;
};

export const isActiveFlag = (value: unknown) => value === true || value === 1;
export const isInactiveFlag = (value: unknown) => value === false || value === 0;

/** Role boundaries come from the B2B frontend contract, not API-key scopes. */
export function accountAccess(profile?: PermissionProfile | null) {
  const active = isActiveFlag(profile?.active);
  const role = active ? profile?.role : undefined;
  return {
    role,
    canManageTeam: role === "owner",
    canWriteBusiness: role === "owner" || role === "admin",
    canManageDeveloperTools: role === "owner" || role === "admin" || role === "developer",
    isDeveloper: role === "developer",
  };
}

export const RESTRICTED_PRODUCTION_SCOPES = new Set([
  "payments:write", "payouts:write", "remittance:settlement:write",
]);

// Explicit deployment configuration avoids confusing `next build` with a live backend.
// Unknown deployments use the conservative production policy.
export function isProductionDeployment(environment?: string) {
  return !["development", "test", "sandbox", "staging", "preview"].includes(environment?.toLowerCase() ?? "");
}

export function canRequestScope(role: AccountRole | undefined, scope: string, production: boolean) {
  return !!role && !(role === "developer" && production && RESTRICTED_PRODUCTION_SCOPES.has(scope));
}

export function isPublicPath(path: string) {
  return ["/login", "/register", "/forgot-password", "/verify", "/pay", "/accept-invite"].some(p => path === p || path.startsWith(p + "/"));
}

/** Defense in depth for legacy forms. Backend authorization remains authoritative. */
export function canMakeRequest(profile: PermissionProfile | null, method: string, path: string) {
  const access = accountAccess(profile);
  if (/^\/business\/account_user\/team(?:\/|$)/.test(path)) return access.canManageTeam;
  if (["get", "head", "options"].includes(method.toLowerCase())) return true;
  if (/^\/business\/auth\/(logout|password\/change)(?:\/|$)/.test(path)) return true;
  if (/^\/b2b\/developers\/(keys|webhooks)(?:\/|$)/.test(path)) return access.canManageDeveloperTools;
  // Notification read markers and feedback do not mutate business/financial settings.
  if (/\/notifications\//.test(path) || /\/feedback\/?$/.test(path)) return true;
  return access.canWriteBusiness;
}
