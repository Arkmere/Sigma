import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateStoredData } from '../dist/data/migrations.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { encryptFitCard, decryptFitCard } from '../dist/exchange/crypto.js';

const storage=()=>{const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}};
const fixture=()=>{let n=0;const local=storage();const service=new SigmaService(new LocalStorageRepository(local),()=>`2026-08-16T00:00:${String(n).padStart(2,'0')}Z`,()=>`id-${++n}`);const alex=service.createProfile({displayName:'Alex',profileType:'independent'});return{service,local,alex}};
const measurement=(service,profileId,label='Waist',category='Upper body')=>service.addMeasurement({profileId,measurementType:label,category,label,value:90,unit:'cm',originalValue:90,originalUnit:'cm',measuredAt:'2026-08-16',recordedAt:'2026-08-16',sourceType:'manual',acquisitionMethod:'manual'});
const size=(service,profileId,label='Shoe size',category='Footwear')=>service.addStandardSize({profileId,category,label,sizingSystem:'UK',sizeValue:'9',recordedAt:'2026-08-16',sourceType:'manual'});

test('exportFitCardPayload only includes the profile\'s own records and honours scope',()=>{
  const{service,alex}=fixture();
  const waist=measurement(service,alex.id,'Waist','Upper body');
  const shoe=size(service,alex.id,'Shoe size','Footwear');
  const other=service.createProfile({displayName:'Jordan',profileType:'independent'});
  service.selectActor(other.id);measurement(service,other.id,'Chest','Upper body');service.selectActor(alex.id);

  const whole=service.exportFitCardPayload(alex.id,{type:'profile'});
  assert.equal(whole.measurements.length,1);
  assert.equal(whole.standardSizes.length,1);
  assert.equal(whole.senderProfileId,alex.id);
  assert.equal(whole.senderDisplayName,'Alex');

  const footwearOnly=service.exportFitCardPayload(alex.id,{type:'category',category:'Footwear'});
  assert.equal(footwearOnly.measurements.length,0);
  assert.equal(footwearOnly.standardSizes.length,1);

  const specific=service.exportFitCardPayload(alex.id,{type:'record',recordKind:'measurement',recordId:waist.id});
  assert.deepEqual(specific.measurements.map(r=>r.id),[waist.id]);
  assert.equal(specific.standardSizes.length,0);
});

test('an unrelated actor cannot export another profile\'s records',()=>{
  const{service,alex}=fixture();
  measurement(service,alex.id);
  const jordan=service.createProfile({displayName:'Jordan',profileType:'independent'});
  service.selectActor(jordan.id);
  assert.throws(()=>service.exportFitCardPayload(alex.id,{type:'profile'}),/cannot export/);
});

test('importFitCard rejects malformed payloads and stores a valid one, defaulting the label to the sender name',()=>{
  const{service}=fixture();
  assert.throws(()=>service.importFitCard({senderProfileId:'',senderDisplayName:'',exportedAt:'',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]}),/not valid/);
  const card=service.importFitCard({senderProfileId:'remote-1',senderDisplayName:'Jordan',exportedAt:'2026-08-16T00:00:00Z',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]});
  assert.equal(card.label,'Jordan');
  assert.equal(card.importedAt,card.updatedAt);
  assert.equal(service.snapshot().importedFitCards.length,1);
});

