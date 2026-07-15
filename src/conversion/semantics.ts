import type { Dimension } from './model.js';

export type MeasurementSemantics =
  | { kind: 'dimensional'; dimension: Dimension }
  | { kind: 'categorical' }
  | { kind: 'custom_or_unknown' };

const MASS = new Set(['weight']);

// Every known non-custom taxonomy label is classified explicitly. This prevents
// newly noticed categorical sizes from acquiring length semantics by fallback.
const LENGTH = new Set([
  'height', 'shoulder width', 'arm span', 'torso length', 'body rise', 'chest', 'bust', 'underbust', 'waist', 'neck/collar',
  'sleeve length', 'bicep circumference', 'forearm circumference', 'wrist circumference', 'back length', 'hip', 'seat', 'inseam',
  'outseam', 'inside leg', 'thigh circumference', 'knee circumference', 'calf circumference', 'ankle circumference', 'front rise',
  'back rise', 'head circumference', 'face width', 'pupillary distance', 'glasses frame width', 'hand length', 'palm width',
  'hand circumference', 'middle finger length', 'foot length', 'foot width', 'arch length', 'instep circumference', 'ball girth',
  'heel-to-ball length', 'ring finger circumference', 'necklace length', 'watch strap length', 'hockey stick length',
]);

const CATEGORICAL = new Set([
  'hat size', 'glove size', 'ring size', 'bracelet size', 't-shirt size', 'shirt size', 'jacket size', 'coat size', 'dress size',
  'skirt size', 'trouser size', 'jeans waist', 'jeans length', 'bra size', 'belt size', 'uniform/workwear size', 'general shoe size',
  'trainer/sneaker size', 'boot size', 'dress shoe size', 'skate size', 'ski boot size', 'cycling shoe size', 'brand-specific shoe size',
  'bike frame size', 'helmet size', 'shin guard size', 'protective pad size', 'wetsuit size', 'climbing harness size',
  'medical/support garment size', 'compression garment size', 'ppe size', 'respirator mask size', 'safety harness size', 'orthotic size',
  'prosthetic/socket measurement',
]);

export function measurementSemantics(measurementType: string): MeasurementSemantics {
  const key = measurementType.trim().toLowerCase();
  if (MASS.has(key)) return { kind: 'dimensional', dimension: 'mass' };
  if (LENGTH.has(key)) return { kind: 'dimensional', dimension: 'length' };
  if (CATEGORICAL.has(key)) return { kind: 'categorical' };
  return { kind: 'custom_or_unknown' };
}

export function measurementDimension(measurementType: string): Dimension | undefined {
  const semantics = measurementSemantics(measurementType);
  return semantics.kind === 'dimensional' ? semantics.dimension : undefined;
}
