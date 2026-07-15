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
  if (raw.schemaVersion !== DATA_SCHEMA_VERSION) return { status: 'unsupported_version', version: raw.schemaVersion };
  const reason = validateVersionOne(raw);
  return reason ? corrupt(reason) : { status: 'ok', data: structuredClone(raw as unknown as SigmaData) };
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
