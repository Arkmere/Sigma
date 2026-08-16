import type { SigmaService } from '../../domain/service.js';
import type { Profile, SharingScope } from '../../domain/model.js';
import type { RecordMode } from './records.js';
import { field, today } from './html.js';
import { canonicalFactById } from '../../domain/canonical-facts.js';
import { decryptFitCard, encryptFitCard } from '../../exchange/crypto.js';
import { isEncryptedFitCardFile, type FitCardPayload } from '../../exchange/model.js';
export function saveProfile(service: SigmaService, data: FormData, editingId: string): void { const metadata = { displayName: field(data, 'displayName'), relationshipLabel: field(data, 'relationshipLabel'), dateOfBirth: field(data, 'dateOfBirth'), notes: field(data, 'notes') }; editingId ? service.updateProfile(editingId, metadata) : service.createProfile({ ...metadata, profileType: field(data, 'profileType') as Profile['profileType'] }); }
export function saveRecord(service: SigmaService, mode: RecordMode, data: FormData): void {
 const profileId=field(data,'profileId'),chosenDate=field(data,'recordedAt'),recordedAt=chosenDate?new Date(`${chosenDate}T12:00:00`).toISOString():new Date().toISOString(),sourceName=field(data,'sourceName')||undefined;
 const custom=field(data,'custom')==='yes',definition=custom?undefined:canonicalFactById(field(data,'canonicalFactId'));
 if(!custom&&!definition)throw new Error('Choose a canonical fact.');
 const category=custom?field(data,'customCategory'):definition!.category;
 const label=custom?field(data,'customLabel'):definition!.label;
 if(custom&&(!label||!category))throw new Error('Custom label and category are required.');
 const canonicalFactId=definition?.id;
 if(mode==='measurement'){
   const value=Number(field(data,'value')),unit=custom?(field(data,'customUnitOrSystem')||field(data,'unit')):field(data,'unit');
   const measurementType=custom?(field(data,'customContext')||label):definition!.measurement!.measurementType;
   if(definition&&!definition.measurement!.permittedUnits.includes(unit))throw new Error('Choose a unit supported by this standard fact.');
   service.addMeasurement({profileId,category,measurementType,label,canonicalFactId,value,unit,originalValue:value,originalUnit:unit,measuredAt:field(data,'measuredAt'),recordedAt,sourceType:'manual',sourceName,acquisitionMethod:'manual',notes:field(data,'notes')||undefined});
 } else if(mode==='standard_size') service.addStandardSize({profileId,category,label,canonicalFactId,sizingSystem:custom?(field(data,'customUnitOrSystem')||field(data,'sizingSystem')):field(data,'sizingSystem'),sizeValue:field(data,'sizeValue'),recordedAt,sourceType:'manual',sourceName,notes:field(data,'notes')||undefined});
 else service.addBrandFit({profileId,category,canonicalFactId,brand:field(data,'brand'),productName:field(data,'productName')||undefined,productLine:field(data,'productLine')||undefined,sizingSystem:custom?(field(data,'customUnitOrSystem')||field(data,'sizingSystem')):field(data,'sizingSystem'),sizeValue:field(data,'sizeValue'),fitNotes:field(data,'fitNotes')||undefined,recordedAt,sourceType:'manual',sourceName});
}
export function addHistory(service: SigmaService, id: string, data: FormData): void { const value = Number(field(data, 'value')); const unit = field(data, 'unit'); service.addMeasurementValue(id, { value, unit, originalValue: value, originalUnit: unit, measuredAt: field(data, 'measuredAt'), recordedAt: new Date().toISOString(), sourceType: 'manual', acquisitionMethod: 'manual', notes: field(data, 'notes') || undefined }); }
export function downloadBackup(service: SigmaService): void { const blob = new Blob([JSON.stringify(service.exportBackup(), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `sigma-backup-${today()}.json`; link.click(); URL.revokeObjectURL(url); }
export async function exportFitCardFile(service: SigmaService, profileId: string, scope: SharingScope, passphrase: string): Promise<void> {
  const payload = service.exportFitCardPayload(profileId, scope);
  const file = await encryptFitCard(JSON.stringify(payload), passphrase);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `sigma-fitcard-${payload.senderDisplayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${today()}.json`;
  link.click(); URL.revokeObjectURL(url);
}
export async function importFitCardFile(service: SigmaService, file: File, passphrase: string): Promise<void> {
  const text = await file.text();
  let envelope: unknown;
  try { envelope = JSON.parse(text); } catch { throw new Error('That file is not a valid fit card.'); }
  if (!isEncryptedFitCardFile(envelope)) throw new Error('That file is not a valid fit card.');
  const decrypted = await decryptFitCard(envelope, passphrase);
  let payload: unknown;
  try { payload = JSON.parse(decrypted); } catch { throw new Error('That file is not a valid fit card.'); }
  service.importFitCard(payload as FitCardPayload);
}
