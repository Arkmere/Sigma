import { categories } from './taxonomy.js';
import { measurementGuidanceFor, type MeasurementGuidance } from './measurement-guidance.js';

export type MeasurementCategory = typeof categories[number];
export type CanonicalRecordKind = 'measurement' | 'standard_size' | 'brand_product_fact';
export type AnatomyPath = readonly ['Body', ...string[]];

export interface CanonicalFactDefinition {
  id: string;
  label: string;
  aliases: readonly string[];
  category: MeasurementCategory;
  recordKind: CanonicalRecordKind;
  description?: string;
  measurement?: {
    measurementType: string;
    semantics: { kind: 'dimensional'; dimension: 'length' | 'mass' } | { kind: 'categorical' };
    permittedUnits: readonly string[];
    defaultUnit?: string;
  };
  standardSize?: { sizeContext: string; permittedSystems: readonly string[]; defaultSystem?: string };
  brandProduct?: { sizeContext?: string; permittedSystems?: readonly string[] };
  anatomyPath?: AnatomyPath;
  guidance?: MeasurementGuidance;
}

const lengthUnits = ['mm', 'cm', 'm', 'in', 'ft'] as const;
const massUnits = ['g', 'kg', 'oz', 'lb', 'st'] as const;
const clothingSystems = ['UK', 'EU', 'US', 'International'] as const;
const footwearSystems = ['UK', 'EU', "US Men's", "US Women's", 'Mondopoint'] as const;
const ringSystems = ['ISO', 'UK', 'US', 'EU', 'Inner circumference (mm)', 'Inner diameter (mm)'] as const;

