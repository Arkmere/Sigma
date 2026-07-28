import type { SigmaService } from '../domain/service.js';
import { externalField } from './allowlist.js';
import type { ImportCandidate, ImportEvaluation, RawExternalDatum } from './model.js';
export const demoPayload:readonly RawExternalDatum[] = [
 {externalFieldId:'body.height',value:178,unitOrSystem:'cm',measuredAt:'2026-07-20',sourceItemId:'demo-height-1',sourceDevice:'Sigma demo device',confidence:0.99,derivation:{kind:'direct'}},
 {externalFieldId:'body.weight',value:76.4,unitOrSystem:'kg',measuredAt:'2026-07-21',sourceItemId:'demo-weight-1',sourceDevice:'Sigma demo device',confidence:0.98,derivation:{kind:'direct'}},
 {externalFieldId:'body.waist_circumference',value:84,unitOrSystem:'cm',measuredAt:'2026-07-22',sourceItemId:'demo-waist-1',sourceDevice:'Sigma demo tape',confidence:0.92,derivation:{kind:'direct'}},
 {externalFieldId:'foot.length',value:272,unitOrSystem:'mm',measuredAt:'2026-07-22',sourceItemId:'demo-foot-1',sourceDevice:'Sigma demo scanner',confidence:0.88,derivation:{kind:'derived',method:'local demo geometry',inputDescription:'Simulated device points'}},
 {externalFieldId:'health.heart_rate',value:70,unitOrSystem:'bpm'},{externalFieldId:'activity.steps',value:8000,unitOrSystem:'count'},{externalFieldId:'sleep.duration',value:8,unitOrSystem:'h'},{externalFieldId:'location.gps_distance',value:4,unitOrSystem:'km'},
];
export function evaluateExternalDatum(raw:RawExternalDatum):ImportEvaluation {
 const definition=externalField(raw.externalFieldId); if(!definition)return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'not_allowlisted'};
 if(raw.unitOrSystem===undefined||raw.measuredAt===undefined)return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'missing_required_field'};
 if(!definition.allowedUnitsOrSystems.includes(raw.unitOrSystem))return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'unsupported_unit'};
 if(definition.targetKind==='measurement'?(typeof raw.value!=='number'||!Number.isFinite(raw.value)):(typeof raw.value!=='string'||!raw.value.trim()))return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'invalid_value'};
 if(raw.confidence!==undefined&&(!Number.isFinite(raw.confidence)||raw.confidence<0||raw.confidence>1))return{status:'rejected',externalFieldId:raw.externalFieldId,reason:'invalid_value'};
 return{status:'accepted',candidate:{externalFieldId:definition.id,targetKind:definition.targetKind,measurementType:definition.measurementType,category:definition.category,label:definition.defaultLabel,value:raw.value as number|string,unitOrSystem:raw.unitOrSystem,measuredAt:raw.measuredAt,sourceItemId:raw.sourceItemId,sourceDevice:raw.sourceDevice,confidence:raw.confidence,derivation:raw.derivation??{kind:'direct'}}};
}
export const evaluateDemoPayload=()=>demoPayload.map(evaluateExternalDatum);
export function importCandidate(service:SigmaService,profileId:string,candidate:ImportCandidate):void {
 if(candidate.targetKind!=='measurement')throw new Error('This demo imports measurements only.');
 const duplicate=service.snapshot().measurements.some(r=>r.values.some(v=>v.sourceId==='measurement_device'&&v.sourceItemId===candidate.sourceItemId));
 if(candidate.sourceItemId&&duplicate)throw new Error('This source item was already imported.');
 const value=candidate.value as number; service.addMeasurement({profileId,measurementType:candidate.measurementType!,category:candidate.category,label:candidate.label,value,unit:candidate.unitOrSystem,originalValue:value,originalUnit:candidate.unitOrSystem,measuredAt:candidate.measuredAt,recordedAt:new Date().toISOString(),sourceType:'imported_device',sourceName:'Local demo source',acquisitionMethod:'imported_device',sourceId:'measurement_device',sourceItemId:candidate.sourceItemId,sourceDevice:candidate.sourceDevice,confidence:candidate.confidence,derivation:candidate.derivation});
}