test('re-importing from the same sender updates the existing card instead of duplicating it',()=>{
  const{service,alex}=fixture();
  const first=service.importFitCard({senderProfileId:alex.id,senderDisplayName:'Alex',exportedAt:'x',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]},'My old friend Alex');
  assert.equal(service.snapshot().importedFitCards.length,1);

  const waist=measurement(service,alex.id,'Waist','Upper body');
  const second=service.importFitCard({senderProfileId:alex.id,senderDisplayName:'Alex Renamed',exportedAt:'y',scope:{type:'profile'},measurements:[{...waist,id:'remote-waist'}],standardSizes:[],brandFits:[]});

  assert.equal(service.snapshot().importedFitCards.length,1,'a second import from the same sender must not create a duplicate card');
  assert.equal(second.id,first.id,'the card identity is preserved across updates');
  assert.equal(second.label,'My old friend Alex','a previously chosen label survives a refresh');
  assert.equal(second.senderDisplayName,'Alex Renamed','sender display-name changes propagate');
  assert.equal(second.measurements.length,1);
  assert.equal(second.importedAt,first.importedAt,'importedAt records when the relationship first started');
  assert.notEqual(second.updatedAt,first.updatedAt,'updatedAt advances on every refresh');
});

test('re-importing a narrower export drops records the sender no longer shares, with no separate delete marker needed',()=>{
  const{service,alex}=fixture();
  service.importFitCard({senderProfileId:alex.id,senderDisplayName:'Alex',exportedAt:'x',scope:{type:'profile'},measurements:[measurement(service,alex.id,'Waist','Upper body')],standardSizes:[size(service,alex.id)],brandFits:[]});
  assert.equal(service.snapshot().importedFitCards[0].measurements.length,1);
  assert.equal(service.snapshot().importedFitCards[0].standardSizes.length,1);

  // Simulate the sender later exporting a narrower scope (or having deleted the waist measurement).
  const refreshed=service.importFitCard({senderProfileId:alex.id,senderDisplayName:'Alex',exportedAt:'y',scope:{type:'category',category:'Footwear'},measurements:[],standardSizes:[size(service,alex.id)],brandFits:[]});
  assert.equal(refreshed.measurements.length,0,'a record dropped from the sender\'s export disappears from the local copy too');
  assert.equal(refreshed.standardSizes.length,1);
});

test('deleteFitCard removes exactly the requested card',()=>{
  const{service}=fixture();
  const a=service.importFitCard({senderProfileId:'r1',senderDisplayName:'A',exportedAt:'x',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]});
  const b=service.importFitCard({senderProfileId:'r2',senderDisplayName:'B',exportedAt:'x',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]});
  service.deleteFitCard(a.id);
  assert.deepEqual(service.snapshot().importedFitCards.map(c=>c.id),[b.id]);
  assert.throws(()=>service.deleteFitCard(a.id),/not found/);
});

test('full round trip: export, encrypt, decrypt, import lands the same data on a fresh device',async()=>{
  const{service:sender,alex}=fixture();
  measurement(sender,alex.id,'Waist','Upper body');
  size(sender,alex.id,'Shoe size','Footwear');
  const payload=sender.exportFitCardPayload(alex.id,{type:'profile'});

  const file=await encryptFitCard(JSON.stringify(payload),'a shared secret phrase');
  // Simulate the file having actually left the device: only the envelope survives, not the object.
  const roundTrippedFile=JSON.parse(JSON.stringify(file));

  const recipient=new SigmaService(new LocalStorageRepository(storage()));
  recipient.createProfile({displayName:'Jordan',profileType:'independent'});
  await assert.rejects(async()=>{const bad=await decryptFitCard(roundTrippedFile,'wrong phrase');recipient.importFitCard(JSON.parse(bad));},/Incorrect passphrase/);

  const decrypted=await decryptFitCard(roundTrippedFile,'a shared secret phrase');
  const card=recipient.importFitCard(JSON.parse(decrypted));
  assert.equal(card.senderDisplayName,'Alex');
  assert.equal(card.measurements.length,1);
  assert.equal(card.measurements[0].label,'Waist');
  assert.equal(card.standardSizes[0].sizeValue,'9');
  // The imported data must never be attributed to a local profile on the recipient's device.
  assert.ok(!recipient.snapshot().profiles.some(p=>p.id===card.senderProfileId));
});

