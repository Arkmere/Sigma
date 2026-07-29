import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { renderRecords } from '../dist/app/ui/records.js';
import { renderFamily } from '../dist/app/ui/family.js';

const storage=()=>{const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}};
const fixture=()=>{let n=0;const local=storage();const service=new SigmaService(new LocalStorageRepository(local),()=>`2026-07-20T00:00:${String(n).padStart(2,'0')}Z`,()=>`id-${++n}`);const alex=service.createProfile({displayName:'Alex',profileType:'independent'});const jordan=service.createProfile({displayName:'Jordan',profileType:'independent'});return{service,local,alex,jordan}};
const measurement=(service,profileId,label='Waist',category='Upper body')=>service.addMeasurement({profileId,measurementType:label,category,label,value:90,unit:'cm',originalValue:90,originalUnit:'cm',measuredAt:'2026-07-20',recordedAt:'2026-07-20',sourceType:'manual',acquisitionMethod:'manual'});
const size=(service,profileId,label='Shoe size',category='Footwear')=>service.addStandardSize({profileId,category,label,sizingSystem:'UK',sizeValue:'9',recordedAt:'2026-07-20',sourceType:'manual'});
const fit=(service,profileId,brand='Nike',category='Footwear')=>service.addBrandFit({profileId,category,brand,productName:'Air Max',sizingSystem:'UK',sizeValue:'9',recordedAt:'2026-07-20',sourceType:'manual'});
const connect=(service,alex,jordan)=>{service.selectActor(alex.id);const request=service.requestConnection(jordan.id);service.selectActor(jordan.id);service.respondConnection(request.id,true);service.selectActor(alex.id);return request};

test('actor switch resolves and persists a hidden active profile fallback while guarded selection rejects it',()=>{
  const{service,local,alex,jordan}=fixture();const waist=measurement(service,alex.id);service.selectProfile(alex.id);service.selectActor(jordan.id);
  assert.equal(service.activeVisibleProfile()?.id,jordan.id);assert.equal(service.snapshot().activeProfileId,jordan.id);
  assert.equal(new SigmaService(new LocalStorageRepository(local)).activeVisibleProfile()?.id,jordan.id);
  assert.throws(()=>service.selectProfile(alex.id),/cannot view that profile/);
  const html=renderRecords(service,'measurement','','',false);assert.doesNotMatch(html,/Alex|Waist/);assert.doesNotMatch(html,/Read-only/);assert.equal(service.records(alex.id).measurements[0].id,waist.id);
});

test('connection and Family membership grant zero profile or record visibility',()=>{
  const{service,alex,jordan}=fixture();measurement(service,alex.id);connect(service,alex,jordan);service.selectActor(jordan.id);
  assert.deepEqual(service.visibleProfiles().map(profile=>profile.id),[jordan.id]);assert.equal(service.authorisedRecords(alex.id).measurements.length,0);
  service.selectActor(alex.id);const family=service.createFamily('Home');service.addFamilyMember(family.id,jordan.id);service.selectActor(jordan.id);
  assert.equal(service.profileAccess(alex.id),'hidden');assert.equal(service.authorisedRecords(alex.id).measurements.length,0);
});

test('empty whole-profile and empty category grants derive profile visibility from grants',()=>{
  for(const scope of [{type:'profile'},{type:'category',category:'Footwear'}]){
    const{service,alex,jordan}=fixture();connect(service,alex,jordan);const grant=service.grantAccess(alex.id,jordan.id,scope);service.selectActor(jordan.id);
    assert.equal(service.profileAccess(alex.id),'read_only');assert.ok(service.visibleProfiles().some(profile=>profile.id===alex.id));service.selectProfile(alex.id);
    const html=renderRecords(service,'measurement','','',false);assert.match(html,/shared with you, but no recorded facts currently match the granted scope/i);assert.doesNotMatch(html,/id="record-form"|data-history-form|data-edit-/);
    service.selectActor(alex.id);service.revokeGrant(grant.id);service.selectActor(jordan.id);assert.equal(service.profileAccess(alex.id),'hidden');
  }
});

