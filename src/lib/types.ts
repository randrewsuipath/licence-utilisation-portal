import type { EntityRecord } from '@uipath/uipath-typescript/entities';
export type UtilisationRisk =
  | 'No licence quantity'
  | 'No usage'
  | 'Low utilisation'
  | 'Moderate utilisation'
  | 'Healthy utilisation'
  | 'Over-utilised'
  | 'Not mapped';
export interface ProcessedSnapshot {
  // Original snapshot fields
  snapshotRunKey: string;
  subsidiaryId: number;
  subsidiaryName: string | null;
  licensedProduct: string;
  snapshotMonth: string;
  licenseStartDate: string | null;
  licenseEndDate: string | null;
  licensedProductQty: number | null;
  // Account fields
  region: string | null;
  accountDirector: string | null;
  tam: string | null;
  csm: string | null;
  isActive: boolean;
  // Metric mapping fields
  displayName: string | null;
  primaryUsageMetric: string | null;
  licensedQuantityMetric: string | null;
  displayUnit: string | null;
  sortOrder: number | null;
  // Calculated fields
  licensedQuantity: number | null;
  usageValue: number | null;
  utilisationPercentage: number | null;
  utilisationRisk: UtilisationRisk;
}
export interface GlobalFilterState {
  snapshotMonth: string | null;
  licensedProduct: string | null;
  accountDirector: string | null;
  tam: string | null;
  csm: string | null;
  subsidiaryName: string | null;
  region: string | null;
  utilisationRisk: UtilisationRisk | null;
}
export interface KpiData {
  uniqueAccounts: number;
  activeAccounts: number;
  totalLicensed: number;
  totalUsage: number;
  avgUtilisation: number;
  expiringLicences: number;
  lowUtilAccounts: number;
  overUtilAccounts: number;
  unmappedProducts: number;
}