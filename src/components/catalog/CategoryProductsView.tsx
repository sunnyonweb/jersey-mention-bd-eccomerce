import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import ProductCard from './ProductCard';
import { Product } from '../../types';
import { Loader2 } from 'lucide-react';

interface CategoryProductsViewProps {
  onQuickView: (p: Product) => void;
}

export default function CategoryProductsView({ onQuickView }: CategoryProductsViewProps) {
  const { selectedCategory, categories } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Find the category object to show the user-friendly title
  const catObj = categories.find(
    (c) => c.slug === selectedCategory || c.id === selectedCategory
  );

  useEffect(() => {
    if (!selectedCategory) return;
    setLoading(true);

    fetch(`/api/products?category=${selectedCategory}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Filter to only include active products
          setProducts(data.products.filter((p: Product) => p.status === 'active'));
        }
      })
      .catch((err) => console.error('Error loading category products:', err))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  const categoryName = catObj ? catObj.name : selectedCategory;

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Category Header Banner */}
      <div className="bg-slate-900 text-white py-12 md:py-16 border-b border-slate-800 relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center md:text-left space-y-2">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-900/40 px-3.5 py-1.5 rounded-full">
            BD Jersey Shop
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase mt-2">
            {categoryName}
          </h1>
          <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
            Discover our premium selection of sports apparel and gear. Authentic fabrics, perfect detailing, and custom name/number printing available.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-black uppercase tracking-wider">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 max-w-md mx-auto shadow-xs">
            <span className="text-4xl">👕</span>
            <h3 className="font-extrabold text-slate-900 text-sm mt-3 uppercase">No Products Found</h3>
            <p className="text-xs text-slate-500 mt-1">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
