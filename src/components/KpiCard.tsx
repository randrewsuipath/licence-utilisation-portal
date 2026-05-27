import type { ReactNode } from 'react';
interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
}
export function KpiCard({ label, value, icon, className = '' }: KpiCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
        {icon && <div>{icon}</div>}
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}