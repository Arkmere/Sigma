export type ExternalFieldId = 'body.height'|'body.weight'|'body.waist_circumference'|'body.neck_circumference'|'body.head_circumference'|'hand.length'|'foot.length'|'foot.width'|'size.clothing'|'size.shoe'|'size.ring'|'size.wearable'|'size.equipment'|'scan.chest_circumference';
export interface ExternalFieldDefinition { id:ExternalFieldId; canonicalFactId:string; allowedUnitsOrSystems:readonly string[]; }
export const externalFieldAllowlist:readonly ExternalFieldDefinition[] = [
  ['body.height','measurement.height',['cm','m','in']], ['body.weight','measurement.weight',['kg','lb','st']],
  ['body.waist_circumference','measurement.waist-circumference',['cm','in']], ['body.neck_circumference','measurement.neck-circumference',['cm','in']],
  ['body.head_circumference','measurement.head-circumference',['cm','in']], ['hand.length','measurement.hand-length',['cm','mm','in']],
  ['foot.length','measurement.foot-length',['cm','mm','in']], ['foot.width','measurement.foot-width',['cm','mm','in']],
  ['size.clothing','size.top-size',['UK','EU','US','International']], ['size.shoe','size.shoe-size',['UK','EU',"US Men's","US Women's"]],
  ['size.ring','size.ring-size',['ISO','UK','US']], ['size.wearable','size.watch-band-size',['mm']],
  ['size.equipment','size.helmet-size',['cm','in']], ['scan.chest_circumference','measurement.chest-circumference',['cm','mm','in']],
].map(([id,canonicalFactId,allowedUnitsOrSystems])=>({id:id as ExternalFieldId,canonicalFactId:canonicalFactId as string,allowedUnitsOrSystems:allowedUnitsOrSystems as string[]}));
export const externalField = (id:string) => externalFieldAllowlist.find(field=>field.id===id);
