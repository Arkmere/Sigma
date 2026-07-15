import type { ConversionResult, Dimension, UnitDefinition } from './model.js';
import { NIST_SP_811 } from './sources.js';

const linear = (id: string, dimension: Dimension, symbol: string, label: string, aliases: readonly string[], factor: number, maximumFractionDigits: number): UnitDefinition => ({
  id, dimension, symbol, label, aliases, maximumFractionDigits,
  toBase: (value) => value * factor, fromBase: (value) => value / factor,
});

// Canonical bases are metre and kilogram. Factors are exact definitions.
export const UNITS: readonly UnitDefinition[] = [
  linear('millimetre', 'length', 'mm', 'millimetres', ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'], 0.001, 1),
  linear('centimetre', 'length', 'cm', 'centimetres', ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'], 0.01, 2),
  linear('metre', 'length', 'm', 'metres', ['m', 'meter', 'meters', 'metre', 'metres'], 1, 3),
  linear('inch', 'length', 'in', 'inches', ['in', 'inch', 'inches'], 0.0254, 2),
  linear('foot', 'length', 'ft', 'feet', ['ft', 'foot', 'feet'], 0.3048, 3),
  linear('gram', 'mass', 'g', 'grams', ['g', 'gram', 'grams', 'gramme', 'grammes'], 0.001, 1),
  linear('kilogram', 'mass', 'kg', 'kilograms', ['kg', 'kilogram', 'kilograms', 'kilogramme', 'kilogrammes'], 1, 2),
  linear('ounce', 'mass', 'oz', 'ounces', ['oz', 'ounce', 'ounces'], 0.028349523125, 2),
  linear('pound', 'mass', 'lb', 'pounds', ['lb', 'lbs', 'pound', 'pounds'], 0.45359237, 2),
  linear('stone', 'mass', 'st', 'stone', ['st', 'stone', 'stones'], 6.35029318, 2),
];

const aliases = new Map(UNITS.flatMap((unit) => unit.aliases.map((alias) => [alias.toLowerCase(), unit] as const)));
export const resolveUnit = (value: string): UnitDefinition | undefined => aliases.get(value.trim().toLowerCase());
export const unitsForDimension = (dimension: Dimension): readonly UnitDefinition[] => UNITS.filter((unit) => unit.dimension === dimension);

export function convertUnit(value: number, from: string, to: string, derivedFromRecordId?: string): ConversionResult | undefined {
  if (!Number.isFinite(value)) return undefined;
  const input = resolveUnit(from); const output = resolveUnit(to);
  if (!input || !output || input.dimension !== output.dimension) return undefined;
  return { kind: 'exact_unit', inputValue: value, inputSystem: input.symbol, outputValue: output.fromBase(input.toBase(value)), outputSystem: output.symbol, exact: true, source: NIST_SP_811, derivedFromRecordId };
}

export function formatConvertedValue(value: number, unit: string): string {
  const definition = resolveUnit(unit);
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: definition?.maximumFractionDigits ?? 3, useGrouping: false }).format(value);
}
