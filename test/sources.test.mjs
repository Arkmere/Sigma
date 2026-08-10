import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceRegistry } from '../dist/sources/registry.js';
import { externalFieldAllowlist } from '../dist/sources/allowlist.js';
import { demoPayload, evaluateDemoPayload, evaluateExternalDatum, evaluateSourcePolicy, importCandidate, inspectSourceDatumCapability } from '../dist/sources/import.js';
import { PermissionDemoService, PERMISSION_DEMO_STORAGE_KEY, permissionExplanations } from '../dist/permissions/service.js';
import { LocalStorageRepository, DATA_STORAGE_KEY } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { canonicalFactById } from '../dist/domain/canonical-facts.js';
import { migrateStoredData } from '../dist/data/migrations.js';

const storage=()=>{const values=new Map();return{values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)}};
const fixture=()=>{const local=storage();let n=0;return{local,service:new SigmaService(new LocalStorageRepository(local),()=> '2026-07-28T12:00:00Z',()=>`id-${++n}`)}};

test('source registry has unique stable IDs and truthful availability and permissions',()=>{
 assert.equal(new Set(sourceRegistry.map(s=>s.id)).size,sourceRegistry.length);
 assert.equal(sourceRegistry.find(s=>s.id==='manual').availability,'live');
 assert.ok(sourceRegistry.filter(s=>s.id!=='manual').every(s=>s.availability!=='live'));
 assert.equal(sourceRegistry.find(s=>s.id==='camera_assisted').requiredPermission,'camera');
 assert.equal(sourceRegistry.find(s=>s.id==='external_scan').requiredPermission,'files');
 assert.equal(sourceRegistry.find(s=>s.id==='smart_scale').requiredPermission,'nearby_devices');
});

test('explicit allowlist accepts catalogued facts and rejects unrelated and malformed fields closed',()=>{
 assert.ok(externalFieldAllowlist.some(f=>f.id==='size.ring'));
 for(const id of ['health.heart_rate','sleep.duration','activity.steps','location.gps','exercise.workout','health.blood_oxygen','medical.diagnosis','medical.medication','body.custom_waist'])
   assert.deepEqual(evaluateExternalDatum({externalFieldId:id,value:1,unitOrSystem:'cm',measuredAt:'2026-01-01'}),{status:'rejected',externalFieldId:id,reason:'not_allowlisted'});
 assert.equal(evaluateExternalDatum({externalFieldId:'body.height',value:180,unitOrSystem:'bpm',measuredAt:'x'}).reason,'unsupported_unit');
 assert.equal(evaluateExternalDatum({externalFieldId:'body.height',value:Infinity,unitOrSystem:'cm',measuredAt:'x'}).reason,'invalid_value');
});

test('demo payload filters unrelated fields and imports only confirmed individual facts with provenance and duplicate protection',()=>{
 const results=evaluateDemoPayload(),accepted=results.filter(x=>x.status==='accepted'),rejected=results.filter(x=>x.status==='rejected');
 assert.equal(demoPayload.length,9);assert.equal(accepted.length,5);assert.equal(rejected.length,4);
 const {service}=fixture(),profile=service.createProfile({displayName:'Alex',profileType:'independent'});
 assert.equal(service.snapshot().measurements.length,0);
 importCandidate(service,profile.id,accepted[0].candidate);
 const value=service.snapshot().measurements[0].values[0];
 assert.equal(service.snapshot().measurements.length,1);assert.equal(value.sourceId,'measurement_device');assert.equal(value.sourceDevice,'Sigma demo device');assert.equal(value.originalValue,178);assert.equal(value.derivation.kind,'direct');
 assert.throws(()=>importCandidate(service,profile.id,accepted[0].candidate),/already imported/);
 importCandidate(service,profile.id,{...accepted[0].candidate,sourceItemId:'different-item'});
 assert.equal(service.snapshot().measurements.length,1);assert.equal(service.snapshot().measurements[0].values.length,2);
});

