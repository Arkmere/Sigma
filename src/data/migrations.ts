import { DATA_SCHEMA_VERSION, type SigmaData } from '../domain/model.js';
import { canonicalFactById } from '../domain/canonical-facts.js';

export type MigrationResult =
  | { status: 'ok'; data: SigmaData }
  | { status: 'corrupt'; reason: string }
  | { status: 'unsupported_version'; version: unknown };

const sourceTypes = new Set(['manual', 'imported_health_platform', 'imported_device', 'camera_assisted', 'body_scan', 'third_party_service']);
const sourceIds = new Set(['manual','apple_health','health_connect','smart_scale','measurement_device','camera_assisted','body_scan','external_scan','third_party_scanner']);
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string';
const nonEmpty = (value: unknown): value is string => string(value) && value.trim().length > 0;
const optionalString = (value: unknown) => value === undefined || string(value);
const timestampPair = (value: Record<string, unknown>) => string(value.createdAt) && string(value.updatedAt);

export function migrateStoredData(raw: unknown): MigrationResult {
  if (!object(raw)) return corrupt('Stored value is not an object.');
  if (typeof raw.schemaVersion !== 'number' || !Number.isFinite(raw.schemaVersion)) return corrupt('schemaVersion must be a finite number.');
  if (raw.schemaVersion === 1) {
    const reason = validateVersionOne(raw); if (reason) return corrupt(reason);
    const migrated = { ...structuredClone(raw), schemaVersion: DATA_SCHEMA_VERSION, activeActorProfileId: undefined, families: [], familyMemberships: [], adultConnections: [], sharingGrants: [], importedFitCards: [] } as unknown as SigmaData;
    const actor = migrated.profiles.find((p) => p.profileType === 'independent'); if (actor) migrated.activeActorProfileId = actor.id;
    return { status: 'ok', data: migrated };
  }
  if (raw.schemaVersion === 2) {
    const reason=validateVersionTwo(raw,false);if(reason)return corrupt(reason);
    return {status:'ok',data:{...structuredClone(raw),schemaVersion:DATA_SCHEMA_VERSION,importedFitCards:[]} as unknown as SigmaData};
  }
  if (raw.schemaVersion === 3) {
    const reason=validateVersionTwo(raw,true);if(reason)return corrupt(reason);
    const migrated=structuredClone(raw) as Record<string,unknown>;
    migrated.schemaVersion=DATA_SCHEMA_VERSION; migrated.importedFitCards=[];
    applySafeCanonicalMappings(migrated);
    const canonicalReason=validateCanonicalRecords(migrated);if(canonicalReason)return corrupt(canonicalReason);
    return {status:'ok',data:migrated as unknown as SigmaData};
  }
  if (raw.schemaVersion === 4) {
    const reason=validateVersionTwo(raw,true);if(reason)return corrupt(reason);
    const migrated=structuredClone(raw) as Record<string,unknown>;
    migrated.schemaVersion=DATA_SCHEMA_VERSION; migrated.importedFitCards=[];
    const canonicalReason=validateCanonicalRecords(migrated);if(canonicalReason)return corrupt(canonicalReason);
    return {status:'ok',data:migrated as unknown as SigmaData};
  }
  if (raw.schemaVersion === 5) {
    const reason=validateVersionTwo(raw,true,true);if(reason)return corrupt(reason);
    const migrated=structuredClone(raw) as Record<string,unknown>;
    migrated.schemaVersion=DATA_SCHEMA_VERSION; migrated.importedFitCards=[];
    const canonicalReason=validateCanonicalRecords(migrated);if(canonicalReason)return corrupt(canonicalReason);
    return {status:'ok',data:migrated as unknown as SigmaData};
  }
  if (raw.schemaVersion === 6) {
    const reason=validateVersionTwo(raw,true,true);if(reason)return corrupt(reason);
    if(!Array.isArray(raw.importedFitCards))return corrupt('importedFitCards must be an array.');
    const migrated=structuredClone(raw) as Record<string,unknown>;
    // Schema 6 cards have no updatedAt (Ticket 11 added it); backfill it from importedAt so every
    // pre-existing card reads as "never refreshed" until its next real re-import.
    migrated.importedFitCards=(migrated.importedFitCards as Record<string,unknown>[]).map((card)=>object(card)&&string(card.importedAt)?{...card,updatedAt:card.importedAt}:card);
    migrated.schemaVersion=DATA_SCHEMA_VERSION;
    const cardReason=validateImportedFitCards(migrated);if(cardReason)return corrupt(cardReason);
    const canonicalReason=validateCanonicalRecords(migrated);if(canonicalReason)return corrupt(canonicalReason);
    return {status:'ok',data:migrated as unknown as SigmaData};
  }
  if (raw.schemaVersion !== DATA_SCHEMA_VERSION) return { status: 'unsupported_version', version: raw.schemaVersion };
  const reason = validateVersionTwo(raw,true,true) ?? validateImportedFitCards(raw);
  if(!reason){
    const canonicalReason=validateCanonicalRecords(raw);
    if(canonicalReason)return corrupt(canonicalReason);
  }
  return reason ? corrupt(reason) : { status: 'ok', data: structuredClone(raw as unknown as SigmaData) };
}

