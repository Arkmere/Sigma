import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { renderRecords } from '../dist/app/ui/records.js';

const storage=()=>{const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}};
const fixture=()=>{let n=0;const service=new SigmaService(new LocalStorageRepository(storage()),()=>`2026-07-30T10:00:${String(n).padStart(2,'0')}Z`,()=>`id-${++n}`);const profile=service.createProfile({displayName:'Alex',profileType:'independent'});return{service,profile}};

test('all record action groups retain semantic details and summary controls',()=>{
  const{service,profile}=fixture();
  service.addMeasurement({profileId:profile.id,measurementType:'Waist',category:'Upper body',label:'Waist',value:40,unit:'cm',originalValue:40,originalUnit:'cm',measuredAt:'2026-07-29',recordedAt:'2026-07-29T10:00:00Z',sourceType:'manual',acquisitionMethod:'manual'});
  service.addStandardSize({profileId:profile.id,category:'Clothing',label:'Clothing size',sizingSystem:'Generic',sizeValue:'M',recordedAt:'2026-07-29',sourceType:'manual'});
  service.addBrandFit({profileId:profile.id,category:'Footwear',brand:'Arkmere',productName:'Field shoe',productLine:'One',sizingSystem:'UK',sizeValue:'9',fitNotes:'Recorded fact',recordedAt:'2026-07-29',sourceType:'manual'});

  for(const mode of ['measurement','standard_size','brand_fit']){
    const html=renderRecords(service,mode,'','',false);
    assert.match(html,/class="record-actions"/);
    assert.match(html,/<details><summary>[^<]+<\/summary>[\s\S]*<\/details>/);
  }
});

test('open record disclosures span the complete desktop action grid without fixed content width',async()=>{
  const css=await readFile('dist/styles.css','utf8');
  assert.match(css,/\.record-actions\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(10rem,\s*1fr\)\)/);
  assert.match(css,/\.record-actions\s*>\s*details\[open\]\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*-1;[\s\S]*?width:\s*100%;/);
  assert.match(css,/\.record-actions\s*>\s*details\[open\]\s*>\s*:not\(summary\)\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?max-width:\s*none;/);
  assert.doesNotMatch(css,/\.record-actions\s*>\s*details\[open\][^{]*\{[^}]*(?:width|max-width):\s*\d+(?:px|rem)/);
});

test('history items keep value, status, metadata, and correction form in one semantic group',()=>{
  const{service,profile}=fixture();
  const record=service.addMeasurement({profileId:profile.id,measurementType:'Waist',category:'Upper body',label:'Waist',value:40,unit:'cm',originalValue:40,originalUnit:'cm',measuredAt:'2026-07-29',recordedAt:'2026-07-29T10:00:00Z',sourceType:'manual',acquisitionMethod:'manual'});
  const updated=service.addMeasurementValue(record.id,{value:41,unit:'cm',originalValue:41,originalUnit:'cm',measuredAt:'2026-07-29',recordedAt:'2026-07-29T11:00:00Z',sourceType:'manual',acquisitionMethod:'manual'});
  service.correctMeasurementValue(record.id,updated.values[1].id,'Entered in error');

  const html=renderRecords(service,'measurement','','',false);
  assert.match(html,/<li class="history-entry corrected-entry">[\s\S]*41 cm[\s\S]*Incorrect[\s\S]*Marked incorrect[\s\S]*Reason<\/dt><dd>Entered in error<\/dd>[\s\S]*<\/li>/);
  assert.match(html,/<li class="history-entry ">[\s\S]*40 cm[\s\S]*Current[\s\S]*class="correction-form"[\s\S]*Mark incorrect[\s\S]*<\/li>/);
});

test('mobile record actions retain single-column stacking and correction forms collapse',async()=>{
  const css=await readFile('dist/styles.css','utf8');
  assert.match(css,/@media \(max-width:\s*620px\)\s*\{[\s\S]*?\.record-actions\s*\{\s*display:\s*block;\s*\}/);
  assert.match(css,/@media \(max-width:\s*620px\)\s*\{[\s\S]*?\.correction-form,\s*\.family-actions\s*\{\s*grid-template-columns:\s*1fr;\s*\}/);
});
