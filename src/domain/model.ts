export const DATA_SCHEMA_VERSION = 6;

export type ProfileType = 'independent' | 'managed';
export type SourceType = 'manual' | 'imported_health_platform' | 'imported_device' | 'camera_assisted' | 'body_scan' | 'third_party_service';
export type SourceId = 'manual' | 'apple_health' | 'health_connect' | 'smart_scale' | 'measurement_device' | 'camera_assisted' | 'body_scan' | 'external_scan' | 'third_party_scanner';
export interface Derivation { kind: 'direct' | 'derived'; method?: string; inputDescription?: string; }
export interface ExternalProvenance {
  sourceId?: SourceId;
  sourceItemId?: string;
  sourceDevice?: string;
  confidence?: number;
  derivation?: Derivation;
}
export type Visibility = 'private';

export interface Profile {
  id: string;
  displayName: string;
  profileType: ProfileType;
  relationshipLabel?: string;
  dateOfBirth?: string;
  notes?: string;
  managedByProfileIds?: string[];
  managedKind?: 'child' | 'dependant';
  createdAt: string;
  updatedAt: string;
}

export interface Family { id: string; name: string; createdByProfileId: string; createdAt: string; updatedAt: string; }
export interface FamilyMembership { id: string; familyId: string; profileId: string; addedByProfileId: string; createdAt: string; }
export type AdultConnectionStatus = 'pending' | 'active' | 'declined' | 'disconnected';
export interface AdultConnection { id: string; initiatorProfileId: string; recipientProfileId: string; status: AdultConnectionStatus; requestedAt: string; respondedAt?: string; disconnectedAt?: string; disconnectedByProfileId?: string; }
export type SharingScope = { type: 'profile' } | { type: 'category'; category: string } | { type: 'record_kind'; recordKind: 'standard_size' | 'brand_fit' } | { type: 'record'; recordKind: 'measurement' | 'standard_size' | 'brand_fit'; recordId: string };
export interface SharingGrant { id: string; ownerProfileId: string; recipientProfileId: string; grantedByProfileId: string; scope: SharingScope; status: 'active' | 'revoked'; grantedAt: string; revokedAt?: string; revokedByProfileId?: string; }

export interface MeasurementValue extends ExternalProvenance {
  id: string;
  value: number;
  unit: string;
  measuredAt: string;
  recordedAt: string;
  sourceType: SourceType;
  sourceName?: string;
  originalValue: number;
  originalUnit: string;
  acquisitionMethod: SourceType;
  notes?: string;
  correction?: {
    status: 'voided';
    correctedAt: string;
    correctedByProfileId: string;
    reason?: string;
  };
  createdAt: string;
}

export interface PhysicalMeasurement {
  id: string;
  profileId: string;
  kind: 'measurement';
  measurementType: string;
  category: string;
  label: string;
  canonicalFactId?: string;
  values: MeasurementValue[];
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface StandardSize extends ExternalProvenance {
  id: string;
  profileId: string;
  kind: 'standard_size';
  category: string;
  label: string;
  canonicalFactId?: string;
  sizingSystem: string;
  sizeValue: string;
  recordedAt: string;
  sourceType: SourceType;
  sourceName?: string;
  notes?: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface BrandFit {
  id: string;
  profileId: string;
  kind: 'brand_fit';
  category: string;
  canonicalFactId?: string;
  brand: string;
  productName?: string;
  productLine?: string;
  sizingSystem: string;
  sizeValue: string;
  fitNotes?: string;
  recordedAt: string;
  sourceType: SourceType;
  sourceName?: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

// A fit card is a scoped, read-only snapshot imported from someone else's exported file (Ticket 10).
// It belongs to no local profile and is never subject to local ownership/authority rules — it exists
// purely so this device can look up a fact someone else shared (e.g. a size, to buy them something).
export interface ImportedFitCard {
  id: string;
  label: string;
  senderProfileId: string;
  senderDisplayName: string;
  scope: SharingScope;
  importedAt: string;
  measurements: PhysicalMeasurement[];
  standardSizes: StandardSize[];
  brandFits: BrandFit[];
}

export interface SigmaData {
  schemaVersion: number;
  activeProfileId?: string;
  activeActorProfileId?: string;
  profiles: Profile[];
  measurements: PhysicalMeasurement[];
  standardSizes: StandardSize[];
  brandFits: BrandFit[];
  families: Family[];
  familyMemberships: FamilyMembership[];
  adultConnections: AdultConnection[];
  sharingGrants: SharingGrant[];
  importedFitCards: ImportedFitCard[];
}

export interface SigmaBackup extends SigmaData {
  product: 'Sigma';
  exportedAt: string;
}

export const emptySigmaData = (): SigmaData => ({
  schemaVersion: DATA_SCHEMA_VERSION,
  profiles: [],
  measurements: [],
  standardSizes: [],
  brandFits: [],
  families: [],
  familyMemberships: [],
  adultConnections: [],
  sharingGrants: [],
  importedFitCards: [],
});

export function currentMeasurementValue(record: PhysicalMeasurement): MeasurementValue | undefined {
  return record.values.filter((value) => !value.correction).sort((a, b) => b.measuredAt.localeCompare(a.measuredAt) || b.recordedAt.localeCompare(a.recordedAt))[0];
}