// Shared with SigmaService.importFitCard, which is the *first* place a decrypted, fully attacker-controlled
// payload is accepted (the sender chooses every field, including this device's own encryption passphrase for
// that file) — the live-import path used to only check top-level array-ness, which let malformed records
// (e.g. a non-numeric originalValue, or a measurement with no values array at all) reach local storage and
// rendering unvalidated. Reusing these exact rules at import time, not just at the next reload's stricter
// migration check, closes that gap instead of leaving two validators that could silently drift apart.
export function validateSharingScopeShape(scope: unknown): string | undefined {
  if (!object(scope)) return 'An imported fit card has an invalid scope.';
  if (!['profile','category','record_kind','record'].includes(String(scope.type))) return 'An imported fit card has an invalid scope.';
  if (scope.type === 'category' && !nonEmpty(scope.category)) return 'An imported fit card has an invalid scope.';
  if ((scope.type === 'record_kind' || scope.type === 'record') && !['measurement','standard_size','brand_fit'].includes(String(scope.recordKind))) return 'An imported fit card has an invalid scope.';
  if (scope.type === 'record' && !nonEmpty(scope.recordId)) return 'An imported fit card has an invalid scope.';
  return undefined;
}

export function validateFitCardRecords(measurements: unknown, standardSizes: unknown, brandFits: unknown): string | undefined {
  if (!Array.isArray(measurements) || !Array.isArray(standardSizes) || !Array.isArray(brandFits)) return 'An imported fit card has invalid record collections.';
  for (const record of measurements as Record<string,unknown>[]) {
    if (!object(record) || !requiredStrings(record, ['id','profileId','measurementType','category','label','createdAt','updatedAt']) || record.kind !== 'measurement' || record.visibility !== 'private' || !Array.isArray(record.values)) return 'An imported measurement has an invalid field.';
    for (const value of record.values) if (!validMeasurementValue(value,true,[],true)) return 'An imported measurement value has an invalid field.';
    if (!uniqueIds(record.values as Record<string,unknown>[])) return 'Imported measurement value IDs must be unique within their measurement.';
  }
  for (const record of standardSizes as Record<string,unknown>[]) if (!validStandardSize(record)) return 'An imported standard-size record has an invalid field.';
  for (const record of brandFits as Record<string,unknown>[]) if (!validBrandFit(record)) return 'An imported brand-fit record has an invalid field.';
  return undefined;
}

function validateImportedFitCards(root: Record<string, unknown>): string | undefined {
  if (!Array.isArray(root.importedFitCards)) return 'Imported fit cards must be an array.';
  const cards = root.importedFitCards as Record<string, unknown>[];
  if (!uniqueIds(cards)) return 'Imported fit card IDs must be unique.';
  for (const card of cards) {
    if (!requiredStrings(card, ['id','label','senderProfileId','senderDisplayName','importedAt','updatedAt']) || !object(card.scope)) return 'An imported fit card has an invalid required field.';
    const scopeReason = validateSharingScopeShape(card.scope); if (scopeReason) return scopeReason;
    const recordsReason = validateFitCardRecords(card.measurements, card.standardSizes, card.brandFits); if (recordsReason) return recordsReason;
  }
  return undefined;
}

