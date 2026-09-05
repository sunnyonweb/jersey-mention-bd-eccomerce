import React from 'react';
import { X, CheckCircle2, ArrowRight, Shirt } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getIncompleteSizeCartItems } from '../../utils/productUtils';

export default function AddedToCartModal() {
  const {
    isAddedToCartModalOpen,
    addedToCartData,
    closeAddedToCartModal,
    cart,
    setActiveTab,
    setIsCartOpen,
    showToast
  } = useStore();

  if (!isAddedToCartModalOpen || !addedToCartData) {
    return null;
  }

  const {
    product,
    quantity,
    selectedSize,
    selectedColor,
    customPrint,
    customization,
    unitPrice
  } = addedToCartData;

  // Calculate dynamic cart totals
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const basePrice = item.product.salePrice || item.product.price;
    const nameNumberAddon = item.customization?.nameNumber?.enabled ? (item.customization.nameNumber.price || 0) : 0;
    const patchesAddon = item.customization?.sleeveBadges?.enabled 
      ? (item.customization.sleeveBadges.totalPrice || 0) 
      : (item.customization?.patches?.enabled ? (item.customization.patches.totalPrice || 0) : 0);
    const itemTotalPrice = basePrice + nameNumberAddon + patchesAddon;
    return sum + itemTotalPrice * item.quantity;
  }, 0);

  const handleGoToCheckout = () => {
    const incomplete = getIncompleteSizeCartItems(cart);
    if (incomplete.length > 0) {
      closeAddedToCartModal();
      setIsCartOpen(true);
      showToast('Please select a size for all required products before checkout.');
      return;
    }
    closeAddedToCartModal();
    setActiveTab('checkout');
  };

  const productImage = product.images && product.images.length > 0 ? product.images[0] : '';

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeAddedToCartModal}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Added to Cart!
              </h2>
            </div>
          </div>

          <button
            onClick={closeAddedToCartModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Product Details */}
        <div className="p-4 sm:p-5 bg-white">
          <div className="flex gap-4">
            
            {/* Product Image Thumbnail */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center shadow-inner relative">
              {productImage ? (
                <img
                  src={productImage}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-1 min-[1220px]:p-0 min-[1220px]:object-cover object-center"
                />
              ) : (
                <Shirt className="w-8 h-8 text-slate-300" />
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 line-clamp-2 leading-snug">
                  {product.name}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {/* Size */}
                  {selectedSize && (
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      Size: <strong className="text-slate-950">{selectedSize}</strong>
                    </span>
                  )}

                  {/* Color (if non-default) */}
                  {selectedColor && selectedColor.name && selectedColor.name !== 'Default' && selectedColor.name !== 'Standard' && (
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {selectedColor.name}
                    </span>
                  )}
                </div>

                {/* Customizations if enabled */}
                {(customization?.nameNumber?.enabled || customPrint?.playerName) && (
                  <div className="mt-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md inline-block">
                    Squad: {customization?.nameNumber?.name || customPrint?.playerName} #{customization?.nameNumber?.number || customPrint?.playerNumber}
                  </div>
                )}

                {customization?.sleeveBadges?.enabled && customization.sleeveBadges.selectedBadges?.length > 0 && (
                  <div className="mt-1.5 p-2 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                    <span className="text-[10px] font-black text-blue-900 uppercase block">
                      Sleeve Badges (+৳{customization.sleeveBadges.totalPrice}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {customization.sleeveBadges.selectedBadges.map((b, idx) => {
                        const img = b.badgeImage || b.image;
                        const name = b.badgeName || b.name;
                        return (
                          <div key={idx} className="flex items-center gap-1.5 bg-white border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-800">
                            {img ? (
                              <img src={img} alt={name} className="w-3.5 h-3.5 object-contain shrink-0" />
                            ) : null}
                            <span>{name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Quantity Row */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Quantity: <strong className="text-slate-900 font-bold">{quantity}</strong>
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-700">
                  ৳{(unitPrice * quantity).toLocaleString()}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Cart Summary Banner */}
        <div className="px-5 py-3 bg-slate-50 border-t border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
            <span>🛒</span>
            <span>{totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} in your cart</span>
          </span>
          <span className="font-semibold text-slate-600">
            Cart Total: <strong className="text-sm font-black text-slate-950">৳{cartSubtotal.toLocaleString()}</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 bg-white flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
          <button
            onClick={closeAddedToCartModal}
            className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-extrabold text-xs py-3.5 px-4 rounded-2xl transition-all cursor-pointer border border-slate-200/80 text-center uppercase tracking-wider"
          >
            CONTINUE SHOPPING
          </button>
          
          <button
            onClick={handleGoToCheckout}
            className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl transition-all cursor-pointer shadow-lg shadow-emerald-600/25 text-center uppercase tracking-wider flex items-center justify-center gap-1.5 border-none"
          >
            <span>GO TO CHECKOUT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
