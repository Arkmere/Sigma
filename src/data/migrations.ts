import { DATA_SCHEMA_VERSION, type SigmaData } from '../domain/model.js';

export type MigrationResult =
  | { status: 'ok'; data: SigmaData }
  | { status: 'corrupt'; reason: string }
  | { status: 'unsupported_version'; version: unknown };

const sourceTypes = new Set(['manual', 'imported_health_platform', 'imported_device', 'camera_assisted', 'body_scan', 'third_party_service']);
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string';
const nonEmpty = (value: unknown): value is string => string(value) && value.trim().length > 0;
const optionalString = (value: unknown) => value === undefined || string(value);
const timestampPair = (value: Record<string, unknown>) => string(value.createdAt) && string(value.updatedAt);

export function migrateStoredData(raw: unknown): MigrationResult {
  if (!object(raw)) return corrupt('Stored value is not an object.');
  if (raw.schemaVersion === 1) {
    const reason = validateVersionOne(raw); if (reason) return corrupt(reason);
    const migrated = { ...structuredClone(raw), schemaVersion: DATA_SCHEMA_VERSION, activeActorProfileId: undefined, families: [], familyMemberships: [], adultConnections: [], sharingGrants: [] } as unknown as SigmaData;
    const actor = migrated.profiles.find((p) => p.profileType === 'independent'); if (actor) migrated.activeActorProfileId = actor.id;
    return { status: 'ok', data: migrated };
  }
  if (raw.schemaVersion !== DATA_SCHEMA_VERSION) return { status: 'unsupported_version', version: raw.schemaVersion };
  const reason = validateVersionTwo(raw);
  return reason ? corrupt(reason) : { status: 'ok', data: structuredClone(raw as unknown as SigmaData) };
}

function validateVersionTwo(root: Record<string, unknown>): string | undefined {
  const base = validateVersionOne(root); if (base) return base;
  if (![root.families, root.familyMemberships, root.adultConnections, root.sharingGrants].every(Array.isArray)) return 'Ticket 4 collections must be arrays.';
  if (!optionalString(root.activeActorProfileId)) return 'activeActorProfileId must be a string when present.';
  const profiles = root.profiles as Record<string, unknown>[]; const profile = (id: unknown) => profiles.find((p) => p.id === id);
  if (root.activeActorProfileId !== undefined && profile(root.activeActorProfileId)?.profileType !== 'independent') return 'The active actor must be an independent profile.';
  for (const p of profiles) {
    if (p.profileType === 'independent' && (p.managedByProfileIds !== undefined || p.managedKind !== undefined)) return 'Independent profiles cannot have managed fields.';
    if (p.managedByProfileIds !== undefined && (!Array.isArray(p.managedByProfileIds) || new Set(p.managedByProfileIds).size !== p.managedByProfileIds.length || p.managedByProfileIds.some((id) => profile(id)?.profileType !== 'independent'))) return 'Managed profile managers are invalid.';
    if (p.managedKind !== undefined && !['child', 'dependant'].includes(String(p.managedKind))) return 'Managed kind is invalid.';
  }
  const families = root.families as Record<string, unknown>[];
  for (const f of families) if (!requiredStrings(f, ['id','name','createdByProfileId','createdAt','updatedAt']) || profile(f.createdByProfileId)?.profileType !== 'independent') return 'A Family is invalid.';
  const memberships = root.familyMemberships as Record<string, unknown>[]; const membershipKeys = new Set<string>();
  for (const m of memberships) { if (!requiredStrings(m,['id','familyId','profileId','addedByProfileId','createdAt']) || !families.some((f) => f.id === m.familyId) || !profile(m.profileId) || profile(m.addedByProfileId)?.profileType !== 'independent') return 'A Family membership is invalid.'; const key=`${m.familyId}:${m.profileId}`; if(membershipKeys.has(key)) return 'Duplicate Family membership.'; membershipKeys.add(key); }
  for (const c of root.adultConnections as Record<string, unknown>[]) if (!requiredStrings(c,['id','initiatorProfileId','recipientProfileId','status','requestedAt']) || c.initiatorProfileId === c.recipientProfileId || profile(c.initiatorProfileId)?.profileType !== 'independent' || profile(c.recipientProfileId)?.profileType !== 'independent' || !['pending','active','declined','disconnected'].includes(String(c.status)) || ![c.respondedAt,c.disconnectedAt,c.disconnectedByProfileId].every(optionalString)) return 'An adult connection is invalid.';
  const records = [...root.measurements as Record<string,unknown>[], ...root.standardSizes as Record<string,unknown>[], ...root.brandFits as Record<string,unknown>[]];
  for (const g of root.sharingGrants as Record<string, unknown>[]) {
    if (!requiredStrings(g,['id','ownerProfileId','recipientProfileId','grantedByProfileId','status','grantedAt']) || !profile(g.ownerProfileId) || profile(g.recipientProfileId)?.profileType !== 'independent' || !profile(g.grantedByProfileId) || !['active','revoked'].includes(String(g.status)) || !object(g.scope)) return 'A sharing grant is invalid.';
    const s=g.scope; if (s.type === 'category' ? !nonEmpty(s.category) : s.type === 'record_kind' ? !['standard_size','brand_fit'].includes(String(s.recordKind)) : s.type === 'record' ? !['measurement','standard_size','brand_fit'].includes(String(s.recordKind)) || !records.some((r)=>r.id===s.recordId && r.kind===s.recordKind) : s.type !== 'profile') return 'A sharing scope is invalid.';
    if ((g.status === 'active' && (g.revokedAt !== undefined || g.revokedByProfileId !== undefined)) || (g.status === 'revoked' && (!nonEmpty(g.revokedAt) || !nonEmpty(g.revokedByProfileId)))) return 'Grant revocation metadata is inconsistent.';
  }
  return undefined;
}

