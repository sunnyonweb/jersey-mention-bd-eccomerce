import { useState, FormEvent, useEffect, useRef } from 'react';
import {
  Star,
  ShoppingBag,
  Heart,
  Shirt,
  ShieldCheck,
  Truck,
  RefreshCw,
  ThumbsUp,
  MessageSquare,
  CheckCircle,
  Video,
  Share2,
  Ruler,
  X,
  AlertCircle,
  Check
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { isProductSizeEnabled, isProductSizeRequired, getProductAvailableSizes, getProductAdultSizes, getProductKidsSizes } from '../../utils/productUtils';
import { sanitizeHtml, stripHtml } from '../../utils/sanitizeHtml';
import ProductCard from '../catalog/ProductCard';
import SizeChart from '../common/SizeChart';

export default function ProductDetailPage() {
  const {
    selectedProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    showToast,
    user,
    recentlyViewed,
    sleeveBadgeOptions,
    fetchSleeveBadgeOptions,
    siteSettings
  } = useStore();

  if (!selectedProduct) {
    return (
      <div className="py-20 text-center text-slate-500 font-bold text-sm">
        No product selected. Please browse the catalog.
      </div>
    );
  }

  const p = selectedProduct;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [sizeError, setSizeError] = useState(false);
  const sizeSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedSize('');
    setSizeError(false);
  }, [p]);
  const [selectedColor, setSelectedColor] = useState<any>(p.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [nameNumberEnabled, setNameNumberEnabled] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  // Jersey Size Calculator States
  const [sizeCalcOpen, setSizeCalcOpen] = useState(false);
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [chestInput, setChestInput] = useState('');
  const [calculatedSize, setCalculatedSize] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchSleeveBadgeOptions();
  }, []);

  const allowedBadges = sleeveBadgeOptions.filter(b => 
    b.isActive && Array.isArray(p.sleeveBadges) && p.sleeveBadges.includes(b.id)
  );

  useEffect(() => {
    setSelectedBadges([]);
  }, [p]);

  // Jersey Size Calculator Logic
  const handleCalculateSize = () => {
    const h = Number(heightInput);
    const w = Number(weightInput);
    const c = Number(chestInput);
    if (!h || !w || !c || h <= 0 || w <= 0 || c <= 0) {
      setErrorMsg('Please enter valid positive numbers for height, weight, and chest.');
      setCalculatedSize(null);
      return;
    }

    let parsedRanges = {
      S: { maxHeight: 165, maxWeight: 60, maxChest: 37 },
      M: { maxHeight: 173, maxWeight: 70, maxChest: 39 },
      L: { maxHeight: 180, maxWeight: 80, maxChest: 41 },
      XL: { maxHeight: 185, maxWeight: 90, maxChest: 43 },
      XXL: { maxHeight: 190, maxWeight: 100, maxChest: 45 },
      "3XL": { maxHeight: 210, maxWeight: 120, maxChest: 48 }
    };

    try {
      if (siteSettings.sizeRanges) {
        parsedRanges = JSON.parse(siteSettings.sizeRanges);
      }
    } catch (err) {
      console.error('Error parsing sizeRanges settings:', err);
    }

    const sizesOrdered = ['S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;

    // Find matched size for height
    let heightSize = '3XL';
    for (const size of sizesOrdered) {
      const limit = parsedRanges[size]?.maxHeight || 0;
      if (h <= limit) {
        heightSize = size;
        break;
      }
    }

    // Find matched size for weight
    let weightSize = '3XL';
    for (const size of sizesOrdered) {
      const limit = parsedRanges[size]?.maxWeight || 0;
      if (w <= limit) {
        weightSize = size;
        break;
      }
    }

    // Find matched size for chest
    let chestSize = '3XL';
    for (const size of sizesOrdered) {
      const limit = parsedRanges[size]?.maxChest || 0;
      if (c <= limit) {
        chestSize = size;
        break;
      }
    }

    // Get max of the three matched sizes
    const heightIndex = sizesOrdered.indexOf(heightSize as any);
    const weightIndex = sizesOrdered.indexOf(weightSize as any);
    const chestIndex = sizesOrdered.indexOf(chestSize as any);

    const maxIndex = Math.max(heightIndex, weightIndex, chestIndex);
    const finalSize = sizesOrdered[maxIndex];

    setCalculatedSize(finalSize);
    setErrorMsg('');
  };

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsList, setReviewsList] = useState([
    {
      id: 'rev-1',
      userName: 'Tanvir Ahmed',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      rating: 5,
      comment: 'Extremely impressed with the Player Version BD Jersey quality! The silicone crest is top notch and the custom print "TANVIR #10" looks 100% official.',
      likesCount: 14,
      createdAt: '2026-02-03'
    },
    {
      id: 'rev-2',
      userName: 'Rafiqul Islam',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      rating: 5,
      comment: 'Fast delivery inside Dhaka within 24 hours. The Real Madrid player fit is snug so order one size up if you prefer loose style.',
      likesCount: 8,
      createdAt: '2026-02-04'
    }
  ]);

  const isLiked = isInWishlist(p.id);
  const currentPrice = p.salePrice || p.price;
  const nameNumberPriceSetting = siteSettings.customNameNumberPrice ?? 250;

  const selectedBadgeObjects = allowedBadges.filter(b => selectedBadges.includes(b.id));
  const patchesPrice = selectedBadgeObjects.reduce((sum, b) => sum + (b.price || 0), 0);
  const addonsPrice = (nameNumberEnabled ? nameNumberPriceSetting : 0) + patchesPrice;
  const finalPrice = currentPrice + addonsPrice;

  const handleAddToCart = () => {
    const sizeRequired = isProductSizeRequired(p) || isProductSizeEnabled(p);

    if (sizeRequired && !selectedSize) {
      setSizeError(true);
      sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Please select a size first.');
      return;
    }

    if (nameNumberEnabled && (!playerName.trim() || !playerNumber.trim())) {
      showToast('Please enter your custom squad name and number');
      return;
    }

    const customPrintPayload = nameNumberEnabled ? {
      playerName: playerName.trim(),
      playerNumber: playerNumber.trim(),
      sleeveBadge: 'None'
    } : undefined;

    const hasBadges = selectedBadges.length > 0;
    const customizationPayload = {
      nameNumber: {
        enabled: nameNumberEnabled,
        name: nameNumberEnabled ? playerName.trim() : undefined,
        number: nameNumberEnabled ? playerNumber.trim() : undefined,
        price: nameNumberEnabled ? nameNumberPriceSetting : 0
      },
      patches: {
        enabled: hasBadges,
        quantity: selectedBadges.length,
        pricePerPatch: selectedBadgeObjects.length > 0 ? selectedBadgeObjects[0].price : 0,
        totalPrice: patchesPrice
      },
      sleeveBadges: hasBadges ? {
        enabled: true,
        selectedBadges: selectedBadgeObjects.map(b => ({
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
        totalPrice: patchesPrice
      } : undefined
    };

    addToCart(p, quantity, selectedSize, selectedColor, customPrintPayload, customizationPayload);
  };

  const handleReviewSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    setTimeout(() => {
      const newRev = {
        id: `rev-${Date.now()}`,
        userName: user?.name || 'Customer',
        userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        rating: reviewRating,
        comment: reviewComment,
        likesCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setReviewsList([newRev, ...reviewsList]);
      setReviewComment('');
      setSubmittingReview(false);
      showToast('Thank you! Your review has been submitted.');
    }, 500);
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 font-semibold mb-6 flex items-center gap-2">
          <span>Home</span>
          <span>/</span>
          <span>{p.categoryName}</span>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-xs">{p.name}</span>
        </div>

        {/* Main Product Layout */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Gallery Column */}
          <div className="space-y-4">
            <div className="relative aspect-square min-[1220px]:aspect-1/1 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center product-image-container">
              {p.images && p.images.length > 0 ? (
                <img
                  src={p.images[activeImageIndex] || p.images[0]}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain p-3 sm:p-4 min-[1220px]:p-0 min-[1220px]:object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                  <Shirt className="w-16 h-16 opacity-40 animate-pulse" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {p.discountPercent && p.discountPercent > 0 && (
                  <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                    {p.discountPercent}% OFF
                  </span>
                )}
                {p.allowCustomPrint && (
                  <span className="bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5" /> SQUAD PRINT READY
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Selectors */}
            {p.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {p.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
                      activeImageIndex === idx ? 'border-emerald-600 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${p.name} - View ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-contain p-1 min-[1220px]:p-0 min-[1220px]:object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Value Props */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-600 font-bold">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <Truck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span>All Bangladesh Delivery Within 3 Days</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span>Official Crest</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <RefreshCw className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span>7 Days Exchange</span>
              </div>
            </div>
          </div>

          {/* Details & Custom Print Options */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md">
                  SKU: {p.sku} | Barcode: {p.barcode}
                </span>
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {p.rating} ({p.reviewCount} Reviews)
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {p.name}
              </h1>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {p.shortDescription || stripHtml(p.description).slice(0, 160)}
              </p>
            </div>

            {/* Price & Stock status */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold block">Current Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    ৳{finalPrice.toLocaleString()}
                  </span>
                  {p.salePrice && (
                    <>
                      <span className="text-sm text-slate-400 line-through font-bold">
                        ৳{p.price.toLocaleString()}
                      </span>
                      {p.discountPercent && p.discountPercent > 0 ? (
                        <span className="text-xs text-red-650 font-black bg-red-50 px-2 py-0.5 rounded-md">
                          {p.discountPercent}% OFF
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                In Stock ({p.stock} Units)
              </span>
            </div>

            {/* Size Selector */}
            {(() => {
              if (!isProductSizeEnabled(p)) return null;
              const availableSizes = getProductAvailableSizes(p);
              const adultSizes = getProductAdultSizes(p);
              const kidsSizes = getProductKidsSizes(p);
              const label = p.sizeOptions?.label || 'Select Size:';

              return (
                <div
                  ref={sizeSectionRef}
                  className={`p-3.5 rounded-2xl transition-all duration-300 ${
                    sizeError
                      ? 'border-2 border-red-500 bg-red-50/70 ring-4 ring-red-200'
                      : 'border border-slate-200/60 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <label className={`text-xs font-extrabold block ${sizeError ? 'text-red-700' : 'text-slate-900'}`}>
                        {label} <span className="text-red-500">*</span>
                      </label>
                      {sizeError && (
                        <span className="text-[11px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Please select a size first.
                        </span>
                      )}
                    </div>
                    {label.toLowerCase().includes('jersey') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSizeCalcOpen(true);
                          setCalculatedSize(null);
                          setErrorMsg('');
                        }}
                        className="text-xs text-emerald-750 hover:text-emerald-850 font-black flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
                      >
                        <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                        Jersey Size Calculator
                      </button>
                    )}
                  </div>

                  {/* If both Adult and Kids sizes exist, show distinct labeled groups */}
                  {adultSizes.length > 0 && kidsSizes.length > 0 ? (
                    <div className="space-y-3.5">
                      {/* Adult Sizes */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Adult Sizes
                        </span>
                        <div className="flex flex-wrap gap-2.5">
                          {adultSizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setSelectedSize(s);
                                setSizeError(false);
                              }}
                              className={`text-xs px-4 py-2 rounded-xl border font-extrabold cursor-pointer transition-all ${
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
                        <div className="flex flex-wrap gap-2.5">
                          {kidsSizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setSelectedSize(s);
                                setSizeError(false);
                              }}
                              className={`text-xs px-4 py-2 rounded-xl border font-extrabold cursor-pointer transition-all ${
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
                    <div className="flex flex-wrap gap-2.5">
                      {availableSizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSelectedSize(s);
                            setSizeError(false);
                          }}
                          className={`text-xs px-4 py-2 rounded-xl border font-extrabold cursor-pointer transition-all ${
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
                    product={p}
                    selectedSize={selectedSize}
                    onSelectSize={(s) => {
                      setSelectedSize(s);
                      setSizeError(false);
                    }}
                  />
                </div>
              );
            })()}

            {/* Modal: Size Calculator */}
            {sizeCalcOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 text-slate-800 relative">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-1.5">
                      <Ruler className="w-4 h-4 text-emerald-600" />
                      Jersey Size Calculator
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSizeCalcOpen(false)}
                      className="text-slate-400 hover:text-slate-900 cursor-pointer border-none bg-transparent"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="font-bold block mb-1">Height (cm)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="e.g. 175"
                          value={heightInput}
                          onChange={(e) => setHeightInput(e.target.value)}
                          className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                        />
                        <span className="text-[10px] text-slate-450 font-bold shrink-0">e.g. 5'9" = ~175cm</span>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold block mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        placeholder="e.g. 72"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="font-bold block mb-1">Chest Measurement (inches)</label>
                      <input
                        type="number"
                        placeholder="e.g. 40"
                        value={chestInput}
                        onChange={(e) => setChestInput(e.target.value)}
                        className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-[11px] text-red-650 font-bold bg-red-50 p-2.5 rounded-lg">
                        {errorMsg}
                      </p>
                    )}

                    {calculatedSize && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2.5">
                        <p className="text-xs font-bold text-slate-650">Recommended Size</p>
                        <p className="text-3xl font-black text-emerald-800">{calculatedSize}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSize(calculatedSize);
                            setSizeCalcOpen(false);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl cursor-pointer border-none shadow-xs text-xs"
                        >
                          Apply Recommended Size
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={handleCalculateSize}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold p-2.5 rounded-xl cursor-pointer border-none shadow-xs"
                      >
                        Calculate Size
                      </button>
                      <button
                        type="button"
                        onClick={() => setSizeCalcOpen(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-2.5 rounded-xl cursor-pointer border-none"
                      >
                        Cancel / Skip
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 border-t pt-3 leading-relaxed font-medium">
                    <strong>Disclaimer:</strong> Size recommendations are approximate. Please check the product size chart before ordering.
                  </div>
                </div>
              </div>
            )}

            {/* Custom squad print options */}
            {p.showCustomNameNumber && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer font-bold select-none text-xs">
                  <input
                    type="checkbox"
                    checked={nameNumberEnabled}
                    onChange={(e) => {
                      setNameNumberEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setPlayerName('');
                        setPlayerNumber('');
                      }
                    }}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-extrabold text-emerald-950 block">CUSTOM SQUAD NAME & NUMBER HEAT-PRESS</span>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">Additional Price: +৳{nameNumberPriceSetting} BDT</span>
                  </div>
                </label>

                {nameNumberEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-in fade-in duration-150 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Name</label>
                      <input
                        type="text"
                        placeholder="Enter Name (e.g. MESSI)"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                        required={nameNumberEnabled}
                        className="w-full bg-white text-slate-900 font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Number</label>
                      <input
                        type="text"
                        placeholder="Enter Number (e.g. 10)"
                        value={playerNumber}
                        onChange={(e) => setPlayerNumber(e.target.value)}
                        required={nameNumberEnabled}
                        className="w-full bg-white text-slate-900 font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sleeve Patches Option */}
            {p.showSleevePatches && allowedBadges.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-950 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Shirt className="w-4 h-4 text-blue-600" />
                    Sleeve / Patches Option
                  </span>
                  {selectedBadges.length > 0 && (
                    <span className="text-[10px] font-black text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full">
                      {selectedBadges.length} Selected (+৳{patchesPrice.toLocaleString()})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-blue-800/80 font-medium">
                  Select official sleeve badges to be heat-pressed onto your jersey:
                </p>

                <div className="space-y-2">
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
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center overflow-hidden shrink-0 ${
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
                              <Shirt className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            )}
                          </div>
                          <span className="font-bold text-xs sm:text-sm truncate">{badge.name}</span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span
                            className={`font-black text-xs sm:text-sm ${
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

            {/* Customization Calculations Breakdown */}
            {(nameNumberEnabled || selectedBadges.length > 0) && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 space-y-1.5 animate-in fade-in duration-150">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Price Calculation</h4>
                <div className="flex justify-between">
                  <span>Product Base Price</span>
                  <span>৳{currentPrice.toLocaleString()} BDT</span>
                </div>
                {nameNumberEnabled && (
                  <div className="flex justify-between text-emerald-700">
                    <span>+ Custom Name & Number</span>
                    <span>৳{nameNumberPriceSetting.toLocaleString()} BDT</span>
                  </div>
                )}
                {selectedBadges.length > 0 && (
                  <div className="flex justify-between text-blue-700">
                    <span>+ Sleeve Badges ({selectedBadges.length} selected)</span>
                    <span>৳{patchesPrice.toLocaleString()} BDT</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-black text-sm text-slate-900">
                  <span>Final Total</span>
                  <span>৳{finalPrice.toLocaleString()} BDT</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-4">
              <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden h-12">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-1 text-slate-700 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 font-bold text-sm text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3.5 py-1 text-slate-700 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={p.isOutOfStock}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm h-12 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>BUY</span>
              </button>

              <button
                onClick={() => toggleWishlist(p)}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  isLiked ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
            </div>

          </div>
        </div>

        {/* Specifications & Reviews Tabs */}
        <div className="mt-10 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
          {/* Full Product Description */}
          {p.description && (
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                PRODUCT DESCRIPTION &amp; DETAILS
              </h3>
              <div
                className="rich-description leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.description) }}
              />
            </div>
          )}

          {p.specifications && p.specifications.length > 0 && (
            <div className={p.description ? "pt-6 border-t border-slate-200" : ""}>
              <h3 className="text-lg font-extrabold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                TECHNICAL SPECIFICATIONS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {p.specifications.map((spec, i) => (
                  <div key={i} className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="font-bold text-slate-600">{spec.key}</span>
                    <span className="font-bold text-slate-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Reviews Section */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  CUSTOMER REVIEWS ({reviewsList.length})
                </h3>
                <p className="text-xs text-slate-500">Verified buyer ratings & match photos</p>
              </div>

              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl text-amber-900 font-extrabold text-sm">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <span>4.9 out of 5 Stars</span>
              </div>
            </div>

            {/* Review submission form */}
            <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Write a Verified Review</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-bold">Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                placeholder="Share your feedback regarding fabric fit, silicone badge quality, custom printing..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
                className="w-full bg-white text-slate-900 text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>

            {/* List */}
            <div className="space-y-4">
              {reviewsList.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={rev.userAvatar}
                        alt={rev.userName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          {rev.userName} <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        </span>
                        <span className="text-[10px] text-slate-400">{rev.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
