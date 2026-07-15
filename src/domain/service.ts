import { currentMeasurementValue, DATA_SCHEMA_VERSION, type AdultConnection, type BrandFit, type Family, type MeasurementValue, type PhysicalMeasurement, type Profile, type SharingGrant, type SharingScope, type SigmaBackup, type SigmaData, type StandardSize } from './model.js';
import { activeConnection, canCreateGrant, canRevokeGrant, canViewRecord } from './sharing.js';
import type { DataRepository, LoadResult } from '../data/repository.js';
import { convertUnit, footwearConversions, measurementSemantics, resolveUnit, unitsForDimension, type ConversionResult, type FootwearContext } from '../conversion/registry.js';

type Clock = () => string;
type IdFactory = () => string;
const defaultId = () => globalThis.crypto?.randomUUID?.() ?? `sigma-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const defaultClock = () => new Date().toISOString();

export class SigmaService {
  private data: SigmaData;
  private loadResult: LoadResult;
  constructor(private readonly repository: DataRepository, private readonly now: Clock = defaultClock, private readonly id: IdFactory = defaultId) {
    this.loadResult = repository.load();
    this.data = this.loadResult.data;
  }

  storageStatus(): LoadResult { return structuredClone(this.loadResult); }
  snapshot(): SigmaData { return structuredClone(this.data); }
  activeProfile(): Profile | undefined { return this.data.profiles.find((profile) => profile.id === this.data.activeProfileId); }
  activeActor(): Profile | undefined { return this.data.profiles.find((profile) => profile.id === this.data.activeActorProfileId); }
  selectActor(profileId: string): void { this.ensureWritable(); const profile=this.requireProfile(profileId); if(profile.profileType!=='independent') throw new Error('Only an independent profile may act.'); this.data.activeActorProfileId=profileId; this.persist(); }
  selectProfile(profileId: string): void { this.ensureWritable(); this.requireProfile(profileId); this.data.activeProfileId = profileId; this.persist(); }

  createProfile(input: Pick<Profile, 'displayName' | 'profileType'> & Partial<Pick<Profile, 'relationshipLabel' | 'dateOfBirth' | 'notes'>>): Profile {
    this.ensureWritable();
    if (input.profileType === 'managed') throw new Error('Managed profiles require an explicit manager and Family.');
    const timestamp = this.now();
    const profile: Profile = { id: this.id(), displayName: input.displayName.trim(), profileType: input.profileType, relationshipLabel: clean(input.relationshipLabel), dateOfBirth: clean(input.dateOfBirth), notes: clean(input.notes), createdAt: timestamp, updatedAt: timestamp };
    if (!profile.displayName) throw new Error('Display name is required.');
    this.data.profiles.push(profile);
    this.data.activeProfileId ??= profile.id;
    if (profile.profileType === 'independent') this.data.activeActorProfileId ??= profile.id;
    this.persist(); return structuredClone(profile);
  }

  createFamily(name: string): Family { this.ensureWritable(); const actor=this.requireActor(); const t=this.now(); const family={id:this.id(),name:name.trim(),createdByProfileId:actor.id,createdAt:t,updatedAt:t}; if(!family.name) throw new Error('Family name is required.'); this.data.families.push(family); this.addMembershipInternal(family.id,actor.id,actor.id,t); this.persist(); return structuredClone(family); }
  addFamilyMember(familyId:string, profileId:string): void { this.ensureWritable(); const actor=this.requireActor(); this.requireFamily(familyId); this.requireProfile(profileId); if(!this.data.familyMemberships.some(m=>m.familyId===familyId&&m.profileId===actor.id)) throw new Error('Actor must belong to the Family.'); this.addMembershipInternal(familyId,profileId,actor.id,this.now()); this.persist(); }
  createManagedProfile(input:{displayName:string; managedKind:'child'|'dependant'; familyId:string; relationshipLabel?:string}):Profile { this.ensureWritable(); const actor=this.requireActor(); this.requireFamily(input.familyId); if(!this.data.familyMemberships.some(m=>m.familyId===input.familyId&&m.profileId===actor.id)) throw new Error('Manager must belong to the Family.'); const t=this.now(); const p:Profile={id:this.id(),displayName:input.displayName.trim(),profileType:'managed',relationshipLabel:clean(input.relationshipLabel),managedKind:input.managedKind,managedByProfileIds:[actor.id],createdAt:t,updatedAt:t}; if(!p.displayName) throw new Error('Display name is required.'); this.data.profiles.push(p); this.addMembershipInternal(input.familyId,p.id,actor.id,t); this.persist(); return structuredClone(p); }
  assignManager(profileId:string, managerId?:string):void { this.ensureWritable(); const actor=this.requireActor(); const p=this.requireProfile(profileId); if(p.profileType!=='managed') throw new Error('Profile is not managed.'); const manager=this.requireProfile(managerId??actor.id); if(manager.profileType!=='independent' || manager.id!==actor.id) throw new Error('A manager must explicitly act for themselves.'); p.managedByProfileIds=[...new Set([...(p.managedByProfileIds??[]),manager.id])]; p.updatedAt=this.now(); this.persist(); }
  requestConnection(recipientId:string):AdultConnection { this.ensureWritable(); const actor=this.requireActor(); const recipient=this.requireProfile(recipientId); if(recipient.profileType!=='independent'||recipient.id===actor.id) throw new Error('Choose another independent adult.'); if(this.data.adultConnections.some(c=>['pending','active'].includes(c.status)&&((c.initiatorProfileId===actor.id&&c.recipientProfileId===recipient.id)||(c.initiatorProfileId===recipient.id&&c.recipientProfileId===actor.id)))) throw new Error('A pending or active connection already exists.'); const c:AdultConnection={id:this.id(),initiatorProfileId:actor.id,recipientProfileId:recipient.id,status:'pending',requestedAt:this.now()}; this.data.adultConnections.push(c); this.persist(); return structuredClone(c); }
  respondConnection(id:string, accept:boolean):void { this.ensureWritable(); const actor=this.requireActor(); const c=this.requireConnection(id); if(c.status!=='pending'||c.recipientProfileId!==actor.id) throw new Error('Only the recipient may respond to a pending request.'); c.status=accept?'active':'declined'; c.respondedAt=this.now(); this.persist(); }
  disconnect(id:string):void { this.ensureWritable(); const actor=this.requireActor(); const c=this.requireConnection(id); if(c.status!=='active'||![c.initiatorProfileId,c.recipientProfileId].includes(actor.id)) throw new Error('Only a connected participant may disconnect.'); c.status='disconnected'; c.disconnectedAt=this.now(); c.disconnectedByProfileId=actor.id; this.persist(); }
  grantAccess(ownerProfileId:string, recipientProfileId:string, scope:SharingScope):SharingGrant { this.ensureWritable(); const actor=this.requireActor(); if(!canCreateGrant(this.data,actor.id,ownerProfileId,recipientProfileId)) throw new Error('Actor is not authorised to create this grant.'); this.validateScope(ownerProfileId,scope); if(this.data.sharingGrants.some(g=>g.status==='active'&&g.ownerProfileId===ownerProfileId&&g.recipientProfileId===recipientProfileId&&JSON.stringify(g.scope)===JSON.stringify(scope))) throw new Error('An equivalent active grant exists.'); const g:SharingGrant={id:this.id(),ownerProfileId,recipientProfileId,grantedByProfileId:actor.id,scope,status:'active',grantedAt:this.now()}; this.data.sharingGrants.push(g); this.persist(); return structuredClone(g); }
  revokeGrant(id:string):void { this.ensureWritable(); const actor=this.requireActor(); const g=this.data.sharingGrants.find(x=>x.id===id); if(!g||!canRevokeGrant(this.data,actor.id,g)) throw new Error('Actor is not authorised to revoke this grant.'); g.status='revoked'; g.revokedAt=this.now(); g.revokedByProfileId=actor.id; this.persist(); }
  sharedRecords(actorId=this.data.activeActorProfileId??'') { const all=[...this.data.measurements,...this.data.standardSizes,...this.data.brandFits]; return all.filter(r=>r.profileId!==actorId&&canViewRecord(this.data,actorId,r)); }
  sharedRecordConversions(actorId:string, recordId:string):ConversionResult[] { if(!this.canViewRecord(actorId,recordId)) return []; if(this.data.measurements.some(r=>r.id===recordId)) return this.measurementConversions(recordId); if(this.data.standardSizes.some(r=>r.id===recordId)) return this.standardSizeConversions(recordId); return this.brandFitConversions(recordId); }
  canViewRecord(actorId:string, recordId:string):boolean { const r=[...this.data.measurements,...this.data.standardSizes,...this.data.brandFits].find(x=>x.id===recordId); return !!r&&canViewRecord(this.data,actorId,r); }
  hasActiveConnection(a:string,b:string):boolean{return activeConnection(this.data,a,b);}

  updateProfile(profileId: string, input: Partial<Pick<Profile, 'displayName' | 'profileType' | 'relationshipLabel' | 'dateOfBirth' | 'notes'>>): Profile {
    this.ensureWritable();
    const profile = this.requireProfile(profileId);
    Object.assign(profile, input, { updatedAt: this.now() });
    profile.displayName = profile.displayName.trim();
    if (!profile.displayName) throw new Error('Display name is required.');
    this.persist(); return structuredClone(profile);
  }

  addMeasurement(input: Omit<PhysicalMeasurement, 'id' | 'kind' | 'values' | 'visibility' | 'createdAt' | 'updatedAt'> & Omit<MeasurementValue, 'id' | 'createdAt'>): PhysicalMeasurement {
    this.ensureWritable();
    this.requireProfile(input.profileId); const timestamp = this.now();
    const value = this.makeValue(input, timestamp);
    const record: PhysicalMeasurement = { id: this.id(), profileId: input.profileId, kind: 'measurement', measurementType: input.measurementType, category: input.category, label: input.label, values: [value], visibility: 'private', createdAt: timestamp, updatedAt: timestamp };
    this.data.measurements.push(record); this.persist(); return structuredClone(record);
  }

  addMeasurementValue(recordId: string, input: Omit<MeasurementValue, 'id' | 'createdAt'>): PhysicalMeasurement {
    this.ensureWritable();
    const record = this.data.measurements.find((item) => item.id === recordId); if (!record) throw new Error('Measurement not found.');
    record.values.push(this.makeValue(input, this.now())); record.updatedAt = this.now(); this.persist(); return structuredClone(record);
  }

  updateMeasurement(recordId: string, input: Pick<PhysicalMeasurement, 'label' | 'category' | 'measurementType'>): PhysicalMeasurement {
    this.ensureWritable();
    const record = this.data.measurements.find((item) => item.id === recordId); if (!record) throw new Error('Measurement not found.');
    Object.assign(record, input, { updatedAt: this.now() }); this.persist(); return structuredClone(record);
  }

  addStandardSize(input: Omit<StandardSize, 'id' | 'kind' | 'visibility' | 'createdAt' | 'updatedAt'>): StandardSize {
    this.ensureWritable();
    this.requireProfile(input.profileId); const timestamp = this.now();
    const record: StandardSize = { ...input, id: this.id(), kind: 'standard_size', visibility: 'private', createdAt: timestamp, updatedAt: timestamp };
    this.data.standardSizes.push(record); this.persist(); return structuredClone(record);
  }

  updateStandardSize(recordId: string, input: Pick<StandardSize, 'category' | 'label' | 'sizingSystem' | 'sizeValue' | 'notes'>): StandardSize {
    this.ensureWritable();
    const record = this.data.standardSizes.find((item) => item.id === recordId); if (!record) throw new Error('Standard size not found.');
    Object.assign(record, input, { updatedAt: this.now() }); this.persist(); return structuredClone(record);
  }

  addBrandFit(input: Omit<BrandFit, 'id' | 'kind' | 'visibility' | 'createdAt' | 'updatedAt'>): BrandFit {
    this.ensureWritable();
    this.requireProfile(input.profileId); const timestamp = this.now();
    const record: BrandFit = { ...input, id: this.id(), kind: 'brand_fit', visibility: 'private', createdAt: timestamp, updatedAt: timestamp };
    this.data.brandFits.push(record); this.persist(); return structuredClone(record);
  }

  updateBrandFit(recordId: string, input: Pick<BrandFit, 'category' | 'brand' | 'productName' | 'productLine' | 'sizingSystem' | 'sizeValue' | 'fitNotes'>): BrandFit {
    this.ensureWritable();
    const record = this.data.brandFits.find((item) => item.id === recordId); if (!record) throw new Error('Brand fit not found.');
    Object.assign(record, input, { updatedAt: this.now() }); this.persist(); return structuredClone(record);
  }

  records(profileId: string, query = '', category = '') {
    const needle = query.trim().toLowerCase();
    const matches = (parts: Array<string | undefined>, itemCategory: string) => (!category || itemCategory === category) && (!needle || parts.some((part) => part?.toLowerCase().includes(needle)));
    return {
      measurements: this.data.measurements.filter((r) => r.profileId === profileId && matches([r.label, r.measurementType, r.category], r.category)),
      standardSizes: this.data.standardSizes.filter((r) => r.profileId === profileId && matches([r.label, r.category, r.sizingSystem, r.sizeValue], r.category)),
      brandFits: this.data.brandFits.filter((r) => r.profileId === profileId && matches([r.brand, r.productName, r.productLine, r.category, r.sizingSystem, r.sizeValue], r.category)),
    };
  }

  exportBackup(): SigmaBackup { return { product: 'Sigma', exportedAt: this.now(), ...this.snapshot(), schemaVersion: DATA_SCHEMA_VERSION }; }
  reset(): void { this.repository.clear(); this.loadResult = this.repository.load(); this.data = this.loadResult.data; }
  currentValue(record: PhysicalMeasurement) { return currentMeasurementValue(record); }
  measurementConversions(recordId: string): ConversionResult[] {
    const record = this.data.measurements.find((item) => item.id === recordId); const current = record && currentMeasurementValue(record);
    if (!record || !current) return [];
    const unit = resolveUnit(current.originalUnit); const semantics = measurementSemantics(record.measurementType);
    if (!unit || semantics.kind === 'categorical' || (semantics.kind === 'dimensional' && unit.dimension !== semantics.dimension)) return [];
    return unitsForDimension(unit.dimension).flatMap((target) => target.symbol === unit.symbol ? [] : [convertUnit(current.originalValue, unit.symbol, target.symbol, record.id)!]);
  }
  standardSizeConversions(recordId: string, context: FootwearContext = 'adult_simplified'): ConversionResult[] {
    const record = this.data.standardSizes.find((item) => item.id === recordId);
    return record?.category === 'Footwear' ? footwearConversions(record.sizingSystem, record.sizeValue, context, record.id) : [];
  }
  brandFitConversions(recordId: string, context: FootwearContext = 'adult_simplified'): ConversionResult[] {
    const record = this.data.brandFits.find((item) => item.id === recordId);
    return record?.category === 'Footwear' ? footwearConversions(record.sizingSystem, record.sizeValue, context, record.id) : [];
  }
  private requireProfile(id: string): Profile { const profile = this.data.profiles.find((item) => item.id === id); if (!profile) throw new Error('Profile not found.'); return profile; }
  private requireActor():Profile { const actor=this.activeActor(); if(!actor) throw new Error('Select an independent acting adult.'); return actor; }
  private requireFamily(id:string){const f=this.data.families.find(x=>x.id===id);if(!f)throw new Error('Family not found.');return f;}
  private requireConnection(id:string){const c=this.data.adultConnections.find(x=>x.id===id);if(!c)throw new Error('Connection not found.');return c;}
  private addMembershipInternal(familyId:string,profileId:string,addedByProfileId:string,createdAt:string){if(this.data.familyMemberships.some(m=>m.familyId===familyId&&m.profileId===profileId))throw new Error('Profile is already a Family member.');this.data.familyMemberships.push({id:this.id(),familyId,profileId,addedByProfileId,createdAt});}
  private validateScope(ownerId:string,scope:SharingScope){if(scope.type==='category'&&!scope.category.trim())throw new Error('Category is required.');if(scope.type==='record'){const collection=scope.recordKind==='measurement'?this.data.measurements:scope.recordKind==='standard_size'?this.data.standardSizes:this.data.brandFits;if(!collection.some(r=>r.id===scope.recordId&&r.profileId===ownerId))throw new Error('Scoped record does not belong to owner.');}}
  private ensureWritable(): void { if (this.loadResult.status === 'corrupt' || this.loadResult.status === 'unsupported_version') throw new Error('Stored Sigma data must be reset before new data can be saved.'); }
  private makeValue(input: Omit<MeasurementValue, 'id' | 'createdAt'>, createdAt: string): MeasurementValue { return { ...input, id: this.id(), createdAt }; }
  private persist(): void {
    if (this.loadResult.status === 'corrupt' || this.loadResult.status === 'unsupported_version') throw new Error('Stored Sigma data must be reset before new data can be saved.');
    this.repository.save(this.data);
    this.loadResult = { status: 'ok', data: this.data };
  }
}

function clean(value?: string): string | undefined { const result = value?.trim(); return result || undefined; }
