export type AdminPermission = string;
export type UserRole = 'super_admin' | 'admin' | 'staff' | 'customer';

export interface SavedShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
  zone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
    permissions?: AdminPermission[];
  phone?: string;
  avatar?: string;
  addresses?: Address[];
  savedShippingAddress?: SavedShippingAddress;
  status: 'active' | 'suspended';
  password?: string;
  createdAt: string;
  cart?: CartItem[];
  wishlist?: string[];
}

export interface Address {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  alternativePhone?: string;
  division: string;
  district: string;
  city?: string;
  address: string;
  area?: string;
  postalCode?: string;
  zipCode?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
  label?: 'Home' | 'Work' | 'Other';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  banner?: string;
  parentId?: string;
  parentName?: string;
  isActive: boolean;
  displayOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  productCount?: number;
  navbarLocation?: 'main' | 'more' | 'hidden';
  navbarPosition?: number;
  createdDate?: string;
  updatedDate?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description?: string;
  isActive: boolean;
  productCount?: number;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  price: number;
  salePrice?: number;
  discountPercent?: number;
  description: string;
  shortDescription?: string;
  specifications: ProductSpecification[];
  images: string[];
  videoUrl?: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brandId?: string;
  brandName?: string;
  stock: number;
  lowStockAlert: number;
  isOutOfStock: boolean;
  sizes: string[];
  sizeOptions?: ProductSizeOptions;
  colors: ProductColor[];
  tags: string[];
  weight?: string;
  featured: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isFlashSale: boolean;
  allowCustomPrint?: boolean; // Name & Number printing for jerseys
  showCustomNameNumber?: boolean;
  showSleevePatches?: boolean;
  showKidsSizes?: boolean;
  kidsSizes?: string[];
  showSizeChart?: boolean;
  sizeChart?: SizeChartItem[];
  returnPolicy: string;
  warranty: string;
  status: 'active' | 'draft' | 'archived';
  rating: number;
  reviewCount: number;
  seo?: ProductSEO;
  homepageSections?: string[];
  sleeveBadges?: string[];
  createdAt: string;
}

export interface CustomJerseyPrint {
  playerName?: string;
  playerNumber?: string;
  sleeveBadge?: string;
  additionalNotes?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: ProductColor;
  customPrint?: CustomJerseyPrint;
  customization?: {
    nameNumber: {
      enabled: boolean;
      name?: string;
      number?: string;
      price: number;
    };
    patches: {
      enabled: boolean;
      quantity: number;
      pricePerPatch: number;
      totalPrice: number;
    };
    sleeveBadges?: {
      enabled: boolean;
      selectedBadges: Array<{
        badgeId: string;
        name: string;
        badgeName?: string;
        image?: string;
        badgeImage?: string;
        price: number;
        badgePrice?: number;
      }>;
      quantity: number;
      pricePerBadge: number;
      totalPrice: number;
    };
  };
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  expireDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'sslcommerz' | 'stripe' | 'cod';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'custom_printing'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  sku?: string;
  name: string;
  productName?: string;
  basePrice?: number;
  salePrice?: number;
  discountPercent?: number;
  price: number;
  finalItemPrice?: number;
  lineTotal?: number;
  quantity: number;
  image: string;
  productImage?: string;
  size?: string;
  isKidsSize?: boolean;
  color?: string;
  priceBreakdown?: {
    baseProductPrice: number;
    regularPrice?: number;
    salePrice?: number;
    customNameNumberPrice: number;
    sleeveBadgesPrice: number;
    finalItemPrice: number;
    lineTotal: number;
  };
  customPrint?: CustomJerseyPrint;
  customization?: {
    nameNumber: {
      enabled: boolean;
      name?: string;
      number?: string;
      price: number;
    };
    patches: {
      enabled: boolean;
      quantity: number;
      pricePerPatch: number;
      totalPrice: number;
    };
    sleeveBadges?: {
      enabled: boolean;
      selectedBadges: Array<{
        badgeId: string;
        name: string;
        badgeName?: string;
        image?: string;
        badgeImage?: string;
        price: number;
        badgePrice?: number;
      }>;
      quantity: number;
      pricePerBadge: number;
      totalPrice: number;
    };
  };
}

