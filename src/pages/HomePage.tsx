import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Entities } from '@uipath/uipath-typescript/entities';
import { LoginScreen } from '@/components/LoginScreen';
import type { EntityRecord } from '@uipath/uipath-typescript/entities';
import { AppLayout } from '@/components/layout/AppLayout';
import { KpiCard } from '@/components/KpiCard';
import { GlobalFilters } from '@/components/GlobalFilters';
import { UtilisationChart } from '@/components/UtilisationChart';
import { AccountsTable } from '@/components/AccountsTable';
import { ExpiryWarningsTable } from '@/components/ExpiryWarningsTable';
import { UnmappedProductsWarning } from '@/components/UnmappedProductsWarning';
import { processSnapshotData, getLatestCompletedRun } from '@/lib/dataProcessing';
import type { ProcessedSnapshot, GlobalFilterState } from '@/lib/types';
import { AlertCircle, TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
export function HomePage() {
  const { sdk, isAuthenticated } = useAuth();
  const entities = useMemo(() => sdk ? new Entities(sdk) : null, [sdk]);
  const [latestRun, setLatestRun] = useState<EntityRecord | null>(null);
  const [snapshots, setSnapshots] = useState<EntityRecord[]>([]);
  const [metricMaps, setMetricMaps] = useState<EntityRecord[]>([]);
  const [accounts, setAccounts] = useState<EntityRecord[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GlobalFilterState>({
    snapshotMonth: null,
    licensedProduct: null,
    accountDirector: null,
    tam: null,
    csm: null,
    subsidiaryName: null,
    region: null,
    utilisationRisk: null,
  });
  // Fetch all data on mount
  useEffect(() => {
    if (!entities || !isAuthenticated) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [runsResult, metricMapsResult, accountsResult] = await Promise.all([
          entities.getAllRecords('LicenseSnapshotRun'),
          entities.getAllRecords('LicenseMetricMap'),
          entities.getAllRecords('LicenseAccount'),
        ]);
        const runs = 'items' in runsResult ? runsResult.items : runsResult;
        const maps = 'items' in metricMapsResult ? metricMapsResult.items : metricMapsResult;
        const accts = 'items' in accountsResult ? accountsResult.items : accountsResult;
        // Find latest completed run
        const completedRun = getLatestCompletedRun(runs);
        if (!completedRun) {
          setError('No completed import run available yet. Please wait for the first import to complete.');
          setIsLoading(false);
          return;
        }
        setLatestRun(completedRun);
        setMetricMaps(maps);
        setAccounts(accts);
        // Fetch snapshots for this run
        const snapshotsResult = await entities.getAllRecords('AccountLicenseConsumptionSnapshot', {
          filter: `snapshotRunKey eq '${completedRun.snapshotRunKey}'`,
        });
        const snaps = 'items' in snapshotsResult ? snapshotsResult.items : snapshotsResult;
        setSnapshots(snaps);
        // Process data with metric mappings
        const processed = processSnapshotData(snaps, maps, accts);
        setProcessedData(processed);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        setIsLoading(false);
      }
    };
    loadData();
  }, [entities, isAuthenticated]);
  // Apply filters
  const filteredData = useMemo(() => {
    let data = processedData;
    if (filters.snapshotMonth) {
      data = data.filter(d => d.snapshotMonth === filters.snapshotMonth);
    }
    if (filters.licensedProduct) {
      data = data.filter(d => d.licensedProduct === filters.licensedProduct);
    }
    if (filters.accountDirector) {
      data = data.filter(d => d.accountDirector === filters.accountDirector);
    }
    if (filters.tam) {
      data = data.filter(d => d.tam === filters.tam);
    }
    if (filters.csm) {
      data = data.filter(d => d.csm === filters.csm);
    }
    if (filters.subsidiaryName) {
      data = data.filter(d => d.subsidiaryName?.toLowerCase().includes(filters.subsidiaryName!.toLowerCase()));
    }
    if (filters.region) {
      data = data.filter(d => d.region === filters.region);
    }
    if (filters.utilisationRisk) {
      data = data.filter(d => d.utilisationRisk === filters.utilisationRisk);
    }
    return data;
  }, [processedData, filters]);
  // Calculate KPIs
  const kpis = useMemo(() => {
    const uniqueAccounts = new Set(filteredData.map(d => d.subsidiaryId)).size;
    const activeAccounts = new Set(
      filteredData.filter(d => d.isActive).map(d => d.subsidiaryId)
    ).size;
    const totalLicensed = filteredData.reduce((sum, d) => sum + (d.licensedQuantity || 0), 0);
    const totalUsage = filteredData.reduce((sum, d) => sum + (d.usageValue || 0), 0);
    const avgUtilisation = totalLicensed > 0 ? (totalUsage / totalLicensed) * 100 : 0;
    const now = new Date();
    const expiringLicences = filteredData.filter(d => {
      if (!d.licenseEndDate) return false;
      const endDate = new Date(d.licenseEndDate);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
    }).length;
    const lowUtilAccounts = new Set(
      filteredData
        .filter(d => d.utilisationRisk === 'Low utilisation')
        .map(d => d.subsidiaryId)
    ).size;
    const overUtilAccounts = new Set(
      filteredData
        .filter(d => d.utilisationRisk === 'Over-utilised')
        .map(d => d.subsidiaryId)
    ).size;
    const unmappedProducts = new Set(
      filteredData
        .filter(d => d.utilisationRisk === 'Not mapped')
        .map(d => d.licensedProduct)
    ).size;
    return {
      uniqueAccounts,
      activeAccounts,
      totalLicensed,
      totalUsage,
      avgUtilisation,
      expiringLicences,
      lowUtilAccounts,
      overUtilAccounts,
      unmappedProducts,
    };
  }, [filteredData]);
  // Top under-utilised accounts
  const underUtilised = useMemo(() => {
    const accountMap = new Map<number, { name: string; utilisation: number; licensed: number; usage: number }>();
    filteredData
      .filter(d => d.utilisationPercentage !== null && d.utilisationPercentage > 0 && d.utilisationPercentage < 25)
      .forEach(d => {
        const existing = accountMap.get(d.subsidiaryId);
        if (!existing) {
          accountMap.set(d.subsidiaryId, {
            name: d.subsidiaryName || `Account ${d.subsidiaryId}`,
            utilisation: d.utilisationPercentage!,
            licensed: d.licensedQuantity || 0,
            usage: d.usageValue || 0,
          });
        } else {
          existing.licensed += d.licensedQuantity || 0;
          existing.usage += d.usageValue || 0;
          existing.utilisation = existing.licensed > 0 ? (existing.usage / existing.licensed) * 100 : 0;
        }
      });
    return Array.from(accountMap.entries())
      .map(([id, data]) => ({ subsidiaryId: id, ...data }))
      .sort((a, b) => a.utilisation - b.utilisation)
      .slice(0, 10);
  }, [filteredData]);
  // Top over-utilised accounts
  const overUtilised = useMemo(() => {
    const accountMap = new Map<number, { name: string; utilisation: number; licensed: number; usage: number }>();
    filteredData
      .filter(d => d.utilisationPercentage !== null && d.utilisationPercentage > 100)
      .forEach(d => {
        const existing = accountMap.get(d.subsidiaryId);
        if (!existing) {
          accountMap.set(d.subsidiaryId, {
            name: d.subsidiaryName || `Account ${d.subsidiaryId}`,
            utilisation: d.utilisationPercentage!,
            licensed: d.licensedQuantity || 0,
            usage: d.usageValue || 0,
          });
        } else {
          existing.licensed += d.licensedQuantity || 0;
          existing.usage += d.usageValue || 0;
          existing.utilisation = existing.licensed > 0 ? (existing.usage / existing.licensed) * 100 : 0;
        }
      });
    return Array.from(accountMap.entries())
      .map(([id, data]) => ({ subsidiaryId: id, ...data }))
      .sort((a, b) => b.utilisation - a.utilisation)
      .slice(0, 10);
  }, [filteredData]);
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  if (isLoading) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  if (error) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">No Completed Import Run Available</h3>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Licence Utilisation Portal</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Latest snapshot: <span className="font-medium text-gray-900">{latestRun?.snapshotMonth || 'N/A'}</span></span>
                <span>•</span>
                <span>Import run: <span className="font-medium text-gray-900">{latestRun?.snapshotTimestamp ? format(new Date(latestRun.snapshotTimestamp), 'dd MMM yyyy HH:mm') : 'N/A'}</span></span>
                <span>•</span>
                <span>Source file: <span className="font-medium text-gray-900">{latestRun?.sourceFileName || 'N/A'}</span></span>
                <span>•</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  latestRun?.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  latestRun?.status === 'Failed' ? 'bg-red-100 text-red-700' :
                  latestRun?.status === 'Started' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{latestRun?.status || 'Unknown'}</span>
              </div>
            </div>
            <GlobalFilters filters={filters} onFiltersChange={setFilters} data={processedData} />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Accounts"
            value={kpis.uniqueAccounts}
            icon={<Users className="w-5 h-5 text-blue-600" />}
          />
          <KpiCard
            label="Active Accounts"
            value={kpis.activeAccounts}
            icon={<Users className="w-5 h-5 text-green-600" />}
          />
          <KpiCard
            label="Total Licensed Quantity"
            value={Math.round(kpis.totalLicensed).toLocaleString()}
          />
          <KpiCard
            label="Total Consumed Units"
            value={Math.round(kpis.totalUsage).toLocaleString()}
          />
          <KpiCard
            label="Average Utilisation"
            value={`${kpis.avgUtilisation.toFixed(1)}%`}
            icon={kpis.avgUtilisation >= 75 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
          />
          <KpiCard
            label="Expiring Licences"
            value={kpis.expiringLicences}
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          />
          <KpiCard
            label="Low-Utilisation Accounts"
            value={kpis.lowUtilAccounts}
            icon={<TrendingDown className="w-5 h-5 text-yellow-600" />}
          />
          <KpiCard
            label="Over-Utilised Accounts"
            value={kpis.overUtilAccounts}
            icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          />
        </div>
        {/* Unmapped Products Warning */}
        {kpis.unmappedProducts > 0 && (
          <UnmappedProductsWarning count={kpis.unmappedProducts} data={filteredData} />
        )}
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UtilisationChart data={filteredData} type="trend" />
          <UtilisationChart data={filteredData} type="byProduct" />
        </div>
        {/* Tables */}
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Top Under-Utilised Accounts</h3>
            <AccountsTable data={underUtilised} type="underUtilised" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Top Over-Utilised Accounts</h3>
            <AccountsTable data={overUtilised} type="overUtilised" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Licence Expiry Warnings</h3>
            <ExpiryWarningsTable data={filteredData} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}