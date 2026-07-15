export type DemoEntitlement = 'free'|'full'|'extended';
const KEY='sigma.demo.entitlement';
export const readDemoEntitlement=():DemoEntitlement => { const v=globalThis.localStorage?.getItem(KEY); return v==='full'||v==='extended'?v:'free'; };
export const writeDemoEntitlement=(v:DemoEntitlement):void => globalThis.localStorage?.setItem(KEY,v);
