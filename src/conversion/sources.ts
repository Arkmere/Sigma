import type { ConversionSource } from './model.js';

export const NIST_SP_811: ConversionSource = {
  id: 'nist-sp-811-appendix-b',
  title: 'Guide for the Use of the International System of Units (SI), Appendix B',
  authority: 'National Institute of Standards and Technology',
  version: 'SP 811 (2008), online Appendix B',
  reference: 'https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors',
};

export const ISO_19407_2023: ConversionSource = {
  id: 'iso-19407-2023', title: 'Footwear — Sizing — Conversion of sizing systems',
  authority: 'International Organization for Standardization', version: 'ISO 19407:2023, Edition 1 (2023-06)',
  reference: 'https://www.iso.org/standard/83106.html',
};

export const ISO_RING_SIZE: ConversionSource = {
  id: 'iso-8653-circumference', title: 'Jewellery — Ring-sizes — Definition, measurement and designation',
  authority: 'International Organization for Standardization', version: 'ISO 8653:2016',
  reference: 'https://www.iso.org/standard/65292.html',
};