function validateVersionTwo(root: Record<string, unknown>,allowCorrections=false,allowDanglingAttribution=false): string | undefined {
  const base = validateVersionOne(root,allowCorrections,allowDanglingAttribution); if (base) return base;
  if (![root.families, root.familyMemberships, root.adultConnections, root.sharingGrants].every(Array.isArray)) return 'Ticket 4 collections must be arrays.';
  if (!optionalString(root.activeActorProfileId)) return 'activeActorProfileId must be a string when present.';
  const profiles = root.profiles as Record<string, unknown>[]; const profile = (id: unknown) => profiles.find((p) => p.id === id);
  // Historical "who did this" attribution: schema 5 tolerates a reference to a profile that has since been deleted.
  // Subject/party fields (owner, recipient, membership profileId, etc.) are never covered by this — they must always resolve.
  const attributed = (id: unknown) => allowDanglingAttribution ? (profile(id) === undefined || profile(id)?.profileType === 'independent') : profile(id)?.profileType === 'independent';
  if (root.activeActorProfileId !== undefined && profile(root.activeActorProfileId)?.profileType !== 'independent') return 'The active actor must be an independent profile.';
  for (const p of profiles) {
    if (p.profileType === 'independent' && (p.managedByProfileIds !== undefined || p.managedKind !== undefined)) return 'Independent profiles cannot have managed fields.';
    if (p.managedByProfileIds !== undefined && (!Array.isArray(p.managedByProfileIds) || new Set(p.managedByProfileIds).size !== p.managedByProfileIds.length || p.managedByProfileIds.some((id) => profile(id)?.profileType !== 'independent'))) return 'Managed profile managers are invalid.';
    if (p.managedKind !== undefined && !['child', 'dependant'].includes(String(p.managedKind))) return 'Managed kind is invalid.';
  }
  const families = root.families as Record<string, unknown>[];
  for (const f of families) if (!requiredStrings(f, ['id','name','createdByProfileId','createdAt','updatedAt']) || !attributed(f.createdByProfileId)) return 'A Family is invalid.';
  const memberships = root.familyMemberships as Record<string, unknown>[]; const membershipKeys = new Set<string>();
  for (const m of memberships) { if (!requiredStrings(m,['id','familyId','profileId','addedByProfileId','createdAt']) || !families.some((f) => f.id === m.familyId) || !profile(m.profileId) || !attributed(m.addedByProfileId)) return 'A Family membership is invalid.'; const key=`${m.familyId}:${m.profileId}`; if(membershipKeys.has(key)) return 'Duplicate Family membership.'; membershipKeys.add(key); }
  for (const c of root.adultConnections as Record<string, unknown>[]) {
    if (!requiredStrings(c,['id','initiatorProfileId','recipientProfileId','status','requestedAt']) || c.initiatorProfileId === c.recipientProfileId || profile(c.initiatorProfileId)?.profileType !== 'independent' || profile(c.recipientProfileId)?.profileType !== 'independent' || !['pending','active','declined','disconnected'].includes(String(c.status)) || ![c.respondedAt,c.disconnectedAt,c.disconnectedByProfileId].every(optionalString)) return 'An adult connection is invalid.';
    if (c.status === 'pending' && [c.respondedAt,c.disconnectedAt,c.disconnectedByProfileId].some((v)=>v!==undefined)) return 'A pending connection has terminal metadata.';
    if ((c.status === 'active'||c.status === 'declined') && (!nonEmpty(c.respondedAt)||c.disconnectedAt!==undefined||c.disconnectedByProfileId!==undefined)) return 'A responded connection has inconsistent metadata.';
    if (c.status === 'disconnected' && (!nonEmpty(c.respondedAt)||!nonEmpty(c.disconnectedAt)||!nonEmpty(c.disconnectedByProfileId)||![c.initiatorProfileId,c.recipientProfileId].includes(c.disconnectedByProfileId))) return 'A disconnected connection has invalid metadata.';
  }
  if (![families, memberships, root.adultConnections as Record<string,unknown>[], root.sharingGrants as Record<string,unknown>[]].every(uniqueIds)) return 'Entity IDs must be unique within each collection.';
  const records = [...root.measurements as Record<string,unknown>[], ...root.standardSizes as Record<string,unknown>[], ...root.brandFits as Record<string,unknown>[]];
  for (const g of root.sharingGrants as Record<string, unknown>[]) {
    const owner=profile(g.ownerProfileId); const grantor=profile(g.grantedByProfileId);
    if (!requiredStrings(g,['id','ownerProfileId','recipientProfileId','grantedByProfileId','status','grantedAt']) || !owner || profile(g.recipientProfileId)?.profileType !== 'independent' || !attributed(g.grantedByProfileId) || !['active','revoked'].includes(String(g.status)) || !object(g.scope)) return 'A sharing grant is invalid.';
    if (grantor && ((owner.profileType==='independent'&&g.grantedByProfileId!==g.ownerProfileId)||(owner.profileType==='managed'&&(!Array.isArray(owner.managedByProfileIds)||!owner.managedByProfileIds.includes(g.grantedByProfileId))))) return 'A sharing grant has impossible grant authority.';
    const s=g.scope; if (s.type === 'category' ? !nonEmpty(s.category) : s.type === 'record_kind' ? !['standard_size','brand_fit'].includes(String(s.recordKind)) : s.type === 'record' ? !['measurement','standard_size','brand_fit'].includes(String(s.recordKind)) || !records.some((r)=>r.id===s.recordId && r.kind===s.recordKind && r.profileId===g.ownerProfileId) : s.type !== 'profile') return 'A sharing scope is invalid.';
    if ((g.status === 'active' && (g.revokedAt !== undefined || g.revokedByProfileId !== undefined)) || (g.status === 'revoked' && (!nonEmpty(g.revokedAt) || !attributed(g.revokedByProfileId)))) return 'Grant revocation metadata is inconsistent.';
    if (g.status==='revoked'&&profile(g.revokedByProfileId)&&((owner.profileType==='independent'&&g.revokedByProfileId!==owner.id)||(owner.profileType==='managed'&&(!Array.isArray(owner.managedByProfileIds)||!owner.managedByProfileIds.includes(g.revokedByProfileId))))) return 'Grant revocation actor was not authorised.';
    if (g.status==='active'&&owner.profileType==='managed'&&owner.managedKind==='child'&&!memberships.some((m)=>m.profileId===owner.id&&memberships.some((n)=>n.familyId===m.familyId&&n.profileId===g.recipientProfileId))) return 'An active child grant recipient must share a Family with the child.';
  }
  return undefined;
}

