import React from 'react';
import { Product } from '../../types';
import { getProductSizeChart, isProductSizeChartEnabled } from '../../utils/productUtils';
import { Ruler, Info } from 'lucide-react';

interface SizeChartProps {
  product: Product | null | undefined;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
  className?: string;
}

export const SizeChart: React.FC<SizeChartProps> = ({
  product,
  selectedSize,
  onSelectSize,
  className = ''
}) => {
  if (!product || !isProductSizeChartEnabled(product)) {
    return null;
  }

  const chart = getProductSizeChart(product);
  if (!chart || chart.length === 0) {
    return null;
  }

  return (
    <div className={`mt-3 pt-3 border-t border-slate-200/80 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <Ruler className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
          Size Chart
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          (inches)
        </span>
      </div>

      {/* Table Container (Responsive Horizontal Scroll, isolated from full page) */}
      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full text-center text-xs border-collapse min-w-[240px]">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <th className="py-2 px-3 text-left">Size</th>
              <th className="py-2 px-3">Length (inches)</th>
              <th className="py-2 px-3">Chest (inches)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {chart.map((row) => {
              const isSelected = selectedSize === row.size;
              return (
                <tr
                  key={row.size}
                  onClick={() => onSelectSize && onSelectSize(row.size)}
                  className={`transition-colors ${
                    onSelectSize ? 'cursor-pointer' : ''
                  } ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-black'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <td className="py-2 px-3 text-left">
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-black ${
                        isSelected
                          ? 'bg-white text-emerald-800 shadow-2xs'
                          : 'bg-slate-100 text-slate-900 border border-slate-200/80'
                      }`}
                    >
                      {row.size}
                    </span>
                  </td>
                  <td className={`py-2 px-3 font-semibold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                    {row.length}
                  </td>
                  <td className={`py-2 px-3 font-semibold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                    {row.chest}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1 font-medium italic">
        <Info className="w-3 h-3 text-slate-400 shrink-0 not-italic" />
        <span>Size may vary ± 1 inch</span>
      </p>
    </div>
  );
};

export default SizeChart;
