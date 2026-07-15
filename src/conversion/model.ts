export type ConversionKind = 'exact_unit' | 'standard_equivalent';
export type Dimension = 'length' | 'mass';

export interface ConversionSource {
  id: string;
  title: string;
  authority: string;
  version: string;
  reference: string;
}

export interface ConversionResult {
  kind: ConversionKind;
  inputValue: number | string;
  inputSystem: string;
  outputValue: number | string;
  outputSystem: string;
  exact: boolean;
  source: ConversionSource;
  derivedFromRecordId?: string;
  note?: string;
}

export interface UnitDefinition {
  id: string;
  dimension: Dimension;
  symbol: string;
  label: string;
  aliases: readonly string[];
  maximumFractionDigits: number;
  toBase(value: number): number;
  fromBase(value: number): number;
}

export interface SizingSystemDefinition { id: string; label: string; category: string; }
export interface SizingConversionRow { context: string; values: Readonly<Partial<Record<string, string>>>; }
export interface SizingConversionTable {
  id: string;
  version: string;
  category: string;
  context: string;
  source: ConversionSource;
  systems: readonly string[];
  rows: readonly SizingConversionRow[];
}