function validateVersionOne(root: Record<string, unknown>,allowCorrections=false,allowDanglingAttribution=false): string | undefined {
  if (!Array.isArray(root.profiles) || !Array.isArray(root.measurements) || !Array.isArray(root.standardSizes) || !Array.isArray(root.brandFits)) return 'Required record collections must be arrays.';
  if (!optionalString(root.activeProfileId)) return 'activeProfileId must be a string when present.';
  for (const profile of root.profiles) {
    if (!object(profile) || !nonEmpty(profile.id) || !nonEmpty(profile.displayName) || !['independent', 'managed'].includes(String(profile.profileType)) || !timestampPair(profile)) return 'A profile has an invalid required field.';
    if (![profile.relationshipLabel, profile.dateOfBirth, profile.notes].every(optionalString)) return 'A profile has an invalid optional field.';
  }
  for (const record of root.measurements) {
    if (!object(record) || !requiredStrings(record, ['id', 'profileId', 'measurementType', 'category', 'label', 'createdAt', 'updatedAt']) || record.kind !== 'measurement' || record.visibility !== 'private' || !Array.isArray(record.values)) return 'A physical measurement has an invalid required field.';
    for (const value of record.values) if (!validMeasurementValue(value,allowCorrections,root.profiles as Record<string,unknown>[],allowDanglingAttribution)) return 'A physical measurement value has an invalid field.';
    if (!uniqueIds(record.values as Record<string,unknown>[])) return 'Measurement value IDs must be unique within their measurement.';
  }
  for (const record of root.standardSizes) if (!validStandardSize(record)) return 'A standard-size record has an invalid field.';
  for (const record of root.brandFits) if (!validBrandFit(record)) return 'A brand-fit record has an invalid field.';
  if (![root.profiles, root.measurements, root.standardSizes, root.brandFits].every((collection)=>uniqueIds(collection as Record<string,unknown>[]))) return 'Entity IDs must be unique within each collection.';
  const profileIds = new Set(root.profiles.map((profile) => (profile as Record<string, unknown>).id));
  if (root.activeProfileId !== undefined && !profileIds.has(root.activeProfileId)) return 'The active profile does not exist.';
  for (const collection of [root.measurements, root.standardSizes, root.brandFits]) for (const record of collection) if (!profileIds.has((record as Record<string, unknown>).profileId)) return 'A record refers to a profile that does not exist.';
  return undefined;
}