test('import authority is independently enforced for managed and read-only profiles',()=>{
 const {service}=fixture(),alex=service.createProfile({displayName:'Alex',profileType:'independent'}),family=service.createFamily('Home');
 const child=service.createManagedProfile({displayName:'Child',managedKind:'child',familyId:family.id});
 const jordan=service.createProfile({displayName:'Jordan',profileType:'independent'}),candidate=evaluateDemoPayload().find(x=>x.status==='accepted').candidate;
 service.selectActor(alex.id);importCandidate(service,child.id,candidate);
 service.selectActor(jordan.id);assert.throws(()=>importCandidate(service,alex.id,{...candidate,sourceItemId:'other'}),/not authorised/);
});

test('permission demonstrations are contextual, complete, separate and absent from backup',()=>{
 const local=storage(),permissions=new PermissionDemoService(local);
 assert.ok(Object.values(permissions.decisions()).every(v=>v==='not_requested'));
 for(const explanation of Object.values(permissionExplanations)){assert.ok(explanation.requestedAccess&&explanation.reason&&explanation.willAccess.length&&explanation.willNotAccess.length&&explanation.alternatives.length&&explanation.denialEffect);}
 permissions.set('health_data','demo_denied');assert.equal(permissions.decision('health_data'),'demo_denied');assert.ok(local.getItem(PERMISSION_DEMO_STORAGE_KEY));assert.equal(local.getItem(DATA_STORAGE_KEY),null);
 const service=new SigmaService(new LocalStorageRepository(local));service.createProfile({displayName:'Alex',profileType:'independent'});
 assert.doesNotMatch(JSON.stringify(service.exportBackup()),/permissionDemo|demo_denied/);
 permissions.reset();assert.equal(permissions.decision('health_data'),'not_requested');assert.ok(local.getItem(DATA_STORAGE_KEY));
});

test('source code contains no real browser permission calls',async()=>{
 const fs=await import('node:fs/promises');const files=['src/app/app.ts','src/permissions/service.ts','src/sources/import.ts'];
 const source=(await Promise.all(files.map(f=>fs.readFile(f,'utf8')))).join('\n');
 assert.doesNotMatch(source,/getUserMedia|requestDevice|navigator\.contacts|showOpenFilePicker|Notification\.requestPermission/);
});

test('schema 2 accepts optional structured provenance and rejects malformed values',()=>{
 const {service}=fixture(),profile=service.createProfile({displayName:'Alex',profileType:'independent'});
 const candidate=evaluateDemoPayload().find(x=>x.status==='accepted').candidate;importCandidate(service,profile.id,candidate);
 const valid=service.snapshot();assert.equal(migrateStoredData(valid).status,'ok');
 const unknown=structuredClone(valid);unknown.measurements[0].values[0].sourceId='unknown';assert.equal(migrateStoredData(unknown).status,'corrupt');
 const badDerivation=structuredClone(valid);badDerivation.measurements[0].values[0].derivation={kind:'guessed'};assert.equal(migrateStoredData(badDerivation).status,'corrupt');
 const badConfidence=structuredClone(valid);badConfidence.measurements[0].values[0].confidence=2;assert.equal(migrateStoredData(badConfidence).status,'corrupt');
});

