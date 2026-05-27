import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GlobalFilterState, ProcessedSnapshot } from '@/lib/types';
import { Filter, X } from 'lucide-react';
interface GlobalFiltersProps {
  filters: GlobalFilterState;
  onFiltersChange: (filters: GlobalFilterState) => void;
  data: ProcessedSnapshot[];
}
export function GlobalFilters({ filters, onFiltersChange, data }: GlobalFiltersProps) {
  const uniqueValues = useMemo(() => {
    return {
      snapshotMonths: Array.from(new Set(data.map(d => d.snapshotMonth))).sort().reverse(),
      licensedProducts: Array.from(new Set(data.map(d => d.licensedProduct))).sort(),
      accountDirectors: Array.from(new Set(data.map(d => d.accountDirector).filter(Boolean))).sort(),
      tams: Array.from(new Set(data.map(d => d.tam).filter(Boolean))).sort(),
      csms: Array.from(new Set(data.map(d => d.csm).filter(Boolean))).sort(),
      regions: Array.from(new Set(data.map(d => d.region).filter(Boolean))).sort(),
      utilisationRisks: Array.from(new Set(data.map(d => d.utilisationRisk))),
    };
  }, [data]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const clearFilters = () => {
    onFiltersChange({
      snapshotMonth: null,
      licensedProduct: null,
      accountDirector: null,
      tam: null,
      csm: null,
      subsidiaryName: null,
      region: null,
      utilisationRisk: null,
    });
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">Filters</h4>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs">
                <X className="w-3 h-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="snapshotMonth" className="text-xs text-gray-700">Snapshot Month</Label>
              <Select
                value={filters.snapshotMonth || ''}
                onValueChange={(val) => onFiltersChange({ ...filters, snapshotMonth: val || null })}
              >
                <SelectTrigger id="snapshotMonth" className="mt-1 text-sm">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All months</SelectItem>
                  {uniqueValues.snapshotMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="licensedProduct" className="text-xs text-gray-700">Licensed Product</Label>
              <Select
                value={filters.licensedProduct || ''}
                onValueChange={(val) => onFiltersChange({ ...filters, licensedProduct: val || null })}
              >
                <SelectTrigger id="licensedProduct" className="mt-1 text-sm">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All products</SelectItem>
                  {uniqueValues.licensedProducts.map(product => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="region" className="text-xs text-gray-700">Region</Label>
              <Select
                value={filters.region || ''}
                onValueChange={(val) => onFiltersChange({ ...filters, region: val || null })}
              >
                <SelectTrigger id="region" className="mt-1 text-sm">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All regions</SelectItem>
                  {uniqueValues.regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="accountDirector" className="text-xs text-gray-700">Account Director</Label>
              <Select
                value={filters.accountDirector || ''}
                onValueChange={(val) => onFiltersChange({ ...filters, accountDirector: val || null })}
              >
                <SelectTrigger id="accountDirector" className="mt-1 text-sm">
                  <SelectValue placeholder="All directors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All directors</SelectItem>
                  {uniqueValues.accountDirectors.map(director => (
                    <SelectItem key={director} value={director!}>{director}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tam" className="text-xs text-gray-700">TAM</Label>
              <Select
                value={filters.tam || ''}
                onValueChange={(val) => onFiltersChange({ ...filters, tam: val || null })}
              >
                <SelectTrigger id="tam" className="mt-1 text-sm">
                  <SelectValue placeholder="All TAMs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All TAMs</SelectItem>
                  {uniqueValues.tams.map(tam => (
                    <SelectItem key={tam} value={tam!}>{tam}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="csm" className="text-xs text-gray-700">CSM</Label>
              <Select
                value={filters.csm || ''}
                onValueChange={(val) => onFiltersChange({ ...filters, csm: val || null })}
              >
                <SelectTrigger id="csm" className="mt-1 text-sm">
                  <SelectValue placeholder="All CSMs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All CSMs</SelectItem>
                  {uniqueValues.csms.map(csm => (
                    <SelectItem key={csm} value={csm!}>{csm}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="utilisationRisk" className="text-xs text-gray-700">Utilisation Risk</Label>
              <Select
                value={filters.utilisationRisk || ''}
                onValueChange={(val) => onFiltersChange({ ...filters, utilisationRisk: (val as any) || null })}
              >
                <SelectTrigger id="utilisationRisk" className="mt-1 text-sm">
                  <SelectValue placeholder="All risk bands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All risk bands</SelectItem>
                  {uniqueValues.utilisationRisks.map(risk => (
                    <SelectItem key={risk} value={risk}>{risk}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}