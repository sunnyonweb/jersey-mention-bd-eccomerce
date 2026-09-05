import { create } from 'zustand';
import {
  User,
  Product,
  Category,
  CartItem,
  Coupon,
  SiteSettings,
  SystemNotification,
  CustomJerseyPrint,
  Order,
  ActiveTab,
  SleeveBadgeOption
} from '../types';
import { isProductSizeEnabled, isProductSizeRequired } from '../utils/productUtils';

export interface AddedToCartPayload {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: any;
  customPrint?: CustomJerseyPrint;
  customization?: CartItem['customization'];
  unitPrice: number;
}

interface AppState {
  // Navigation & Views
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Drawer / Modals State
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  isAddedToCartModalOpen: boolean;
  addedToCartData: AddedToCartPayload | null;
  openAddedToCartModal: (data: AddedToCartPayload) => void;
  closeAddedToCartModal: () => void;
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;

  // Selected Product for Detail / Modal
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;

  // Order Tracking State
  currentOrderTracking: Order | null;
  setCurrentOrderTracking: (ord: Order | null) => void;

  // Auth State
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  isAuthLoading: boolean;
  setIsAuthLoading: (loading: boolean) => void;
  authPrompt: { message: string; returnTab: ActiveTab } | null;
  authPromptMode: 'login' | 'signup';
  requireLogin: (message: string) => void;
  closeAuthPrompt: () => void;
  setAuthPromptMode: (mode: 'login' | 'signup') => void;
  completeAuthPrompt: () => void;

  // Cart Management
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: any, customPrint?: CustomJerseyPrint, customization?: CartItem['customization']) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  updateCartItemSize: (cartItemId: string, newSize: string) => Promise<void>;
  clearCart: () => void;

  // Coupon State
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  setAppliedCoupon: (coupon: Coupon | null, discount: number) => void;

  // Wishlist
  wishlist: Product[];
  toggleWishlist: (p: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  loadUserCartAndWishlist: () => Promise<void>;
  mergeGuestCartAndWishlist: () => Promise<void>;

  // Recently Viewed & Search
  recentlyViewed: Product[];
  addRecentlyViewed: (p: Product) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchHistory: string[];
  addSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;

  // Filters State
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (sub: string) => void;
  selectedBrand: string;
  setSelectedBrand: (b: string) => void;

  // Dynamic Categories
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  navigateTo: (path: string) => void;
  syncPath: (pathname: string) => void;

  // Site Settings
  siteSettings: SiteSettings;
  updateSiteSettings: (s: Partial<SiteSettings>) => void;

  // Toast Notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;

  // Sleeve Badge Options
  sleeveBadgeOptions: SleeveBadgeOption[];
  setSleeveBadgeOptions: (options: SleeveBadgeOption[]) => void;
  fetchSleeveBadgeOptions: () => Promise<void>;
  fetchAdminSleeveBadgeOptions: () => Promise<void>;
  addSleeveBadgeOption: (badge: Partial<SleeveBadgeOption>) => Promise<boolean>;
  updateSleeveBadgeOption: (id: string, body: Partial<SleeveBadgeOption>) => Promise<boolean>;
  deleteSleeveBadgeOption: (id: string) => Promise<{ success: boolean; message?: string }>;
}

function getInitialStateFromPath() {
  if (typeof window === 'undefined') {
    return { activeTab: 'home' as ActiveTab, selectedCategory: '', selectedSubcategory: '' };
  }
  const pathname = window.location.pathname.split('?')[0];
  const parts = pathname.split('/').filter(Boolean);

  let activeTab: ActiveTab = 'home';
  let category = '';
  let subcategory = '';

  if (parts.length === 0 || parts[0] === 'home') {
    activeTab = 'home';
  } else if (parts[0] === 'shop') {
    activeTab = 'catalog';
  } else if (parts[0] === 'category') {
    activeTab = 'category_detail';
    category = parts[1] || '';
  } else if (parts[0] === 'clubs' || parts[0] === 'national-teams') {
    if (parts.length === 1) {
      activeTab = 'clubs';
    } else if (parts.length === 2) {
      activeTab = 'club_category';
      category = parts[1];
    } else if (parts.length === 3) {
      activeTab = 'club_category';
      category = parts[1];
      subcategory = parts[2];
    }
  } else if (parts[0] === 'checkout') {
    activeTab = 'checkout';
  } else if (parts[0] === 'order_tracking' || parts[0] === 'track-order') {
    activeTab = 'order_tracking';
  } else if (parts[0] === 'wishlist') {
    activeTab = 'wishlist';
  } else if (parts[0] === 'profile') {
    activeTab = 'profile';
  } else if (parts[0] === 'admin') {
    activeTab = 'admin';
  } else if (parts[0] === 'reset-password') {
    activeTab = 'reset_password';
  } else if (parts[0] === 'search') {
    activeTab = 'search';
    const params = new URLSearchParams(window.location.search || '');
    category = params.get('q') || '';
  } else {
    activeTab = 'catalog';
    category = parts[0];
  }

  return { activeTab, selectedCategory: category, selectedSubcategory: subcategory };
}

