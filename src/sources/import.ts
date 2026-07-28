import type { SigmaService } from '../domain/service.js';
import type { Derivation, SourceId } from '../domain/model.js';
import { externalField } from './allowlist.js';
import { sourceRegistry } from './registry.js';
import type { ImportCandidate, ImportEvaluation, RawExternalDatum } from './model.js';
export const demoPayload:readonly RawExternalDatum[] = [
 {externalFieldId:'body.height',value:178,unitOrSystem:'cm',measuredAt:'2026-07-20',sourceItemId:'demo-height-1',sourceDevice:'Sigma demo device',confidence:0.99,derivation:{kind:'direct'}},
 {externalFieldId:'body.weight',value:76.4,unitOrSystem:'kg',measuredAt:'2026-07-21',sourceItemId:'demo-weight-1',sourceDevice:'Sigma demo device',confidence:0.98,derivation:{kind:'direct'}},
 {externalFieldId:'body.waist_circumference',value:84,unitOrSystem:'cm',measuredAt:'2026-07-22',sourceItemId:'demo-waist-1',sourceDevice:'Sigma demo tape',confidence:0.92,derivation:{kind:'direct'}},
 {externalFieldId:'foot.length',value:272,unitOrSystem:'mm',measuredAt:'2026-07-22',sourceItemId:'demo-foot-1',sourceDevice:'Sigma demo scanner',confidence:0.88,derivation:{kind:'derived',method:'local demo geometry',inputDescription:'Simulated device points'}},
 {externalFieldId:'health.heart_rate',value:70,unitOrSystem:'bpm'},{externalFieldId:'activity.steps',value:8000,unitOrSystem:'count'},{externalFieldId:'sleep.duration',value:8,unitOrSystem:'h'},{externalFieldId:'location.gps_distance',value:4,unitOrSystem:'km'},
];
export function evaluateExternalDatum(raw:RawExternalDatum,sourceId:SourceId='measurement_device'):ImportEvaluation {
 const definition=externalField(raw.externalFieldId); if(!definition)return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'not_allowlisted'};
 if(!sourceRegistry.some(source=>source.id===sourceId))return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'invalid_provenance'};
 if(raw.unitOrSystem===undefined||raw.measuredAt===undefined)return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'missing_required_field'};
 if(typeof raw.unitOrSystem!=='string'||typeof raw.measuredAt!=='string'||!raw.unitOrSystem.trim()||!raw.measuredAt.trim())return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'invalid_value'};
 if(!definition.allowedUnitsOrSystems.includes(raw.unitOrSystem))return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'unsupported_unit'};
 if(definition.targetKind==='measurement'?(typeof raw.value!=='number'||!Number.isFinite(raw.value)):(typeof raw.value!=='string'||!raw.value.trim()))return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'invalid_value'};
 const provenance=validatedProvenance(raw);if(!provenance)return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'invalid_provenance'};
 return{status:'accepted',candidate:{sourceId,externalFieldId:definition.id,targetKind:definition.targetKind,measurementType:definition.measurementType,category:definition.category,label:definition.defaultLabel,value:raw.value as number|string,unitOrSystem:raw.unitOrSystem,measuredAt:raw.measuredAt,...provenance}};
}
export const evaluateDemoPayload=()=>demoPayload.map(raw=>evaluateExternalDatum(raw));
export function importCandidate(service:SigmaService,profileId:string,candidate:ImportCandidate):void {
 assertCandidate(candidate);if(candidate.sourceItemId&&hasImportedSourceItem(service,candidate.sourceId,candidate.sourceItemId,candidate.targetKind))throw new Error('This source item was already imported.');
 const source=sourceRegistry.find(item=>item.id===candidate.sourceId);if(!source)throw new Error('Import source is invalid.');
 const provenance={sourceId:candidate.sourceId,sourceItemId:candidate.sourceItemId,sourceDevice:candidate.sourceDevice,confidence:candidate.confidence,derivation:candidate.derivation};
 if(candidate.targetKind==='measurement'){const value=candidate.value as number;service.addMeasurement({profileId,measurementType:candidate.measurementType!,category:candidate.category,label:candidate.label,value,unit:candidate.unitOrSystem,originalValue:value,originalUnit:candidate.unitOrSystem,measuredAt:candidate.measuredAt,recordedAt:new Date().toISOString(),sourceType:source.acquisitionMethod,sourceName:source.label,acquisitionMethod:source.acquisitionMethod,...provenance});return;}
 service.addStandardSize({profileId,category:candidate.category,label:candidate.label,sizingSystem:candidate.unitOrSystem,sizeValue:candidate.value as string,recordedAt:candidate.measuredAt,sourceType:source.acquisitionMethod,sourceName:source.label,...provenance});
}
function validatedProvenance(raw:RawExternalDatum):{sourceItemId?:string;sourceDevice?:string;confidence?:number;derivation:Derivation}|undefined {
 const nonEmpty=(value:unknown)=>typeof value==='string'&&value.trim().length>0;
 if(raw.sourceItemId!==undefined&&!nonEmpty(raw.sourceItemId))return; if(raw.sourceDevice!==undefined&&!nonEmpty(raw.sourceDevice))return;
 if(raw.confidence!==undefined&&(typeof raw.confidence!=='number'||!Number.isFinite(raw.confidence)||raw.confidence<0||raw.confidence>1))return;
 let derivation:Derivation={kind:'direct'};if(raw.derivation!==undefined){if(typeof raw.derivation!=='object'||raw.derivation===null||Array.isArray(raw.derivation))return;const value=raw.derivation as Record<string,unknown>;if(Object.keys(value).some(key=>!['kind','method','inputDescription'].includes(key)))return;if(value.kind!=='direct'&&value.kind!=='derived')return;if(value.method!==undefined&&typeof value.method!=='string')return;if(value.inputDescription!==undefined&&typeof value.inputDescription!=='string')return;derivation={kind:value.kind,method:value.method as string|undefined,inputDescription:value.inputDescription as string|undefined};}
 return{sourceItemId:raw.sourceItemId as string|undefined,sourceDevice:raw.sourceDevice as string|undefined,confidence:raw.confidence as number|undefined,derivation};
}
function hasImportedSourceItem(service:SigmaService,sourceId:SourceId,itemId:string,kind:ImportCandidate['targetKind']):boolean { const data=service.snapshot();return kind==='measurement'?data.measurements.some(r=>r.values.some(v=>v.sourceId===sourceId&&v.sourceItemId===itemId)):data.standardSizes.some(r=>r.sourceId===sourceId&&r.sourceItemId===itemId); }
function assertCandidate(candidate:ImportCandidate):void { const evaluation=evaluateExternalDatum({externalFieldId:candidate.externalFieldId,value:candidate.value,unitOrSystem:candidate.unitOrSystem,measuredAt:candidate.measuredAt,sourceItemId:candidate.sourceItemId,sourceDevice:candidate.sourceDevice,confidence:candidate.confidence,derivation:candidate.derivation},candidate.sourceId);if(evaluation.status!=='accepted'||evaluation.candidate.targetKind!==candidate.targetKind)throw new Error('Import candidate is invalid.'); }