test('declared shoe and ring sizes import through the operational demo source with shared provenance',()=>{
 const clothing=evaluateExternalDatum({externalFieldId:'size.shoe',value:'9',unitOrSystem:'UK',measuredAt:'2026-07-01',sourceItemId:'size-1',sourceDevice:'Demo sizing device',confidence:0.9,derivation:{kind:'direct'}});
 const shoe=evaluateExternalDatum({externalFieldId:'size.shoe',value:'9',unitOrSystem:'UK',measuredAt:'2026-07-02',sourceItemId:'shoe-1'});
 assert.equal(clothing.status,'accepted');assert.equal(shoe.status,'accepted');assert.equal(clothing.candidate.targetKind,'standard_size');assert.equal(shoe.candidate.targetKind,'standard_size');
 const {service}=fixture(),profile=service.createProfile({displayName:'Alex',profileType:'independent'});
 importCandidate(service,profile.id,clothing.candidate);const record=service.snapshot().standardSizes[0];
 assert.deepEqual({profileId:record.profileId,canonicalFactId:record.canonicalFactId,category:record.category,label:record.label,sizingSystem:record.sizingSystem,sizeValue:record.sizeValue,sourceId:record.sourceId,sourceItemId:record.sourceItemId,sourceDevice:record.sourceDevice,confidence:record.confidence,derivation:record.derivation},{profileId:profile.id,canonicalFactId:'size.shoe-size',category:'Footwear',label:'Shoe size',sizingSystem:'UK',sizeValue:'9',sourceId:'measurement_device',sourceItemId:'size-1',sourceDevice:'Demo sizing device',confidence:0.9,derivation:{kind:'direct',method:undefined,inputDescription:undefined}});
 assert.equal(record.recordedAt,'2026-07-01');assert.equal(migrateStoredData(service.snapshot()).status,'ok');
 assert.throws(()=>importCandidate(service,profile.id,clothing.candidate),/already imported/);
 importCandidate(service,profile.id,{...clothing.candidate,sourceItemId:'size-2'});assert.equal(service.snapshot().standardSizes.length,2);
 const ring=evaluateExternalDatum({externalFieldId:'size.ring',value:'54',unitOrSystem:'ISO',measuredAt:'2026-07-03',sourceItemId:'ring-1'});assert.equal(ring.status,'accepted');importCandidate(service,profile.id,ring.candidate);assert.equal(service.snapshot().standardSizes.length,3);
 const backup=JSON.stringify(service.exportBackup());assert.match(backup,/Demo sizing device/);assert.doesNotMatch(backup,/permissionDemo/);
});

test('source registry capabilities and availability are enforced with distinct reasons',()=>{
 const raw=(externalFieldId,value,unitOrSystem)=>({externalFieldId,value,unitOrSystem,measuredAt:'2026-07-01'});
 for(const field of ['body.height','body.weight','body.waist_circumference','foot.length'])assert.equal(evaluateExternalDatum(raw(field,field==='body.weight'?70:170,field==='body.weight'?'kg':field==='foot.length'?'mm':'cm')).status,'accepted');
 const healthHeight=inspectSourceDatumCapability(raw('body.height',180,'cm'),'health_connect');assert.equal(healthHeight.status,'supported');assert.equal('candidate' in healthHeight,false);assert.equal(inspectSourceDatumCapability(raw('body.weight',70,'kg'),'health_connect').status,'supported');
 for(const [source,field,value,unit,reason] of [
  ['health_connect','size.clothing','M','Generic','field_not_supported_by_source'],['health_connect','size.ring','54','ISO','field_not_supported_by_source'],
  ['apple_health','foot.length',270,'mm','field_not_supported_by_source'],['smart_scale','body.waist_circumference',84,'cm','field_not_supported_by_source'],
  ['camera_assisted','body.weight',70,'kg','field_not_supported_by_source'],
 ])assert.equal(evaluateExternalDatum(raw(field,value,unit),source).reason,reason);
 assert.equal(inspectSourceDatumCapability(raw('body.weight',70,'kg'),'smart_scale').status,'supported');
 assert.equal(inspectSourceDatumCapability(raw('body.waist_circumference',84,'cm'),'camera_assisted').status,'supported');
 assert.equal(evaluateExternalDatum(raw('body.height',180,'cm'),'health_connect').reason,'source_not_available');
 assert.equal(evaluateExternalDatum(raw('body.weight',70,'kg'),'smart_scale').reason,'source_not_available');
 const sizeField=externalFieldAllowlist.find(field=>field.id==='size.shoe'),measurementOnly={...sourceRegistry.find(source=>source.id==='measurement_device'),supportedRecordKinds:['measurement']};
 assert.equal(evaluateSourcePolicy(measurementOnly,sizeField,false),'record_kind_not_supported_by_source');
});

