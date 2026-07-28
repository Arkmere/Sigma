export type PermissionKind = 'contacts' | 'camera' | 'health_data' | 'nearby_devices' | 'files';
export type PermissionDecision = 'not_requested' | 'demo_granted' | 'demo_denied';
export interface PermissionExplanation {
  kind: PermissionKind;
  title: string;
  requestedAccess: string;
  reason: string;
  willAccess: readonly string[];
  willNotAccess: readonly string[];
  alternatives: readonly string[];
  denialEffect: string;
}
