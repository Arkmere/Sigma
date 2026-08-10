import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateStoredData } from '../dist/data/migrations.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';

const value=(id='v',unit='cm')=>({id,value:170,unit,originalValue:170,originalUnit:unit,measuredAt:'2026-01-01',recordedAt:'2026-01-01',sourceType:'manual',acquisitionMethod:'manual',createdAt:'x'});
const measurement=(id='m',profileId='p',values=[value()])=>({id,profileId,kind:'measurement',measurementType:'Height',category:'General body dimensions',label:'Height',values,visibility:'private',createdAt:'x',updatedAt:'x'});
const size=(id='s',profileId='p')=>({id,profileId,kind:'standard_size',category:'Footwear',label:'Shoe size',sizingSystem:'UK',sizeValue:'9',recordedAt:'x',sourceType:'manual',visibility:'private',createdAt:'x',updatedAt:'x'});
const profile=(id='p')=>({id,displayName:id,profileType:'independent',createdAt:'x',updatedAt:'x'});
const data=(schemaVersion=4)=>({schemaVersion,activeProfileId:'p',activeActorProfileId:'p',profiles:[profile()],measurements:[measurement()],standardSizes:[size()],brandFits:[],families:[],familyMemberships:[],adultConnections:[],sharingGrants:[]});
const memory=()=>{const values=new Map();return{values,getItem:key=>values.get(key)??null,setItem:(key,val)=>values.set(key,val),removeItem:key=>values.delete(key)}};

test('schema-3 canonical mapping requires permitted units and no same-profile collision',()=>{
  const raw=data(3); raw.profiles.push(profile('q'));
  raw.measurements=[measurement('a','p'),measurement('b','p'),measurement('c','q'),measurement('d','q',[value('vd','yard')])];
  raw.standardSizes=[size('s1'),size('s2')];
  const before=structuredClone(raw); const result=migrateStoredData(raw);
  assert.equal(result.status,'ok');
  assert.deepEqual(result.data.measurements.map(record=>record.canonicalFactId),[undefined,undefined,'measurement.height',undefined]);
  assert.deepEqual(result.data.standardSizes.map(record=>record.canonicalFactId),['size.shoe-size','size.shoe-size']);
  assert.deepEqual(raw,before); assert.equal(result.data.schemaVersion,4);
});

test('invalid version discriminators are corrupt and finite unknown versions are unsupported without mutation',()=>{
  for(const schemaVersion of [undefined,'4',null,NaN,Infinity]) assert.equal(migrateStoredData({...data(),schemaVersion}).status,'corrupt');
  const future={...data(),schemaVersion:99,marker:{untouched:true}}; const before=structuredClone(future); const result=migrateStoredData(future);
  assert.deepEqual(result,{status:'unsupported_version',version:99}); assert.deepEqual(future,before);
});

test('IDs are unique in their defined scopes while cross-kind and cross-measurement reuse remains valid',()=>{
  const duplicateCases=[
    root=>root.profiles.push({...root.profiles[0]}),
    root=>root.measurements.push({...root.measurements[0]}),
    root=>root.standardSizes.push({...root.standardSizes[0]}),
    root=>root.brandFits.push({...root.brandFits[0]}),
    root=>root.families.push({id:'f',name:'F',createdByProfileId:'p',createdAt:'x',updatedAt:'x'},{id:'f',name:'F2',createdByProfileId:'p',createdAt:'x',updatedAt:'x'}),
    root=>root.familyMemberships.push({id:'fm',familyId:'f',profileId:'p',addedByProfileId:'p',createdAt:'x'},{id:'fm',familyId:'f',profileId:'q',addedByProfileId:'p',createdAt:'x'}),
    root=>root.adultConnections.push({id:'c',initiatorProfileId:'p',recipientProfileId:'q',status:'pending',requestedAt:'x'},{id:'c',initiatorProfileId:'q',recipientProfileId:'p',status:'pending',requestedAt:'x'}),
    root=>root.sharingGrants.push({id:'g',ownerProfileId:'p',recipientProfileId:'q',grantedByProfileId:'p',status:'active',grantedAt:'x',scope:{type:'profile'}},{id:'g',ownerProfileId:'q',recipientProfileId:'p',grantedByProfileId:'q',status:'active',grantedAt:'x',scope:{type:'profile'}}),
    root=>root.measurements[0].values.push({...root.measurements[0].values[0]}),
  ];
  for(const mutate of duplicateCases){const root=data();root.profiles.push(profile('q'));root.families.push({id:'f',name:'F',createdByProfileId:'p',createdAt:'x',updatedAt:'x'});mutate(root);assert.equal(migrateStoredData(root).status,'corrupt');}
  const allowed=data(); allowed.measurements.push(measurement('s','p',[value('v')])); allowed.standardSizes[0].id='s';
  assert.equal(migrateStoredData(allowed).status,'ok');
});

test('record-scoped grants must reference a record owned by the grant owner',()=>{
  const root=data();root.profiles.push(profile('q'));root.sharingGrants=[{id:'g',ownerProfileId:'q',recipientProfileId:'p',grantedByProfileId:'q',status:'active',grantedAt:'x',scope:{type:'record',recordKind:'measurement',recordId:'m'}}];
  assert.equal(migrateStoredData(root).status,'corrupt');
  root.sharingGrants[0].ownerProfileId='p';root.sharingGrants[0].grantedByProfileId='p';root.sharingGrants[0].recipientProfileId='q';
  assert.equal(migrateStoredData(root).status,'ok');
});

test('canonical measurement and standard-size labels are validated but custom labels remain free',()=>{
  const root=data();root.measurements[0].canonicalFactId='measurement.height';root.standardSizes[0].canonicalFactId='size.shoe-size';
  assert.equal(migrateStoredData(root).status,'ok');
  root.measurements[0].label='Stature';assert.equal(migrateStoredData(root).status,'corrupt');root.measurements[0].label='Height';
  root.standardSizes[0].label='Shoes';assert.equal(migrateStoredData(root).status,'corrupt');
  delete root.measurements[0].canonicalFactId;delete root.standardSizes[0].canonicalFactId;assert.equal(migrateStoredData(root).status,'ok');
});

test('backup export refuses unsafe repository states and preserves raw storage',()=>{
  for(const raw of [{schemaVersion:4,bad:true},{schemaVersion:99,future:true}]){
    const local=memory();local.setItem('sigma.data.v1',JSON.stringify(raw));const before=local.getItem('sigma.data.v1');
    const service=new SigmaService(new LocalStorageRepository(local));assert.throws(()=>service.exportBackup());assert.equal(local.getItem('sigma.data.v1'),before);
  }
  const local=memory();const service=new SigmaService(new LocalStorageRepository(local));assert.equal(service.exportBackup().schemaVersion,4);
});
