import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { renderRecords } from '../dist/app/ui/records.js';
import { renderProfiles } from '../dist/app/ui/profiles.js';
import { renderFamily } from '../dist/app/ui/family.js';
import { renderShell } from '../dist/app/ui/shell.js';

const storage=(raw)=>{const values=new Map(raw?[['sigma.data.v1',raw]]:[]);return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}};
const fixture=()=>{let n=0;const local=storage();const service=new SigmaService(new LocalStorageRepository(local),()=>`2026-07-29T12:00:${String(n).padStart(2,'0')}Z`,()=>`id-${++n}`);const profile=service.createProfile({displayName:'Alex',profileType:'independent'});return{service,local,profile}};
const add=(service,profile,value,measuredAt,recordedAt)=>service.addMeasurement({profileId:profile.id,measurementType:'Waist',category:'Upper body',label:'Waist',value,unit:'cm',originalValue:value,originalUnit:'cm',measuredAt,recordedAt,sourceType:'manual',acquisitionMethod:'manual'});

test('correction retains audit history and removes an incorrect current value from current and conversions',()=>{
  const{service,profile}=fixture();const record=add(service,profile,90,'2026-06-01','2026-06-01T10:00:00Z');
  const updated=service.addMeasurementValue(record.id,{value:95,unit:'cm',originalValue:95,originalUnit:'cm',measuredAt:'2026-07-01',recordedAt:'2026-07-01T10:00:00Z',sourceType:'manual',acquisitionMethod:'manual'});
  service.correctMeasurementValue(record.id,updated.values[1].id,'Tape slipped');
  const corrected=service.records(profile.id).measurements[0];
  assert.equal(corrected.values.length,2);assert.equal(corrected.values[1].correction.reason,'Tape slipped');
  assert.equal(service.currentValue(corrected).value,90);
  assert.ok(service.measurementConversions(record.id).every(result=>result.inputValue===90));
  const html=renderRecords(service,'measurement','','',false);
  assert.match(html,/Incorrect/);assert.match(html,/Tape slipped/);assert.match(html,/90 cm/);
});

test('all corrected values leave no current value or derived conversions',()=>{
  const{service,profile}=fixture();const record=add(service,profile,90,'2026-06-01','2026-06-01T10:00:00Z');
  service.correctMeasurementValue(record.id,record.values[0].id);
  const corrected=service.records(profile.id).measurements[0];
  assert.equal(service.currentValue(corrected),undefined);assert.deepEqual(service.measurementConversions(record.id),[]);
  assert.match(renderRecords(service,'measurement','','',false),/All entries corrected/);
});

test('equal measured dates use the most recently recorded valid entry and explain that tie only then',()=>{
  const{service,profile}=fixture();const record=add(service,profile,90,'2026-07-01','2026-07-01T09:00:00Z');
  service.addMeasurementValue(record.id,{value:91,unit:'cm',originalValue:91,originalUnit:'cm',measuredAt:'2026-07-01',recordedAt:'2026-07-01T10:00:00Z',sourceType:'manual',acquisitionMethod:'manual'});
  assert.equal(service.currentValue(service.records(profile.id).measurements[0]).value,91);
  assert.match(renderRecords(service,'measurement','','',false),/same date use the most recently recorded valid entry/);
  const separate=fixture();add(separate.service,separate.profile,80,'2026-06-01','2026-06-01T09:00:00Z');
  assert.doesNotMatch(renderRecords(separate.service,'measurement','','',false),/same date use/);
});

