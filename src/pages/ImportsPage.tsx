import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Entities } from '@uipath/uipath-typescript/entities';
import type { EntityRecord } from '@uipath/uipath-typescript/entities';
import { AppLayout } from '@/components/layout/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { format } from 'date-fns';
export function ImportsPage() {
  const { sdk, isAuthenticated } = useAuth();
  const entities = useMemo(() => sdk ? new Entities(sdk) : null, [sdk]);
  const [runs, setRuns] = useState<EntityRecord[]>([]);
  const [expandedRunKey, setExpandedRunKey] = useState<string | null>(null);
  const [runSnapshots, setRunSnapshots] = useState<Record<string, EntityRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  useEffect(() => {
    if (!entities || !isAuthenticated) return;
    const loadRuns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const runsResult = await entities.getAllRecords('LicenseSnapshotRun');
        const runsData = 'items' in runsResult ? runsResult.items : runsResult;
        const sorted = runsData.sort((a, b) => {
          if (a.snapshotTimestamp && b.snapshotTimestamp) {
            return new Date(b.snapshotTimestamp).getTime() - new Date(a.snapshotTimestamp).getTime();
          }
          if (a.snapshotMonth && b.snapshotMonth) {
            return b.snapshotMonth.localeCompare(a.snapshotMonth);
          }
          return 0;
        });
        setRuns(sorted);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading import runs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load import runs');
        setIsLoading(false);
      }
    };
    loadRuns();
  }, [entities, isAuthenticated]);
  const toggleRunExpansion = async (runKey: string) => {
    if (expandedRunKey === runKey) {
      setExpandedRunKey(null);
      return;
    }
    setExpandedRunKey(runKey);
    if (!runSnapshots[runKey] && entities) {
      try {
        const snapshotsResult = await entities.getAllRecords('AccountLicenseConsumptionSnapshot', {
          filter: `snapshotRunKey eq '${runKey}'`,
        });
        const snaps = 'items' in snapshotsResult ? snapshotsResult.items : snapshotsResult;
        setRunSnapshots(prev => ({ ...prev, [runKey]: snaps }));
      } catch (err) {
        console.error('Error loading snapshots for run:', err);
      }
    }
  };
  const uniqueValues = useMemo(() => {
    return {
      statuses: Array.from(new Set(runs.map(r => r.status).filter(Boolean))).sort(),
      months: Array.from(new Set(runs.map(r => r.snapshotMonth).filter(Boolean))).sort().reverse(),
    };
  }, [runs]);
  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      if (filterStatus && run.status !== filterStatus) return false;
      if (filterMonth && run.snapshotMonth !== filterMonth) return false;
      return true;
    });
  }, [runs, filterStatus, filterMonth]);
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'Started': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'DuplicateSkipped': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  if (!isAuthenticated) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-600">Please log in to view import runs.</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  if (isLoading) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Loading import runs...</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Error Loading Import Runs</h3>
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
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Import Runs</h1>
            <p className="text-sm text-gray-600">Monitor import quality and audit snapshot data by run</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {uniqueValues.statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All months</SelectItem>
                  {uniqueValues.months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-medium text-gray-500 uppercase w-12"></TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Snapshot Month</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Timestamp</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Status</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Source File</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Source Rows</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Inserted</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Failed</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Skipped</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRuns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-sm text-gray-500">No import runs found</TableCell>
                  </TableRow>
                ) : (
                  filteredRuns.map(run => (
                    <React.Fragment key={run.snapshotRunKey}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRunExpansion(run.snapshotRunKey)}
                            className="h-6 w-6 p-0"
                          >
                            {expandedRunKey === run.snapshotRunKey ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">{run.snapshotMonth || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {run.snapshotTimestamp ? format(new Date(run.snapshotTimestamp), 'dd MMM yyyy HH:mm') : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(run.status)}`}>
                            {run.status || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{run.sourceFileName || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-700 text-right">{run.sourceRowCount?.toLocaleString() || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-700 text-right">{run.insertedRowCount?.toLocaleString() || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-700 text-right">
                          {run.failedRowCount ? (
                            <span className="text-red-600 font-medium">{run.failedRowCount.toLocaleString()}</span>
                          ) : '0'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 text-right">{run.skippedDuplicateRowCount?.toLocaleString() || '0'}</TableCell>
                      </TableRow>
                      {expandedRunKey === run.snapshotRunKey && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-gray-50 p-6">
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Import Quality Indicators</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500">Transformed:</span>
                                      <span className="ml-2 text-gray-900 font-medium">{run.transformedRowCount?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Inserted:</span>
                                      <span className="ml-2 text-gray-900 font-medium">{run.insertedRowCount?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Failed:</span>
                                      <span className="ml-2 text-red-600 font-medium">{run.failedRowCount?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Skipped:</span>
                                      <span className="ml-2 text-gray-900 font-medium">{run.skippedDuplicateRowCount?.toLocaleString() || '0'}</span>
                                    </div>
                                  </div>
                                  {run.errorSummary && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                                      <h5 className="text-xs font-semibold text-red-900 mb-1">Error Summary</h5>
                                      <p className="text-xs text-red-700">{run.errorSummary}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {runSnapshots[run.snapshotRunKey] && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Snapshot Records ({runSnapshots[run.snapshotRunKey].length})</h4>
                                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-gray-100">
                                          <TableHead className="text-xs font-medium text-gray-500 uppercase">Subsidiary ID</TableHead>
                                          <TableHead className="text-xs font-medium text-gray-500 uppercase">Product</TableHead>
                                          <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Licensed Qty</TableHead>
                                          <TableHead className="text-xs font-medium text-gray-500 uppercase">Start Date</TableHead>
                                          <TableHead className="text-xs font-medium text-gray-500 uppercase">End Date</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {runSnapshots[run.snapshotRunKey].slice(0, 10).map((snap, idx) => (
                                          <TableRow key={idx} className="hover:bg-gray-50">
                                            <TableCell className="text-sm text-gray-700">{snap.subsidiaryId}</TableCell>
                                            <TableCell className="text-sm text-gray-700">{snap.licensedProduct}</TableCell>
                                            <TableCell className="text-sm text-gray-700 text-right">{snap.licensedProductQty?.toLocaleString() || '—'}</TableCell>
                                            <TableCell className="text-sm text-gray-700">{snap.licenseStartDate ? format(new Date(snap.licenseStartDate), 'dd MMM yyyy') : '—'}</TableCell>
                                            <TableCell className="text-sm text-gray-700">{snap.licenseEndDate ? format(new Date(snap.licenseEndDate), 'dd MMM yyyy') : '—'}</TableCell>
                                          </TableRow>
                                        ))}
                                        {runSnapshots[run.snapshotRunKey].length > 10 && (
                                          <TableRow>
                                            <TableCell colSpan={5} className="text-center py-2 text-xs text-gray-500">
                                              Showing 10 of {runSnapshots[run.snapshotRunKey].length} records
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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