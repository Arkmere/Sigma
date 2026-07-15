export const DATA_SCHEMA_VERSION = 2;

export type ProfileType = 'independent' | 'managed';
export type SourceType = 'manual' | 'imported_health_platform' | 'imported_device' | 'camera_assisted' | 'body_scan' | 'third_party_service';
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

export interface MeasurementValue {
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
  confidence?: number;
  notes?: string;
  createdAt: string;
}

export interface PhysicalMeasurement {
  id: string;
  profileId: string;
  kind: 'measurement';
  measurementType: string;
  category: string;
  label: string;
  values: MeasurementValue[];
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface StandardSize {
  id: string;
  profileId: string;
  kind: 'standard_size';
  category: string;
  label: string;
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
});

export function currentMeasurementValue(record: PhysicalMeasurement): MeasurementValue | undefined {
  return [...record.values].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt) || b.recordedAt.localeCompare(a.recordedAt))[0];
}
