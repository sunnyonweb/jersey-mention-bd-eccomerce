import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Trophy, Flame, Zap, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ProductCard from '../catalog/ProductCard';
import { Product } from '../../types';

export default function FeaturedProducts() {
  const { setActiveTab, setSelectedCategory } = useStore();
  const [activeTabFilter, setActiveTabFilter] = useState<'featured' | 'bestseller' | 'trending' | 'new'>('featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/products?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products.filter((p: Product) => p.status === 'active'));
        }
      })
      .catch((err) => console.error('Error loading trending gear products:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    if (activeTabFilter === 'featured') {
      if (p.homepageSections && p.homepageSections.length > 0) {
        return p.homepageSections.includes('featured');
      }
      return p.featured || p.homepageSections?.includes('trending_sports_match_gear');
    }
    if (activeTabFilter === 'bestseller') {
      if (p.homepageSections && p.homepageSections.length > 0) {
        return p.homepageSections.includes('best_sellers');
      }
      return p.isBestSeller;
    }
    if (activeTabFilter === 'trending') {
      if (p.homepageSections && p.homepageSections.length > 0) {
        return p.homepageSections.includes('trending');
      }
      return p.isTrending;
    }
    if (activeTabFilter === 'new') {
      if (p.homepageSections && p.homepageSections.length > 0) {
        return p.homepageSections.includes('new_arrivals');
      }
      return p.isNewArrival;
    }
    return true;
  });

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Curated Selection
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              TRENDING SPORTS & MATCH GEAR
            </h2>
          </div>

          {/* Tab Controls */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTabFilter('featured')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none ${
                activeTabFilter === 'featured'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Featured
            </button>

            <button
              onClick={() => setActiveTabFilter('bestseller')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none ${
                activeTabFilter === 'bestseller'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Best Sellers
            </button>

            <button
              onClick={() => setActiveTabFilter('trending')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none ${
                activeTabFilter === 'trending'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Trending
            </button>

            <button
              onClick={() => setActiveTabFilter('new')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none ${
                activeTabFilter === 'new'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> New Arrivals
            </button>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading curated match gear...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-3xl max-w-md mx-auto">
            <span className="text-3xl">👕</span>
            <h3 className="font-extrabold text-slate-805 text-sm mt-3 uppercase tracking-wider">No Active Gear Items</h3>
            <p className="text-xs text-slate-500 mt-1">We don't have items in this tab right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="mt-12 text-center">
          <button
            onClick={() => {
              setSelectedCategory('');
              setActiveTab('catalog');
            }}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-extrabold px-8 py-3.5 rounded-full shadow-md transition-all cursor-pointer border-none"
          >
            <span>SHOW ALL PRODUCTS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
