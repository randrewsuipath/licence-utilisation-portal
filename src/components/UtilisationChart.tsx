import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ProcessedSnapshot } from '@/lib/types';
interface UtilisationChartProps {
  data: ProcessedSnapshot[];
  type: 'trend' | 'byProduct';
}
export function UtilisationChart({ data, type }: UtilisationChartProps) {
  const chartData = useMemo(() => {
    if (type === 'trend') {
      // Group by snapshot month
      const monthMap = new Map<string, { licensed: number; usage: number }>();
      data.forEach(d => {
        const existing = monthMap.get(d.snapshotMonth);
        if (existing) {
          existing.licensed += d.licensedQuantity || 0;
          existing.usage += d.usageValue || 0;
        } else {
          monthMap.set(d.snapshotMonth, {
            licensed: d.licensedQuantity || 0,
            usage: d.usageValue || 0,
          });
        }
      });
      return Array.from(monthMap.entries())
        .map(([month, values]) => ({
          month,
          utilisation: values.licensed > 0 ? (values.usage / values.licensed) * 100 : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
    } else {
      // Group by product
      const productMap = new Map<string, { licensed: number; usage: number; displayName: string | null }>();
      data.forEach(d => {
        const existing = productMap.get(d.licensedProduct);
        if (existing) {
          existing.licensed += d.licensedQuantity || 0;
          existing.usage += d.usageValue || 0;
        } else {
          productMap.set(d.licensedProduct, {
            licensed: d.licensedQuantity || 0,
            usage: d.usageValue || 0,
            displayName: d.displayName,
          });
        }
      });
      return Array.from(productMap.entries())
        .map(([product, values]) => ({
          product: values.displayName || product,
          utilisation: values.licensed > 0 ? (values.usage / values.licensed) * 100 : 0,
        }))
        .sort((a, b) => b.utilisation - a.utilisation)
        .slice(0, 10);
    }
  }, [data, type]);
  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {type === 'trend' ? 'Utilisation Trend by Snapshot Month' : 'Utilisation by Product'}
        </h3>
        <div className="flex items-center justify-center h-64 text-sm text-gray-500">
          No data available
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        {type === 'trend' ? 'Utilisation Trend by Snapshot Month' : 'Top 10 Products by Utilisation'}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        {type === 'trend' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="utilisation" stroke="#2563eb" strokeWidth={2} name="Utilisation %" />
          </LineChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="product" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={100} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="utilisation" fill="#2563eb" name="Utilisation %" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}