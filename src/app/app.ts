import { type RouteId } from './content.js';
import { LocalStorageRepository } from '../data/repository.js';
import { SigmaService } from '../domain/service.js';
import { readAnatomyFamilyPreference, readThemePreference, resolveTheme, type AnatomyFamilyPreference, type ThemePreference, writeAnatomyFamilyPreference, writeThemePreference } from '../lib/preferences.js';
import { addHistory, downloadBackup, saveProfile, saveRecord } from './ui/actions.js';
import { field } from './ui/html.js';
import { renderProfiles } from './ui/profiles.js';
import { renderRecords, type RecordMode } from './ui/records.js';
import { renderShell, type AppNotice } from './ui/shell.js';
import { renderPrivacy, renderSettings } from './ui/status.js';
import { emptyGrantComposerState, renderFamily as renderFamilyScreen, type FamilyView, type GrantComposerState, type GrantScopeChoice } from './ui/family.js';
import { readDemoEntitlement, writeDemoEntitlement, type DemoEntitlement } from '../lib/entitlement.js';
import { unitsForDimension, type Dimension } from '../conversion/registry.js';
import { PermissionDemoService } from '../permissions/service.js';
import type { PermissionKind } from '../permissions/model.js';
import { evaluateDemoPayload, importCandidate } from '../sources/import.js';
import type { ImportCandidate } from '../sources/model.js';
import type { SourceId } from '../domain/model.js';
import { renderSources } from './ui/sources.js';
import { hydrateStandaloneAnatomy } from './ui/anatomy-illustration.js';

