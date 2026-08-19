import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_STORAGE_KEY, LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';

const storage=(raw)=>{const values=new Map(raw===undefined?[]:[[DATA_STORAGE_KEY,raw]]);return{values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)}};
const fixture=()=>{let n=0;const local=storage();const service=new SigmaService(new LocalStorageRepository(local),()=>`2026-07-15T00:00:${String(n).padStart(2,'0')}Z`,()=>`id-${++n}`);const alex=service.createProfile({displayName:'Alex',profileType:'independent'});const jordan=service.createProfile({displayName:'Jordan',profileType:'independent'});const chris=service.createProfile({displayName:'Chris',profileType:'independent'});return{service,local,alex,jordan,chris}};
const measurementInput=profileId=>({profileId,measurementType:'Waist',category:'Upper body',label:'Waist',value:90,unit:'cm',originalValue:90,originalUnit:'cm',measuredAt:'2026-07-15',recordedAt:'2026-07-15',sourceType:'manual',acquisitionMethod:'manual'});
const sizeInput=profileId=>({profileId,category:'Footwear',label:'Shoe',sizingSystem:'UK',sizeValue:'9',recordedAt:'2026-07-15',sourceType:'manual'});
const fitInput=profileId=>({profileId,category:'Footwear',brand:'Nike',sizingSystem:'UK',sizeValue:'9',recordedAt:'2026-07-15',sourceType:'manual'});

test('connections, Family membership and whole-profile read grants never confer independent edit authority',()=>{const{service,alex,jordan}=fixture();const measurement=service.addMeasurement(measurementInput(alex.id));const size=service.addStandardSize(sizeInput(alex.id));const fit=service.addBrandFit(fitInput(alex.id));const family=service.createFamily('Home');service.addFamilyMember(family.id,jordan.id);const request=service.requestConnection(jordan.id);service.selectActor(jordan.id);service.respondConnection(request.id,true);service.selectActor(alex.id);service.grantAccess(alex.id,jordan.id,{type:'profile'});service.selectActor(jordan.id);const denied=[()=>service.addMeasurement(measurementInput(alex.id)),()=>service.addMeasurementValue(measurement.id,{value:89,unit:'cm',originalValue:89,originalUnit:'cm',measuredAt:'2026-07-16',recordedAt:'2026-07-16',sourceType:'manual',acquisitionMethod:'manual'}),()=>service.updateMeasurement(measurement.id,{label:'Changed',category:'Upper body',measurementType:'Waist'}),()=>service.addStandardSize(sizeInput(alex.id)),()=>service.updateStandardSize(size.id,{category:'Footwear',label:'Changed',sizingSystem:'UK',sizeValue:'10',notes:undefined}),()=>service.addBrandFit(fitInput(alex.id)),()=>service.updateBrandFit(fit.id,{category:'Footwear',brand:'Other',productName:undefined,productLine:undefined,sizingSystem:'UK',sizeValue:'10',fitNotes:undefined})];for(const mutate of denied)assert.throws(mutate,/not authorised/);assert.equal(service.canViewRecord(jordan.id,measurement.id),true);});

test('authorised managers can mutate managed records while non-managers cannot',()=>{const{service,alex,jordan,chris}=fixture();const family=service.createFamily('Home');service.addFamilyMember(family.id,jordan.id);const child=service.createManagedProfile({displayName:'Sam',managedKind:'child',familyId:family.id});const measurement=service.addMeasurement(measurementInput(child.id));const size=service.addStandardSize(sizeInput(child.id));const fit=service.addBrandFit(fitInput(child.id));service.addMeasurementValue(measurement.id,{value:89,unit:'cm',originalValue:89,originalUnit:'cm',measuredAt:'2026-07-16',recordedAt:'2026-07-16',sourceType:'manual',acquisitionMethod:'manual'});service.updateStandardSize(size.id,{...sizeInput(child.id),notes:undefined});service.updateBrandFit(fit.id,{category:'Footwear',brand:'Nike',productName:undefined,productLine:undefined,sizingSystem:'UK',sizeValue:'9',fitNotes:'ok'});for(const actor of [jordan,chris]){service.selectActor(actor.id);assert.throws(()=>service.addMeasurement(measurementInput(child.id)),/not authorised/);assert.throws(()=>service.updateMeasurement(measurement.id,{label:'No',category:'Upper body',measurementType:'Waist'}),/not authorised/);}assert.equal(service.snapshot().profiles.find(p=>p.id===child.id).managedByProfileIds[0],alex.id);});