function validateVersionOne(root: Record<string, unknown>): string | undefined {
  if (!Array.isArray(root.profiles) || !Array.isArray(root.measurements) || !Array.isArray(root.standardSizes) || !Array.isArray(root.brandFits)) return 'Required record collections must be arrays.';
  if (!optionalString(root.activeProfileId)) return 'activeProfileId must be a string when present.';
  for (const profile of root.profiles) {
    if (!object(profile) || !nonEmpty(profile.id) || !nonEmpty(profile.displayName) || !['independent', 'managed'].includes(String(profile.profileType)) || !timestampPair(profile)) return 'A profile has an invalid required field.';
    if (![profile.relationshipLabel, profile.dateOfBirth, profile.notes].every(optionalString)) return 'A profile has an invalid optional field.';
  }
  for (const record of root.measurements) {
    if (!object(record) || !requiredStrings(record, ['id', 'profileId', 'measurementType', 'category', 'label', 'createdAt', 'updatedAt']) || record.kind !== 'measurement' || record.visibility !== 'private' || !Array.isArray(record.values)) return 'A physical measurement has an invalid required field.';
    for (const value of record.values) if (!validMeasurementValue(value)) return 'A physical measurement value has an invalid field.';
  }
  for (const record of root.standardSizes) if (!validStandardSize(record)) return 'A standard-size record has an invalid field.';
  for (const record of root.brandFits) if (!validBrandFit(record)) return 'A brand-fit record has an invalid field.';
  const profileIds = new Set(root.profiles.map((profile) => (profile as Record<string, unknown>).id));
  if (root.activeProfileId !== undefined && !profileIds.has(root.activeProfileId)) return 'The active profile does not exist.';
  for (const collection of [root.measurements, root.standardSizes, root.brandFits]) for (const record of collection) if (!profileIds.has((record as Record<string, unknown>).profileId)) return 'A record refers to a profile that does not exist.';
  return undefined;
}

function validMeasurementValue(value: unknown): boolean {
  if (!object(value) || !requiredStrings(value, ['id', 'unit', 'measuredAt', 'recordedAt', 'originalUnit', 'createdAt']) || typeof value.value !== 'number' || !Number.isFinite(value.value) || typeof value.originalValue !== 'number' || !Number.isFinite(value.originalValue) || !sourceTypes.has(String(value.sourceType)) || !sourceTypes.has(String(value.acquisitionMethod))) return false;
  return optionalString(value.sourceName) && optionalString(value.notes) && (value.confidence === undefined || (typeof value.confidence === 'number' && Number.isFinite(value.confidence)));
}

function validStandardSize(value: unknown): boolean {
  return object(value) && requiredStrings(value, ['id', 'profileId', 'category', 'label', 'sizingSystem', 'sizeValue', 'recordedAt', 'createdAt', 'updatedAt']) && value.kind === 'standard_size' && value.visibility === 'private' && sourceTypes.has(String(value.sourceType)) && optionalString(value.sourceName) && optionalString(value.notes);
}

function validBrandFit(value: unknown): boolean {
  return object(value) && requiredStrings(value, ['id', 'profileId', 'category', 'brand', 'sizingSystem', 'sizeValue', 'recordedAt', 'createdAt', 'updatedAt']) && value.kind === 'brand_fit' && value.visibility === 'private' && sourceTypes.has(String(value.sourceType)) && [value.productName, value.productLine, value.fitNotes, value.sourceName].every(optionalString);
}

function requiredStrings(value: Record<string, unknown>, keys: string[]): boolean { return keys.every((key) => nonEmpty(value[key])); }
function corrupt(reason: string): MigrationResult { return { status: 'corrupt', reason }; }
