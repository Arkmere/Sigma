import type { ConversionResult } from './model.js';
import { ISO_RING_SIZE, NIST_SP_811 } from './sources.js';

export function ringDiameterFromCircumference(circumferenceMm: number, recordId?: string): ConversionResult | undefined {
  if (!Number.isFinite(circumferenceMm) || circumferenceMm <= 0) return undefined;
  return { kind: 'exact_unit', inputValue: circumferenceMm, inputSystem: 'inner circumference mm', outputValue: circumferenceMm / Math.PI, outputSystem: 'inner diameter mm', exact: true, source: NIST_SP_811, derivedFromRecordId: recordId };
}
export function ringCircumferenceFromDiameter(diameterMm: number, recordId?: string): ConversionResult | undefined {
  if (!Number.isFinite(diameterMm) || diameterMm <= 0) return undefined;
  return { kind: 'exact_unit', inputValue: diameterMm, inputSystem: 'inner diameter mm', outputValue: diameterMm * Math.PI, outputSystem: 'inner circumference mm', exact: true, source: NIST_SP_811, derivedFromRecordId: recordId };
}
export function isoRingSizeFromCircumference(circumferenceMm: number, recordId?: string): ConversionResult | undefined {
  if (!Number.isFinite(circumferenceMm) || circumferenceMm <= 0) return undefined;
  return { kind: 'standard_equivalent', inputValue: circumferenceMm, inputSystem: 'inner circumference mm', outputValue: circumferenceMm, outputSystem: 'ISO ring size', exact: true, source: ISO_RING_SIZE, derivedFromRecordId: recordId, note: 'ISO size is explicitly designated by inner circumference in millimetres; no regional size is inferred.' };
}
