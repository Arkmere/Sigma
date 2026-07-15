import type { Dimension } from './model.js';

const MASS = new Set(['weight']);
const CATEGORICAL = new Set(['hat size', 'glove size', 't-shirt size', 'shirt size', 'jacket size', 'coat size', 'dress size', 'skirt size', 'trouser size', 'jeans waist', 'jeans length', 'bra size', 'uniform/workwear size', 'ring size']);

export function measurementDimension(measurementType: string): Dimension | undefined {
  const key = measurementType.trim().toLowerCase();
  if (MASS.has(key)) return 'mass';
  if (CATEGORICAL.has(key) || key.startsWith('custom ')) return undefined;
  return 'length';
}