function validMeasurementValue(value: unknown,allowCorrection=false,profiles:Record<string,unknown>[]=[],allowDanglingAttribution=false): boolean {
  if (!object(value) || !requiredStrings(value, ['id', 'unit', 'measuredAt', 'recordedAt', 'originalUnit', 'createdAt']) || typeof value.value !== 'number' || !Number.isFinite(value.value) || typeof value.originalValue !== 'number' || !Number.isFinite(value.originalValue) || !sourceTypes.has(String(value.sourceType)) || !sourceTypes.has(String(value.acquisitionMethod))) return false;
  if(value.correction!==undefined){
    const correction=value.correction;
    if(!allowCorrection||!object(correction)||correction.status!=='voided'||!nonEmpty(correction.correctedAt)||!nonEmpty(correction.correctedByProfileId)||!optionalString(correction.reason))return false;
    const corrector=profiles.find((profile)=>profile.id===correction.correctedByProfileId);
    const correctorValid=allowDanglingAttribution?(corrector===undefined||corrector.profileType==='independent'):(corrector!==undefined&&corrector.profileType==='independent');
    if(!correctorValid)return false;
  }
  return optionalString(value.sourceName) && optionalString(value.notes) && validExternalProvenance(value);
}

function validStandardSize(value: unknown): boolean {
  return object(value) && requiredStrings(value, ['id', 'profileId', 'category', 'label', 'sizingSystem', 'sizeValue', 'recordedAt', 'createdAt', 'updatedAt']) && value.kind === 'standard_size' && value.visibility === 'private' && sourceTypes.has(String(value.sourceType)) && optionalString(value.sourceName) && optionalString(value.notes) && validExternalProvenance(value);
}

function validBrandFit(value: unknown): boolean {
  return object(value) && requiredStrings(value, ['id', 'profileId', 'category', 'brand', 'sizingSystem', 'sizeValue', 'recordedAt', 'createdAt', 'updatedAt']) && value.kind === 'brand_fit' && value.visibility === 'private' && sourceTypes.has(String(value.sourceType)) && [value.productName, value.productLine, value.fitNotes, value.sourceName].every(optionalString);
}

