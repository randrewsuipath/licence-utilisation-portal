import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ProcessedSnapshot } from '@/lib/types';
interface UnmappedProductsWarningProps {
  count: number;
  data: ProcessedSnapshot[];
}
export function UnmappedProductsWarning({ count, data }: UnmappedProductsWarningProps) {
  const unmappedProducts = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter(d => d.utilisationRisk === 'Not mapped')
          .map(d => d.licensedProduct)
      )
    ).sort();
  }, [data]);
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-900 mb-1">
            {count} {count === 1 ? 'Product' : 'Products'} Not Mapped
          </h4>
          <p className="text-sm text-amber-700 mb-2">
            The following products do not have active metric mappings. Utilisation cannot be calculated until mappings are configured in the Metric Mapping Admin page.
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
  );
}