type MeasurementSeed = readonly [id:string, label:string, category:MeasurementCategory, aliases:readonly string[], dimension?:'length'|'mass', anatomy?:AnatomyPath, description?:string];
const measurementSeeds: readonly MeasurementSeed[] = [
  ['height','Height','General body dimensions',['stature','body height'],'length',['Body']],
  ['weight','Weight','General body dimensions',['body mass'],'mass',['Body']],
  ['body-length','Body length','General body dimensions',['total body length'],'length',['Body']],
  ['arm-span','Arm span','General body dimensions',['wingspan'],'length',['Body','Upper limbs']],
  ['head-circumference','Head circumference','Head and neck',['head size'],'length',['Body','Head and neck']],
  ['neck-circumference','Neck circumference','Head and neck',['neck','collar measurement'],'length',['Body','Head and neck']],
  ['face-width','Face width','Head and neck',['facial width'],'length',['Body','Head and neck','Face']],
  ['face-length','Face length','Head and neck',['facial length'],'length',['Body','Head and neck','Face']],
  ['pupillary-distance','Pupillary distance','Head and neck',['pd','eye distance'],'length',['Body','Head and neck','Face']],
  ['chest-circumference','Chest circumference','Upper body',['chest','chest size'],'length',['Body','Torso']],
  ['bust-circumference','Bust circumference','Upper body',['bust'],'length',['Body','Torso']],
  ['underbust-circumference','Underbust circumference','Upper body',['under bust','bra band measurement'],'length',['Body','Torso']],
  ['waist-circumference','Waist circumference','Upper body',['waist','trouser waist'],'length',['Body','Torso']],
  ['hip-circumference','Hip circumference','Lower body',['hip','seat circumference'],'length',['Body','Torso']],
  ['shoulder-width','Shoulder width','Upper body',['shoulders'],'length',['Body','Torso']],
  ['back-width','Back width','Upper body',['across back'],'length',['Body','Torso']],
  ['torso-length','Torso length','Upper body',['body length','back length'],'length',['Body','Torso']],
  ['arm-length','Arm length','Upper body',['arm measurement'],'length',['Body','Upper limbs']],
  ['sleeve-length','Sleeve length','Upper body',['shirt sleeve'],'length',['Body','Upper limbs']],
  ['upper-arm-circumference','Upper-arm circumference','Upper body',['bicep circumference','upper arm'],'length',['Body','Upper limbs']],
  ['forearm-circumference','Forearm circumference','Upper body',['forearm'],'length',['Body','Upper limbs']],
  ['wrist-circumference','Wrist circumference','Hands',['wrist','watch measurement'],'length',['Body','Upper limbs','Hand']],
  ['hand-length','Hand length','Hands',['hand size'],'length',['Body','Upper limbs','Hand']],
  ['hand-width','Hand width','Hands',['palm width'],'length',['Body','Upper limbs','Hand']],
  ['palm-circumference','Palm circumference','Hands',['hand circumference','palm girth'],'length',['Body','Upper limbs','Hand']],
  ['middle-finger-length','Middle finger length','Hands',['finger length'],'length',['Body','Upper limbs','Hand','Fingers']],
  ['finger-circumference','Finger circumference','Jewellery',['ring finger circumference','ring measurement'],'length',['Body','Upper limbs','Hand','Fingers']],
  ['inseam','Inseam','Lower body',['inside leg','trouser length'],'length',['Body','Lower limbs']],
  ['outseam','Outseam','Lower body',['outside leg'],'length',['Body','Lower limbs']],
  ['rise','Rise','Lower body',['body rise','trouser rise'],'length',['Body','Lower limbs']],
  ['front-rise','Front rise','Lower body',['front trouser rise'],'length',['Body','Lower limbs']],
  ['back-rise','Back rise','Lower body',['back trouser rise'],'length',['Body','Lower limbs']],
  ['thigh-circumference','Thigh circumference','Lower body',['thigh'],'length',['Body','Lower limbs']],
  ['knee-circumference','Knee circumference','Lower body',['knee'],'length',['Body','Lower limbs']],
  ['calf-circumference','Calf circumference','Lower body',['calf'],'length',['Body','Lower limbs']],
  ['ankle-circumference','Ankle circumference','Lower body',['ankle'],'length',['Body','Lower limbs']],
  ['foot-length','Foot length','Feet',['shoe measurement','heel to toe'],'length',['Body','Lower limbs','Foot']],
  ['foot-width','Foot width','Feet',['shoe width'],'length',['Body','Lower limbs','Foot']],
  ['foot-circumference','Foot circumference','Feet',['foot girth','ball girth'],'length',['Body','Lower limbs','Foot']],
  ['arch-length','Arch length','Feet',['heel to ball length'],'length',['Body','Lower limbs','Foot']],
  ['instep-circumference','Instep circumference','Feet',['instep girth'],'length',['Body','Lower limbs','Foot']],
  ['necklace-length','Necklace length','Jewellery',['chain length'],'length',['Body','Head and neck']],
  ['watch-band-length','Watch-band length','Jewellery',['watch strap length'],'length',['Body','Upper limbs','Hand']],
  ['bike-frame-measurement','Bike frame measurement','Sports equipment',['bike frame size'],'length',['Body','Lower limbs']],
  ['hockey-stick-length','Hockey stick length','Sports equipment',['stick length'],'length',['Body']],
  ['prosthetic-socket-measurement','Prosthetic/socket measurement','Specialist wearables',['prosthetic measurement'],'length',['Body'],'A precisely named dimensional measurement recorded for a prosthetic or socket context.'],
];

