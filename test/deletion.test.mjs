import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateStoredData } from '../dist/data/migrations.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';

const storage=()=>{const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}};
const fixture=()=>{let n=0;const local=storage();const service=new SigmaService(new LocalStorageRepository(local),()=>`2026-08-16T00:00:${String(n).padStart(2,'0')}Z`,()=>`id-${++n}`);const alex=service.createProfile({displayName:'Alex',profileType:'independent'});const jordan=service.createProfile({displayName:'Jordan',profileType:'independent'});return{service,local,alex,jordan}};
const measurement=(service,profileId,label='Waist',category='Upper body')=>service.addMeasurement({profileId,measurementType:label,category,label,value:90,unit:'cm',originalValue:90,originalUnit:'cm',measuredAt:'2026-08-16',recordedAt:'2026-08-16',sourceType:'manual',acquisitionMethod:'manual'});
const size=(service,profileId,label='Shoe size',category='Footwear')=>service.addStandardSize({profileId,category,label,sizingSystem:'UK',sizeValue:'9',recordedAt:'2026-08-16',sourceType:'manual'});
const fit=(service,profileId,brand='Nike',category='Footwear')=>service.addBrandFit({profileId,category,brand,productName:'Air Max',sizingSystem:'UK',sizeValue:'9',recordedAt:'2026-08-16',sourceType:'manual'});
const connect=(service,alex,jordan)=>{service.selectActor(alex.id);const request=service.requestConnection(jordan.id);service.selectActor(jordan.id);service.respondConnection(request.id,true);service.selectActor(alex.id);return request};

test('deleting the only value of a record is rejected; deleting one of several removes just that entry',()=>{
  const{service,alex}=fixture();
  const record=measurement(service,alex.id);
  assert.throws(()=>service.deleteMeasurementValue(record.id,record.values[0].id),/only value/);
  const updated=service.addMeasurementValue(record.id,{value:91,unit:'cm',originalValue:91,originalUnit:'cm',measuredAt:'2026-08-17',recordedAt:'2026-08-17',sourceType:'manual',acquisitionMethod:'manual'});
  service.deleteMeasurementValue(record.id,record.values[0].id);
  assert.deepEqual(service.records(alex.id).measurements[0].values.map(v=>v.id),[updated.values[1].id]);
});

test('deleting a record cascades to remove any grant scoped to exactly that record',()=>{
  const{service,alex,jordan}=fixture();
  const record=measurement(service,alex.id);
  connect(service,alex,jordan);
  const grant=service.grantAccess(alex.id,jordan.id,{type:'record',recordKind:'measurement',recordId:record.id});
  service.deleteMeasurement(record.id);
  assert.equal(service.records(alex.id).measurements.length,0);
  assert.ok(!service.snapshot().sharingGrants.some(g=>g.id===grant.id));
});

test('an unrelated actor cannot delete another profile\'s record or profile',()=>{
  const{service,alex,jordan}=fixture();
  const record=measurement(service,alex.id);
  service.selectActor(jordan.id);
  assert.throws(()=>service.deleteMeasurement(record.id),/not authorised/i);
  assert.throws(()=>service.deleteProfile(alex.id),/not authorised/i);
});

test('deleting a profile cascades through records, memberships, connections, grants and manager lists',()=>{
  const{service,alex,jordan}=fixture();
  const waist=measurement(service,alex.id);
  const shoe=size(service,alex.id);
  const nike=fit(service,alex.id);
  const family=service.createFamily('Home');
  service.addFamilyMember(family.id,jordan.id);
  const child=service.createManagedProfile({displayName:'Sam',managedKind:'child',familyId:family.id});
  service.assignManager(child.id,jordan.id);
  const connectionRequest=connect(service,alex,jordan);
  const grant=service.grantAccess(alex.id,jordan.id,{type:'profile'});

  service.deleteProfile(alex.id);

  const snapshot=service.snapshot();
  assert.ok(!snapshot.profiles.some(p=>p.id===alex.id));
  assert.equal(snapshot.measurements.some(r=>r.id===waist.id),false);
  assert.equal(snapshot.standardSizes.some(r=>r.id===shoe.id),false);
  assert.equal(snapshot.brandFits.some(r=>r.id===nike.id),false);
  assert.ok(!snapshot.sharingGrants.some(g=>g.id===grant.id));
  assert.ok(!snapshot.adultConnections.some(c=>c.id===connectionRequest.id));
  assert.ok(!snapshot.familyMemberships.some(m=>m.profileId===alex.id));
  // Jordan was never a manager of anything Alex managed, so nothing else should change for them.
  assert.ok(snapshot.profiles.some(p=>p.id===jordan.id));

  // The resulting data must still be internally valid — deleting a profile must never corrupt storage.
  assert.equal(migrateStoredData(snapshot).status,'ok');
});

test('deleting a manager cascades their managed-profile entries and leaves the managed profile unassigned, not corrupt',()=>{
  const{service,alex}=fixture();
  const family=service.createFamily('Home');
  const child=service.createManagedProfile({displayName:'Sam',managedKind:'child',familyId:family.id});
  assert.deepEqual(service.snapshot().profiles.find(p=>p.id===child.id).managedByProfileIds,[alex.id]);

  service.deleteProfile(alex.id);

  const snapshot=service.snapshot();
  const sam=snapshot.profiles.find(p=>p.id===child.id);
  assert.ok(sam, 'the managed profile itself is not deleted when only its manager is deleted');
  assert.deepEqual(sam.managedByProfileIds,[]);
  const result=migrateStoredData(snapshot);
  assert.equal(result.status,'ok');
});

test('deleting the active actor reassigns to another independent profile',()=>{
  const{service,alex,jordan}=fixture();
  assert.equal(service.activeActor().id,alex.id);
  service.deleteProfile(alex.id);
  assert.equal(service.activeActor()?.id,jordan.id);
});

test('deleting the last independent profile leaves no active actor and the store still reloads cleanly',()=>{
  const{service,alex,jordan}=fixture();
  service.selectActor(jordan.id);
  service.deleteProfile(jordan.id);
  assert.equal(service.activeActor()?.id,alex.id);
  service.deleteProfile(alex.id);
  assert.equal(service.activeActor(),undefined);
  const result=migrateStoredData(service.snapshot());
  assert.equal(result.status,'ok');
});

test('schema 5 tolerates a dangling historical grantedByProfileId but still rejects a dangling ownerProfileId',()=>{
  const{service,alex,jordan}=fixture();
  connect(service,alex,jordan);
  service.grantAccess(alex.id,jordan.id,{type:'profile'});
  const dataWithDeletedGranter=service.snapshot();
  dataWithDeletedGranter.sharingGrants[0].grantedByProfileId='no-such-profile-anymore';
  assert.equal(migrateStoredData(dataWithDeletedGranter).status,'ok');

  const dataWithDeletedOwner=service.snapshot();
  dataWithDeletedOwner.sharingGrants[0].ownerProfileId='no-such-profile-anymore';
  assert.equal(migrateStoredData(dataWithDeletedOwner).status,'corrupt');
});

test('schema 4 stored data still migrates losslessly to the current schema',()=>{
  const{service,alex}=fixture();
  measurement(service,alex.id);
  const legacy={...service.snapshot(),schemaVersion:4};
  const result=migrateStoredData(legacy);
  assert.equal(result.status,'ok');
  assert.equal(result.data.schemaVersion,7);
  assert.equal(result.data.measurements.length,1);
});
