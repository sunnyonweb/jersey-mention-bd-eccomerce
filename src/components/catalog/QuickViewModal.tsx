import { useState, useEffect } from 'react';
import { X, Star, ShoppingBag, Heart, Shirt, CheckCircle, AlertCircle, Plus, Minus, ShieldCheck, Check } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../store/useStore';
import {
  isProductSizeEnabled,
  isProductSizeRequired,
  getProductAvailableSizes,
  getProductAdultSizes,
  getProductKidsSizes,
  isProductCustomSquadEnabled,
  isProductSleevePatchesEnabled
} from '../../utils/productUtils';
import SizeChart from '../common/SizeChart';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    showToast,
    setActiveTab,
    setSelectedProduct,
    siteSettings,
    sleeveBadgeOptions,
    fetchSleeveBadgeOptions
  } = useStore();

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sizeError, setSizeError] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Custom Squad Name & Number
  const [nameNumberToggle, setNameNumberToggle] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>('');
  const [playerNumber, setPlayerNumber] = useState<string>('');

  // Sleeve Patches: selected badge IDs
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  useEffect(() => {
    fetchSleeveBadgeOptions();
  }, [fetchSleeveBadgeOptions]);

  // Allowed sleeve badges for this product:
  // Must be active AND assigned to product.sleeveBadges
  const allowedBadges = sleeveBadgeOptions.filter(
    (b) => b.isActive && Array.isArray(product?.sleeveBadges) && product.sleeveBadges.includes(b.id)
  );

  // Reset states whenever product changes or modal opens
  useEffect(() => {
    if (product) {
      setSelectedSize('');
      setSizeError(false);
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : { name: 'Default', hex: '#000' });
      setQuantity(1);
      setNameNumberToggle(false);
      setPlayerName('');
      setPlayerNumber('');
      setSelectedBadges([]);
    }
  }, [product]);

  if (!product) return null;

  // Determine enabled options strictly per product configuration
  const sizeRequired = isProductSizeRequired(product) || isProductSizeEnabled(product);
  const availableSizes = getProductAvailableSizes(product);
  const adultSizes = getProductAdultSizes(product);
  const kidsSizes = getProductKidsSizes(product);
  const sizeLabel = product.sizeOptions?.label || 'Select Size:';

  const customSquadEnabled = isProductCustomSquadEnabled(product);
  const sleevePatchesEnabled = isProductSleevePatchesEnabled(product);

  const currentColor = selectedColor || product.colors?.[0] || { name: 'Default', hex: '#000' };
  const isLiked = isInWishlist(product.id);

  // Prices calculation
  const basePrice = product.salePrice || product.price;
  const nameNumberPriceSetting = siteSettings.customNameNumberPrice ?? 250;

  const selectedBadgeObjects = allowedBadges.filter((b) => selectedBadges.includes(b.id));
  const nameNumberAddon = nameNumberToggle ? nameNumberPriceSetting : 0;
  const patchesAddon = selectedBadgeObjects.reduce((sum, b) => sum + (b.price || 0), 0);
  const unitPrice = basePrice + nameNumberAddon + patchesAddon;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    // 1. Validate Size if enabled
    if (sizeRequired && (!selectedSize || !selectedSize.trim())) {
      setSizeError(true);
      showToast('Please select a size first.');
      return;
    }

    // 2. Validate Custom Squad Name & Number if customer toggled it ON
    if (nameNumberToggle && (!playerName.trim() || !playerNumber.trim())) {
      showToast('Please enter your custom squad name and number.');
      return;
    }

    const customPrintPayload = nameNumberToggle
      ? {
          playerName: playerName.trim(),
          playerNumber: playerNumber.trim(),
          sleeveBadge: 'None'
        }
      : undefined;

    const hasBadges = selectedBadges.length > 0;
    const customizationPayload = {
      nameNumber: {
        enabled: nameNumberToggle,
        name: nameNumberToggle ? playerName.trim() : undefined,
        number: nameNumberToggle ? playerNumber.trim() : undefined,
        price: nameNumberToggle ? nameNumberPriceSetting : 0
      },
      patches: {
        enabled: hasBadges,
        quantity: selectedBadges.length,
        pricePerPatch: selectedBadgeObjects.length > 0 ? selectedBadgeObjects[0].price : 0,
        totalPrice: patchesAddon
      },
      sleeveBadges: hasBadges
        ? {
            enabled: true,
            selectedBadges: selectedBadgeObjects.map((b) => ({
              badgeId: b.id,
              name: b.name,
              badgeName: b.name,
              image: b.image || '',
              badgeImage: b.image || '',
              price: b.price || 0,
              badgePrice: b.price || 0
            })),
            quantity: selectedBadges.length,
            pricePerBadge: selectedBadgeObjects.length > 0 ? selectedBadgeObjects[0].price : 0,
            totalPrice: patchesAddon
          }
        : undefined
    };

    addToCart(
      product,
      quantity,
      sizeRequired ? selectedSize.trim() : undefined,
      currentColor,
      customPrintPayload,
      customizationPayload
    );

    onClose();
  };

  const handleFullDetail = () => {
    setSelectedProduct(product);
    setActiveTab('product_detail');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 relative max-h-[92vh] flex flex-col md:flex-row text-left">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer border-none shadow-md"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Image Preview */}
        <div className="md:w-1/2 bg-slate-100 relative min-h-[260px] md:min-h-[380px] flex items-center justify-center overflow-hidden shrink-0">
          {product.images && product.images.length > 0 && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              referrerPolicy="no-referrer;same-origin"
              className="w-full h-full object-contain p-3 sm:p-4 min-[1220px]:p-0 min-[1220px]:object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
              <Shirt className="w-12 h-12 opacity-40 animate-pulse" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase shadow-xs">
              {product.categoryName}
            </span>
          </div>
        </div>

        {/* Product Customization & Details Form */}
        <div className="md:w-1/2 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3.5">
            <div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs mb-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{product.rating} ({product.reviewCount} Reviews)</span>
              </div>

              <h2 className="font-extrabold text-slate-900 text-base leading-snug">
                {product.name}
              </h2>

              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-xl font-black text-slate-900">
                  ৳{(product.salePrice || product.price).toLocaleString()}
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
            </div>

            {/* 1. SIZE SELECTION (ONLY IF ENABLED) */}
            {sizeRequired && (
              <div
                className={`p-3 rounded-2xl transition-all duration-200 ${
                  sizeError
                    ? 'border-2 border-red-500 bg-red-50/70 ring-2 ring-red-200'
                    : 'border border-slate-200/80 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-extrabold block ${sizeError ? 'text-red-700' : 'text-slate-800'}`}>
                    {sizeLabel} <span className="text-red-500">*</span>
                  </span>
                  {sizeError && (
                    <span className="text-[10px] font-black text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Please select a size first.
                    </span>
                  )}
                </div>
                {/* If both Adult and Kids sizes exist, show distinct labeled groups */}
                {adultSizes.length > 0 && kidsSizes.length > 0 ? (
                  <div className="space-y-3">
                    {/* Adult Sizes */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Adult Sizes
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {adultSizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setSelectedSize(s);
                              setSizeError(false);
                            }}
                            className={`text-xs px-3 py-1.5 rounded-xl border font-extrabold cursor-pointer transition-all ${
                              selectedSize === s
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                                : sizeError
                                ? 'bg-white text-slate-800 border-red-300 hover:border-red-500 hover:bg-red-50/40'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kids Sizes */}
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1.5">
                        Kids / Children Sizes (3Y–14Y)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {kidsSizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setSelectedSize(s);
                              setSizeError(false);
                            }}
                            className={`text-xs px-3 py-1.5 rounded-xl border font-extrabold cursor-pointer transition-all ${
                              selectedSize === s
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm scale-105'
                                : sizeError
                                ? 'bg-white text-slate-800 border-red-300 hover:border-red-500 hover:bg-red-50/40'
                                : 'bg-white text-slate-700 border-amber-200 hover:border-amber-400 bg-amber-50/30'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSelectedSize(s);
                          setSizeError(false);
                        }}
                        className={`text-xs px-3.5 py-1.5 rounded-xl border font-extrabold cursor-pointer transition-all ${
                          selectedSize === s
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                            : sizeError
                            ? 'bg-white text-slate-800 border-red-300 hover:border-red-500 hover:bg-red-50/40'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Size Chart (when enabled) */}
                <SizeChart
                  product={product}
                  selectedSize={selectedSize}
                  onSelectSize={(s) => {
                    setSelectedSize(s);
                    setSizeError(false);
                  }}
                />
              </div>
            )}

            {/* 2. CUSTOM SQUAD NAME & NUMBER HEAT-PRESS (ONLY IF ENABLED) */}
            {customSquadEnabled && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border border-emerald-200 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer font-bold select-none text-xs">
                  <input
                    type="checkbox"
                    checked={nameNumberToggle}
                    onChange={(e) => {
                      setNameNumberToggle(e.target.checked);
                      if (!e.target.checked) {
                        setPlayerName('');
                        setPlayerNumber('');
                      }
                    }}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-extrabold text-emerald-950 block">CUSTOM SQUAD NAME & NUMBER HEAT-PRESS</span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">
                      Additional Price: +৳{nameNumberPriceSetting} BDT
                    </span>
                  </div>
                </label>

                {nameNumberToggle && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150 text-xs">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-700 block mb-1">Name</label>
                      <input
                        type="text"
                        placeholder="e.g. MESSI"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                        className="w-full bg-white text-slate-900 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 uppercase font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-700 block mb-1">Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 10"
                        value={playerNumber}
                        onChange={(e) => setPlayerNumber(e.target.value)}
                        className="w-full bg-white text-slate-900 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. SLEEVE / PATCHES OPTION (ONLY IF ENABLED & HAS ASSIGNED BADGES) */}
            {sleevePatchesEnabled && allowedBadges.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-950 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 text-blue-600" />
                    Sleeve / Patches Option
                  </span>
                  {selectedBadges.length > 0 && (
                    <span className="text-[10px] font-black text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                      {selectedBadges.length} Selected (+৳{patchesAddon.toLocaleString()})
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-blue-800/80 font-medium">
                  Select official sleeve badges to be heat-pressed onto your jersey:
                </p>

                <div className="space-y-1.5">
                  {allowedBadges.map((badge) => {
                    const isSelected = selectedBadges.includes(badge.id);
                    return (
                      <div
                        key={badge.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedBadges(selectedBadges.filter((id) => id !== badge.id));
                          } else {
                            setSelectedBadges([...selectedBadges, badge.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center overflow-hidden shrink-0 ${
                              isSelected ? 'bg-white/20 border-white/30' : 'bg-slate-100 border-slate-200'
                            }`}
                          >
                            {badge.image ? (
                              <img
                                src={badge.image}
                                alt={badge.name}
                                className="w-full h-full object-contain p-0.5"
                              />
                            ) : (
                              <Shirt className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            )}
                          </div>
                          <span className="font-bold text-xs truncate">{badge.name}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`font-black text-xs ${
                              isSelected ? 'text-blue-100' : 'text-emerald-700'
                            }`}
                          >
                            +৳{(badge.price || 0).toLocaleString()}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                              isSelected
                                ? 'bg-white text-blue-600 border-white'
                                : 'border-slate-300 bg-slate-50'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors Selection (if multiple) */}
            {product.colors && product.colors.length > 1 && (
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-slate-800 block">Color: {currentColor.name}</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                        currentColor.name === c.name
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Price Calculation Breakdown */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">Quantity</span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-3xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-black text-xs text-slate-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {(nameNumberToggle || selectedBadges.length > 0) && (
                <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Price</span>
                    <span>৳{basePrice.toLocaleString()}</span>
                  </div>
                  {nameNumberToggle && (
                    <div className="flex justify-between text-emerald-700">
                      <span>+ Custom Squad Name & Number</span>
                      <span>৳{nameNumberPriceSetting.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedBadges.length > 0 && (
                    <div className="flex justify-between text-blue-700">
                      <span>+ Sleeve Badges ({selectedBadges.length} selected)</span>
                      <span>৳{patchesAddon.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                <span>Total Amount:</span>
                <span className="text-emerald-700 text-base">৳{totalPrice.toLocaleString()} BDT</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                disabled={product.isOutOfStock}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 border-none"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>BUY (৳{totalPrice.toLocaleString()})</span>
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                  isLiked ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300'
                }`}
                title="Wishlist"
              >
                <Heart className="w-4 h-4 fill-current" />
              </button>
            </div>

            <button
              onClick={handleFullDetail}
              className="w-full text-center text-xs font-bold text-slate-600 hover:text-slate-900 py-1 hover:underline cursor-pointer bg-transparent border-none"
            >
              View Full Product Specifications & Reviews →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
