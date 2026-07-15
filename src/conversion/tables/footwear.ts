import type { SizingConversionTable } from '../model.js';
import { ISO_19407_2023 } from '../sources.js';

export const FOOTWEAR_SYSTEMS = ['Mondopoint', 'EU', 'UK', "US Men's", "US Women's"] as const;

// Deliberately limited: only the row explicitly supplied by the Ticket 3 specification is encoded.
// The ISO public catalogue confirms semantics and table contexts, but does not publish table contents.
export const ADULT_SIMPLIFIED_FOOTWEAR: SizingConversionTable = {
  id: 'iso-19407-2023-adult-simplified-ticket-subset', version: '2023-ticket-subset', category: 'Footwear',
  context: 'adult_simplified', source: ISO_19407_2023, systems: FOOTWEAR_SYSTEMS,
  rows: [{ context: 'adult_simplified', values: { UK: '9', EU: '43', "US Men's": '10' } }],
};

export const CHILD_FOOTWEAR: SizingConversionTable = {
  id: 'iso-19407-2023-child-empty', version: '2023-no-encoded-rows', category: 'Footwear', context: 'child',
  source: ISO_19407_2023, systems: FOOTWEAR_SYSTEMS, rows: [],
};