test('schema 2 migrates to current schema and malformed correction metadata fails closed',()=>{
  const{service,local}=fixture();const raw=JSON.parse(local.getItem('sigma.data.v1'));raw.schemaVersion=2;const migrated=new LocalStorageRepository(storage(JSON.stringify(raw))).load();
  assert.equal(migrated.status,'ok');assert.equal(migrated.data.schemaVersion,7);
  raw.schemaVersion=3;raw.measurements=[{id:'m',profileId:raw.profiles[0].id,kind:'measurement',measurementType:'Waist',category:'Upper body',label:'Waist',visibility:'private',createdAt:'2026-01-01',updatedAt:'2026-01-01',values:[{id:'v',value:90,unit:'cm',originalValue:90,originalUnit:'cm',measuredAt:'2026-01-01',recordedAt:'2026-01-01',createdAt:'2026-01-01',sourceType:'manual',acquisitionMethod:'manual',correction:{status:'deleted'}}]}];
  assert.equal(new LocalStorageRepository(storage(JSON.stringify(raw))).load().status,'corrupt');
  assert.ok(service);
});

test('compact renderers hide creation and Family stages until explicitly selected',()=>{
  const{service,profile}=fixture();add(service,profile,90,'2026-07-01','2026-07-01T10:00:00Z');
  assert.doesNotMatch(renderProfiles(service),/id="profile-form"/);assert.match(renderProfiles(service),/Add profile/);
  const records=renderRecords(service,'brand_fit','','',false);assert.match(records,/id="record-mode-select"/);assert.match(records,/Brand &amp; product facts/);assert.doesNotMatch(records,/Brand &amp; product fit/);
  const physical=renderRecords(service,'measurement','','',false);assert.match(physical,/Update value/);
  const overview=renderFamily(service,'full');assert.match(overview,/class="family-overview"/);assert.doesNotMatch(overview,/id="family-form"|id="connection-form"|id="grant-form"/);
  assert.match(renderFamily(service,'full',undefined,'families'),/id="family-form"/);
  assert.doesNotMatch(renderFamily(service,'full',undefined,'families'),/id="connection-form"|id="grant-form"/);
});

test('compact context avoids redundant selectors until a real choice exists',()=>{
  const{service}=fixture();const one=renderShell('profiles',service,'');
  assert.doesNotMatch(one,/id="context-actor-select"|id="context-profile-select"/);
  service.createProfile({displayName:'Jordan',profileType:'independent'});
  assert.match(renderShell('profiles',service,''),/id="context-actor-select"/);
});

test('Family shows pending requests to the recipient and composes sharing only in the selected eligible stage',()=>{
  const{service,profile:alex}=fixture();const jordan=service.createProfile({displayName:'Jordan',profileType:'independent'});
  service.selectActor(alex.id);service.requestConnection(jordan.id);service.selectActor(jordan.id);
  assert.doesNotMatch(renderFamily(service,'full'),/Accept/);
  assert.match(renderFamily(service,'full',undefined,'connections'),/Alex[\s\S]*Accept/);
  assert.doesNotMatch(renderFamily(service,'full',undefined,'sharing'),/id="grant-form"/);
  const pending=service.snapshot().adultConnections[0];service.respondConnection(pending.id,true);service.selectActor(alex.id);
  assert.doesNotMatch(renderFamily(service,'full'),/id="grant-form"/);
  assert.match(renderFamily(service,'full',undefined,'sharing'),/id="grant-form"/);
});

test('read-only recipients cannot correct an owner measurement and all six destinations remain in navigation',()=>{
  const{service,profile:alex}=fixture();const record=add(service,alex,90,'2026-07-01','2026-07-01T10:00:00Z');const jordan=service.createProfile({displayName:'Jordan',profileType:'independent'});
  service.selectActor(alex.id);const request=service.requestConnection(jordan.id);service.selectActor(jordan.id);service.respondConnection(request.id,true);service.selectActor(alex.id);service.grantAccess(alex.id,jordan.id,{type:'profile'});service.selectActor(jordan.id);
  assert.throws(()=>service.correctMeasurementValue(record.id,record.values[0].id),/not authorised/);
  const shell=renderShell('profiles',service,'');assert.equal([...shell.matchAll(/data-route="/g)].length,6);
});
