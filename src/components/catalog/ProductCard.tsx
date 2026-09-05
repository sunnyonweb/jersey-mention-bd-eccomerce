import { MouseEvent } from 'react';
import { Heart, ShoppingBag, Eye, Star, Shirt, CheckCircle } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../store/useStore';
import { isProductSizeEnabled, getProductAvailableSizes } from '../../utils/productUtils';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    setSelectedProduct,
    setActiveTab,
    addRecentlyViewed,
    showToast,
    openQuickView,
    user
  } = useStore();

  const isLiked = isInWishlist(product.id);
  const currentPrice = product.salePrice || product.price;

  const handleCardClick = () => {
    setSelectedProduct(product);
    addRecentlyViewed(product);
    setActiveTab('product_detail');
  };

  const handleAddToCart = (e: MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else {
      openQuickView(product);
    }
  };

  const handleToggleLike = (e: MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickViewClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else {
      openQuickView(product);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square min-[1220px]:aspect-1/1 w-full bg-slate-100 overflow-hidden flex items-center justify-center product-image-container">
        {product.images && product.images.length > 0 && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain p-2 sm:p-2.5 min-[1220px]:p-0 min-[1220px]:object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
            <Shirt className="w-8 h-8 opacity-40 animate-pulse" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.discountPercent && product.discountPercent > 0 ? (
            <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full tracking-wider uppercase shadow-xs">
              {product.discountPercent}% OFF
            </span>
          ) : null}

          {product.isFlashSale && (
            <span className="bg-amber-500 text-slate-900 font-black text-[10px] px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-xs">
              FLASH SALE
            </span>
          )}

          {product.allowCustomPrint && (
            <span className="bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Shirt className="w-3 h-3 text-emerald-300" />
              PRINT READY
            </span>
          )}
        </div>

        {/* Wishlist & QuickView Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleLike}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer ${
              isLiked ? 'bg-red-600 text-white' : 'bg-white/90 text-slate-700 hover:bg-white hover:text-red-600'
            }`}
            title="Save to Wishlist"
          >
            <Heart className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={handleQuickViewClick}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-600 flex items-center justify-center shadow-md transition-colors cursor-pointer"
            title="Quick View"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Out of stock overlay */}
        {product.isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase">
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
            <span>{product.categoryName}</span>
            <span className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {product.rating} ({product.reviewCount})
            </span>
          </div>

          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Sizes Pill row - only show if size enabled */}
        {(() => {
          if (!isProductSizeEnabled(product)) return null;
          const availableSizes = getProductAvailableSizes(product);
          if (availableSizes.length === 0) return null;

          return (
            <div className="flex items-center gap-1 flex-wrap text-[10px] text-slate-600 font-semibold">
              <span className="text-slate-400">Sizes:</span>
              {availableSizes.slice(0, 4).map((s, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                  {s}
                </span>
              ))}
              {availableSizes.length > 4 && <span>+{availableSizes.length - 4}</span>}
            </div>
          );
        })()}

        {/* Price & BUY Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-slate-900">
                ৳{currentPrice.toLocaleString()}
              </span>
              {product.salePrice && (
                <>
                  <span className="text-xs text-slate-400 line-through">
                    ৳{product.price.toLocaleString()}
                  </span>
                  {product.discountPercent && product.discountPercent > 0 ? (
                    <span className="text-[10px] text-red-650 font-black bg-red-50 px-1.5 py-0.5 rounded-md">
                      {product.discountPercent}% OFF
                    </span>
                  ) : null}
                </>
              )}
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> All Bangladesh Delivery Within 3 Days
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.isOutOfStock}
            className="bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="BUY"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>BUY</span>
          </button>
        </div>
      </div>
    </div>
  );
}

