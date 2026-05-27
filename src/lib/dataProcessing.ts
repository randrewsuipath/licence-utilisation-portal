import type { EntityRecord } from '@uipath/uipath-typescript/entities';
import type { ProcessedSnapshot, UtilisationRisk } from './types';
/**
 * Find the latest completed LicenseSnapshotRun
 */
export function getLatestCompletedRun(runs: EntityRecord[]): EntityRecord | null {
  const completed = runs.filter(r => r.status === 'Completed');
  if (completed.length === 0) return null;
  // Sort by snapshotTimestamp desc, fallback to snapshotMonth desc
  completed.sort((a, b) => {
    if (a.snapshotTimestamp && b.snapshotTimestamp) {
      return new Date(b.snapshotTimestamp).getTime() - new Date(a.snapshotTimestamp).getTime();
    }
    if (a.snapshotMonth && b.snapshotMonth) {
      return b.snapshotMonth.localeCompare(a.snapshotMonth);
    }
    return 0;
  });
  return completed[0];
}
/**
 * Calculate utilisation risk band
 */
export function calculateUtilisationRisk(
  licensedQuantity: number | null,
  usageValue: number | null,
  utilisationPercentage: number | null,
  hasMappedMetric: boolean
): UtilisationRisk {
  if (!hasMappedMetric) return 'Not mapped';
  if (!licensedQuantity || licensedQuantity <= 0) return 'No licence quantity';
  if (!usageValue || usageValue <= 0) return 'No usage';
  if (utilisationPercentage === null) return 'No usage';
  if (utilisationPercentage > 100) return 'Over-utilised';
  if (utilisationPercentage >= 75) return 'Healthy utilisation';
  if (utilisationPercentage >= 25) return 'Moderate utilisation';
  if (utilisationPercentage > 0) return 'Low utilisation';
  return 'No usage';
}
/**
 * Process snapshot data with metric mappings and account joins
 */
export function processSnapshotData(
  snapshots: EntityRecord[],
  metricMaps: EntityRecord[],
  accounts: EntityRecord[]
): ProcessedSnapshot[] {
  const activeMetricMaps = metricMaps.filter(m => m.isActive === true);
  const accountMap = new Map(accounts.map(a => [a.subsidiaryId, a]));
  return snapshots.map(snapshot => {
    const account = accountMap.get(snapshot.subsidiaryId);
    const metricMap = activeMetricMaps.find(m => m.licensedProduct === snapshot.licensedProduct);    
    let licensedQuantity: number | null = null;
    let usageValue: number | null = null;
    let utilisationPercentage: number | null = null;
    if (metricMap) {
      // Extract licensed quantity using licensedQuantityMetric field name
      const licensedQtyFieldName = metricMap.licensedQuantityMetric || 'licensedProductQty';
      licensedQuantity = (typeof snapshot[licensedQtyFieldName] === 'number' ? snapshot[licensedQtyFieldName] : null);
      // Extract usage value using primaryUsageMetric field name
      const usageFieldName = metricMap.primaryUsageMetric;
      if (usageFieldName) {
        usageValue = (typeof snapshot[usageFieldName] === 'number' ? snapshot[usageFieldName] : null);
      }
      // Calculate utilisation percentage
      if (licensedQuantity && licensedQuantity > 0 && usageValue !== null) {
        utilisationPercentage = (usageValue / licensedQuantity) * 100;
      }
    }
    const utilisationRisk = calculateUtilisationRisk(
      licensedQuantity,
      usageValue,
      utilisationPercentage,
      !!metricMap
    );
    return {
      snapshotRunKey: snapshot.snapshotRunKey,
      subsidiaryId: snapshot.subsidiaryId,
      subsidiaryName: snapshot.subsidiaryName || account?.subsidiaryName || null,
      licensedProduct: snapshot.licensedProduct,
      snapshotMonth: snapshot.snapshotMonth,
      licenseStartDate: snapshot.licenseStartDate || null,
      licenseEndDate: snapshot.licenseEndDate || null,
      licensedProductQty: snapshot.licensedProductQty ?? null,
      region: account?.region || null,
      accountDirector: account?.accountDirector || null,
      tam: account?.tam || null,
      csm: account?.csm || null,
      isActive: account?.isActive ?? false,
      displayName: metricMap?.displayName || null,
      primaryUsageMetric: metricMap?.primaryUsageMetric || null,
      licensedQuantityMetric: metricMap?.licensedQuantityMetric || null,
      displayUnit: metricMap?.displayUnit || null,
      sortOrder: metricMap?.sortOrder ?? null,
      licensedQuantity,
      usageValue,
      utilisationPercentage,
      utilisationRisk,
    };
  });
}