export function mountApp(root: HTMLElement, service = new SigmaService(new LocalStorageRepository(globalThis.localStorage))): void {
  let route: RouteId = 'profiles'; let theme = readThemePreference(); let anatomyFamily=readAnatomyFamilyPreference(); let entitlement=readDemoEntitlement(); let mode: RecordMode = 'measurement'; let search = ''; let category = ''; let editingProfileId = ''; let profileFormOpen=false; let recordFormOpen=false; let familyView:FamilyView='overview'; let notice:AppNotice|undefined;
  const permissions=new PermissionDemoService(globalThis.localStorage); let permissionFlow:PermissionKind|undefined; let selectedSourceId:SourceId|undefined; let sourceNotice=''; let importCandidates:ImportCandidate[]=[]; let excluded=0;
  let grantComposer:GrantComposerState=emptyGrantComposerState();
  const render = () => {
    const resolved = resolveTheme(theme, globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
    document.documentElement.dataset.theme = resolved; document.documentElement.dataset.themePreference = theme; writeThemePreference(theme);writeAnatomyFamilyPreference(anatomyFamily);
    const content = route === 'profiles' ? renderProfiles(service, editingProfileId,profileFormOpen) : route === 'measurements' ? renderRecords(service, mode, search, category,recordFormOpen) : route === 'sources' ? renderSources(service,permissions,permissionFlow,importCandidates,excluded,sourceNotice) : route === 'privacy' ? renderPrivacy(service,permissions) : route === 'settings' ? renderSettings(service, theme, resolved, anatomyFamily, entitlement,permissions) : renderFamilyScreen(service, entitlement,grantComposer,familyView);
    root.innerHTML = renderShell(route, service, content,notice);
    void hydrateStandaloneAnatomy(root);
    const run=(action:()=>void,message?:string)=>{try{action();if(message)notice={kind:'success',message};render();}catch(error){if(error instanceof Error){notice={kind:'error',message:error.message};render();return;}throw error;}};
    bind(root, '[data-route]', 'click', (element) => { notice=undefined; route = element.dataset.route as RouteId; render(); });
    bind(root, '[data-select-profile]', 'click', (element) => {notice=undefined;run(()=>{ service.selectProfile(element.dataset.selectProfile!); route = 'measurements'; });});
    bind(root, '[data-edit-profile]', 'click', (element) => { editingProfileId = element.dataset.editProfile!; profileFormOpen=true; render(); });
    bind(root, '#open-profile-form', 'click', () => { profileFormOpen=true; render(); root.querySelector<HTMLInputElement>('#profile-form input[name="displayName"]')?.focus(); });
    bind(root, '#cancel-profile-form', 'click', () => { profileFormOpen=false; editingProfileId=''; render(); });
    bind(root, '[data-record-mode]', 'click', (element) => { mode = element.dataset.recordMode as RecordMode; recordFormOpen=false; render(); });
    root.querySelector<HTMLSelectElement>('#record-mode-select')?.addEventListener('change',(event)=>{mode=(event.currentTarget as HTMLSelectElement).value as RecordMode;recordFormOpen=false;render();});
    bind(root,'[data-family-view]','click',(element)=>{notice=undefined;familyView=element.dataset.familyView as FamilyView;route='family';render();});
    root.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) => input.addEventListener('change', () => { theme = input.value as ThemePreference; render(); }));
    root.querySelectorAll<HTMLInputElement>('input[name="anatomyFamily"]').forEach((input) => input.addEventListener('change', () => { anatomyFamily = input.value as AnatomyFamilyPreference; writeAnatomyFamilyPreference(anatomyFamily); render(); }));
    root.querySelector<HTMLSelectElement>('#entitlement-select')?.addEventListener('change',(event)=>{entitlement=(event.currentTarget as HTMLSelectElement).value as DemoEntitlement;writeDemoEntitlement(entitlement);render();});
    root.querySelectorAll<HTMLSelectElement>('#actor-select,#context-actor-select').forEach(select=>select.addEventListener('change',(event)=>run(()=>{service.selectActor((event.currentTarget as HTMLSelectElement).value);grantComposer=emptyGrantComposerState();familyView='overview';search='';category='';recordFormOpen=false;},'Acting local adult switched.')));
    root.querySelector<HTMLSelectElement>('#context-profile-select')?.addEventListener('change',(event)=>run(()=>service.selectProfile((event.currentTarget as HTMLSelectElement).value)));
    onForm(root,'#family-form',(form)=>run(()=>service.createFamily(field(new FormData(form),'name')),'Family created.'));
    onForm(root,'#connection-form',(form)=>run(()=>service.requestConnection(field(new FormData(form),'recipientId')),'Connection request sent. No records were shared.'));
    onForm(root,'#managed-form',(form)=>run(()=>{const data=new FormData(form);const p=service.createManagedProfile({displayName:field(data,'displayName'),managedKind:field(data,'managedKind') as 'child'|'dependant',familyId:field(data,'familyId')});service.selectProfile(p.id);},'Managed profile created with the acting adult as manager.'));
    onForm(root,'#member-form',(form)=>run(()=>{const data=new FormData(form);service.addFamilyMember(field(data,'familyId'),field(data,'profileId'));},'Family member added. No record access was granted.'));
    onForm(root,'#grant-form',(form)=>run(()=>{const data=new FormData(form);const type=field(data,'scopeType');const scope=type==='profile'?{type:'profile' as const}:type==='category'?{type:'category' as const,category:field(data,'category')}:type.startsWith('record:')?{type:'record' as const,recordKind:type.slice(7) as 'measurement'|'standard_size'|'brand_fit',recordId:field(data,'recordId')}:{type:'record_kind' as const,recordKind:type as 'standard_size'|'brand_fit'};service.grantAccess(field(data,'ownerId'),field(data,'recipientId'),scope);grantComposer=emptyGrantComposerState();},'Read-only sharing access granted.'));
    root.querySelector<HTMLSelectElement>('#grant-owner')?.addEventListener('change',(event)=>{grantComposer={...grantComposer,ownerId:(event.currentTarget as HTMLSelectElement).value,recipientId:'',recordId:''};render();});
    root.querySelector<HTMLSelectElement>('#grant-recipient')?.addEventListener('change',(event)=>{grantComposer={...grantComposer,recipientId:(event.currentTarget as HTMLSelectElement).value};render();});
    root.querySelector<HTMLSelectElement>('#grant-scope')?.addEventListener('change',(event)=>{grantComposer={...grantComposer,scope:(event.currentTarget as HTMLSelectElement).value as GrantScopeChoice,recordId:''};render();});
    root.querySelector<HTMLSelectElement>('#grant-category')?.addEventListener('change',(event)=>{grantComposer={...grantComposer,category:(event.currentTarget as HTMLSelectElement).value};render();});
    root.querySelector<HTMLSelectElement>('#grant-record')?.addEventListener('change',(event)=>{grantComposer={...grantComposer,recordId:(event.currentTarget as HTMLSelectElement).value};render();});
    bind(root,'[data-assign-manager]','click',(el)=>run(()=>service.assignManager(el.dataset.assignManager!,service.activeActor()!.id),'Manager assigned.'));
    bind(root,'[data-respond]','click',(el)=>run(()=>service.respondConnection(el.dataset.respond!,el.dataset.accept==='true'),el.dataset.accept==='true'?'Connection accepted. No records were shared.':'Connection declined.'));
    bind(root,'[data-disconnect]','click',(el)=>run(()=>service.disconnect(el.dataset.disconnect!),'Adult connection disconnected.'));
    bind(root,'[data-revoke-grant]','click',(el)=>{if(globalThis.confirm('Revoke this read-only access now? The underlying records will not be deleted.'))run(()=>service.revokeGrant(el.dataset.revokeGrant!),'Sharing access revoked.');});
    onForm(root, '#profile-form', (form) => run(()=>{ saveProfile(service, new FormData(form), editingProfileId); editingProfileId = ''; profileFormOpen=false; },editingProfileId?'Profile details saved.':'Profile created.'));
    onForm(root, '#record-form', (form) => run(()=>{ saveRecord(service, mode, new FormData(form)); recordFormOpen=false; },'Recorded fact added.'));
    forms(root, '[data-history-form]', (form, data) => addHistory(service, form.dataset.historyForm!, data), render);
    root.querySelectorAll<HTMLFormElement>('[data-correct-value-form]').forEach((form)=>form.addEventListener('submit',(event)=>{
      event.preventDefault();const recordId=form.dataset.correctValueForm!;
      if(globalThis.confirm('Mark this recorded value as incorrect? It will remain in history and stop affecting the current value and conversions.')) {
        service.correctMeasurementValue(recordId,form.dataset.valueId!,field(new FormData(form),'reason')||undefined);
        notice={kind:'success',message:'Recorded value marked incorrect and retained in history.'};render();
        root.querySelector<HTMLElement>(`#record-${recordId}`)?.focus();
      }
    }));
    forms(root, '[data-edit-measurement-form]', (form, data) => service.updateMeasurement(form.dataset.editMeasurementForm!, { label: field(data, 'label'), measurementType: field(data, 'measurementType'), category: field(data, 'category') }), render);
    forms(root, '[data-edit-size-form]', (form, data) => service.updateStandardSize(form.dataset.editSizeForm!, { label: field(data, 'label'), category: field(data, 'category'), sizingSystem: field(data, 'sizingSystem'), sizeValue: field(data, 'sizeValue'), notes: field(data, 'notes') || undefined }), render);
    forms(root, '[data-edit-brand-form]', (form, data) => service.updateBrandFit(form.dataset.editBrandForm!, { category: field(data, 'category'), brand: field(data, 'brand'), productName: field(data, 'productName') || undefined, productLine: field(data, 'productLine') || undefined, sizingSystem: field(data, 'sizingSystem'), sizeValue: field(data, 'sizeValue'), fitNotes: field(data, 'fitNotes') || undefined }), render);
    root.querySelector<HTMLInputElement>('#record-search')?.addEventListener('input', (event) => {
      const input=event.currentTarget as HTMLInputElement; search=input.value; const start=input.selectionStart??search.length,end=input.selectionEnd??start; render();
      const replacement=root.querySelector<HTMLInputElement>('#record-search'); replacement?.focus(); replacement?.setSelectionRange(start,end);
    });
    root.querySelector<HTMLSelectElement>('#category-filter')?.addEventListener('change', (event) => { category = (event.currentTarget as HTMLSelectElement).value; render(); });
    bind(root,'#clear-record-filters','click',()=>{search='';category='';render();});
    bind(root,'#open-record-form','click',()=>{recordFormOpen=true;render();root.querySelector<HTMLElement>('#record-form-panel')?.focus();});
    bind(root,'#cancel-record-form','click',()=>{recordFormOpen=false;render();root.querySelector<HTMLElement>('#open-record-form')?.focus();});
    root.querySelector<HTMLSelectElement>('#measurement-type')?.addEventListener('change', (event) => { const option = (event.currentTarget as HTMLSelectElement).selectedOptions[0]; const unit = root.querySelector<HTMLSelectElement>('#measurement-unit'); if (unit) unit.innerHTML = unitChoices(option?.dataset.dimension as Dimension | undefined); });
    const canonicalPicker=root.querySelector<HTMLSelectElement>('#canonical-fact-picker');
    const populateCanonicalChoices=()=>{const target=root.querySelector<HTMLSelectElement>('#canonical-choice'),selected=canonicalPicker?.selectedOptions[0];if(target&&selected){target.innerHTML=(selected.dataset.choices??'').split('|').filter(Boolean).map((choice)=>`<option value="${choice.replaceAll('&','&amp;').replaceAll('"','&quot;')}">${choice}</option>`).join('');if(selected.dataset.defaultChoice)target.value=selected.dataset.defaultChoice;}root.querySelectorAll<HTMLDetailsElement>('[data-guidance-id]').forEach((panel)=>{panel.hidden=panel.dataset.guidanceId!==canonicalPicker?.value;panel.open=false;});};
    canonicalPicker?.addEventListener('change',populateCanonicalChoices);populateCanonicalChoices();
    root.querySelector<HTMLInputElement>('#canonical-fact-search')?.addEventListener('input',(event)=>{const needle=(event.currentTarget as HTMLInputElement).value.toLowerCase();if(!canonicalPicker)return;for(const option of canonicalPicker.options)option.hidden=!!needle&&!option.dataset.search?.includes(needle);const first=[...canonicalPicker.options].find((option)=>!option.hidden);if(first&&canonicalPicker.selectedOptions[0]?.hidden){canonicalPicker.value=first.value;populateCanonicalChoices();}});
    root.querySelector<HTMLInputElement>('input[name="custom"]')?.addEventListener('change',(event)=>{const guidance=root.querySelector<HTMLElement>('#creation-guidance');if(guidance)guidance.hidden=(event.currentTarget as HTMLInputElement).checked;});
    bind(root, '#export-data', 'click', () => downloadBackup(service));
    bind(root, '#reset-data', 'click', () => { if (globalThis.confirm('Delete every Sigma profile, record, Family, connection and sharing grant stored in this browser? This cannot be undone.')) { service.reset(); route = 'profiles'; notice={kind:'success',message:'Local Sigma data reset. You can start again.'}; render(); } });
    bind(root,'[data-source-action]','click',(el)=>{const source=el.dataset.sourceAction as SourceId;selectedSourceId=source;sourceNotice='';if(['measurement_device','apple_health','health_connect'].includes(source))permissionFlow='health_data';else if(source==='camera_assisted'||source==='body_scan')permissionFlow='camera';else if(source==='external_scan')permissionFlow='files';else if(source==='smart_scale')permissionFlow='nearby_devices';render();});
    bind(root,'[data-permission-allow]','click',(el)=>{const kind=el.dataset.permissionAllow as PermissionKind;permissions.set(kind,'demo_granted');permissionFlow=undefined;if(selectedSourceId==='measurement_device'){const results=evaluateDemoPayload();importCandidates=results.flatMap(x=>x.status==='accepted'?[x.candidate]:[]);excluded=results.filter(x=>x.status==='rejected').length;sourceNotice='Local demo access simulated. No external service was contacted.';}else{importCandidates=[];excluded=0;sourceNotice='This integration is not implemented in the current local demo. Simulated permission does not activate it.'}render();});
    bind(root,'[data-permission-decline]','click',(el)=>{permissions.set(el.dataset.permissionDecline as PermissionKind,'demo_denied');permissionFlow=undefined;importCandidates=[];excluded=0;notice={kind:'info',message:'Demo permission declined. Nothing was imported; manual entry remains available.'};render();});
    bind(root,'[data-import-candidate]','click',(el)=>{const target=root.querySelector<HTMLSelectElement>('#import-target')?.value;if(target){run(()=>{importCandidate(service,target,importCandidates[Number(el.dataset.importCandidate)]);importCandidates.splice(Number(el.dataset.importCandidate),1);},'Candidate imported with its provenance.');}});
    bind(root,'#reset-permission-demos','click',()=>{permissions.reset();permissionFlow=undefined;selectedSourceId=undefined;sourceNotice='';importCandidates=[];excluded=0;notice={kind:'success',message:'Permission demonstrations reset. Records were not deleted.'};render();});
  };
  render();
}

function bind(root: HTMLElement, selector: string, event: string, action: (element: HTMLElement) => void): void { root.querySelectorAll<HTMLElement>(selector).forEach((element) => element.addEventListener(event, () => action(element))); }
function onForm(root: HTMLElement, selector: string, action: (form: HTMLFormElement) => void): void { root.querySelector<HTMLFormElement>(selector)?.addEventListener('submit', (event) => { event.preventDefault(); action(event.currentTarget as HTMLFormElement); }); }
function forms(root: HTMLElement, selector: string, action: (form: HTMLFormElement, data: FormData) => void, done: () => void): void { root.querySelectorAll<HTMLFormElement>(selector).forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); action(form, new FormData(event.currentTarget as HTMLFormElement)); done(); })); }
function unitChoices(dimension?: Dimension): string { const choices = dimension ? unitsForDimension(dimension).map((unit) => `<option value="${unit.symbol}">${unit.symbol} · ${unit.label}</option>`).join('') : ''; return `${choices}<option value="custom">Custom recorded unit</option>`; }