export function getInitialGuestCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('guest_cart');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item === 'object' && item.id && item.productId && item.product && typeof item.quantity === 'number' && item.quantity > 0
    );
  } catch (e) {
    console.error('Error parsing guest_cart from localStorage:', e);
    return [];
  }
}

export function getInitialGuestWishlist(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('guest_wishlist');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === 'object' && item.id && item.name);
  } catch (e) {
    console.error('Error parsing guest_wishlist from localStorage:', e);
    return [];
  }
}

export function saveGuestCart(cart: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('guest_cart', JSON.stringify(cart));
  } catch (e) {
    console.error('Error saving guest_cart to localStorage:', e);
  }
}

export function saveGuestWishlist(wishlist: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('guest_wishlist', JSON.stringify(wishlist));
  } catch (e) {
    console.error('Error saving guest_wishlist to localStorage:', e);
  }
}

export const useStore = create<AppState>((set, get) => {
  const initial = getInitialStateFromPath();
  return {
    activeTab: initial.activeTab,
    setActiveTab: (tab) => set({ activeTab: tab }),

  isCartOpen: false,
  setIsCartOpen: (open) => set({ isCartOpen: open }),

  isAiModalOpen: false,
  setIsAiModalOpen: (open) => set({ isAiModalOpen: open }),

  isAddedToCartModalOpen: false,
  addedToCartData: null,
  openAddedToCartModal: (data) => set({ addedToCartData: data, isAddedToCartModalOpen: true }),
  closeAddedToCartModal: () => set({ isAddedToCartModalOpen: false, addedToCartData: null }),

  quickViewProduct: null,
  openQuickView: (product) => set({ quickViewProduct: product }),
  closeQuickView: () => set({ quickViewProduct: null }),

  selectedProduct: null,
  setSelectedProduct: (p) => set({ selectedProduct: p }),

  currentOrderTracking: null,
  setCurrentOrderTracking: (ord) => set({ currentOrderTracking: ord }),

  user: null,
  setUser: (u) => set({ user: u }),
  logout: () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    const guestCart = getInitialGuestCart();
    const guestWishlist = getInitialGuestWishlist();
    set({ user: null, cart: guestCart, wishlist: guestWishlist, activeTab: 'home' });
  },
  isAuthLoading: true,
  setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),
  authPrompt: null,
  authPromptMode: 'login',
  requireLogin: (message) => set({ authPrompt: { message, returnTab: get().activeTab } }),
  closeAuthPrompt: () => set({ authPrompt: null }),
  setAuthPromptMode: (mode) => set({ authPromptMode: mode }),
  completeAuthPrompt: () => {
    const prompt = get().authPrompt;
    if (prompt) {
      set({ authPrompt: null, activeTab: prompt.returnTab });
    }
  },

  cart: getInitialGuestCart(),

  addToCart: async (product, quantity = 1, selectedSize, selectedColor, customPrint, customization) => {
    const user = get().user;

    const sizeRequired = isProductSizeRequired(product) || isProductSizeEnabled(product);
    if (sizeRequired && (!selectedSize || !selectedSize.trim())) {
      get().showToast('Please select a size first.');
      return;
    }

    const size = sizeRequired ? selectedSize?.trim() : undefined;
    const color = selectedColor || product.colors[0] || { name: 'Default', hex: '#000' };

    const badgeIdsStr = customization?.sleeveBadges?.enabled 
      ? customization.sleeveBadges.selectedBadges.map((b: any) => b.badgeId).sort().join(',') 
      : '';

    const itemId = `cart-${product.id}-${size || 'nosize'}-${color.name}-${customPrint?.playerName || ''}-${customization?.nameNumber?.name || ''}-${badgeIdsStr || customization?.patches?.quantity || 0}`;

    const basePrice = product.salePrice || product.price;
    const nameNumberPrice = customization?.nameNumber?.enabled ? (customization.nameNumber.price || 0) : 0;
    const patchesPrice = customization?.sleeveBadges?.enabled 
      ? (customization.sleeveBadges.totalPrice || 0) 
      : (customization?.patches?.enabled ? (customization.patches.totalPrice || 0) : 0);
    const unitPrice = basePrice + nameNumberPrice + patchesPrice;

    const addedPayload: AddedToCartPayload = {
      product,
      quantity,
      selectedSize: size,
      selectedColor: color,
      customPrint,
      customization,
      unitPrice
    };

    if (!user) {
      const currentCart = [...get().cart];
      const existingItemIndex = currentCart.findIndex((item) => item.id === itemId);
      if (existingItemIndex > -1) {
        currentCart[existingItemIndex].quantity += quantity;
      } else {
        const newItem: CartItem = {
          id: itemId,
          productId: product.id,
          product,
          quantity,
          selectedSize: size,
          selectedColor: color,
          customPrint,
          customization
        };
        currentCart.push(newItem);
      }
      set({ 
        cart: currentCart,
        addedToCartData: addedPayload,
        isAddedToCartModalOpen: true
      });
      saveGuestCart(currentCart);
      get().showToast(`Added "${product.name.slice(0, 25)}..." to cart`);
      return;
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          selectedSize: size,
          selectedColor: color,
          customPrint,
          customization
        })
      });
      const data = await res.json();
      if (data.success) {
        set({ 
          cart: data.cart,
          addedToCartData: addedPayload,
          isAddedToCartModalOpen: true
        });
        saveGuestCart(data.cart);
        get().showToast(`Added "${product.name.slice(0, 25)}..." to cart`);
      } else {
        get().showToast(data.message || 'Failed to add to cart');
      }
    } catch (err) {
      get().showToast('Network error, failed to update cart');
    }
  },

  removeFromCart: async (cartItemId) => {
    const user = get().user;
    if (!user) {
      const updatedCart = get().cart.filter((i) => i.id !== cartItemId);
      set({ cart: updatedCart });
      saveGuestCart(updatedCart);
      get().showToast('Item removed from shopping cart');
    } else {
      try {
        const res = await fetch(`/api/cart/${cartItemId}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          set({ cart: data.cart });
          saveGuestCart(data.cart);
          get().showToast('Item removed from shopping cart');
        } else {
          get().showToast(data.message || 'Failed to remove from cart');
        }
      } catch (err) {
        get().showToast('Network error, failed to update cart');
      }
    }
  },

  updateCartQuantity: async (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(cartItemId);
      return;
    }

    const user = get().user;
    if (!user) {
      const updatedCart = get().cart.map((i) => (i.id === cartItemId ? { ...i, quantity } : i));
      set({ cart: updatedCart });
      saveGuestCart(updatedCart);
    } else {
      try {
        const res = await fetch(`/api/cart/${cartItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity })
        });
        const data = await res.json();
        if (data.success) {
          set({ cart: data.cart });
          saveGuestCart(data.cart);
        } else {
          get().showToast(data.message || 'Failed to update cart quantity');
        }
      } catch (err) {
        get().showToast('Network error, failed to update cart');
      }
    }
  },

  updateCartItemSize: async (cartItemId, newSize) => {
    const user = get().user;
    const currentCart = [...get().cart];
    const targetItem = currentCart.find((i) => i.id === cartItemId);
    if (!targetItem) return;

    const updatedSize = (newSize || '').trim();
    if (!updatedSize) return;

    const color = targetItem.selectedColor || targetItem.product.colors?.[0] || { name: 'Default', hex: '#000' };
    const badgeIdsStr = targetItem.customization?.sleeveBadges?.enabled 
      ? targetItem.customization.sleeveBadges.selectedBadges.map((b: any) => b.badgeId).sort().join(',') 
      : '';

    const newItemId = `cart-${targetItem.product.id}-${updatedSize}-${color.name}-${targetItem.customPrint?.playerName || ''}-${targetItem.customization?.nameNumber?.name || ''}-${badgeIdsStr || targetItem.customization?.patches?.quantity || 0}`;

    if (!user) {
      const existingIdx = currentCart.findIndex((i) => i.id === newItemId);
      let updatedCart: CartItem[];
      if (existingIdx > -1 && currentCart[existingIdx].id !== cartItemId) {
        currentCart[existingIdx].quantity += targetItem.quantity;
        updatedCart = currentCart.filter((i) => i.id !== cartItemId);
      } else {
        updatedCart = currentCart.map((i) => (i.id === cartItemId ? { ...i, id: newItemId, selectedSize: updatedSize } : i));
      }
      set({ cart: updatedCart });
      saveGuestCart(updatedCart);
      get().showToast(`Size updated to ${updatedSize}`);
    } else {
      try {
        const res = await fetch(`/api/cart/${cartItemId}/size`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ size: updatedSize })
        });
        const data = await res.json();
        if (data.success) {
          set({ cart: data.cart });
          saveGuestCart(data.cart);
          get().showToast(`Size updated to ${updatedSize}`);
        } else {
          get().showToast(data.message || 'Failed to update item size');
        }
      } catch (err) {
        get().showToast('Network error, failed to update size');
      }
    }
  },

  clearCart: async () => {
    const user = get().user;
    if (!user) {
      set({ cart: [], appliedCoupon: null, couponDiscount: 0 });
      saveGuestCart([]);
    } else {
      try {
        const res = await fetch('/api/cart', {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          set({ cart: [], appliedCoupon: null, couponDiscount: 0 });
          saveGuestCart([]);
        }
      } catch (err) {
        get().showToast('Network error, failed to clear cart');
      }
    }
  },

  appliedCoupon: null,
  couponDiscount: 0,
  setAppliedCoupon: (coupon, discount) => set({ appliedCoupon: coupon, couponDiscount: discount }),

  wishlist: getInitialGuestWishlist(),
  toggleWishlist: async (product) => {
    const user = get().user;
    const list = get().wishlist;
    const exists = list.some((p) => p.id === product.id);

    if (!user) {
      let updatedWishlist = [...list];
      if (exists) {
        updatedWishlist = updatedWishlist.filter((p) => p.id !== product.id);
        get().showToast('Removed from wishlist');
      } else {
        updatedWishlist.push(product);
        get().showToast('Saved to wishlist');
      }
      set({ wishlist: updatedWishlist });
      saveGuestWishlist(updatedWishlist);
      return;
    }

    try {
      const url = exists ? `/api/wishlist/${product.id}` : '/api/wishlist';
      const method = exists ? 'DELETE' : 'POST';
      const body = exists ? undefined : JSON.stringify({ productId: product.id });

      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body
      });
      const data = await res.json();
      if (data.success) {
        set({ wishlist: data.wishlist });
        saveGuestWishlist(data.wishlist);
        get().showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist');
      } else {
        get().showToast(data.message || 'Failed to update wishlist');
      }
    } catch (err) {
      get().showToast('Network error, failed to update wishlist');
    }
  },
  isInWishlist: (productId) => get().wishlist.some((p) => p.id === productId),
  clearWishlist: async () => {
    const user = get().user;
    if (!user) {
      set({ wishlist: [] });
      saveGuestWishlist([]);
      return;
    }
    try {
      const res = await fetch('/api/wishlist', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        set({ wishlist: [] });
        saveGuestWishlist([]);
      } else {
        get().showToast(data.message || 'Failed to clear wishlist');
      }
    } catch (err) {
      get().showToast('Network error, failed to clear wishlist');
    }
  },

  loadUserCartAndWishlist: async () => {
    try {
      const [cartRes, wishlistRes] = await Promise.all([
        fetch('/api/cart'),
        fetch('/api/wishlist')
      ]);
      const [cartData, wishlistData] = await Promise.all([
        cartRes.json(),
        wishlistRes.json()
      ]);
      if (cartData.success) {
        set({ cart: cartData.cart });
        saveGuestCart(cartData.cart);
      }
      if (wishlistData.success) {
        set({ wishlist: wishlistData.wishlist });
        saveGuestWishlist(wishlistData.wishlist);
      }
    } catch (err) {
      console.error('Error loading user cart/wishlist:', err);
    }
  },

  mergeGuestCartAndWishlist: async () => {
    const guestCart = get().cart;
    const guestWishlistProductIds = get().wishlist.map((p) => p.id);

    try {
      const [cartRes, wishlistRes] = await Promise.all([
        fetch('/api/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItems: guestCart })
        }),
        fetch('/api/wishlist/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wishlistProductIds: guestWishlistProductIds })
        })
      ]);
      const [cartData, wishlistData] = await Promise.all([
        cartRes.json(),
        wishlistRes.json()
      ]);
      if (cartData.success) {
        set({ cart: cartData.cart });
        saveGuestCart(cartData.cart);
      }
      if (wishlistData.success) {
        set({ wishlist: wishlistData.wishlist });
        saveGuestWishlist(wishlistData.wishlist);
      }
    } catch (err) {
      console.error('Error merging guest cart/wishlist:', err);
    }
  },

  recentlyViewed: [],
  addRecentlyViewed: (product) => {
    const current = get().recentlyViewed.filter((p) => p.id !== product.id);
    set({ recentlyViewed: [product, ...current].slice(0, 10) });
  },

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  searchHistory: ['Bangladesh National Jersey', 'Real Madrid 2026', 'Cricket Polo', 'Retro 1999'],
  addSearchHistory: (term) => {
    if (!term.trim()) return;
    const current = get().searchHistory.filter((t) => t.toLowerCase() !== term.toLowerCase());
    set({ searchHistory: [term, ...current].slice(0, 6) });
  },
  clearSearchHistory: () => set({ searchHistory: [] }),

  selectedCategory: initial.selectedCategory,
  setSelectedCategory: (c) => set({ selectedCategory: c }),
  selectedSubcategory: initial.selectedSubcategory,
  setSelectedSubcategory: (sub) => set({ selectedSubcategory: sub }),
  selectedBrand: '',
  setSelectedBrand: (b) => set({ selectedBrand: b }),

  categories: [],
  setCategories: (cats) => set({ categories: cats }),

  navigateTo: (path) => {
    window.history.pushState({}, '', path);
    get().syncPath(path);
  },

  syncPath: (path) => {
    const pathname = path.split('?')[0];
    const parts = pathname.split('/').filter(Boolean);

    let activeTab: ActiveTab = 'home';
    let category = '';
    let subcategory = '';

    if (parts.length === 0 || parts[0] === 'home') {
      activeTab = 'home';
    } else if (parts[0] === 'shop') {
      activeTab = 'catalog';
    } else if (parts[0] === 'category') {
      activeTab = 'category_detail';
      category = parts[1] || '';
    } else if (parts[0] === 'clubs' || parts[0] === 'national-teams') {
      if (parts.length === 1) {
        activeTab = 'clubs';
      } else if (parts.length === 2) {
        activeTab = 'club_category';
        category = parts[1];
      } else if (parts.length === 3) {
        activeTab = 'club_category';
        category = parts[1];
        subcategory = parts[2];
      }
    } else if (parts[0] === 'checkout') {
      activeTab = 'checkout';
    } else if (parts[0] === 'order_tracking' || parts[0] === 'track-order') {
      activeTab = 'order_tracking';
    } else if (parts[0] === 'wishlist') {
      activeTab = 'wishlist';
    } else if (parts[0] === 'profile') {
      activeTab = 'profile';
    } else if (parts[0] === 'admin') {
      activeTab = 'admin';
    } else if (parts[0] === 'reset-password') {
      activeTab = 'reset_password';
    } else if (parts[0] === 'search') {
      activeTab = 'search';
      const params = new URLSearchParams(window.location.search || '');
      category = params.get('q') || '';
    } else {
      activeTab = 'catalog';
      category = parts[0];
    }

    set({
      activeTab,
      selectedCategory: category,
      selectedSubcategory: subcategory
    });
  },

  siteSettings: {
    siteName: 'Jersey Mention BD',
    tagLine: 'Premium Authentic Sports Jerseys & Apparel in Bangladesh',
    logo: '/images/logo.png',
    favicon: '/images/logo.png',
    contactEmail: 'admin@jerseymentionbd.com',
    contactPhone: '01640581442',
    whatsappNumber: '01640581442',
    address: 'Rampura, Dhaka',
    facebookUrl: 'https://facebook.com/jerseymentionbd',
    instagramUrl: 'https://instagram.com/jerseymentionbd',
    youtubeUrl: 'https://youtube.com/@jerseymentionbd',
    currencySymbol: '৳',
    taxRate: 5,
    insideDhakaShippingFee: 80,
    outsideDhakaShippingFee: 150,
    freeShippingThreshold: 3000,
    freeDeliveryEnabled: true,
    aboutUsText: 'Jersey Mention BD is Bangladesh\'s leading store for premium player version jerseys, fan merchandise, retro classics, and custom squad printing.',
    privacyPolicy: 'We respect customer privacy and secure data with encrypted tokens.',
    termsAndConditions: 'All orders subject to stock availability and delivery confirmation.',
    refundPolicy: 'Easy 7-day exchange for standard merchandise.',
    shippingPolicy: 'Dhaka delivery in 24-48 hours. Express courier outside Dhaka in 2-4 days.',
    customNameNumberPrice: 250,
    patchPrice: 100,
    sizeRanges: JSON.stringify({
      S: { maxHeight: 165, maxWeight: 60, maxChest: 37 },
      M: { maxHeight: 173, maxWeight: 70, maxChest: 39 },
      L: { maxHeight: 180, maxWeight: 80, maxChest: 41 },
      XL: { maxHeight: 185, maxWeight: 90, maxChest: 43 },
      XXL: { maxHeight: 190, maxWeight: 100, maxChest: 45 },
      "3XL": { maxHeight: 210, maxWeight: 120, maxChest: 48 }
    }),
    paymentGatewayBkash: true,
    paymentGatewayNagad: true,
    paymentGatewayRocket: false,
    paymentGatewaySsl: false,
    paymentGatewayStripe: false,
    paymentGatewayCod: true,
    seoSection1Title: "Jersey Mention BD — Your Trusted Football Jersey Store in Bangladesh",
    seoSection1Text: "Welcome to Jersey Mention BD, the premier online destination for premium football jerseys in Bangladesh. Whether you are looking for high-performance player version kits or comfortable fan sportswear, we have you covered. Our catalog features an extensive collection of authentic club jerseys and national team jerseys designed to show your squad passion on and off the field. Discover top-tier Player Edition jerseys built with breathable athletic mesh, Fan Edition jerseys for casual daily wear, and timeless classic retro jerseys from iconic footballing eras.",
    seoSection2Title: "Buy Football Jerseys & Sportswear Online in Bangladesh",
    seoSection2Text: "Ready to gear up for the match? When you want to buy football jersey online Bangladesh has never had a more reliable store. We make it easy to order authentic football shirts, club jerseys, and national team kits directly to your doorstep. Choose from the premium detailing of our Player Edition or the relaxed comfort of the Fan Edition and Retro Edition kits. Each kit offers outstanding breathability, high-durability sublimation print graphics, and comfortable sizing suited for active play."
  },
  updateSiteSettings: (s) => set({ siteSettings: { ...get().siteSettings, ...s } }),

  toastMessage: null,
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3500);
  },
  clearToast: () => set({ toastMessage: null }),

  sleeveBadgeOptions: [],
  setSleeveBadgeOptions: (options) => set({ sleeveBadgeOptions: options }),
  fetchSleeveBadgeOptions: async () => {
    try {
      const res = await fetch('/api/sleeve-badges');
      const data = await res.json();
      if (data.success) {
        set({ sleeveBadgeOptions: data.badges });
      }
    } catch (err) {
      console.error('Error fetching sleeve badges:', err);
    }
  },
  fetchAdminSleeveBadgeOptions: async () => {
    try {
      const res = await fetch('/api/admin/sleeve-badges');
      const data = await res.json();
      if (data.success) {
        set({ sleeveBadgeOptions: data.badges });
      }
    } catch (err) {
      console.error('Error fetching admin sleeve badges:', err);
    }
  },
  addSleeveBadgeOption: async (badge) => {
    try {
      const res = await fetch('/api/admin/sleeve-badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badge)
      });
      const data = await res.json();
      if (data.success) {
        get().showToast('Sleeve badge option added successfully');
        await get().fetchAdminSleeveBadgeOptions();
        return true;
      } else {
        get().showToast(data.message || 'Error adding badge option');
        return false;
      }
    } catch (err) {
      console.error('Error adding sleeve badge:', err);
      return false;
    }
  },
  updateSleeveBadgeOption: async (id, body) => {
    try {
      const res = await fetch(`/api/admin/sleeve-badges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        get().showToast('Sleeve badge option updated successfully');
        await get().fetchAdminSleeveBadgeOptions();
        return true;
      } else {
        get().showToast(data.message || 'Error updating badge option');
        return false;
      }
    } catch (err) {
      console.error('Error updating sleeve badge:', err);
      return false;
    }
  },
  deleteSleeveBadgeOption: async (id) => {
    try {
      const res = await fetch(`/api/admin/sleeve-badges/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        get().showToast('Sleeve badge option deleted');
        await get().fetchAdminSleeveBadgeOptions();
        return { success: true };
      } else {
        get().showToast(data.message || 'Error deleting option');
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Error deleting sleeve badge:', err);
      return { success: false, message: 'Server communication error' };
    }
  }
  };
});
