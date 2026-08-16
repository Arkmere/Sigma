import { type RouteId } from './content.js';
import { LocalStorageRepository } from '../data/repository.js';
import { SigmaService } from '../domain/service.js';
import { readAnatomyFamilyPreference, readThemePreference, resolveTheme, type AnatomyFamilyPreference, type ThemePreference, writeAnatomyFamilyPreference, writeThemePreference } from '../lib/preferences.js';
import { addHistory, downloadBackup, exportFitCardFile, importFitCardFile, saveProfile, saveRecord } from './ui/actions.js';
import { field } from './ui/html.js';
import { renderProfiles } from './ui/profiles.js';
import { renderRecords, type RecordMode } from './ui/records.js';
import { renderShell, type AppNotice } from './ui/shell.js';
import { renderPrivacy, renderSettings } from './ui/status.js';
import { emptyGrantComposerState, familyStageIds, renderFamily as renderFamilyScreen, type FamilyView, type GrantComposerState, type GrantScopeChoice } from './ui/family.js';
import { readDemoEntitlement, writeDemoEntitlement, type DemoEntitlement } from '../lib/entitlement.js';
import { unitsForDimension, type Dimension } from '../conversion/registry.js';
import { PermissionDemoService } from '../permissions/service.js';
import type { PermissionKind } from '../permissions/model.js';
import { evaluateDemoPayload, importCandidate } from '../sources/import.js';
import type { ImportCandidate } from '../sources/model.js';
import type { SharingScope, SourceId } from '../domain/model.js';
import { renderSources } from './ui/sources.js';
import { hydrateStandaloneAnatomy } from './ui/anatomy-illustration.js';
import { renderAnatomyNavigator } from './ui/anatomy-navigator.js';
import type { AnatomyPath } from '../domain/canonical-facts.js';

const routeIds: readonly RouteId[] = ['profiles', 'measurements', 'family', 'sources', 'privacy', 'settings'];
const familyStages: readonly Exclude<FamilyView, 'overview'>[] = familyStageIds;
function parseHash(hash: string): { route: RouteId; familyView: FamilyView } {
  const segments = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const route = (routeIds as readonly string[]).includes(segments[0]) ? segments[0] as RouteId : 'profiles';
  const familyView = route === 'family' && (familyStages as readonly string[]).includes(segments[1]) ? segments[1] as FamilyView : 'overview';
  return { route, familyView };
}
function hashFor(route: RouteId, familyView: FamilyView): string {
  return route === 'family' && familyView !== 'overview' ? `#/family/${familyView}` : `#/${route}`;
}