const safeMappings = new Map([
  ['measurement|Height|General body dimensions|Height','measurement.height'],
  ['measurement|Weight|General body dimensions|Weight','measurement.weight'],
  ['measurement|Waist circumference|Upper body|Waist circumference','measurement.waist-circumference'],
  ['measurement|Foot length|Feet|Foot length','measurement.foot-length'],
  ['standard_size|Shoe size|Footwear','size.shoe-size'],
  ['standard_size|Ring size|Jewellery','size.ring-size'],
]);
function applySafeCanonicalMappings(root:Record<string,unknown>):void {
  const measurements=root.measurements as Record<string,unknown>[];
  const candidates=new Map<Record<string,unknown>,string>();
  const counts=new Map<string,number>();
  for(const record of measurements) {
    const id=safeMappings.get(`measurement|${record.measurementType}|${record.category}|${record.label}`);
    const definition=id?canonicalFactById(id):undefined;
    if(id&&definition?.measurement&&(record.values as Record<string,unknown>[]).every((value)=>definition.measurement!.permittedUnits.includes(String(value.unit)))) {
      candidates.set(record,id);
      const key=`${record.profileId}|${id}`;
      counts.set(key,(counts.get(key)??0)+1);
    }
  }
  for(const [record,id] of candidates) {
    if(counts.get(`${record.profileId}|${id}`)===1)record.canonicalFactId=id;
  }
  for(const record of root.standardSizes as Record<string,unknown>[]) {
    const id=safeMappings.get(`standard_size|${record.label}|${record.category}`);
    const definition=id?canonicalFactById(id):undefined;
    if(id&&definition?.standardSize?.permittedSystems.includes(String(record.sizingSystem)))record.canonicalFactId=id;
  }
}
function validateCanonicalRecords(root:Record<string,unknown>):string|undefined {
  for(const record of root.measurements as Record<string,unknown>[]) {
    if(record.canonicalFactId===undefined)continue;
    if(!nonEmpty(record.canonicalFactId))return 'A canonical fact identifier is invalid.';
    const definition=canonicalFactById(record.canonicalFactId);
    if(!definition||definition.recordKind!=='measurement'||definition.category!==record.category||definition.label!==record.label||definition.measurement?.measurementType!==record.measurementType)return 'A physical measurement has inconsistent canonical metadata.';
    for(const value of record.values as Record<string,unknown>[])if(!definition.measurement!.permittedUnits.includes(String(value.unit)))return 'A canonical measurement uses an invalid unit.';
  }
  for(const [collection,kind] of [[root.standardSizes,'standard_size'],[root.brandFits,'brand_product_fact']] as const) {
    for(const record of collection as Record<string,unknown>[]) {
      if(record.canonicalFactId===undefined)continue;
      if(!nonEmpty(record.canonicalFactId))return 'A canonical fact identifier is invalid.';
      const definition=canonicalFactById(record.canonicalFactId);
      const systems=definition?.standardSize?.permittedSystems??definition?.brandProduct?.permittedSystems;
      if(!definition||definition.recordKind!==kind||definition.category!==record.category||(kind==='standard_size'&&definition.label!==record.label)||(systems&&!systems.includes(String(record.sizingSystem))))return 'A size record has inconsistent canonical metadata.';
    }
  }
}

function requiredStrings(value: Record<string, unknown>, keys: string[]): boolean { return keys.every((key) => nonEmpty(value[key])); }
function uniqueIds(values: Record<string,unknown>[]):boolean { const ids=values.map((value)=>value.id); return ids.every(nonEmpty)&&new Set(ids).size===ids.length; }
function validExternalProvenance(value:Record<string,unknown>):boolean {
  if (!optionalString(value.sourceItemId) || !optionalString(value.sourceDevice) || (value.sourceId !== undefined && !sourceIds.has(String(value.sourceId))) || (value.confidence !== undefined && (typeof value.confidence !== 'number' || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1))) return false;
  if ((value.sourceItemId !== undefined && !nonEmpty(value.sourceItemId)) || (value.sourceDevice !== undefined && !nonEmpty(value.sourceDevice))) return false;
  if (value.derivation !== undefined && (!object(value.derivation) || Object.keys(value.derivation).some(key=>!['kind','method','inputDescription'].includes(key)) || !['direct','derived'].includes(String(value.derivation.kind)) || !optionalString(value.derivation.method) || !optionalString(value.derivation.inputDescription))) return false;
  return !(value.sourceType === 'manual' && value.sourceId !== undefined && value.sourceId !== 'manual');
}
function corrupt(reason: string): MigrationResult { return { status: 'corrupt', reason }; }