export interface OrderTimelineItem {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
}

export type PaymentVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  itemsSubtotal?: number;
  customizationTotal?: number;
  tax: number;
  shippingFee: number;
  deliveryLocation?: string;
  discount: number;
  couponCode?: string;
  grandTotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentVerificationStatus?: PaymentVerificationStatus;
  paymentMobileNumber?: string;
  transactionId?: string;
  advancePaymentPercentage?: number;
  amountPaid?: number;
  remainingAmount?: number;
  paymentDetails?: {
    transactionId?: string;
    senderNumber?: string;
    paidAt?: string;
    cardBrand?: string;
  };
  orderStatus: OrderStatus;
  notes?: string;
  customerNotes?: string;
  trackingNumber?: string;
  courierProvider?: string;
  courierTrackingCode?: string;
  timeline: OrderTimelineItem[];
  payment?: {
    type: '25_percent_advance' | '100_percent_advance';
    totalAmount: number;
    advanceAmount: number;
    remainingAmount: number;
  };
  delivery?: {
    location: string;
    charge: number;
  };
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  isApproved: boolean;
  likesCount: number;
  reported: boolean;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'promo' | 'system';
  read: boolean;
  createdAt: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  link: string;
  buttonText: string;
  order: number;
  isActive: boolean;
}

export interface OfferBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  section: 'home_top' | 'home_middle' | 'sidebar';
  isActive: boolean;
}

export interface SiteSettings {
  siteName: string;
  tagLine: string;
  logo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  currencySymbol: string;
  taxRate: number; // percentage e.g. 5
  insideDhakaShippingFee: number;
  outsideDhakaShippingFee: number;
  freeShippingThreshold: number;
  freeDeliveryEnabled?: boolean;
  aboutUsText: string;
  privacyPolicy: string;
  termsAndConditions: string;
  refundPolicy: string;
  shippingPolicy: string;
  paymentGatewayBkash?: boolean;
  paymentGatewayNagad?: boolean;
  paymentGatewayRocket?: boolean;
  paymentGatewaySsl?: boolean;
  paymentGatewayStripe?: boolean;
  bkashPersonalNumber?: string;
  nagadPersonalNumber?: string;
  seoSection1Title?: string;
  seoSection1Text?: string;
  seoSection2Title?: string;
  seoSection2Text?: string;
  customNameNumberPrice?: number;
  patchPrice?: number;
  sizeRanges?: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalVisitors: number;
  lowStockItemsCount: number;
  pendingOrdersCount: number;
  monthlySales: Array<{ month: string; sales: number; orders: number }>;
  topCategories: Array<{ name: string; sales: number; percent: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  notes: string;
  createdByName: string;
  createdAt: string;
}

export type ActiveTab =
  | 'home'
  | 'catalog'
  | 'product_detail'
  | 'cart'
  | 'checkout'
  | 'order_tracking'
  | 'wishlist'
  | 'profile'
  | 'admin'
  | 'reset_password'
  | 'clubs'
  | 'club_category'
  | 'category_detail'
  | 'search';

export interface SleeveBadgeOption {
  id: string;
  name: string;
  image?: string;
  price: number;
  isActive: boolean;
  createdAt: string;
}

export interface SizeChartItem {
  size: string;
  length: number;
  chest: number;
}

export interface ProductSizeOptions {
  enabled: boolean;
  required: boolean;
  label: string;
  sizes: string[];
  showKidsSizes?: boolean;
  kidsSizes?: string[];
  showSizeChart?: boolean;
  sizeChart?: SizeChartItem[];
}
