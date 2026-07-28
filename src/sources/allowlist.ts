export type ExternalFieldId = 'body.height'|'body.weight'|'body.waist_circumference'|'body.neck_circumference'|'body.head_circumference'|'hand.length'|'foot.length'|'foot.width'|'size.clothing'|'size.shoe'|'size.ring'|'size.wearable'|'size.equipment'|'scan.chest_circumference';
export interface ExternalFieldDefinition { id:ExternalFieldId; targetKind:'measurement'|'standard_size'; measurementType?:string; category:string; defaultLabel:string; allowedUnitsOrSystems:readonly string[]; }
export const externalFieldAllowlist:readonly ExternalFieldDefinition[] = [
  ['body.height','measurement','Height','Whole body','Height',['cm','m','in']], ['body.weight','measurement','Weight','Whole body','Weight',['kg','lb','st']],
  ['body.waist_circumference','measurement','Waist','Upper body','Waist circumference',['cm','in']], ['body.neck_circumference','measurement','Neck/collar','Upper body','Neck circumference',['cm','in']],
  ['body.head_circumference','measurement','Head circumference','Head & neck','Head circumference',['cm','in']], ['hand.length','measurement','Hand length','Hands','Hand length',['cm','mm','in']],
  ['foot.length','measurement','Foot length','Footwear','Foot length',['cm','mm','in']], ['foot.width','measurement','Foot width','Footwear','Foot width',['cm','mm','in']],
  ['size.clothing','standard_size',undefined,'Clothing','Clothing size',['UK','EU','US','Generic']], ['size.shoe','standard_size',undefined,'Footwear','Shoe size',['UK','EU',"US Men's","US Women's"]],
  ['size.ring','standard_size',undefined,'Jewellery','Ring size',['ISO','UK','US']], ['size.wearable','standard_size',undefined,'Wearables','Wearable size',['mm','Generic']],
  ['size.equipment','standard_size',undefined,'Equipment','Equipment size',['Generic','cm','in']], ['scan.chest_circumference','measurement','Chest','Upper body','Scan-derived chest circumference',['cm','mm','in']],
].map(([id,targetKind,measurementType,category,defaultLabel,allowedUnitsOrSystems])=>({id:id as ExternalFieldId,targetKind:targetKind as 'measurement'|'standard_size',measurementType:measurementType as string|undefined,category:category as string,defaultLabel:defaultLabel as string,allowedUnitsOrSystems:allowedUnitsOrSystems as string[]}));
export const externalField = (id:string) => externalFieldAllowlist.find(field=>field.id===id);