export function mountApp(root: HTMLElement, service = new SigmaService(new LocalStorageRepository(globalThis.localStorage))): void {
  const buildId = (globalThis as unknown as { __SIGMA_BUILD__?: string }).__SIGMA_BUILD__;
  const hasHash = typeof window !== 'undefined' && typeof window.location !== 'undefined';
  const seeded = hasHash && window.location.hash ? parseHash(window.location.hash) : undefined;
  let route: RouteId = seeded?.route ?? 'profiles'; let theme = readThemePreference(); let anatomyFamily=readAnatomyFamilyPreference(); let entitlement=readDemoEntitlement(); let mode: RecordMode = 'measurement'; let search = ''; let category = ''; let editingProfileId = ''; let profileFormOpen=false; let recordFormOpen=false; let familyView:FamilyView=seeded?.familyView ?? 'overview'; let notice:AppNotice|undefined;
  const syncHash = () => { if (hasHash) { const next = hashFor(route, familyView); if (window.location.hash !== next) window.location.hash = next; } };
  const permissions=new PermissionDemoService(globalThis.localStorage); let permissionFlow:PermissionKind|undefined; let selectedSourceId:SourceId|undefined; let sourceNotice=''; let importCandidates:ImportCandidate[]=[]; let excluded=0;
  let grantComposer:GrantComposerState=emptyGrantComposerState();
  const render = () => {
    const resolved = resolveTheme(theme, globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
    document.documentElement.dataset.theme = resolved; document.documentElement.dataset.themePreference = theme; writeThemePreference(theme);writeAnatomyFamilyPreference(anatomyFamily);
    const content = route === 'profiles' ? renderProfiles(service, editingProfileId,profileFormOpen) : route === 'measurements' ? renderRecords(service, mode, search, category,recordFormOpen) : route === 'sources' ? renderSources(service,permissions,permissionFlow,importCandidates,excluded,sourceNotice) : route === 'privacy' ? renderPrivacy(service,permissions) : route === 'settings' ? renderSettings(service, theme, resolved, anatomyFamily, entitlement,permissions,buildId) : renderFamilyScreen(service, entitlement,grantComposer,familyView);
    root.innerHTML = renderShell(route, service, content,notice);
    void hydrateStandaloneAnatomy(root);
    const run=(action:()=>void,message?:string)=>{try{action();if(message)notice={kind:'success',message};render();}catch(error){if(error instanceof Error){notice={kind:'error',message:error.message};render();return;}throw error;}};
    const onFormAsync=<T,>(selector:string,action:(form:HTMLFormElement)=>Promise<T>,message?:string|((result:T)=>string))=>{root.querySelector<HTMLFormElement>(selector)?.addEventListener('submit',(event)=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;action(form).then((result)=>{const text=typeof message==='function'?message(result):message;if(text)notice={kind:'success',message:text};render();}).catch((error:unknown)=>{if(error instanceof Error){notice={kind:'error',message:error.message};render();return;}throw error;});});};
    bind(root, '[data-route]', 'click', (element) => { notice=undefined; route = element.dataset.route as RouteId; syncHash(); render(); });
    bind(root, '[data-select-profile]', 'click', (element) => {notice=undefined;run(()=>{ service.selectProfile(element.dataset.selectProfile!); route = 'measurements'; syncHash(); });});
    bind(root, '[data-edit-profile]', 'click', (element) => { editingProfileId = element.dataset.editProfile!; profileFormOpen=true; render(); });
    bind(root, '#open-profile-form', 'click', () => { profileFormOpen=true; render(); root.querySelector<HTMLInputElement>('#profile-form input[name="displayName"]')?.focus(); });
    bind(root, '#cancel-profile-form', 'click', () => { profileFormOpen=false; editingProfileId=''; render(); });
    bind(root, '[data-record-mode]', 'click', (element) => { mode = element.dataset.recordMode as RecordMode; recordFormOpen=false; render(); });
    root.querySelector<HTMLSelectElement>('#record-mode-select')?.addEventListener('change',(event)=>{mode=(event.currentTarget as HTMLSelectElement).value as RecordMode;recordFormOpen=false;render();});
    bind(root,'[data-family-view]','click',(element)=>{notice=undefined;familyView=element.dataset.familyView as FamilyView;route='family';syncHash();render();});
    root.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) => input.addEventListener('change', () => { theme = input.value as ThemePreference; render(); }));
    root.querySelectorAll<HTMLInputElement>('input[name="anatomyFamily"]').forEach((input) => input.addEventListener('change', () => { anatomyFamily = input.value as AnatomyFamilyPreference; writeAnatomyFamilyPreference(anatomyFamily); render(); }));
    root.querySelector<HTMLSelectElement>('#entitlement-select')?.addEventListener('change',(event)=>{entitlement=(event.currentTarget as HTMLSelectElement).value as DemoEntitlement;writeDemoEntitlement(entitlement);render();});
    root.querySelectorAll<HTMLSelectElement>('#actor-select,#context-actor-select').forEach(select=>select.addEventListener('change',(event)=>run(()=>{service.selectActor((event.currentTarget as HTMLSelectElement).value);grantComposer=emptyGrantComposerState();familyView='overview';search='';category='';recordFormOpen=false;syncHash();},'Acting local adult switched.')));
    root.querySelector<HTMLSelectElement>('#context-profile-select')?.addEventListener('change',(event)=>run(()=>service.selectProfile((event.currentTarget as HTMLSelectElement).value)));
    onForm(root,'#family-form',(form)=>run(()=>service.createFamily(field(new FormData(form),'name')),'Family created.'));
    onForm(root,'#connection-form',(form)=>run(()=>service.requestConnection(field(new FormData(form),'recipientId')),'Connection request sent. No records were shared.'));
    onForm(root,'#managed-form',(form)=>run(()=>{const data=new FormData(form);const p=service.createManagedProfile({displayName:field(data,'displayName'),managedKind:field(data,'managedKind') as 'child'|'dependant',familyId:field(data,'familyId')});service.selectProfile(p.id);},'Managed profile created. You are the manager.'));
    onForm(root,'#member-form',(form)=>run(()=>{const data=new FormData(form);service.addFamilyMember(field(data,'familyId'),field(data,'profileId'));},'Family member added. No record access was granted.'));
    onForm(root,'#grant-form',(form)=>run(()=>{const data=new FormData(form);const type=field(data,'scopeType');const scope=type==='profile'?{type:'profile' as const}:type==='category'?{type:'category' as const,category:field(data,'category')}:type.startsWith('record:')?{type:'record' as const,recordKind:type.slice(7) as 'measurement'|'standard_size'|'brand_fit',recordId:field(data,'recordId')}:{type:'record_kind' as const,recordKind:type as 'standard_size'|'brand_fit'};service.grantAccess(field(data,'ownerId'),field(data,'recipientId'),scope);grantComposer=emptyGrantComposerState();},'Read-only sharing access granted.'));
    root.querySelector<HTMLSelectElement>('#grant-owner')?.addEventListener('change',(event)=>{grantComposer={...grantComposer,ownerId:(event.currentTarget as HTMLSelectElement).value,recipientId:'',recordId:''};render();});
    root.querySelector<HTMLSelectElement>('#grant-recipient')?.addEventListener('change',(event)=>{grantComposer={...grantComposer,recipientId:(event.currentTarget as HTMLSelectElement).value};render();});
    root.querySelector<HTMLSelectElement>('#grant-scope')?.addEventListener('change',(event)=>{grantComposer={...grantComposer,scope:(event.currentTarget as HTMLSelectElement).value as GrantScopeChoice,recordId:''};render();});
    root.querySelector<HTMLSelectElement>('#grant-category')?.addEventListener('change',(event)=>{grantComposer={...grantComposer,category:(event.currentTarget as HTMLSelectElement).value};render();});
    root.querySelector<HTMLSelectElement>('#grant-record')?.addEventListener('change',(event)=>{grantComposer={...grantComposer,recordId:(event.currentTarget as HTMLSelectElement).value};render();});
    root.querySelector<HTMLSelectElement>('#fitcard-scope-type')?.addEventListener('change',(event)=>{const field=root.querySelector<HTMLElement>('#fitcard-category-field');if(field)field.hidden=(event.currentTarget as HTMLSelectElement).value!=='category';});
    bind(root,'[data-delete-fitcard]','click',(el)=>{if(globalThis.confirm('Remove this fit card? It only removes the copy on this device; nothing changes for the person who shared it.'))run(()=>service.deleteFitCard(el.dataset.deleteFitcard!),'Fit card removed.');});
    onFormAsync('#fitcard-export-form',async(form)=>{const data=new FormData(form);const type=field(data,'scopeType');const scope:SharingScope=type==='category'?{type:'category',category:field(data,'category')}:type==='standard_size'?{type:'record_kind',recordKind:'standard_size'}:type==='brand_fit'?{type:'record_kind',recordKind:'brand_fit'}:{type:'profile'};await exportFitCardFile(service,field(data,'ownerId'),scope,field(data,'passphrase'));form.reset();},'Fit card downloaded. Share the passphrase separately from the file.');
    onFormAsync('#fitcard-import-form',async(form)=>{const data=new FormData(form);const file=data.get('file');if(!(file instanceof File)||!file.size)throw new Error('Choose a fit card file.');return importFitCardFile(service,file,field(data,'passphrase'));},(result)=>`Fit card from ${result.senderDisplayName} ${result.created?'added':'updated'}.`);
    bind(root,'[data-assign-manager]','click',(el)=>run(()=>service.assignManager(el.dataset.assignManager!,service.activeActor()!.id),'Manager assigned.'));
    bind(root,'[data-respond]','click',(el)=>run(()=>service.respondConnection(el.dataset.respond!,el.dataset.accept==='true'),el.dataset.accept==='true'?'Connection accepted. No records were shared.':'Connection declined.'));
    bind(root,'[data-disconnect]','click',(el)=>run(()=>service.disconnect(el.dataset.disconnect!),'Adult connection disconnected.'));
    bind(root,'[data-revoke-grant]','click',(el)=>{if(globalThis.confirm('Revoke this read-only access now? The underlying records will not be deleted.'))run(()=>service.revokeGrant(el.dataset.revokeGrant!),'Sharing access revoked.');});
    bind(root,'[data-delete-value]','click',(el)=>{if(globalThis.confirm('Delete this recorded value? This cannot be undone.'))run(()=>service.deleteMeasurementValue(el.dataset.deleteValue!,el.dataset.valueId!),'Value deleted.');});
    bind(root,'[data-delete-measurement]','click',(el)=>{if(globalThis.confirm('Delete this measurement and all its recorded values? This cannot be undone.'))run(()=>service.deleteMeasurement(el.dataset.deleteMeasurement!),'Measurement deleted.');});
    bind(root,'[data-delete-size]','click',(el)=>{if(globalThis.confirm('Delete this recorded size? This cannot be undone.'))run(()=>service.deleteStandardSize(el.dataset.deleteSize!),'Standard size deleted.');});
    bind(root,'[data-delete-brand]','click',(el)=>{if(globalThis.confirm('Delete this brand & product fact? This cannot be undone.'))run(()=>service.deleteBrandFit(el.dataset.deleteBrand!),'Brand & product fact deleted.');});
    bind(root,'[data-delete-profile]','click',(el)=>{if(globalThis.confirm('Delete this profile and every record it owns? Any sharing access to it will also end. This cannot be undone.'))run(()=>{service.deleteProfile(el.dataset.deleteProfile!);editingProfileId='';profileFormOpen=false;},'Profile deleted.');});
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
    const anatomyBrowser=root.querySelector<HTMLElement>('#anatomy-discovery-browser'),anatomyToggle=root.querySelector<HTMLButtonElement>('#open-anatomy-discovery');
    const showAnatomyPath=(path:string)=>{root.querySelectorAll<HTMLElement>('[data-anatomy-panel]').forEach((panel)=>panel.hidden=panel.dataset.anatomyPanel!==path);const stage=root.querySelector<HTMLElement>('#anatomy-navigator-stage');if(stage){stage.innerHTML=renderAnatomyNavigator(path.split(' > ') as unknown as AnatomyPath);void hydrateStandaloneAnatomy(stage);}const broad=path==='Body'?'':path.split(' > ').slice(0,2).join(' > ');root.querySelectorAll<SVGElement>('[data-anatomy-visual-path]').forEach(region=>region.toggleAttribute('data-selected',region.dataset.anatomyVisualPath===broad));root.querySelectorAll<HTMLElement>('.anatomy-region-choice').forEach(region=>region.toggleAttribute('aria-current',region.dataset.anatomyPath===broad));};
    bind(root,'#open-anatomy-discovery','click',()=>{if(anatomyBrowser&&anatomyToggle){anatomyBrowser.hidden=false;anatomyToggle.setAttribute('aria-expanded','true');showAnatomyPath('Body');anatomyBrowser.querySelector<HTMLElement>('[data-anatomy-panel="Body"] button')?.focus();}});
    bind(root,'#close-anatomy-discovery','click',()=>{if(anatomyBrowser&&anatomyToggle){anatomyBrowser.hidden=true;anatomyToggle.setAttribute('aria-expanded','false');anatomyToggle.focus();}});
    const navigateAnatomy=(element:HTMLElement)=>{
      const destination=element.dataset.anatomyPath!,origin=element.closest<HTMLElement>('[data-anatomy-panel]')?.dataset.anatomyPanel,isBack=element.classList.contains('anatomy-back');showAnatomyPath(destination);
      const panel=root.querySelector<HTMLElement>(`[data-anatomy-panel="${destination}"]`);
      const target=isBack&&origin?panel?.querySelector<HTMLElement>(`[data-anatomy-path="${origin}"]`):panel?.querySelector<HTMLElement>('[data-anatomy-fact],.anatomy-region-choice');target?.focus();
    };
    bind(root,'[data-anatomy-path]','click',navigateAnatomy);
    root.querySelector<HTMLElement>('#anatomy-navigator-stage')?.addEventListener('click',(event)=>{const element=(event.target as Element).closest<HTMLElement>('[data-anatomy-visual-path]');if(element){element.dataset.anatomyPath=element.dataset.anatomyVisualPath;navigateAnatomy(element);}});
    bind(root,'[data-anatomy-fact]','click',(element)=>{if(!canonicalPicker)return;canonicalPicker.value=element.dataset.anatomyFact!;canonicalPicker.dispatchEvent(new Event('change'));if(anatomyBrowser&&anatomyToggle){anatomyBrowser.hidden=true;anatomyToggle.setAttribute('aria-expanded','false');}canonicalPicker.focus();});
    root.querySelector<HTMLInputElement>('#canonical-fact-search')?.addEventListener('input',(event)=>{const needle=(event.currentTarget as HTMLInputElement).value.toLowerCase();if(!canonicalPicker)return;for(const option of canonicalPicker.options)option.hidden=!!needle&&!option.dataset.search?.includes(needle);canonicalPicker.querySelectorAll<HTMLOptGroupElement>('optgroup').forEach((group)=>{group.hidden=[...group.querySelectorAll<HTMLOptionElement>('option')].every((option)=>option.hidden);});const first=[...canonicalPicker.options].find((option)=>!option.hidden);if(first&&canonicalPicker.selectedOptions[0]?.hidden){canonicalPicker.value=first.value;populateCanonicalChoices();}});
    root.querySelector<HTMLInputElement>('input[name="custom"]')?.addEventListener('change',(event)=>{const guidance=root.querySelector<HTMLElement>('#creation-guidance');if(guidance)guidance.hidden=(event.currentTarget as HTMLInputElement).checked;});
    bind(root, '#export-data', 'click', () => downloadBackup(service));
    bind(root, '#reset-data', 'click', () => { if (globalThis.confirm('Delete every Sigma profile, record, Family, connection and sharing grant stored in this browser? This cannot be undone.')) { service.reset(); route = 'profiles'; familyView='overview'; syncHash(); notice={kind:'success',message:'Local Sigma data reset. You can start again.'}; render(); } });
    bind(root,'[data-source-action]','click',(el)=>{const source=el.dataset.sourceAction as SourceId;selectedSourceId=source;sourceNotice='';if(['measurement_device','apple_health','health_connect'].includes(source))permissionFlow='health_data';else if(source==='camera_assisted'||source==='body_scan')permissionFlow='camera';else if(source==='external_scan')permissionFlow='files';else if(source==='smart_scale')permissionFlow='nearby_devices';render();root.querySelector<HTMLElement>('#permission-explanation')?.focus();});
    bind(root,'[data-permission-allow]','click',(el)=>{const kind=el.dataset.permissionAllow as PermissionKind;permissions.set(kind,'demo_granted');permissionFlow=undefined;if(selectedSourceId==='measurement_device'){const results=evaluateDemoPayload();importCandidates=results.flatMap(x=>x.status==='accepted'?[x.candidate]:[]);excluded=results.filter(x=>x.status==='rejected').length;sourceNotice='Local demo access simulated. No external service was contacted.';}else{importCandidates=[];excluded=0;sourceNotice='This integration is not implemented in the current local demo. Simulated permission does not activate it.'}render();(root.querySelector<HTMLElement>('#import-candidates')??root.querySelector<HTMLElement>('#source-status'))?.focus();});
    bind(root,'[data-permission-decline]','click',(el)=>{permissions.set(el.dataset.permissionDecline as PermissionKind,'demo_denied');permissionFlow=undefined;importCandidates=[];excluded=0;notice={kind:'info',message:'Demo permission declined. Nothing was imported; manual entry remains available.'};render();});
    bind(root,'[data-import-candidate]','click',(el)=>{const target=root.querySelector<HTMLSelectElement>('#import-target')?.value;if(target){run(()=>{importCandidate(service,target,importCandidates[Number(el.dataset.importCandidate)]);importCandidates.splice(Number(el.dataset.importCandidate),1);},'Candidate imported with its provenance.');}});
    bind(root,'#reset-permission-demos','click',()=>{permissions.reset();permissionFlow=undefined;selectedSourceId=undefined;sourceNotice='';importCandidates=[];excluded=0;notice={kind:'success',message:'Permission demonstrations reset. Records were not deleted.'};render();});
  };
  if (hasHash) window.addEventListener('hashchange', () => { const parsed = parseHash(window.location.hash); route = parsed.route; familyView = parsed.familyView; notice = undefined; render(); });
  syncHash();
  render();
}

function bind(root: HTMLElement, selector: string, event: string, action: (element: HTMLElement) => void): void { root.querySelectorAll<HTMLElement>(selector).forEach((element) => element.addEventListener(event, () => action(element))); }
function onForm(root: HTMLElement, selector: string, action: (form: HTMLFormElement) => void): void { root.querySelector<HTMLFormElement>(selector)?.addEventListener('submit', (event) => { event.preventDefault(); action(event.currentTarget as HTMLFormElement); }); }
function forms(root: HTMLElement, selector: string, action: (form: HTMLFormElement, data: FormData) => void, done: () => void): void { root.querySelectorAll<HTMLFormElement>(selector).forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); action(form, new FormData(event.currentTarget as HTMLFormElement)); done(); })); }
function unitChoices(dimension?: Dimension): string { const choices = dimension ? unitsForDimension(dimension).map((unit) => `<option value="${unit.symbol}">${unit.symbol} · ${unit.label}</option>`).join('') : ''; return `${choices}<option value="custom">Custom recorded unit</option>`; }