test('schema 7 rejects a malformed imported fit card and accepts a well-formed one',()=>{
  const base=()=>({schemaVersion:7,activeProfileId:'p',activeActorProfileId:'p',profiles:[{id:'p',displayName:'Alex',profileType:'independent',createdAt:'x',updatedAt:'x'}],measurements:[],standardSizes:[],brandFits:[],families:[],familyMemberships:[],adultConnections:[],sharingGrants:[],importedFitCards:[]});

  const wellFormed=base();wellFormed.importedFitCards=[{id:'c1',label:'Jordan',senderProfileId:'r1',senderDisplayName:'Jordan',importedAt:'2026-08-16',updatedAt:'2026-08-16',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]}];
  assert.equal(migrateStoredData(wellFormed).status,'ok');

  const missingField=base();missingField.importedFitCards=[{id:'c1',label:'Jordan',senderProfileId:'r1',senderDisplayName:'Jordan',updatedAt:'x',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]}];
  assert.equal(migrateStoredData(missingField).status,'corrupt');

  const missingUpdatedAt=base();missingUpdatedAt.importedFitCards=[{id:'c1',label:'Jordan',senderProfileId:'r1',senderDisplayName:'Jordan',importedAt:'x',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]}];
  assert.equal(migrateStoredData(missingUpdatedAt).status,'corrupt');

  const badScope=base();badScope.importedFitCards=[{id:'c1',label:'Jordan',senderProfileId:'r1',senderDisplayName:'Jordan',importedAt:'x',updatedAt:'x',scope:{type:'nonsense'},measurements:[],standardSizes:[],brandFits:[]}];
  assert.equal(migrateStoredData(badScope).status,'corrupt');

  const duplicateIds=base();duplicateIds.importedFitCards=[
    {id:'c1',label:'A',senderProfileId:'r1',senderDisplayName:'A',importedAt:'x',updatedAt:'x',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]},
    {id:'c1',label:'B',senderProfileId:'r2',senderDisplayName:'B',importedAt:'x',updatedAt:'x',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]},
  ];
  assert.equal(migrateStoredData(duplicateIds).status,'corrupt');

  const notArray=base();notArray.importedFitCards=undefined;
  assert.equal(migrateStoredData(notArray).status,'corrupt');
});

test('schema 6 imported fit cards backfill updatedAt from importedAt on migration to schema 7',()=>{
  const raw={schemaVersion:6,activeProfileId:'p',activeActorProfileId:'p',profiles:[{id:'p',displayName:'Alex',profileType:'independent',createdAt:'x',updatedAt:'x'}],measurements:[],standardSizes:[],brandFits:[],families:[],familyMemberships:[],adultConnections:[],sharingGrants:[],importedFitCards:[{id:'c1',label:'Jordan',senderProfileId:'r1',senderDisplayName:'Jordan',importedAt:'2026-08-16',scope:{type:'profile'},measurements:[],standardSizes:[],brandFits:[]}]};
  const result=migrateStoredData(raw);
  assert.equal(result.status,'ok');
  assert.equal(result.data.schemaVersion,7);
  assert.equal(result.data.importedFitCards[0].updatedAt,'2026-08-16');
});

test('schema 1 through 6 all migrate losslessly to schema 7 with an empty importedFitCards collection',()=>{
  for(const version of [1,2,3,4,5,6]){
    const{service,alex}=fixture();
    measurement(service,alex.id);
    const raw={...service.snapshot(),schemaVersion:version};
    if(version===1){delete raw.families;delete raw.familyMemberships;delete raw.adultConnections;delete raw.sharingGrants;delete raw.activeActorProfileId;}
    if(version===6)raw.importedFitCards=[];else delete raw.importedFitCards;
    const result=migrateStoredData(raw);
    assert.equal(result.status,'ok',`schema ${version} should migrate cleanly`);
    assert.equal(result.data.schemaVersion,7);
    assert.deepEqual(result.data.importedFitCards,[]);
  }
});
