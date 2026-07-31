import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalFactDefinitions, canonicalFactById, searchCanonicalFacts } from '../dist/domain/canonical-facts.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';

const storage=()=>{const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}};
test('canonical registry is deterministic, unique, complete and anatomy-controlled',()=>{
  assert.equal(canonicalFactDefinitions.length,118);
  assert.equal(new Set(canonicalFactDefinitions.map(f=>f.id)).size,canonicalFactDefinitions.length);
  const segments=new Set(['Body','Head and neck','Face','Torso','Upper limbs','Hand','Fingers','Lower limbs','Foot']);
  for(const fact of canonicalFactDefinitions){
    assert.ok(fact.id&&fact.label&&fact.category&&fact.recordKind);
    if(fact.measurement)assert.ok(fact.measurement.measurementType&&fact.measurement.permittedUnits.length);
    if(fact.standardSize)assert.ok(fact.standardSize.sizeContext&&fact.standardSize.permittedSystems.length);
    if(fact.anatomyPath)for(const segment of fact.anatomyPath)assert.ok(segments.has(segment),segment);
  }
});
test('canonical search matches labels and useful aliases',()=>{
  assert.ok(searchCanonicalFacts('collar').some(f=>f.id==='size.collar-size'));
  assert.ok(searchCanonicalFacts('neck').some(f=>f.id==='measurement.neck-circumference'));
  assert.ok(searchCanonicalFacts('shoe').some(f=>f.id==='measurement.foot-length'));
  assert.ok(searchCanonicalFacts('trouser').some(f=>f.id==='measurement.waist-circumference'));
});
test('canonical persistence derives metadata, rejects drift, and prevents duplicate measurements',()=>{
  let n=0;const service=new SigmaService(new LocalStorageRepository(storage()),()=> '2026-07-30T12:00:00Z',()=>`id-${++n}`);
  const profile=service.createProfile({displayName:'Morgan',profileType:'independent'});
  const input={profileId:profile.id,canonicalFactId:'measurement.waist-circumference',measurementType:'Waist circumference',category:'Upper body',label:'ignored',value:90,unit:'cm',originalValue:90,originalUnit:'cm',measuredAt:'2026-07-30',recordedAt:'2026-07-30',sourceType:'manual',acquisitionMethod:'manual'};
  const record=service.addMeasurement(input);
  assert.equal(record.label,'Waist circumference');assert.equal(record.canonicalFactId,'measurement.waist-circumference');
  assert.throws(()=>service.addMeasurement(input),/Update its value/);
  assert.throws(()=>service.addMeasurement({...input,canonicalFactId:'unknown'}),/Unknown/);
  assert.throws(()=>service.addMeasurement({...input,category:'Feet'}),/category/);
  assert.equal(service.exportBackup().measurements[0].canonicalFactId,record.canonicalFactId);
});
test('custom records omit canonical IDs',()=>{
  assert.equal(canonicalFactById('size.shoe-size')?.category,'Footwear');
  let n=0;const service=new SigmaService(new LocalStorageRepository(storage()),()=> '2026-07-30',()=>`i${++n}`);
  const profile=service.createProfile({displayName:'Taylor',profileType:'independent'});
  const custom=service.addStandardSize({profileId:profile.id,category:'Custom',label:'Stage costume code',sizingSystem:'Maker',sizeValue:'B',recordedAt:'2026-07-30',sourceType:'manual'});
  assert.equal(custom.canonicalFactId,undefined);
});
test('schema-3 migration maps only exact allowlisted facts and preserves ambiguous records',()=>{
  const values=new Map();const local={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const raw={schemaVersion:3,activeProfileId:'p',activeActorProfileId:'p',profiles:[{id:'p',displayName:'Casey',profileType:'independent',createdAt:'x',updatedAt:'x'}],measurements:[
    {id:'h',profileId:'p',kind:'measurement',measurementType:'Height',category:'General body dimensions',label:'Height',values:[{id:'v',value:170,unit:'cm',originalValue:170,originalUnit:'cm',measuredAt:'2026-01-01',recordedAt:'2026-01-01',sourceType:'manual',acquisitionMethod:'manual',createdAt:'x'}],visibility:'private',createdAt:'x',updatedAt:'x'},
    {id:'a',profileId:'p',kind:'measurement',measurementType:'Height',category:'Custom',label:'Height',values:[{id:'v2',value:1,unit:'cm',originalValue:1,originalUnit:'cm',measuredAt:'2026-01-01',recordedAt:'2026-01-01',sourceType:'manual',acquisitionMethod:'manual',createdAt:'x'}],visibility:'private',createdAt:'x',updatedAt:'x'},
  ],standardSizes:[],brandFits:[],families:[],familyMemberships:[],adultConnections:[],sharingGrants:[]};
  local.setItem('sigma.data.v1',JSON.stringify(raw));const loaded=new LocalStorageRepository(local).load();
  assert.equal(loaded.status,'ok');assert.equal(loaded.data.schemaVersion,4);
  assert.equal(loaded.data.measurements[0].canonicalFactId,'measurement.height');
  assert.equal(loaded.data.measurements[1].canonicalFactId,undefined);
  assert.equal(loaded.data.measurements[1].category,'Custom');
});
