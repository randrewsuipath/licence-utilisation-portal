import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
interface AccountRow {
  subsidiaryId: number;
  name: string;
  utilisation: number;
  licensed: number;
  usage: number;
}
interface AccountsTableProps {
  data: AccountRow[];
  type: 'underUtilised' | 'overUtilised';
}
export function AccountsTable({ data, type }: AccountsTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-sm text-gray-500 text-center">No accounts found</p>
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-medium text-gray-500 uppercase">Account</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Licensed Quantity</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Usage</TableHead>
            <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Utilisation %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.subsidiaryId} className="hover:bg-gray-50">
              <TableCell className="text-sm font-medium text-gray-900">
                {row.name}
                <span className="ml-2 text-xs text-gray-500">#{row.subsidiaryId}</span>
              </TableCell>
              <TableCell className="text-sm text-gray-700 text-right">{Math.round(row.licensed).toLocaleString()}</TableCell>
              <TableCell className="text-sm text-gray-700 text-right">{Math.round(row.usage).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    type === 'underUtilised'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {row.utilisation.toFixed(1)}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}