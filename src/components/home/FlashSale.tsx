import { useState, useEffect } from 'react';
import { Flame, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ProductCard from '../catalog/ProductCard';
import { Product } from '../../types';

export default function FlashSale() {
  const { setActiveTab, setSelectedCategory } = useStore();

  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 42 });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/products?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const activeDeals = data.products.filter((p: Product) => {
            if (p.status !== 'active') return false;
            if (p.homepageSections && p.homepageSections.length > 0) {
              return p.homepageSections.includes('flash_sale') || p.homepageSections.includes('limited_time_deals');
            }
            return p.isFlashSale;
          });
          setProducts(activeDeals);
        }
      })
      .catch((err) => console.error('Error fetching flash sale products:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Live Countdown Timer */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
              <Flame className="w-7 h-7 fill-current animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Limited Time Deals</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                FLASH SALE 2026
              </h2>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 px-5 py-3 rounded-2xl backdrop-blur-md">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-slate-400 mr-1">Ends In:</span>
            <div className="flex items-center gap-1.5 text-sm font-black font-mono">
              <span className="bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg border border-slate-700">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg border border-slate-700">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg border border-slate-700">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Fetching Flash Deals...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 border border-slate-800 rounded-3xl">
            <span className="text-3xl">⚡</span>
            <h3 className="font-extrabold text-sm mt-3 uppercase tracking-wider">No Active Flash Deals</h3>
            <p className="text-xs text-slate-400 mt-1">Check back later for premium discounted jerseys!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p.id} className="text-slate-905 bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-shadow">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <button
            onClick={() => {
              setSelectedCategory('');
              setActiveTab('catalog');
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs px-6 py-3 rounded-full transition-all cursor-pointer shadow-md border-none"
          >
            <span>VIEW ALL DISCOUNTED MATCH KITS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
