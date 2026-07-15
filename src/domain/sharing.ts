import type { BrandFit, PhysicalMeasurement, SharingGrant, SharingScope, SigmaData, StandardSize } from './model.js';
export type CanonicalRecord = PhysicalMeasurement | StandardSize | BrandFit;
export function canManageProfile(data: SigmaData, actorId: string, targetId: string): boolean {
  const actor = data.profiles.find((p) => p.id === actorId);
  const target = data.profiles.find((p) => p.id === targetId);
  if (actor?.profileType !== 'independent' || !target) return false;
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
  if (actorId === record.profileId) return true;
  const owner = data.profiles.find((p) => p.id === record.profileId);
  if (owner?.profileType === 'managed' && owner.managedByProfileIds?.includes(actorId)) return true;
  return data.sharingGrants.some((g) => g.status === 'active' && g.ownerProfileId === record.profileId && g.recipientProfileId === actorId && scopeCovers(g.scope, record));
}
export function canCreateGrant(data: SigmaData, actorId: string, ownerId: string, recipientId: string): boolean {
  const owner = data.profiles.find((p) => p.id === ownerId); const recipient = data.profiles.find((p) => p.id === recipientId);
  if (!owner || !recipient || recipient.profileType !== 'independent' || ownerId === recipientId) return false;
  if (owner.profileType === 'independent') return actorId === ownerId && activeConnection(data, ownerId, recipientId);
  return !!owner.managedByProfileIds?.includes(actorId) && profilesShareFamily(data, ownerId, recipientId);
}
export const canRevokeGrant = (data: SigmaData, actorId: string, grant: SharingGrant) => grant.status === 'active' && (grant.grantedByProfileId === actorId || data.profiles.find((p) => p.id === grant.ownerProfileId)?.managedByProfileIds?.includes(actorId) === true);