test('confirmed import defensively rejects forged source capability and availability',()=>{
 const {service}=fixture(),profile=service.createProfile({displayName:'Alex',profileType:'independent'}),valid=evaluateDemoPayload().find(x=>x.status==='accepted').candidate;
 const forgeries=[
  {...valid,sourceId:'health_connect'}, {...valid,externalFieldId:'body.neck_circumference'}, {...valid,targetKind:'standard_size'},
  {...valid,externalFieldId:'size.shoe'}, {...valid,canonicalFactId:'measurement.weight'}, {...valid,category:'Feet'}, {...valid,label:'Not height'},
  {...valid,unitOrSystem:'bpm'}, {...valid,sourceId:'unknown'}, {...valid,sourceItemId:' '},
 ];
 for(const candidate of forgeries)assert.throws(()=>importCandidate(service,profile.id,candidate),/invalid/);
 assert.equal(service.snapshot().measurements.length,0);assert.equal(service.snapshot().standardSizes.length,0);
});

test('operational external fields resolve and persist one canonical authority with provenance',()=>{
 const cases=[
  ['body.height',180,'cm','measurement.height'],['body.weight',75,'kg','measurement.weight'],['body.waist_circumference',82,'cm','measurement.waist-circumference'],['foot.length',270,'mm','measurement.foot-length'],
  ['size.shoe','9','UK','size.shoe-size'],['size.ring','54','ISO','size.ring-size'],
 ];
 const {service}=fixture(),profile=service.createProfile({displayName:'Casey',profileType:'independent'});
 for(const [externalFieldId,value,unitOrSystem,canonicalFactId] of cases){const result=evaluateExternalDatum({externalFieldId,value,unitOrSystem,measuredAt:'2026-08-10',sourceItemId:`item-${externalFieldId}`,sourceDevice:'Demo device'});assert.equal(result.status,'accepted');assert.equal(result.candidate.canonicalFactId,canonicalFactId);importCandidate(service,profile.id,result.candidate);}
 const data=service.snapshot();for(const record of [...data.measurements,...data.standardSizes]){const definition=canonicalFactById(record.canonicalFactId);assert.ok(definition);assert.equal(record.category,definition.category);if(record.kind==='measurement'){assert.equal(record.label,definition.label);assert.equal(record.measurementType,definition.measurement.measurementType);assert.equal(record.values[0].sourceId,'measurement_device');}else{assert.equal(record.label,definition.label);assert.equal(record.sourceId,'measurement_device');}}
});

test('manual and imported canonical measurements converge on one history record in either order',()=>{
 const first=fixture(),profile=first.service.createProfile({displayName:'Morgan',profileType:'independent'}),height=evaluateExternalDatum({externalFieldId:'body.height',value:181,unitOrSystem:'cm',measuredAt:'2026-08-10',sourceItemId:'height-import'}).candidate;
 first.service.addMeasurement({profileId:profile.id,canonicalFactId:'measurement.height',measurementType:'Height',category:'General body dimensions',label:'Height',value:180,unit:'cm',originalValue:180,originalUnit:'cm',measuredAt:'2026-08-09',recordedAt:'2026-08-09',sourceType:'manual',acquisitionMethod:'manual'});
 importCandidate(first.service,profile.id,height);assert.equal(first.service.snapshot().measurements.length,1);assert.equal(first.service.snapshot().measurements[0].values.length,2);assert.equal(first.service.snapshot().measurements[0].values[1].sourceId,'measurement_device');
 const second=fixture(),other=second.service.createProfile({displayName:'Riley',profileType:'independent'});importCandidate(second.service,other.id,{...height,sourceItemId:'height-first'});const record=second.service.snapshot().measurements[0];second.service.addMeasurementValue(record.id,{value:182,unit:'cm',originalValue:182,originalUnit:'cm',measuredAt:'2026-08-11',recordedAt:'2026-08-11',sourceType:'manual',acquisitionMethod:'manual'});assert.equal(second.service.snapshot().measurements.length,1);assert.equal(second.service.snapshot().measurements[0].values.length,2);
});

