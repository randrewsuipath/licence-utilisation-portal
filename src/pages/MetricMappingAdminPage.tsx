import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Entities } from '@uipath/uipath-typescript/entities';
import type { EntityRecord } from '@uipath/uipath-typescript/entities';
import { AppLayout } from '@/components/layout/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Save, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
const USAGE_METRICS = [
  'monthlyExecutedHours',
  'monthlyExecutedHoursTestRobot',
  'robotUnitsConsumed',
  'aiUnitsConsumed',
  'agenticUnitsConsumed',
  'platformUnitsConsumed',
  'duUnitsConsumed',
];
const LICENSED_QUANTITY_METRICS = ['licensedProductQty'];
interface EditableMapping extends EntityRecord {
  isNew?: boolean;
  isEdited?: boolean;
}
export function MetricMappingAdminPage() {
  const { sdk, isAuthenticated } = useAuth();
  const entities = useMemo(() => sdk ? new Entities(sdk) : null, [sdk]);
  const [mappings, setMappings] = useState<EditableMapping[]>([]);
  const [unmappedProducts, setUnmappedProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (!entities || !isAuthenticated) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [mappingsResult, snapshotsResult] = await Promise.all([
          entities.getAllRecords('LicenseMetricMap'),
          entities.getAllRecords('AccountLicenseConsumptionSnapshot'),
        ]);
        const maps = 'items' in mappingsResult ? mappingsResult.items : mappingsResult;
        const snaps = 'items' in snapshotsResult ? snapshotsResult.items : snapshotsResult;
        const sorted = maps.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
        setMappings(sorted);
        const activeMappedProducts = new Set(
          maps.filter(m => m.isActive === true).map(m => m.licensedProduct)
        );
        const allProducts = Array.from(new Set(snaps.map(s => s.licensedProduct)));
        const unmapped = allProducts.filter(p => !activeMappedProducts.has(p)).sort();
        setUnmappedProducts(unmapped);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading metric mappings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metric mappings');
        setIsLoading(false);
      }
    };
    loadData();
  }, [entities, isAuthenticated]);
  const addNewMapping = () => {
    const newMapping: EditableMapping = {
      id: `new-${Date.now()}`,
      licensedProduct: '',
      displayName: '',
      primaryUsageMetric: '',
      licensedQuantityMetric: 'licensedProductQty',
      displayUnit: '',
      utilisationFormula: '',
      graphType: '',
      sortOrder: mappings.length + 1,
      isActive: true,
      notes: '',
      isNew: true,
    };
    setMappings([...mappings, newMapping]);
  };
  const updateMapping = (id: string | number, field: string, value: any) => {
    setMappings(prev =>
      prev.map(m =>
        m.id === id ? { ...m, [field]: value, isEdited: !m.isNew } : m
      )
    );
  };
  const deleteMapping = (id: string | number) => {
    setMappings(prev => prev.filter(m => m.id !== id));
  };
  const saveChanges = async () => {
    if (!entities) return;
    try {
      setIsSaving(true);
      const newMappings = mappings.filter(m => m.isNew);
      const editedMappings = mappings.filter(m => m.isEdited && !m.isNew);
      for (const mapping of newMappings) {
        const { id, isNew, isEdited, ...data } = mapping;
        await entities.insertRecordById('LicenseMetricMap', data);
      }
      for (const mapping of editedMappings) {
        const { isNew, isEdited, ...data } = mapping;
        await entities.updateRecordsById('LicenseMetricMap', [data]);
      }
      toast.success('Metric mappings saved successfully');
      const mappingsResult = await entities.getAllRecords('LicenseMetricMap');
      const maps = 'items' in mappingsResult ? mappingsResult.items : mappingsResult;
      const sorted = maps.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      setMappings(sorted);
      setIsSaving(false);
    } catch (err) {
      console.error('Error saving metric mappings:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save metric mappings');
      setIsSaving(false);
    }
  };
  const hasChanges = useMemo(() => {
    return mappings.some(m => m.isNew || m.isEdited);
  }, [mappings]);
  if (!isAuthenticated) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-600">Please log in to manage metric mappings.</p>
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
            <p className="text-gray-600">Loading metric mappings...</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Error Loading Metric Mappings</h3>
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
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Metric Mapping Admin</h1>
            <p className="text-sm text-gray-600">Configure product display names, usage metrics, and utilisation formulas</p>
          </div>
          {unmappedProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 mb-1">
                    {unmappedProducts.length} {unmappedProducts.length === 1 ? 'Product' : 'Products'} Without Active Mappings
                  </h4>
                  <p className="text-sm text-amber-700 mb-2">
                    The following products exist in snapshot data but do not have active metric mappings:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unmappedProducts.map(product => (
                      <span
                        key={product}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white border border-amber-300 text-amber-800 rounded"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button onClick={addNewMapping} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Mapping
              </Button>
              {hasChanges && (
                <Button onClick={saveChanges} disabled={isSaving} size="sm" variant="default">
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
            {hasChanges && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Unsaved changes
              </Badge>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Licensed Product</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Display Name</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Primary Usage Metric</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Licensed Qty Metric</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Display Unit</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Sort Order</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Active</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-sm text-gray-500">No metric mappings configured</TableCell>
                  </TableRow>
                ) : (
                  mappings.map(mapping => (
                    <TableRow
                      key={mapping.id}
                      className={`hover:bg-gray-50 ${!mapping.isActive ? 'opacity-60' : ''} ${mapping.isNew || mapping.isEdited ? 'bg-blue-50' : ''}`}
                    >
                      <TableCell>
                        <Input
                          value={mapping.licensedProduct || ''}
                          onChange={(e) => updateMapping(mapping.id, 'licensedProduct', e.target.value)}
                          className="text-sm"
                          placeholder="Product ID"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={mapping.displayName || ''}
                          onChange={(e) => updateMapping(mapping.id, 'displayName', e.target.value)}
                          className="text-sm"
                          placeholder="Display name"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.primaryUsageMetric || ''}
                          onValueChange={(val) => updateMapping(mapping.id, 'primaryUsageMetric', val)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            {USAGE_METRICS.map(metric => (
                              <SelectItem key={metric} value={metric}>{metric}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.licensedQuantityMetric || 'licensedProductQty'}
                          onValueChange={(val) => updateMapping(mapping.id, 'licensedQuantityMetric', val)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LICENSED_QUANTITY_METRICS.map(metric => (
                              <SelectItem key={metric} value={metric}>{metric}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={mapping.displayUnit || ''}
                          onChange={(e) => updateMapping(mapping.id, 'displayUnit', e.target.value)}
                          className="text-sm"
                          placeholder="hours, units, etc."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={mapping.sortOrder || ''}
                          onChange={(e) => updateMapping(mapping.id, 'sortOrder', parseInt(e.target.value) || 0)}
                          className="text-sm w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={mapping.isActive === true}
                          onChange={(e) => updateMapping(mapping.id, 'isActive', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMapping(mapping.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
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