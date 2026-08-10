import type { Derivation, SourceId, SourceType } from '../domain/model.js';
import type { PermissionKind } from '../permissions/model.js';
export type SourceAvailability = 'live' | 'demo' | 'future';
export type RecordKind = 'measurement' | 'standard_size' | 'brand_fit';
export interface SourceDefinition { id:SourceId; label:string; description:string; availability:SourceAvailability; acquisitionMethod:SourceType; requiredPermission?:PermissionKind; supportedRecordKinds:readonly RecordKind[]; allowedExternalFields:readonly string[]; excludedDataExamples:readonly string[]; }
export interface RawExternalDatum { externalFieldId:string; value:unknown; unitOrSystem?:unknown; measuredAt?:unknown; sourceItemId?:unknown; sourceDevice?:unknown; confidence?:unknown; derivation?:unknown; }
export interface ImportCandidate { sourceId:SourceId; externalFieldId:string; canonicalFactId:string; targetKind:'measurement'|'standard_size'; measurementType?:string; category:string; label:string; value:number|string; unitOrSystem:string; measuredAt:string; sourceItemId?:string; sourceDevice?:string; confidence?:number; derivation:Derivation; }
export type ImportRejectionReason = 'not_allowlisted'|'invalid_value'|'unsupported_unit'|'missing_required_field'|'invalid_provenance'|'source_not_available'|'field_not_supported_by_source'|'record_kind_not_supported_by_source';
export type ImportEvaluation = {status:'accepted';candidate:ImportCandidate}|{status:'rejected';externalFieldId:string;reason:ImportRejectionReason};
