import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LoginScreen } from '@/components/LoginScreen';
import { Entities } from '@uipath/uipath-typescript/entities';
import type { EntityRecord } from '@uipath/uipath-typescript/entities';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { processSnapshotData, getLatestCompletedRun } from '@/lib/dataProcessing';
import type { ProcessedSnapshot, UtilisationRisk } from '@/lib/types';
import { Search, AlertCircle } from 'lucide-react';
interface AccountSummary {
  subsidiaryId: number;
  subsidiaryName: string | null;
  region: string | null;
  accountDirector: string | null;
  tam: string | null;
  csm: string | null;
  isActive: boolean;
  firstSeenSnapshotMonth: string;
  lastSeenSnapshotMonth: string;
  totalLicensed: number;
  totalUsage: number;
  avgUtilisation: number;
  utilisationRisk: UtilisationRisk;
  productCount: number;
  nextExpiryDate: string | null;
}
export function AccountsPage() {
  const { sdk, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const entities = useMemo(() => sdk ? new Entities(sdk) : null, [sdk]);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [filterAccountDirector, setFilterAccountDirector] = useState<string>('');
  const [filterTam, setFilterTam] = useState<string>('');
  const [filterCsm, setFilterCsm] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('');
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
        const completedRun = getLatestCompletedRun(runs);
        if (!completedRun) {
          setError('No completed import run available yet.');
          setIsLoading(false);
          return;
        }
        const snapshotsResult = await entities.getAllRecords('AccountLicenseConsumptionSnapshot', {
          filter: `snapshotRunKey eq '${completedRun.snapshotRunKey}'`,
        });
        const snaps = 'items' in snapshotsResult ? snapshotsResult.items : snapshotsResult;
        const processed = processSnapshotData(snaps, maps, accts);
        const accountMap = new Map<number, AccountSummary>();
        processed.forEach(d => {
          const existing = accountMap.get(d.subsidiaryId);
          if (!existing) {
            accountMap.set(d.subsidiaryId, {
              subsidiaryId: d.subsidiaryId,
              subsidiaryName: d.subsidiaryName,
              region: d.region,
              accountDirector: d.accountDirector,
              tam: d.tam,
              csm: d.csm,
              isActive: d.isActive,
              firstSeenSnapshotMonth: d.snapshotMonth,
              lastSeenSnapshotMonth: d.snapshotMonth,
              totalLicensed: d.licensedQuantity || 0,
              totalUsage: d.usageValue || 0,
              avgUtilisation: d.utilisationPercentage || 0,
              utilisationRisk: d.utilisationRisk,
              productCount: 1,
              nextExpiryDate: d.licenseEndDate,
            });
          } else {
            existing.totalLicensed += d.licensedQuantity || 0;
            existing.totalUsage += d.usageValue || 0;
            existing.productCount += 1;
            if (d.snapshotMonth < existing.firstSeenSnapshotMonth) {
              existing.firstSeenSnapshotMonth = d.snapshotMonth;
            }
            if (d.snapshotMonth > existing.lastSeenSnapshotMonth) {
              existing.lastSeenSnapshotMonth = d.snapshotMonth;
            }
            if (d.licenseEndDate && (!existing.nextExpiryDate || d.licenseEndDate < existing.nextExpiryDate)) {
              existing.nextExpiryDate = d.licenseEndDate;
            }
          }
        });
        accountMap.forEach(acc => {
          acc.avgUtilisation = acc.totalLicensed > 0 ? (acc.totalUsage / acc.totalLicensed) * 100 : 0;
        });
        setAccounts(Array.from(accountMap.values()));
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading accounts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
        setIsLoading(false);
      }
    };
    loadData();
  }, [entities, isAuthenticated]);
  const uniqueValues = useMemo(() => {
    return {
      regions: Array.from(new Set(accounts.map(a => a.region).filter(Boolean))).sort(),
      accountDirectors: Array.from(new Set(accounts.map(a => a.accountDirector).filter(Boolean))).sort(),
      tams: Array.from(new Set(accounts.map(a => a.tam).filter(Boolean))).sort(),
      csms: Array.from(new Set(accounts.map(a => a.csm).filter(Boolean))).sort(),
      risks: Array.from(new Set(accounts.map(a => a.utilisationRisk))),
    };
  }, [accounts]);
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (searchTerm && !acc.subsidiaryName?.toLowerCase().includes(searchTerm.toLowerCase()) && !acc.subsidiaryId.toString().includes(searchTerm)) {
        return false;
      }
      if (filterRegion && acc.region !== filterRegion) return false;
      if (filterAccountDirector && acc.accountDirector !== filterAccountDirector) return false;
      if (filterTam && acc.tam !== filterTam) return false;
      if (filterCsm && acc.csm !== filterCsm) return false;
      if (filterActive === 'active' && !acc.isActive) return false;
      if (filterActive === 'inactive' && acc.isActive) return false;
      if (filterRisk && acc.utilisationRisk !== filterRisk) return false;
      return true;
    });
  }, [accounts, searchTerm, filterRegion, filterAccountDirector, filterTam, filterCsm, filterActive, filterRisk]);
  const getRiskBadgeClass = (risk: UtilisationRisk) => {
    switch (risk) {
      case 'Healthy utilisation': return 'bg-green-50 text-green-700 border-green-200';
      case 'Moderate utilisation': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Low utilisation': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Over-utilised': return 'bg-red-50 text-red-700 border-red-200';
      case 'No usage': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'No licence quantity': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'Not mapped': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  if (isLoading) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Loading accounts...</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Error Loading Accounts</h3>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Accounts</h1>
            <p className="text-sm text-gray-600">Browse and search all accounts with licence utilisation data</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All regions</SelectItem>
                  {uniqueValues.regions.map(r => <SelectItem key={r} value={r!}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterAccountDirector} onValueChange={setFilterAccountDirector}>
                <SelectTrigger>
                  <SelectValue placeholder="All directors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All directors</SelectItem>
                  {uniqueValues.accountDirectors.map(d => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterTam} onValueChange={setFilterTam}>
                <SelectTrigger>
                  <SelectValue placeholder="All TAMs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All TAMs</SelectItem>
                  {uniqueValues.tams.map(t => <SelectItem key={t} value={t!}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCsm} onValueChange={setFilterCsm}>
                <SelectTrigger>
                  <SelectValue placeholder="All CSMs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All CSMs</SelectItem>
                  {uniqueValues.csms.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger>
                  <SelectValue placeholder="All risk bands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All risk bands</SelectItem>
                  {uniqueValues.risks.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Account</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Region</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Account Director</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">TAM</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">CSM</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Licensed Qty</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Usage</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Utilisation %</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Risk</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-center">Products</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-sm text-gray-500">
                      No accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map(acc => (
                    <TableRow
                      key={acc.subsidiaryId}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/accounts/${acc.subsidiaryId}`)}
                    >
                      <TableCell className="text-sm font-medium text-gray-900">
                        {acc.subsidiaryName || `Account ${acc.subsidiaryId}`}
                        <span className="ml-2 text-xs text-gray-500">#{acc.subsidiaryId}</span>
                        {acc.isActive && (
                          <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{acc.region || '—'}</TableCell>
                      <TableCell className="text-sm text-gray-700">{acc.accountDirector || '—'}</TableCell>
                      <TableCell className="text-sm text-gray-700">{acc.tam || '—'}</TableCell>
                      <TableCell className="text-sm text-gray-700">{acc.csm || '—'}</TableCell>
                      <TableCell className="text-sm text-gray-700 text-right">{Math.round(acc.totalLicensed).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-gray-700 text-right">{Math.round(acc.totalUsage).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-gray-700 text-right">{acc.avgUtilisation.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getRiskBadgeClass(acc.utilisationRisk)}`}>
                          {acc.utilisationRisk}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 text-center">{acc.productCount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}