import { Heart, Trash2, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ProductCard from '../catalog/ProductCard';

export default function WishlistView() {
  const { wishlist, clearWishlist, setActiveTab, isAuthLoading } = useStore();

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
              Saved Gear
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              MY WISHLIST ({wishlist.length})
            </h1>
          </div>

          {wishlist.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Clear All Saved Items
            </button>
          )}
        </div>

        {isAuthLoading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-slate-500 text-sm font-bold">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Loading your wishlist...
          </div>
        ) : wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Your Wishlist is Empty</h3>
            <p className="text-xs text-slate-500">
              Save your favorite Bangladesh National Team, European Club, and Retro kits to review anytime.
            </p>
            <button
              onClick={() => setActiveTab('catalog')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-full transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <span>EXPLORE MATCH KITS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
