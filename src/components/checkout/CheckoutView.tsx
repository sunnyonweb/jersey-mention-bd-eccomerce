import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { ShieldCheck, Truck, CreditCard, CheckCircle, Lock, ArrowLeft, Shirt, AlertCircle, MapPin } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { isProductSizeEnabled, getIncompleteSizeCartItems, isCartItemSizeValid } from '../../utils/productUtils';

export default function CheckoutView() {
  const {
    cart,
    clearCart,
    appliedCoupon,
    couponDiscount,
    setActiveTab,
    setIsCartOpen,
    setCurrentOrderTracking,
    user,
    setUser,
    showToast,
    siteSettings
  } = useStore();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    altPhone: '',
    address: user?.addresses?.[0]?.address || '',
    city: user?.addresses?.[0]?.city || 'Dhaka',
    district: user?.addresses?.[0]?.district || 'Dhaka',
    postalCode: user?.addresses?.[0]?.postalCode || '1205',
    shippingZone: '' as '' | 'inside_dhaka' | 'outside_dhaka',
    notes: ''
  });

  const [isEditingAddress, setIsEditingAddress] = useState(!user?.savedShippingAddress?.address);

  // Sync state and fields when user session is restored
  useEffect(() => {
    if (user?.savedShippingAddress?.address) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.savedShippingAddress?.fullName || user.name || '',
        phone: user.savedShippingAddress?.phone || user.phone || '',
        email: user.email || '',
        address: user.savedShippingAddress?.address || '',
        city: user.savedShippingAddress?.city || '',
        district: user.savedShippingAddress?.district || '',
        postalCode: user.savedShippingAddress?.postalCode || '',
        shippingZone: (user.savedShippingAddress?.zone || '') as '' | 'inside_dhaka' | 'outside_dhaka'
      }));
      setIsEditingAddress(false);
    } else {
      setIsEditingAddress(true);
    }
  }, [user]);

  const handleSaveCheckoutAddress = async () => {
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.district || !formData.shippingZone) {
      showToast('Please fill out all required shipping fields.');
      return;
    }

    const phoneRegex = /^(?:\+88|88)?01[3-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      showToast('Please enter a valid Bangladesh mobile number format (e.g. 01XXXXXXXXX).');
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        postalCode: formData.postalCode,
        zone: formData.shippingZone
      };

      const res = await fetch('/api/user/shipping-address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user!, savedShippingAddress: data.savedShippingAddress });
        showToast('Shipping address saved to account successfully!');
        setIsEditingAddress(false);
      } else {
        showToast(data.message || 'Failed to save address.');
      }
    } catch (err) {
      showToast('Server connection error.');
    }
  };

  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [paymentType, setPaymentType] = useState<'25_percent_advance' | '100_percent_advance' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((sum, item) => {
    const basePrice = item.product.salePrice || item.product.price;
    const nameNumberAddon = item.customization?.nameNumber?.enabled ? (item.customization.nameNumber.price) : 0;
    const patchesAddon = item.customization?.sleeveBadges?.enabled 
      ? (item.customization.sleeveBadges.totalPrice) 
      : (item.customization?.patches?.enabled ? (item.customization.patches.totalPrice) : 0);
    const itemTotalPrice = basePrice + nameNumberAddon + patchesAddon;
    return sum + itemTotalPrice * item.quantity;
  }, 0);

  const freeDeliveryEnabled = siteSettings?.freeDeliveryEnabled !== false;
  const FREE_SHIPPING_THRESHOLD = siteSettings?.freeShippingThreshold ?? 3000;
  const isFreeShipping = freeDeliveryEnabled && (subtotal >= FREE_SHIPPING_THRESHOLD);
  const shippingFee = isFreeShipping ? 0 : (formData.shippingZone === 'inside_dhaka' 
    ? (siteSettings?.insideDhakaShippingFee ?? 80) 
    : (siteSettings?.outsideDhakaShippingFee ?? 150));
  const grandTotal = Math.max(0, subtotal + shippingFee - couponDiscount);
  const payAmount = paymentType ? (paymentType === '25_percent_advance' ? Math.round(grandTotal * 0.25) : grandTotal) : 0;
  const displayPayAmount = isNaN(payAmount) || payAmount <= 0 ? '0' : payAmount.toLocaleString();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    const incompleteItems = getIncompleteSizeCartItems(cart);
    if (incompleteItems.length > 0) {
      showToast('Please select a size first.');
      setIsCartOpen(true);
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address) {
      showToast('Please fill out all required shipping fields.');
      return;
    }
    if (!formData.shippingZone) {
      showToast('Please select your delivery location.');
      return;
    }

    const phoneRegex = /^(?:\+88|88)?01[3-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      showToast('Please enter a valid delivery mobile number format (e.g. 01XXXXXXXXX).');
      return;
    }

    if (!paymentType) {
      showToast('Please select a payment option before placing your order.');
      return;
    }

    if (!senderNumber.trim()) {
      showToast('Mobile Number is required');
      return;
    }

    if (!phoneRegex.test(senderNumber.trim())) {
      showToast('Please enter a valid Bangladesh mobile number format (e.g. 01XXXXXXXXX) for sender number.');
      return;
    }

    if (!transactionId.trim()) {
      showToast('Transaction ID / TrxID is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: formData.fullName,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        paymentType,
        items: cart.map((i) => {
          const basePrice = i.product.salePrice || i.product.price;
          const nameNumberAddon = i.customization?.nameNumber?.enabled ? (i.customization.nameNumber.price) : 0;
          const patchesAddon = i.customization?.sleeveBadges?.enabled 
            ? (i.customization.sleeveBadges.totalPrice) 
            : (i.customization?.patches?.enabled ? (i.customization.patches.totalPrice) : 0);
          const itemPrice = basePrice + nameNumberAddon + patchesAddon;
          return {
            productId: i.product.id,
            sku: i.product.sku,
            productName: i.product.name,
            productImage: i.product.images && i.product.images.length > 0 && i.product.images[0] ? i.product.images[0] : '',
            basePrice: i.product.price,
            salePrice: i.product.salePrice,
            price: itemPrice,
            quantity: i.quantity,
            size: i.selectedSize,
            color: i.selectedColor?.name,
            customPrint: i.customPrint,
            customization: i.customization
          };
        }),
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          postalCode: formData.postalCode,
          zone: formData.shippingZone
        },
        paymentMethod,
        paymentStatus: 'pending',
        paymentVerificationStatus: 'pending',
        paymentMobileNumber: senderNumber.trim(),
        transactionId: transactionId.trim(),
        advancePaymentPercentage: paymentType === '100_percent_advance' ? 100 : 25,
        amountPaid: payAmount,
        remainingAmount: Math.max(0, grandTotal - payAmount),
        paymentDetails: {
          transactionId: transactionId.trim(),
          senderNumber: senderNumber.trim(),
          paidAt: new Date().toISOString()
        },
        subtotal,
        discount: couponDiscount,
        couponCode: appliedCoupon?.code,
        shippingFee,
        deliveryLocation: formData.shippingZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka',
        totalAmount: grandTotal,
        notes: formData.notes
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (data.success) {
        clearCart();
        setCurrentOrderTracking(data.order);
        showToast(`Order Placed Successfully! Order #${data.order.orderNumber}`);
        setActiveTab('order_tracking');
      } else {
        showToast(data.message || 'Failed to place order');
      }
    } catch (err) {
      showToast('Error connecting to payment gateway');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4 space-y-4">
        <h2 className="text-2xl font-black text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add match kits to your cart before proceeding to checkout.</p>
        <button
          onClick={() => setActiveTab('catalog')}
          className="bg-emerald-600 text-white font-bold text-xs px-6 py-3 rounded-full hover:bg-emerald-700 cursor-pointer"
        >
          Explore Store Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setActiveTab('catalog')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </button>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted Checkout
          </div>
        </div>

        {/* Action Required Banner if Any Cart Item is Missing Required Size */}
        {getIncompleteSizeCartItems(cart).length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-red-800 tracking-wide">Action Required: Missing Product Size</h4>
                <p className="text-xs font-bold text-red-700 mt-0.5">
                  Please select a size for all required products before checkout.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 border-none shadow-sm"
            >
              Select Size in Cart
            </button>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Shipping & Payment Form Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Delivery Address */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Truck className="w-5 h-5 text-emerald-600" />
                1. Delivery Shipping Information
              </h2>

              {!isEditingAddress && user?.savedShippingAddress?.address ? (
                /* SAVED SHIPPING ADDRESS DISPLAY MODE */
                <div className="space-y-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs font-semibold text-slate-700 leading-relaxed text-left">
                    <div className="text-emerald-700 font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Saved Shipping Address
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-200/50">
                      <div>
                        <span className="text-slate-400 block font-bold text-[9px] uppercase">Full Name</span>
                        <span className="text-slate-955 font-black text-sm">{formData.fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[9px] uppercase">Mobile Number</span>
                        <span className="text-slate-955 font-black text-sm">{formData.phone}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-bold text-[9px] uppercase">Shipping Address</span>
                      <span className="text-slate-955 font-black text-xs">{formData.address}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/50">
                      <div>
                        <span className="text-slate-400 block font-bold text-[9px] uppercase">City</span>
                        <span className="text-slate-955 font-extrabold">{formData.city}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[9px] uppercase">District</span>
                        <span className="text-slate-955 font-extrabold">{formData.district}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[9px] uppercase">Location Zone</span>
                        <span className="text-emerald-750 font-black uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded w-max block">
                          {formData.shippingZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
                        </span>
                      </div>
                    </div>

                    {formData.postalCode && (
                      <div className="pt-2 border-t border-slate-200/50">
                        <span className="text-slate-400 block font-bold text-[9px] uppercase">Postal Code</span>
                        <span className="text-slate-955 font-extrabold">{formData.postalCode}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors border-none"
                  >
                    Edit Address
                  </button>
                </div>
              ) : (
                /* EDIT/INPUT MODE */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Tanvir Ahmed"
                        className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. 01700000000"
                        className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="e.g. tanvir@example.com"
                        className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Alternative Phone</label>
                      <input
                        type="tel"
                        name="altPhone"
                        value={formData.altPhone}
                        onChange={handleInputChange}
                        placeholder="Optional backup phone"
                        className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Street Address *</label>
                    <textarea
                      rows={2}
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="House #, Road #, Sector/Area, Thana"
                      className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">City / Division *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-slate-50 text-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">District *</label>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-slate-50 text-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Select Delivery Location: *</label>
                      <select
                        name="shippingZone"
                        value={formData.shippingZone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 text-slate-900 text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold cursor-pointer"
                      >
                        <option value="">Select Delivery Location:</option>
                        <option value="inside_dhaka">Inside Dhaka (৳{siteSettings?.insideDhakaShippingFee ?? 80})</option>
                        <option value="outside_dhaka">Outside Dhaka (৳{siteSettings?.outsideDhakaShippingFee ?? 150})</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="Postal Code"
                        className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {user && (
                    <div className="pt-2 flex gap-3">
                      {user.savedShippingAddress?.address && (
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-3 rounded-xl cursor-pointer transition-colors border-none"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveCheckoutAddress}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer transition-colors border-none shadow-sm"
                      >
                        Save Address
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Payment Method & Details */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  2. Choose Payment Method
                </h2>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <label
                    onClick={() => setPaymentMethod('bkash')}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'bkash'
                        ? 'border-pink-650 bg-pink-50/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'bkash'}
                      onChange={() => setPaymentMethod('bkash')}
                      className="sr-only"
                    />
                    <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                      b
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">bKash Personal</span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('nagad')}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'nagad'
                        ? 'border-orange-600 bg-orange-50/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'nagad'}
                      onChange={() => setPaymentMethod('nagad')}
                      className="sr-only"
                    />
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
                      N
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">Nagad Personal</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-3">3. Choose Advance Payment Amount</h3>
                <div className="grid grid-cols-1 gap-3">
                  <label
                    onClick={() => setPaymentType('25_percent_advance')}
                    className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      paymentType === '25_percent_advance'
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      checked={paymentType === '25_percent_advance'}
                      onChange={() => setPaymentType('25_percent_advance')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm block">25% Advance Payment</span>
                      <span className="text-xs text-slate-500 mt-1 block">
                        Pay 25% of total amount in advance. The remaining 75% will be paid as Cash on Delivery.
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setPaymentType('100_percent_advance')}
                    className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      paymentType === '100_percent_advance'
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      checked={paymentType === '100_percent_advance'}
                      onChange={() => setPaymentType('100_percent_advance')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm block">100% Advance Payment</span>
                      <span className="text-xs text-slate-500 mt-1 block">
                        Pay 100% full amount in advance for priority processing.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {paymentType && (
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 font-bold text-xs">
                   <div className="border-b pb-2 space-y-2">
                     <div className="text-slate-800 text-sm font-black flex items-center gap-1.5">
                       <span>Amount to Pay:</span>
                       <span className="text-emerald-705 font-extrabold text-base">৳{displayPayAmount}</span>
                     </div>
 
                     <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3 font-bold">
                       <div>
                         <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider mb-0.5">English</span>
                         <p className="text-slate-850 text-xs font-semibold leading-relaxed">
                           {paymentMethod === 'bkash' ? (
                             <>
                               Send payment to bKash Personal Number: <strong className="text-slate-900 font-black">{siteSettings.bkashPersonalNumber || '01571305964'}</strong>
                               <br />
                               Please send <strong className="text-emerald-750">৳{displayPayAmount}</strong> to the above number using Send Money and enter the TrxID below.
                             </>
                           ) : (
                             <>
                               Send payment to Nagad Personal Number: <strong className="text-slate-900 font-black">{siteSettings.nagadPersonalNumber || '01571305964'}</strong>
                               <br />
                               Please send <strong className="text-emerald-750">৳{displayPayAmount}</strong> to the above number using Send Money and enter the TrxID below.
                             </>
                           )}
                         </p>
                       </div>
 
                       <div className="border-t pt-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider mb-0.5">Bangla</span>
                         <p className="text-slate-850 text-xs font-semibold leading-relaxed">
                           {paymentMethod === 'bkash' ? (
                             <>
                               bKash Personal Number: <strong className="text-slate-900 font-black">{siteSettings.bkashPersonalNumber || '01571305964'}</strong> নম্বরে পেমেন্ট পাঠান।
                               <br />
                               উপরের নম্বরে Send Money ব্যবহার করে <strong className="text-emerald-750">৳{displayPayAmount}</strong> পাঠিয়ে নিচের TrxID দিন।
                             </>
                           ) : (
                             <>
                               Nagad Personal Number: <strong className="text-slate-900 font-black">{siteSettings.nagadPersonalNumber || '01571305964'}</strong> নম্বরে পেমেন্ট পাঠান।
                               <br />
                               উপরের নম্বরে Send Money ব্যবহার করে <strong className="text-emerald-750">৳{displayPayAmount}</strong> পাঠিয়ে নিচের TrxID দিন।
                             </>
                           )}
                         </p>
                       </div>
                     </div>
                   </div>
 
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number *</label>
                       <input
                         type="tel"
                         value={senderNumber}
                         onChange={(e) => setSenderNumber(e.target.value)}
                         required
                         placeholder="01XXXXXXXXX"
                         className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden"
                       />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-slate-700 block mb-1">Transaction ID / TrxID *</label>
                       <input
                         type="text"
                         value={transactionId}
                         onChange={(e) => setTransactionId(e.target.value)}
                         required
                         placeholder="Enter Transaction ID"
                         className="w-full bg-white text-slate-900 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-hidden font-mono uppercase"
                       />
                     </div>
                   </div>
                 </div>
              )}

              {!paymentType && (
                <p className="text-xs text-red-500 font-extrabold animate-pulse">
                  ⚠️ Please select an advance payment option before placing your order.
                </p>
              )}
            </div>

          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 sticky top-24">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                Order Summary ({cart.length} Items)
              </h2>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const basePrice = item.product.salePrice || item.product.price;
                  const nameNumberAddon = item.customization?.nameNumber?.enabled ? (item.customization.nameNumber.price) : 0;
                  const patchesAddon = item.customization?.sleeveBadges?.enabled 
                    ? (item.customization.sleeveBadges.totalPrice) 
                    : (item.customization?.patches?.enabled ? (item.customization.patches.totalPrice) : 0);
                  const itemTotalPrice = basePrice + nameNumberAddon + patchesAddon;
                  return (
                    <div key={item.id} className="flex gap-3 text-xs">
                      {item.product.images && item.product.images.length > 0 && item.product.images[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 object-contain p-1 rounded-xl bg-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                          <Shirt className="w-5 h-5 opacity-45" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 line-clamp-1">{item.product.name}</h4>
                        {isProductSizeEnabled(item.product) ? (
                          item.selectedSize ? (
                            <p className="text-slate-600 text-[11px] font-bold">
                              Qty: {item.quantity} | Size: <strong className="text-slate-950 font-black">{item.selectedSize}</strong>
                            </p>
                          ) : (
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <span className="text-red-600 font-extrabold text-[11px] flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" /> Size Required
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsCartOpen(true)}
                                className="text-[10px] text-emerald-700 underline font-black cursor-pointer bg-transparent border-none p-0"
                              >
                                Select Size
                              </button>
                            </div>
                          )
                        ) : (
                          <p className="text-slate-500 text-[11px]">
                            Qty: {item.quantity}
                          </p>
                        )}
                        {item.customization?.nameNumber?.enabled && (
                          <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                            <Shirt className="w-3 h-3" /> Print: {item.customization.nameNumber.name} #{item.customization.nameNumber.number} (+৳{item.customization.nameNumber.price})
                          </p>
                        )}
                        {item.customization?.sleeveBadges?.enabled && (
                          <div className="text-[10px] text-blue-700 font-bold mt-1 space-y-1 bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-black">
                                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Sleeve Badges ({item.customization.sleeveBadges.quantity}):
                              </span>
                              <span className="font-extrabold text-blue-900">+৳{item.customization.sleeveBadges.totalPrice}</span>
                            </div>
                            <div className="space-y-0.5 pt-0.5">
                              {item.customization.sleeveBadges.selectedBadges.map((b: any, idx: number) => {
                                const img = b.badgeImage || b.image;
                                const name = b.badgeName || b.name;
                                const price = b.badgePrice ?? b.price;
                                return (
                                  <div key={idx} className="flex items-center justify-between text-[9px] text-slate-700 pl-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="w-3.5 h-3.5 rounded bg-white border border-blue-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        {img ? (
                                          <img src={img} alt={name} className="w-full h-full object-contain" />
                                        ) : (
                                          <Shirt className="w-2.5 h-2.5 text-blue-500" />
                                        )}
                                      </div>
                                      <span className="truncate font-semibold">{name}</span>
                                    </div>
                                    {price !== undefined && (
                                      <span className="text-blue-700 font-bold shrink-0">+৳{price}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {!item.customization?.sleeveBadges?.enabled && item.customization?.patches?.enabled && (
                          <p className="text-[10px] text-blue-700 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle className="w-3 h-3" /> Patches: {item.customization.patches.quantity} Patch(es) (+৳{item.customization.patches.totalPrice})
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-slate-900">
                        ৳{(itemTotalPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-bold text-slate-900">
                    {isFreeShipping ? (
                      <span className="text-emerald-600 font-black">Free Delivery</span>
                    ) : (
                      `৳${shippingFee}`
                    )}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Discount</span>
                    <span className="font-bold">-৳{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-emerald-700">৳{grandTotal.toLocaleString()}</span>
                </div>
                {paymentType && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 animate-in fade-in duration-150 font-bold text-xs">
                    <div className="flex justify-between text-emerald-700 font-extrabold">
                      <span>Advance Amount Paid</span>
                      <span>৳{(paymentType === '25_percent_advance' ? Math.round(grandTotal * 0.25 * 100) / 100 : grandTotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Remaining Balance (COD)</span>
                      <span>৳{(paymentType === '25_percent_advance' ? Math.round((grandTotal - Math.round(grandTotal * 0.25 * 100) / 100) * 100) / 100 : 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{isSubmitting ? 'PROCESSING ORDER...' : `PLACE ORDER (PAY WITH ${paymentMethod.toUpperCase()})`}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