type SizeSeed = readonly [id:string,label:string,category:MeasurementCategory,aliases:readonly string[],context:string,systems:readonly string[],anatomy?:AnatomyPath,description?:string];
const sizeSeeds: readonly SizeSeed[] = [
  ['hat-size','Hat size','Head and neck',['headwear size'],'hat',['UK','US','EU','International'],['Body','Head and neck']],
  ['collar-size','Collar size','Head and neck',['collar','shirt neck size','neck'],'collar',['cm','in','UK','EU','US'],['Body','Head and neck']],
  ['bra-size','Bra size','Clothing',['bra band and cup'],'bra',['UK','EU','US','AU/NZ','FR'],['Body','Torso']],
  ['shirt-size','Shirt size','Clothing',['button shirt size'], 'shirt',clothingSystems,['Body','Torso']],
  ['top-size','T-shirt/top size','Clothing',['t shirt','tee','top size'], 'top',clothingSystems,['Body','Torso']],
  ['jacket-size','Jacket/coat size','Clothing',['jacket size','coat size'], 'outerwear',clothingSystems,['Body','Torso']],
  ['dress-size','Dress size','Clothing',['dress'], 'dress',clothingSystems,['Body','Torso']],
  ['trouser-size','Trouser size','Clothing',['pants size','trousers','waist','inseam'], 'trousers',clothingSystems,['Body','Lower limbs']],
  ['jeans-size','Jeans size','Clothing',['jeans waist','jeans length'], 'jeans',['Waist/length','UK','EU','US','International'],['Body','Lower limbs']],
  ['skirt-size','Skirt size','Clothing',['skirt'], 'skirt',clothingSystems,['Body','Lower limbs']],
  ['glove-size','Glove size','Hands',['handwear size','hand circumference'], 'glove',['Numeric','International','US','EU'],['Body','Upper limbs','Hand']],
  ['ring-size','Ring size','Jewellery',['ring','finger circumference'], 'ring',ringSystems,['Body','Upper limbs','Hand','Fingers']],
  ['shoe-size','Shoe size','Footwear',['general shoe size','trainer size','sneaker size','foot length'], 'footwear',footwearSystems,['Body','Lower limbs','Foot']],
  ['boot-size','Boot size','Footwear',['boots'], 'footwear',footwearSystems,['Body','Lower limbs','Foot']],
  ['dress-shoe-size','Dress shoe size','Footwear',['formal shoe size'], 'footwear',footwearSystems,['Body','Lower limbs','Foot']],
  ['ice-skate-size','Ice-skate size','Sports equipment',['ice skate','hockey skate','skate size'], 'ice_skate',['Bauer','CCM','True','UK','EU','US'],['Body','Lower limbs','Foot']],
  ['roller-skate-size','Roller-skate size','Sports equipment',['roller skate','inline skate'], 'roller_skate',['UK','EU','US','Mondopoint'],['Body','Lower limbs','Foot']],
  ['ski-boot-size','Ski boot size','Sports equipment',['ski boot'], 'ski_boot',['Mondopoint','UK','EU','US'],['Body','Lower limbs','Foot']],
  ['cycling-shoe-size','Cycling shoe size','Sports equipment',['bike shoe'], 'cycling_shoe',['UK','EU','US','Mondopoint'],['Body','Lower limbs','Foot']],
  ['belt-size','Belt size','Clothing',['belt length'], 'belt',['cm','in','UK','EU','US'],['Body','Torso']],
  ['watch-band-size','Watch-band size','Jewellery',['watch strap size'], 'watch_band',['mm','cm','in','Manufacturer'],['Body','Upper limbs','Hand']],
  ['bracelet-size','Bracelet size','Jewellery',['wrist jewellery size'], 'bracelet',['cm','in','International'],['Body','Upper limbs','Hand']],
  ['helmet-size','Helmet size','Sports equipment',['head protection size'], 'helmet',['cm','in','International','Manufacturer'],['Body','Head and neck']],
  ['glasses-frame-size','Glasses/frame size','Head and neck',['glasses frame width','spectacle size'], 'glasses',['Lens–bridge–temple (mm)','Manufacturer'],['Body','Head and neck','Face']],
  ['mask-size','Mask size','Specialist wearables',['respirator mask size','face mask size'], 'mask',['International','Manufacturer'],['Body','Head and neck','Face']],
  ['sock-size','Sock size','Clothing',['hosiery size'], 'sock',['UK','EU','US','International'],['Body','Lower limbs','Foot']],
  ['uniform-workwear-size','Uniform/workwear size','Clothing',['uniform size','workwear'], 'workwear',clothingSystems,['Body']],
  ['wetsuit-size','Wetsuit size','Sports equipment',['wet suit'], 'wetsuit',['International','Manufacturer'],['Body']],
  ['shin-guard-size','Shin guard size','Sports equipment',['shin pad size'], 'shin_guard',['International','Manufacturer'],['Body','Lower limbs']],
  ['protective-pad-size','Protective pad size','Sports equipment',['sports pad size'], 'protective_pad',['International','Manufacturer'],['Body']],
  ['climbing-harness-size','Climbing harness size','Sports equipment',['harness size'], 'climbing_harness',['International','Manufacturer'],['Body','Torso']],
  ['support-garment-size','Medical/support garment size','Specialist wearables',['support garment'], 'support_garment',['International','Manufacturer'],['Body']],
  ['compression-garment-size','Compression garment size','Specialist wearables',['compression wear'], 'compression_garment',['International','Manufacturer'],['Body']],
  ['ppe-size','PPE size','Specialist wearables',['personal protective equipment size'], 'ppe',['International','Manufacturer'],['Body']],
  ['safety-harness-size','Safety harness size','Specialist wearables',['work harness size'], 'safety_harness',['International','Manufacturer'],['Body','Torso']],
  ['orthotic-size','Orthotic size','Specialist wearables',['orthosis size'], 'orthotic',['Manufacturer'],['Body']],
];

