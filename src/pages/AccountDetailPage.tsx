import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginScreen } from '@/components/LoginScreen';
import { Entities } from '@uipath/uipath-typescript/entities';
import type { EntityRecord } from '@uipath/uipath-typescript/entities';
import { AppLayout } from '@/components/layout/AppLayout';
import { KpiCard } from '@/components/KpiCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { processSnapshotData } from '@/lib/dataProcessing';
import type { ProcessedSnapshot, UtilisationRisk } from '@/lib/types';
import { ArrowLeft, AlertCircle, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export function AccountDetailPage() {
  const { subsidiaryId } = useParams<{ subsidiaryId: string }>();
  const navigate = useNavigate();
  const { sdk, isAuthenticated } = useAuth();
  const entities = useMemo(() => sdk ? new Entities(sdk) : null, [sdk]);
  const [account, setAccount] = useState<EntityRecord | null>(null);
  const [snapshots, setSnapshots] = useState<ProcessedSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!entities || !isAuthenticated || !subsidiaryId) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [accountsResult, snapshotsResult, metricMapsResult] = await Promise.all([
          entities.getAllRecords('LicenseAccount', { filter: `subsidiaryId eq ${subsidiaryId}` }),
          entities.getAllRecords('AccountLicenseConsumptionSnapshot', { filter: `subsidiaryId eq ${subsidiaryId}` }),
          entities.getAllRecords('LicenseMetricMap'),
        ]);
        const accts = 'items' in accountsResult ? accountsResult.items : accountsResult;
        const snaps = 'items' in snapshotsResult ? snapshotsResult.items : snapshotsResult;
        const maps = 'items' in metricMapsResult ? metricMapsResult.items : metricMapsResult;
        if (accts.length === 0) {
          setError('Account not found');
          setIsLoading(false);
          return;
        }
        if (snaps.length === 0) {
          setError('No snapshot data available for this account');
          setIsLoading(false);
          return;
        }
        setAccount(accts[0]);
        const processed = processSnapshotData(snaps, maps, accts);
        setSnapshots(processed);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading account detail:', err);
        setError(err instanceof Error ? err.message : 'Failed to load account detail');
        setIsLoading(false);
      }
    };
    loadData();
  }, [entities, isAuthenticated, subsidiaryId]);
  const kpis = useMemo(() => {
    const totalLicensed = snapshots.reduce((sum, s) => sum + (s.licensedQuantity || 0), 0);
    const totalUsage = snapshots.reduce((sum, s) => sum + (s.usageValue || 0), 0);
    const avgUtilisation = totalLicensed > 0 ? (totalUsage / totalLicensed) * 100 : 0;
    const productCount = new Set(snapshots.map(s => s.licensedProduct)).size;
    const now = new Date();
    const expiringLicences = snapshots.filter(s => {
      if (!s.licenseEndDate) return false;
      const endDate = new Date(s.licenseEndDate);
      const days = differenceInDays(endDate, now);
      return days >= 0 && days <= 90;
    }).length;
    const lowUtilProducts = snapshots.filter(s => s.utilisationRisk === 'Low utilisation').length;
    const overUtilProducts = snapshots.filter(s => s.utilisationRisk === 'Over-utilised').length;
    return { totalLicensed, totalUsage, avgUtilisation, productCount, expiringLicences, lowUtilProducts, overUtilProducts };
  }, [snapshots]);
  const latestSnapshots = useMemo(() => {
    const months = Array.from(new Set(snapshots.map(s => s.snapshotMonth))).sort().reverse();
    const latestMonth = months[0];
    return snapshots.filter(s => s.snapshotMonth === latestMonth);
  }, [snapshots]);
  const trendData = useMemo(() => {
    const monthMap = new Map<string, Map<string, { licensed: number; usage: number }>>();
    snapshots.forEach(s => {
      if (!monthMap.has(s.snapshotMonth)) {
        monthMap.set(s.snapshotMonth, new Map());
      }
      const productMap = monthMap.get(s.snapshotMonth)!;
      const existing = productMap.get(s.licensedProduct);
      if (existing) {
        existing.licensed += s.licensedQuantity || 0;
        existing.usage += s.usageValue || 0;
      } else {
        productMap.set(s.licensedProduct, { licensed: s.licensedQuantity || 0, usage: s.usageValue || 0 });
      }
    });
    const products = Array.from(new Set(snapshots.map(s => s.displayName || s.licensedProduct)));
    return Array.from(monthMap.entries())
      .map(([month, productMap]) => {
        const row: any = { month };
        products.forEach(product => {
          const data = Array.from(productMap.values()).reduce(
            (acc, val) => ({ licensed: acc.licensed + val.licensed, usage: acc.usage + val.usage }),
            { licensed: 0, usage: 0 }
          );
          row[product] = data.licensed > 0 ? (data.usage / data.licensed) * 100 : 0;
        });
        return row;
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [snapshots]);
  const expiryList = useMemo(() => {
    const now = new Date();
    return latestSnapshots
      .filter(s => s.licenseEndDate)
      .map(s => ({
        ...s,
        endDate: new Date(s.licenseEndDate!),
        daysUntilExpiry: differenceInDays(new Date(s.licenseEndDate!), now),
      }))
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [latestSnapshots]);
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
            <p className="text-gray-600">Loading account details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  if (error || !account) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">Error Loading Account</h3>
            <p className="text-sm text-gray-600">{error || 'Account not found'}</p>
            <Button onClick={() => navigate('/accounts')}>Back to Accounts</Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <Button variant="ghost" onClick={() => navigate('/accounts')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Accounts
          </Button>
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{account.subsidiaryName || `Account ${account.subsidiaryId}`}</h1>
                <p className="text-sm text-gray-500 mt-1">Subsidiary ID: {account.subsidiaryId}</p>
              </div>
              {account.isActive && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Region:</span>
                <span className="ml-2 text-gray-900 font-medium">{account.region || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">Account Director:</span>
                <span className="ml-2 text-gray-900 font-medium">{account.accountDirector || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">TAM:</span>
                <span className="ml-2 text-gray-900 font-medium">{account.tam || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500">CSM:</span>
                <span className="ml-2 text-gray-900 font-medium">{account.csm || '—'}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Total Licensed Quantity" value={Math.round(kpis.totalLicensed).toLocaleString()} />
            <KpiCard label="Total Usage" value={Math.round(kpis.totalUsage).toLocaleString()} />
            <KpiCard
              label="Average Utilisation"
              value={`${kpis.avgUtilisation.toFixed(1)}%`}
              icon={kpis.avgUtilisation >= 75 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
            />
            <KpiCard label="Licensed Products" value={kpis.productCount} icon={<Package className="w-5 h-5 text-blue-600" />} />
          </div>
          <Tabs defaultValue="products" className="space-y-6">
            <TabsList>
              <TabsTrigger value="products">Product Utilisation</TabsTrigger>
              <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
              <TabsTrigger value="expiry">Licence Expiry</TabsTrigger>
              <TabsTrigger value="audit">Raw Data</TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">Product</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Licensed Qty</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Usage</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">Unit</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Utilisation %</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">Risk</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">Start Date</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">End Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {latestSnapshots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-sm text-gray-500">No product data available</TableCell>
                      </TableRow>
                    ) : (
                      latestSnapshots.map((s, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50">
                          <TableCell className="text-sm font-medium text-gray-900">{s.displayName || s.licensedProduct}</TableCell>
                          <TableCell className="text-sm text-gray-700 text-right">{s.licensedQuantity ? Math.round(s.licensedQuantity).toLocaleString() : '—'}</TableCell>
                          <TableCell className="text-sm text-gray-700 text-right">{s.usageValue ? Math.round(s.usageValue).toLocaleString() : '—'}</TableCell>
                          <TableCell className="text-sm text-gray-700">{s.displayUnit || '—'}</TableCell>
                          <TableCell className="text-sm text-gray-700 text-right">{s.utilisationPercentage !== null ? `${s.utilisationPercentage.toFixed(1)}%` : '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${getRiskBadgeClass(s.utilisationRisk)}`}>{s.utilisationRisk}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">{s.licenseStartDate ? format(new Date(s.licenseStartDate), 'dd MMM yyyy') : '—'}</TableCell>
                          <TableCell className="text-sm text-gray-700">{s.licenseEndDate ? format(new Date(s.licenseEndDate), 'dd MMM yyyy') : '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="trends">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Utilisation Trend by Month</h3>
                {trendData.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-sm text-gray-500">No trend data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {Array.from(new Set(snapshots.map(s => s.displayName || s.licensedProduct))).map((product, idx) => (
                        <Line key={product} type="monotone" dataKey={product} stroke={['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea'][idx % 5]} strokeWidth={2} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
            <TabsContent value="expiry">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">Product</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Licensed Qty</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">Start Date</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">End Date</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">Days Until Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiryList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-sm text-gray-500">No licence expiry data available</TableCell>
                      </TableRow>
                    ) : (
                      expiryList.map((s, idx) => (
                        <TableRow key={idx} className={`hover:bg-gray-50 ${s.daysUntilExpiry < 0 || s.daysUntilExpiry <= 30 ? 'bg-red-50' : ''}`}>
                          <TableCell className="text-sm font-medium text-gray-900">{s.displayName || s.licensedProduct}</TableCell>
                          <TableCell className="text-sm text-gray-700 text-right">{s.licensedQuantity ? Math.round(s.licensedQuantity).toLocaleString() : '—'}</TableCell>
                          <TableCell className="text-sm text-gray-700">{s.licenseStartDate ? format(new Date(s.licenseStartDate), 'dd MMM yyyy') : '—'}</TableCell>
                          <TableCell className="text-sm text-gray-700">{format(s.endDate, 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${
                              s.daysUntilExpiry < 0 ? 'bg-red-100 text-red-800 border-red-300' :
                              s.daysUntilExpiry <= 30 ? 'bg-red-50 text-red-700 border-red-200' :
                              s.daysUntilExpiry <= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                              {s.daysUntilExpiry < 0 ? `Expired ${Math.abs(s.daysUntilExpiry)} days ago` : `${s.daysUntilExpiry} days`}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="audit">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">Snapshot Month</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">Product</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Licensed Qty</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Usage</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500 uppercase">Snapshot Run Key</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-sm text-gray-500">No audit data available</TableCell>
                      </TableRow>
                    ) : (
                      snapshots.map((s, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50">
                          <TableCell className="text-sm text-gray-700">{s.snapshotMonth}</TableCell>
                          <TableCell className="text-sm font-medium text-gray-900">{s.displayName || s.licensedProduct}</TableCell>
                          <TableCell className="text-sm text-gray-700 text-right">{s.licensedQuantity ? Math.round(s.licensedQuantity).toLocaleString() : '—'}</TableCell>
                          <TableCell className="text-sm text-gray-700 text-right">{s.usageValue ? Math.round(s.usageValue).toLocaleString() : '—'}</TableCell>
                          <TableCell className="text-sm text-gray-500 font-mono text-xs">{s.snapshotRunKey}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}