test('granular grant scopes expose only their intended canonical records',()=>{
  const cases=[
    [{type:'category',category:'Upper body'},['Waist'],['Shoe size','Nike']],
    [{type:'record_kind',recordKind:'standard_size'},['Shoe size'],['Waist','Nike']],
    [{type:'record_kind',recordKind:'brand_fit'},['Nike'],['Waist','Shoe size']],
    'measurement','standard_size','brand_fit',
  ];
  for(const entry of cases){
    const{service,alex,jordan}=fixture();const waist=measurement(service,alex.id);const shoe=size(service,alex.id);const nike=fit(service,alex.id);connect(service,alex,jordan);
    let scope,shown,hidden;if(Array.isArray(entry)&&typeof entry[0]==='object'){[scope,shown,hidden]=entry;}else{const kind=entry;const record=kind==='measurement'?waist:kind==='standard_size'?shoe:nike;scope={type:'record',recordKind:kind,recordId:record.id};shown=[kind==='measurement'?'Waist':kind==='standard_size'?'Shoe size':'Nike'];hidden=['Waist','Shoe size','Nike'].filter(value=>!shown.includes(value));}
    service.grantAccess(alex.id,jordan.id,scope);service.selectActor(jordan.id);service.selectProfile(alex.id);const records=service.authorisedRecords(alex.id);const labels=[...records.measurements.map(record=>record.label),...records.standardSizes.map(record=>record.label),...records.brandFits.map(record=>record.brand)];const rendered=['measurement','standard_size','brand_fit'].map(mode=>renderRecords(service,mode,'','',false)).join('');
    for(const value of shown){assert.ok(labels.includes(value),`${JSON.stringify(scope)} should include ${value}`);assert.match(rendered,new RegExp(value));}for(const value of hidden){assert.ok(!labels.includes(value),`${JSON.stringify(scope)} should hide ${value}`);assert.doesNotMatch(rendered,new RegExp(`>${value}<`));}
    assert.doesNotMatch(rendered,/id="record-form"|data-history-form|data-edit-/);
  }
});

test('managed-owner composer uses only the selected child records and creates a valid specific grant',()=>{
  const{service,alex,jordan}=fixture();const family=service.createFamily('Home');service.addFamilyMember(family.id,jordan.id);const child=service.createManagedProfile({displayName:'Sam',managedKind:'child',familyId:family.id});const adultRecord=measurement(service,alex.id,'Adult waist');const childRecord=measurement(service,child.id,'Child waist');
  const html=renderFamily(service,'full',{ownerId:child.id,recipientId:jordan.id,scope:'record:measurement',category:'Footwear',recordId:childRecord.id},'sharing');
  assert.match(html,/Child waist/);assert.doesNotMatch(html,/Adult waist/);assert.match(html,/Share Sam’s “Child waist” record with Jordan/);
  const options=service.grantableRecords(child.id);assert.deepEqual(options.measurements.map(record=>record.id),[childRecord.id]);assert.ok(!options.measurements.some(record=>record.id===adultRecord.id));
  service.grantAccess(child.id,jordan.id,{type:'record',recordKind:'measurement',recordId:childRecord.id});service.selectActor(jordan.id);service.selectProfile(child.id);assert.deepEqual(service.authorisedRecords(child.id).measurements.map(record=>record.id),[childRecord.id]);
});

test('authorised grant history hides unrelated grants and reports revoke authority from the service',()=>{
  const{service,alex,jordan}=fixture();const chris=service.createProfile({displayName:'Chris',profileType:'independent'});connect(service,alex,jordan);const grant=service.grantAccess(alex.id,jordan.id,{type:'profile'});
  assert.deepEqual(service.authorisedGrantHistory().map(view=>[view.grant.id,view.canRevoke]),[[grant.id,true]]);
  service.selectActor(jordan.id);assert.deepEqual(service.authorisedGrantHistory().map(view=>[view.grant.id,view.canRevoke]),[[grant.id,false]]);
  service.selectActor(chris.id);assert.deepEqual(service.authorisedGrantHistory(),[]);assert.doesNotMatch(renderFamily(service,'full'),/Alex → Jordan/);
});

test('revocation removes recipient visibility, resolves fallback, and preserves owner records',()=>{
  const{service,alex,jordan}=fixture();const waist=measurement(service,alex.id);connect(service,alex,jordan);const grant=service.grantAccess(alex.id,jordan.id,{type:'profile'});service.selectActor(jordan.id);service.selectProfile(alex.id);assert.equal(service.activeVisibleProfile()?.id,alex.id);
  service.selectActor(alex.id);service.revokeGrant(grant.id);service.selectActor(jordan.id);
  assert.equal(service.activeVisibleProfile()?.id,jordan.id);assert.ok(!service.visibleProfiles().some(profile=>profile.id===alex.id));assert.doesNotMatch(renderRecords(service,'measurement','','',false),/Alex|Waist/);assert.equal(service.records(alex.id).measurements[0].id,waist.id);
});

test('disconnect follows existing semantics: an active explicit grant remains until revoked',()=>{
  const{service,alex,jordan}=fixture();measurement(service,alex.id);const connection=connect(service,alex,jordan);service.grantAccess(alex.id,jordan.id,{type:'profile'});service.selectActor(jordan.id);service.disconnect(connection.id);
  assert.equal(service.profileAccess(alex.id),'read_only');assert.equal(service.authorisedRecords(alex.id).measurements.length,1);
});