test('ordinary metadata editing cannot change profile type and reload remains valid',()=>{const{service,local,alex}=fixture();service.updateProfile(alex.id,{displayName:'Alex Updated',profileType:'managed'});const profile=service.snapshot().profiles.find(p=>p.id===alex.id);assert.equal(profile.profileType,'independent');assert.equal(profile.displayName,'Alex Updated');assert.equal(new SigmaService(new LocalStorageRepository(local)).storageStatus().status,'ok');});

test('manager additions require existing authority and eligible independent managers',()=>{const{service,alex,jordan,chris}=fixture();const family=service.createFamily('Home');service.addFamilyMember(family.id,jordan.id);const child=service.createManagedProfile({displayName:'Sam',managedKind:'child',familyId:family.id});service.selectActor(jordan.id);assert.throws(()=>service.assignManager(child.id,jordan.id),/existing manager/);service.selectActor(alex.id);assert.throws(()=>service.assignManager(child.id,chris.id),/share a Family/);service.assignManager(child.id,jordan.id);assert.throws(()=>service.assignManager(child.id,jordan.id),/already/);assert.throws(()=>service.assignManager(child.id,child.id),/independent/);assert.deepEqual(service.snapshot().profiles.find(p=>p.id===child.id).managedByProfileIds,[alex.id,jordan.id]);});

test('legacy managed profiles require an explicit same-existing-Family initial assignment',()=>{const old={schemaVersion:1,activeProfileId:'a',profiles:[{id:'a',displayName:'Alex',profileType:'independent',createdAt:'x',updatedAt:'x'},{id:'m',displayName:'Legacy',profileType:'managed',createdAt:'x',updatedAt:'x'}],measurements:[],standardSizes:[],brandFits:[]};const service=new SigmaService(new LocalStorageRepository(storage(JSON.stringify(old))));assert.equal(service.snapshot().profiles[1].managedByProfileIds,undefined);assert.throws(()=>service.assignManager('m','a'),/share a Family/);const family=service.createFamily('Home');service.addFamilyMember(family.id,'m');service.assignManager('m','a');assert.deepEqual(service.snapshot().profiles[1].managedByProfileIds,['a']);});

test('admin mode can view and edit every account with no grant, connection or management relationship',()=>{
  const{service,alex,jordan,chris}=fixture();
  const measurement=service.addMeasurement(measurementInput(alex.id));
  service.enterAdminMode();
  assert.equal(service.isAdminMode(),true);
  assert.equal(service.activeActor().displayName,'Admin');
  // Every real account is visible and editable, unrelated by any grant/Family/connection.
  for(const profile of [alex,jordan,chris])assert.equal(service.profileAccess(profile.id),'editable');
  assert.deepEqual(service.visibleProfiles().map(p=>p.id).sort(),[alex.id,jordan.id,chris.id].sort());
  // Admin can mutate a record on a totally unrelated profile.
  service.updateMeasurement(measurement.id,{label:'Adjusted',category:'Upper body',measurementType:'Waist'});
  assert.equal(service.snapshot().measurements[0].label,'Adjusted');
  service.addMeasurement(measurementInput(jordan.id));
  assert.equal(service.snapshot().measurements.filter(m=>m.profileId===jordan.id).length,1);
  // The synthetic Admin identity never becomes a real, storable, exportable profile.
  assert.equal(service.snapshot().profiles.some(p=>p.displayName==='Admin'),false);
  assert.equal(service.exportBackup().profiles.some(p=>p.displayName==='Admin'),false);
});

test('admin mode can create and revoke a sharing grant between two unrelated accounts',()=>{
  const{service,alex,jordan}=fixture();
  service.enterAdminMode();
  const grant=service.grantAccess(alex.id,jordan.id,{type:'profile'});
  assert.equal(grant.status,'active');
  service.revokeGrant(grant.id);
  assert.equal(service.snapshot().sharingGrants[0].status,'revoked');
});

test('logOut clears the current session (normal account or admin) without deleting any data',()=>{
  const{service,alex,local}=fixture();
  service.addMeasurement(measurementInput(alex.id));
  service.logOut();
  assert.equal(service.activeActor(),undefined);
  assert.equal(service.activeProfile(),undefined);
  assert.equal(service.snapshot().profiles.length,3,'logging out must not delete any account');
  assert.equal(service.snapshot().measurements.length,1,'logging out must not delete any record');

  service.enterAdminMode();
  assert.equal(service.isAdminMode(),true);
  service.logOut();
  assert.equal(service.isAdminMode(),false);
  assert.equal(service.activeActor(),undefined);
  assert.equal(new SigmaService(new LocalStorageRepository(local)).storageStatus().status,'ok','logged-out state reloads cleanly');
});

test('the admin sentinel identity cannot be reached through ordinary actor selection',()=>{
  const{service}=fixture();
  assert.throws(()=>service.selectActor('__sigma_admin__'),/not found/);
});
