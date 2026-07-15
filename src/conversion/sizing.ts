import type { ConversionResult, SizingConversionTable } from './model.js';
import { ADULT_SIMPLIFIED_FOOTWEAR, CHILD_FOOTWEAR } from './tables/footwear.js';

export type FootwearContext = 'adult_simplified' | 'child';
const tables: readonly SizingConversionTable[] = [ADULT_SIMPLIFIED_FOOTWEAR, CHILD_FOOTWEAR];
const systemAliases = new Map([['eu', 'EU'], ['uk', 'UK'], ['mondopoint', 'Mondopoint'], ["us men's", "US Men's"], ['us men', "US Men's"], ["us women's", "US Women's"], ['us women', "US Women's"]]);
export const resolveSizingSystem = (value: string): string | undefined => systemAliases.get(value.trim().toLowerCase());

export function footwearConversions(system: string, size: string, context: FootwearContext = 'adult_simplified', recordId?: string): ConversionResult[] {
  const canonical = resolveSizingSystem(system); const normalizedSize = size.trim();
  if (!canonical || !normalizedSize || !Number.isFinite(Number(normalizedSize))) return [];
  const table = tables.find((item) => item.context === context); const row = table?.rows.find((item) => item.values[canonical] === normalizedSize);
  if (!table || !row) return [];
  return table.systems.flatMap((outputSystem) => {
    const outputValue = row.values[outputSystem];
    return outputSystem === canonical || outputValue === undefined ? [] : [{ kind: 'standard_equivalent', inputValue: normalizedSize, inputSystem: canonical, outputValue, outputSystem, exact: false, source: table.source, derivedFromRecordId: recordId, note: 'Generic standard guidance; not a prediction of brand or product fit.' } satisfies ConversionResult];
  });
}