const measurements: CanonicalFactDefinition[] = measurementSeeds.map(([id,label,category,aliases,dimension='length',anatomyPath,description]) => ({
  id:`measurement.${id}`, label, category, aliases, recordKind:'measurement', description,
  measurement:{measurementType:label,semantics:{kind:'dimensional',dimension},permittedUnits:dimension==='mass'?massUnits:lengthUnits,defaultUnit:dimension==='mass'?'kg':'cm'}, anatomyPath, guidance:measurementGuidanceFor(`measurement.${id}`),
}));
const sizes: CanonicalFactDefinition[] = sizeSeeds.map(([id,label,category,aliases,sizeContext,permittedSystems,anatomyPath,description]) => ({
  id:`size.${id}`,label,category,aliases,recordKind:'standard_size',description,
  standardSize:{sizeContext,permittedSystems,defaultSystem:permittedSystems[0]},anatomyPath,
}));
const brandFacts: CanonicalFactDefinition[] = sizes.map((fact) => ({
  id:`brand.${fact.id.slice(5)}`, label:fact.label, aliases:fact.aliases, category:fact.category,
  recordKind:'brand_product_fact', description:fact.description,
  brandProduct:{sizeContext:fact.standardSize!.sizeContext,permittedSystems:fact.standardSize!.permittedSystems}, anatomyPath:fact.anatomyPath,
}));

export const canonicalFactDefinitions: readonly CanonicalFactDefinition[] = Object.freeze([...measurements,...sizes,...brandFacts]);
const byId = new Map(canonicalFactDefinitions.map((definition) => [definition.id, definition]));
export const canonicalFactById = (id:string):CanonicalFactDefinition|undefined => byId.get(id);
export const canonicalFactsFor = (kind:CanonicalRecordKind, category?:string):readonly CanonicalFactDefinition[] =>
  canonicalFactDefinitions.filter((definition)=>definition.recordKind===kind&&(!category||definition.category===category));
export function searchCanonicalFacts(query:string,kind?:CanonicalRecordKind):readonly CanonicalFactDefinition[] {
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return canonicalFactDefinitions.filter((definition)=>!kind||definition.recordKind===kind).filter((definition)=>{
    const haystack=[definition.label,definition.category,definition.description,...definition.aliases].filter(Boolean).join(' ').toLowerCase();
    return words.every((word)=>haystack.includes(word));
  });
}