test('standard-size imports enforce Ticket 4A management authority',()=>{
 const candidate=evaluateExternalDatum({externalFieldId:'size.shoe',value:'9',unitOrSystem:'UK',measuredAt:'2026-07-02',sourceItemId:'shoe-authority'}).candidate;
 const {service}=fixture(),owner=service.createProfile({displayName:'Owner',profileType:'independent'}),viewer=service.createProfile({displayName:'Viewer',profileType:'independent'});
 service.selectActor(viewer.id);assert.throws(()=>importCandidate(service,owner.id,candidate),/not authorised/);assert.equal(service.snapshot().standardSizes.length,0);
});

test('raw malformed provenance fails closed before candidate creation',()=>{
 const base={externalFieldId:'body.height',value:180,unitOrSystem:'cm',measuredAt:'2026-07-01'};
 const malformed=[
  {derivation:{kind:'guessed'}},{derivation:{kind:'derived',method:4}},{derivation:{kind:'derived',method:{}}},{derivation:{kind:'derived',inputDescription:4}},{derivation:{kind:'direct',unexpected:'value'}},{derivation:[]},{derivation:'direct'},
  {sourceItemId:4},{sourceItemId:{}},{sourceItemId:''},{sourceItemId:'   '},{sourceDevice:4},{sourceDevice:{}},{sourceDevice:''},{sourceDevice:'  '},
  {confidence:-0.1},{confidence:1.1},{confidence:NaN},{confidence:Infinity},
 ];
 for(const extra of malformed){const result=evaluateExternalDatum({...base,...extra});assert.equal(result.status,'rejected');assert.equal(result.reason,'invalid_provenance');}
});

test('measurement and standard-size imports are immediately valid and remain valid after reload',()=>{
 const {service,local}=fixture(),profile=service.createProfile({displayName:'Alex',profileType:'independent'});
 const measurement=evaluateDemoPayload().find(x=>x.status==='accepted').candidate;
 const size=evaluateExternalDatum({externalFieldId:'size.ring',value:'54',unitOrSystem:'ISO',measuredAt:'2026-07-03',sourceItemId:'ring-54'}).candidate;
 importCandidate(service,profile.id,measurement);importCandidate(service,profile.id,size);
 assert.equal(migrateStoredData(service.snapshot()).status,'ok');const reloaded=new SigmaService(new LocalStorageRepository(local));assert.equal(reloaded.storageStatus().status,'ok');assert.equal(reloaded.snapshot().measurements.length,1);assert.equal(reloaded.snapshot().standardSizes.length,1);
});

test('legacy schema-2 records need no fabricated external provenance',()=>{
 const {service}=fixture(),profile=service.createProfile({displayName:'Alex',profileType:'independent'});
 service.addStandardSize({profileId:profile.id,category:'Clothing',label:'Top',sizingSystem:'Generic',sizeValue:'M',recordedAt:'2026-01-01',sourceType:'manual'});
 const snapshot=service.snapshot();assert.equal(migrateStoredData(snapshot).status,'ok');assert.equal(snapshot.standardSizes[0].sourceId,undefined);assert.equal(snapshot.standardSizes[0].derivation,undefined);
});

test('schema 2 rejects malformed optional standard-size provenance',()=>{
 const {service}=fixture(),profile=service.createProfile({displayName:'Alex',profileType:'independent'});
 service.addStandardSize({profileId:profile.id,category:'Clothing',label:'Top',sizingSystem:'Generic',sizeValue:'M',recordedAt:'2026-01-01',sourceType:'manual'});
 for(const change of [{sourceId:'unknown'},{sourceItemId:' '},{sourceDevice:{}},{confidence:2},{derivation:{kind:'guessed'}}]){const snapshot=service.snapshot();Object.assign(snapshot.standardSizes[0],change);assert.equal(migrateStoredData(snapshot).status,'corrupt');}
});
