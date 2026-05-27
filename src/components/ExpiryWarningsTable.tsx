import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ProcessedSnapshot } from '@/lib/types';
import { format, differenceInDays } from 'date-fns';
interface ExpiryWarningsTableProps {
  data: ProcessedSnapshot[];
}
export function ExpiryWarningsTable({ data }: ExpiryWarningsTableProps) {
  const expiryData = useMemo(() => {
    const now = new Date();
    return data
      .filter(d => {
        if (!d.licenseEndDate) return false;
        try {
          new Date(d.licenseEndDate);
          return true;
        } catch { return false; }
      })
      .map(d => {
        const endDate = new Date(d.licenseEndDate!);
        const daysUntilExpiry = differenceInDays(endDate, now);
        let band: 'expired' | '30days' | '60days' | '90days' | 'later' = 'later';
        if (daysUntilExpiry < 0) band = 'expired';
        else if (daysUntilExpiry <= 30) band = '30days';
        else if (daysUntilExpiry <= 60) band = '60days';
        else if (daysUntilExpiry <= 90) band = '90days';
        return {
          ...d,
          endDate,
          daysUntilExpiry,
          band,
        };
      })
      .filter(d => d.band !== 'later')
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [data]);
  if (expiryData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-sm text-gray-500 text-center">No expiring licences within 90 days</p>
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-medium text-gray-500 uppercase">Account</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase">Product</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Licensed Quantity</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase">End Date</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase">Days Until Expiry</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase">Account Director</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase">TAM</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expiryData.map((row, idx) => (
            <TableRow
              key={`${row.subsidiaryId}-${row.licensedProduct}-${idx}`}
              className={`hover:bg-gray-50 ${
                row.band === 'expired' || row.band === '30days' ? 'bg-red-50' : ''
              }`}
            >
              <TableCell className="text-sm font-medium text-gray-900">
                {row.subsidiaryName || `Account ${row.subsidiaryId}`}
              </TableCell>
              <TableCell className="text-sm text-gray-700">{row.displayName || row.licensedProduct}</TableCell>
              <TableCell className="text-sm text-gray-700 text-right">
                {row.licensedQuantity ? Math.round(row.licensedQuantity).toLocaleString() : '—'}
              </TableCell>
              <TableCell className="text-sm text-gray-700">{format(row.endDate, 'dd MMM yyyy')}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    row.band === 'expired'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : row.band === '30days'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : row.band === '60days'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}
                >
                  {row.daysUntilExpiry < 0
                    ? `Expired ${Math.abs(row.daysUntilExpiry)} days ago`
                    : `${row.daysUntilExpiry} days`}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-700">{row.accountDirector || '—'}</TableCell>
              <TableCell className="text-sm text-gray-700">{row.tam || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}