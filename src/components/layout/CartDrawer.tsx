import { useState, FormEvent } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Shirt, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  isProductSizeEnabled,
  getProductAvailableSizes,
  getIncompleteSizeCartItems,
  isCartItemSizeValid
} from '../../utils/productUtils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    updateCartItemSize,
    appliedCoupon,
    couponDiscount,
    setAppliedCoupon,
    setActiveTab,
    showToast,
    siteSettings,
    isAuthLoading,
    sleeveBadgeOptions
  } = useStore();

  const [couponCode, setCouponCode] = useState('');
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => {
    const basePrice = item.product.salePrice || item.product.price;
    const nameNumberAddon = item.customization?.nameNumber?.enabled ? (item.customization.nameNumber.price) : 0;
    const patchesAddon = item.customization?.sleeveBadges?.enabled
      ? (item.customization.sleeveBadges.totalPrice)
      : (item.customization?.patches?.enabled ? (item.customization.patches.totalPrice) : 0);
    const itemTotalPrice = basePrice + nameNumberAddon + patchesAddon;
    return sum + itemTotalPrice * item.quantity;
  }, 0);

  // Free shipping threshold logic
  const freeDeliveryEnabled = siteSettings?.freeDeliveryEnabled !== false;
  const FREE_SHIPPING_THRESHOLD = siteSettings?.freeShippingThreshold ?? 3000;
  const isFreeShipping = freeDeliveryEnabled && (subtotal >= FREE_SHIPPING_THRESHOLD);
  const amountNeededForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);


  const handleApplyCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setLoadingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal })
      });
      const data = await res.json();

      if (data.success) {
        setAppliedCoupon(data.coupon, data.discount);
        showToast(`Coupon "${data.coupon.code}" applied: ৳${data.discount} discount!`);
        setCouponCode('');
      } else {
        showToast(data.message || 'Invalid coupon code');
      }
    } catch (err) {
      showToast('Error validating coupon');
    } finally {
      setLoadingCoupon(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      showToast('Your shopping cart is empty');
      return;
    }
    const incompleteItems = getIncompleteSizeCartItems(cart);
    if (incompleteItems.length > 0) {
      showToast('Please select a size for all required products before checkout.');
      return;
    }
    onClose();
    setActiveTab('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-extrabold text-base tracking-tight">Shopping Cart</h2>
                <p className="text-[10px] text-slate-400 font-semibold">{cart.length} item{cart.length !== 1 ? 's' : ''} selected</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isAuthLoading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-slate-500 text-sm font-bold">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Loading your cart...
            </div>
          ) : <>
          {/* Free Shipping Tracker (Dynamic) */}
          {cart.length > 0 && freeDeliveryEnabled && (
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-800">
                  {isFreeShipping ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      🎉 You qualified for FREE shipping!
                    </span>
                  ) : (
                    <span>
                      Spend <strong className="text-emerald-700">৳{amountNeededForFreeShipping.toLocaleString()}</strong> more for Free Shipping
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase">Threshold: ৳{FREE_SHIPPING_THRESHOLD.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-500 ease-out rounded-full" 
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-50/50">
            {cart.length === 0 ? (
              <div className="text-center py-20 px-4 flex flex-col items-center justify-center h-full space-y-5">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
                  <ShoppingBag className="w-10 h-10 stroke-1.5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-slate-800 text-lg">Your Cart is Empty</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Explore our premium 2026 player version kits and personalized retro classics to fill your bag.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('catalog');
                  }}
                  className="bg-slate-900 hover:bg-emerald-600 hover:scale-105 text-white text-xs font-black px-6 py-3 rounded-2xl transition-all cursor-pointer shadow-md"
                >
                  Browse Collection
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const basePrice = item.product.salePrice || item.product.price;
                const nameNumberAddon = item.customization?.nameNumber?.enabled ? (item.customization.nameNumber.price) : 0;
                const patchesAddon = item.customization?.patches?.enabled ? (item.customization.patches.totalPrice) : 0;
                const itemPrice = basePrice + nameNumberAddon + patchesAddon;
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    {/* Item Image */}
                    <div className="relative w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shrink-0">
                      {item.product.images && item.product.images.length > 0 && item.product.images[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                          <Shirt className="w-6 h-6 opacity-45" />
                        </div>
                      )}
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Selected Variants */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600 font-bold mt-1.5">
                          {item.selectedSize && (
                            <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60 font-black text-slate-800">
                              Size: <span className="text-slate-950 font-black">{item.selectedSize}</span>
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/50 flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block border border-black/10"
                                style={{ backgroundColor: item.selectedColor.hex }}
                              />
                              {item.selectedColor.name}
                            </span>
                          )}
                        </div>

                        {/* Missing Size Warning & Quick Picker */}
                        {isProductSizeEnabled(item.product) && (!item.selectedSize || !item.selectedSize.trim()) && (
                          <div className="mt-2 p-2.5 rounded-2xl bg-red-50/90 border border-red-200 text-xs shadow-3xs animate-in fade-in">
                            <div className="flex items-center justify-between gap-1 text-[11px] font-black text-red-700 mb-1.5">
                              <span className="flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" /> Size Required:
                              </span>
                              <span className="text-[10px] text-red-600 font-extrabold uppercase">Please select</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {getProductAvailableSizes(item.product).map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => updateCartItemSize(item.id, sz)}
                                  className="px-2.5 py-1 text-xs font-black rounded-lg bg-white border border-red-300 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white text-slate-800 transition-all cursor-pointer shadow-3xs"
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Customizations Badges */}
                        {item.customization?.nameNumber?.enabled && (
                          <div className="mt-2 p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] flex items-center gap-2 font-black shadow-3xs">
                            <Shirt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              Print: {item.customization.nameNumber.name} #{item.customization.nameNumber.number} (+৳{item.customization.nameNumber.price})
                            </span>
                          </div>
                        )}
                        {item.customization?.sleeveBadges?.enabled && (
                          <div className="mt-2 p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 text-[10px] flex flex-col gap-1.5 font-bold shadow-3xs">
                            <div className="flex items-center justify-between font-black">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Sleeve Badges ({item.customization.sleeveBadges.quantity})</span>
                              </div>
                              <span className="text-blue-900 font-extrabold">+৳{item.customization.sleeveBadges.totalPrice}</span>
                            </div>
                            <div className="space-y-1 pt-0.5">
                              {item.customization.sleeveBadges.selectedBadges.map((b: any, idx: number) => {
                                const liveBadge = sleeveBadgeOptions.find((o) => o.id === b.badgeId);
                                const img = liveBadge?.image || b.badgeImage || b.image;
                                const name = liveBadge?.name || b.badgeName || b.name;
                                const price = liveBadge?.price ?? b.badgePrice ?? b.price;
                                return (
                                  <div key={idx} className="flex items-center justify-between gap-1.5 pl-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="w-4 h-4 rounded bg-white border border-blue-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        {img ? (
                                          <img src={img} alt={name} className="w-full h-full object-contain" />
                                        ) : (
                                          <Shirt className="w-2.5 h-2.5 text-blue-500" />
                                        )}
                                      </div>
                                      <span className="text-slate-700 font-semibold truncate">{name}</span>
                                    </div>
                                    {price !== undefined && (
                                      <span className="text-[9px] text-blue-700 font-extrabold shrink-0">+৳{price}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {!item.customization?.sleeveBadges?.enabled && item.customization?.patches?.enabled && (
                          <div className="mt-2 p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 text-[10px] flex items-center gap-2 font-black shadow-3xs">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                              Patches: {item.customization.patches.quantity} Patch(es) (+৳{item.customization.patches.totalPrice})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quantity & Total Row */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-3xs">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-extrabold text-sm transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-black text-slate-800 bg-slate-50/50 min-w-[28px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="px-2.5 py-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-extrabold text-sm transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-black text-sm sm:text-base text-slate-900">
                          ৳{(itemPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </>}

          {/* Footer Summary and Controls */}
          {cart.length > 0 && (
            <div className="p-6 bg-white border-t border-slate-100 space-y-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
              
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ENTER COUPON CODE"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-bold uppercase tracking-wider transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingCoupon}
                  className="bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-400 text-white text-xs font-black px-5 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {loadingCoupon ? 'Validating...' : 'Apply'}
                </button>
              </form>

              {appliedCoupon && (
                <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 px-3.5 py-2.5 rounded-xl border border-emerald-100 text-xs font-bold shadow-3xs animate-in slide-in-from-top-1">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Coupon "{appliedCoupon.code}" Activated
                  </span>
                  <span className="font-extrabold text-emerald-700">-৳{couponDiscount}</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-150">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">৳{subtotal.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span>-৳{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2.5 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-emerald-600 text-lg">৳{Math.max(0, subtotal - couponDiscount).toLocaleString()}</span>
                </div>
              </div>

              {/* Warning if any size is missing */}
              {getIncompleteSizeCartItems(cart).length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-black text-red-700 flex items-center gap-2 animate-in fade-in shadow-3xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Please select a size for all required products before checkout.</span>
                </div>
              )}

              {/* Checkout CTA */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-sm py-4 rounded-2xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
