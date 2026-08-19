import type { BrandFit, PhysicalMeasurement, SharingGrant, SharingScope, SigmaData, StandardSize } from './model.js';
export type CanonicalRecord = PhysicalMeasurement | StandardSize | BrandFit;
// A dedicated actor identity for the local testing-only Super User/Admin login, never a real stored
// profile (so it can never be selected via ordinary means, exported in a backup, or referenced by
// data a normal account created). SigmaService.activeActor() returns a synthetic Profile with this ID
// when admin mode is active; every authorization primitive below treats it as "can do anything to any
// profile that actually exists," so admin capability lives in one place rather than being re-checked
// at each call site in service.ts.
export const ADMIN_ACTOR_ID = '__sigma_admin__';
export function canManageProfile(data: SigmaData, actorId: string, targetId: string): boolean {
  const target = data.profiles.find((p) => p.id === targetId);
  if (!target) return false;
  if (actorId === ADMIN_ACTOR_ID) return true;
  const actor = data.profiles.find((p) => p.id === actorId);
  if (actor?.profileType !== 'independent') return false;
  return target.profileType === 'independent' ? actorId === targetId : target.managedByProfileIds?.includes(actorId) === true;
}
export const profilesShareFamily = (data: SigmaData, a: string, b: string) => data.familyMemberships.some((m) => m.profileId === a && data.familyMemberships.some((n) => n.familyId === m.familyId && n.profileId === b));
export const activeConnection = (data: SigmaData, a: string, b: string) => data.adultConnections.some((c) => c.status === 'active' && ((c.initiatorProfileId === a && c.recipientProfileId === b) || (c.initiatorProfileId === b && c.recipientProfileId === a)));
export function scopeCovers(scope: SharingScope, record: CanonicalRecord): boolean {
  if (scope.type === 'profile') return true;
  if (scope.type === 'category') return scope.category === record.category;
  if (scope.type === 'record_kind') return scope.recordKind === record.kind;
  return scope.recordKind === record.kind && scope.recordId === record.id;
}
export function canViewRecord(data: SigmaData, actorId: string, record: CanonicalRecord): boolean {
  if (actorId === ADMIN_ACTOR_ID) return true;
  if (actorId === record.profileId) return true;
  const owner = data.profiles.find((p) => p.id === record.profileId);
  if (owner?.profileType === 'managed' && owner.managedByProfileIds?.includes(actorId)) return true;
  return data.sharingGrants.some((g) => g.status === 'active' && g.ownerProfileId === record.profileId && g.recipientProfileId === actorId && scopeCovers(g.scope, record));
}
export function canCreateGrant(data: SigmaData, actorId: string, ownerId: string, recipientId: string): boolean {
  const owner = data.profiles.find((p) => p.id === ownerId); const recipient = data.profiles.find((p) => p.id === recipientId);
  if (!owner || !recipient || recipient.profileType !== 'independent' || ownerId === recipientId) return false;
  if (actorId === ADMIN_ACTOR_ID) return true;
  if (owner.profileType === 'independent') return actorId === ownerId && activeConnection(data, ownerId, recipientId);
  return !!owner.managedByProfileIds?.includes(actorId) && profilesShareFamily(data, ownerId, recipientId);
}
export const canRevokeGrant = (data: SigmaData, actorId: string, grant: SharingGrant) => grant.status === 'active' && (actorId === ADMIN_ACTOR_ID || grant.grantedByProfileId === actorId || data.profiles.find((p) => p.id === grant.ownerProfileId)?.managedByProfileIds?.includes(actorId) === true);
