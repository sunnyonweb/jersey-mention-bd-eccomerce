import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import ProductCard from './ProductCard';
import { Product } from '../../types';
import { Loader2, Search, ArrowRight } from 'lucide-react';

interface SearchResultsViewProps {
  onQuickView: (p: Product) => void;
}

export default function SearchResultsView({ onQuickView }: SearchResultsViewProps) {
  const { selectedCategory, navigateTo, categories } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!selectedCategory) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    fetch(`/api/products?search=${encodeURIComponent(selectedCategory)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Filter to only include active products
          setProducts(data.products.filter((p: Product) => p.status === 'active'));
        }
      })
      .catch((err) => console.error('Error fetching search results:', err))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-12 md:py-16 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center md:text-left space-y-2">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-950/80 border border-emerald-900/40 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Search className="w-3 h-3" /> Search Results Explorer
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase mt-2">
            Search results for "{selectedCategory}"
          </h1>
          <p className="text-xs text-slate-400 font-bold">
            {!loading && `${products.length} products found`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-black uppercase tracking-wider">Searching database...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="space-y-12">
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
              <span className="text-4xl">🔍</span>
              <h3 className="font-extrabold text-slate-900 text-sm mt-3 uppercase">No products found</h3>
              <p className="text-xs text-slate-500 mt-1">No products matched your search. Try different keywords or browse our popular categories below.</p>
            </div>

            {/* Popular Categories Fallback Recommendations */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 text-center">
                Popular Collections to Explore
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories
                  .filter((cat) => cat.navbarLocation === 'main' && cat.isActive)
                  .slice(0, 4)
                  .map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => navigateTo(`/category/${cat.slug}`)}
                      className="bg-white border hover:border-emerald-500 hover:shadow-md rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center gap-3 group"
                    >
                      <span className="text-sm font-extrabold text-slate-800 group-hover:text-emerald-700 uppercase transition-colors">
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
                        Shop Now <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>
                  ))}
              </div>
            </div>
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
