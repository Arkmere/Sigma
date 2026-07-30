import type { PermissionDecision, PermissionExplanation, PermissionKind } from './model.js';

export const PERMISSION_DEMO_STORAGE_KEY = 'sigma.permissionDemo.v1';
export const permissionExplanations: Record<PermissionKind, PermissionExplanation> = {
  contacts: { kind:'contacts', title:'Choose someone from contacts', requestedAccess:'Local contact selection', reason:'To help enter a person you deliberately choose.', willAccess:['Only the selected contact details'], willNotAccess:['Your full address book','Contact activity'], alternatives:['Enter the person manually'], denialEffect:'Connections and manual entry remain available.' },
  camera: { kind:'camera', title:'Preview camera permission', requestedAccess:'Camera access for a focused future measurement', reason:'To explain a possible future capture of one specific measurement.', willAccess:['A deliberate future capture'], willNotAccess:['Your photo library','Background camera access'], alternatives:['Enter the measurement manually'], denialEffect:'Manual measurements remain fully usable.' },
  health_data: { kind:'health_data', title:'Import measurement data', requestedAccess:'Allowlisted measurement and size fields', reason:'To preview relevant facts before you choose what to save.', willAccess:['Height, weight and explicitly allowlisted fit measurements'], willNotAccess:['Heart rate, sleep, steps, location, workouts or medical data'], alternatives:['Enter measurements manually'], denialEffect:'No records are created and manual entry remains available.' },
  nearby_devices: { kind:'nearby_devices', title:'Preview nearby-device permission', requestedAccess:'A future nearby measurement device', reason:'To explain a possible future deliberate device connection.', willAccess:['Measurements supported by the selected device'], willNotAccess:['Unrelated nearby devices','Background discovery'], alternatives:['Enter measurements manually'], denialEffect:'Existing records and manual entry are unaffected.' },
  files: { kind:'files', title:'Inspect planned scan import', requestedAccess:'One deliberately selected future scan file', reason:'To explain a possible future preview of allowlisted measurements from that file.', willAccess:['Only the file you select'], willNotAccess:['Other files or folders'], alternatives:['Enter measurements manually'], denialEffect:'No file is read and manual entry remains available.' },
};

export class PermissionDemoService {
  constructor(private readonly storage: Pick<Storage,'getItem'|'setItem'|'removeItem'> | undefined = globalThis.localStorage) {}
  decisions(): Record<PermissionKind, PermissionDecision> {
    const initial = { contacts:'not_requested', camera:'not_requested', health_data:'not_requested', nearby_devices:'not_requested', files:'not_requested' } as Record<PermissionKind,PermissionDecision>;
    try { const value=JSON.parse(this.storage?.getItem(PERMISSION_DEMO_STORAGE_KEY)??'{}') as Partial<Record<PermissionKind,PermissionDecision>>; for(const kind of Object.keys(initial) as PermissionKind[]) if(value[kind]==='demo_granted'||value[kind]==='demo_denied') initial[kind]=value[kind]!; } catch {}
    return initial;
  }
  decision(kind:PermissionKind):PermissionDecision { return this.decisions()[kind]; }
  set(kind:PermissionKind, decision:Exclude<PermissionDecision,'not_requested'>):void { this.storage?.setItem(PERMISSION_DEMO_STORAGE_KEY,JSON.stringify({...this.decisions(),[kind]:decision})); }
  reset():void { this.storage?.removeItem(PERMISSION_DEMO_STORAGE_KEY); }
}
