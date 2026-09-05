import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  User,
  Category,
  Brand,
  HeroSlide,
  SiteSettings,
  Order,
  Coupon,
  Review,
  InventoryLog,
  SystemNotification,
  SleeveBadgeOption
} from '../src/types';
import { db } from './db';
import fs from 'fs';
import path from 'path';

export async function connectMongoDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://user:password@cluster.mongodb.net/jersey_mention_bd?retryWrites=true&w=majority';
  try {
    // Avoid connecting multiple times if already connected
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    
    if (MONGODB_URI.includes('user:password@cluster.mongodb.net')) {
      console.warn('\n[MongoDB Atlas] WARNING: Using placeholder connection string in .env.');
      console.warn('Please update the MONGODB_URI variable in the .env file with your actual MongoDB Atlas connection string to save user data securely.\n');
      throw new Error('Placeholder MongoDB URI detected. Please configure a valid MONGODB_URI in your .env file.');
    }
    
    console.log('[MongoDB Atlas] Connecting...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 } as any);
    console.log('[MongoDB Atlas] Connected successfully.');
    
    // Seed collections directly to MongoDB on first-time connection
    await seedInitialUsers();
    await migrateAdminPhone();
    await normalizeUserEmailIndex();
    await seedCategories();
    // Seeding of demo products, orders, reviews, inventory logs, and notifications is disabled for production readiness.
    // await seedProducts();
    await seedBrands();
    await seedHeroSlides();
    await seedSettings();
    // await seedOrders();
    await seedCoupons();
    // await seedReviews();
    // await seedInventoryLogs();
    // await seedNotifications();
    await seedSleeveBadgeOptions();

    // Clean up automatic/default placeholder images from database
    await cleanDatabasePlaceholderImages();
    await migrateProductSizeOptions();
  } catch (err) {
    console.error('[MongoDB Atlas Connection Error]:', err);
    console.error('\nIf your MongoDB Atlas instance is offline or the connection string is incorrect, please verify it in the .env file.\n');
    throw err;
  }
}

interface IUser {
  id: string;
  name: string;
  email: string;
  role: string;
    permissions?: string[];
  phone: string;
  avatar: string;
  status: string;
  password?: string;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date | null;
  createdAt: string;
  cart?: any[];
  wishlist?: string[];
}

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, sparse: true, index: true },
  role: { type: String, required: true },
    permissions: { type: [String], default: [] },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  status: { type: String, required: true, default: 'active' },
  savedShippingAddress: {
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    zone: { type: String, default: '' }
  },
  password: { type: String, required: true },
  passwordResetTokenHash: { type: String, default: '' },
  passwordResetExpires: { type: Date, default: null },
  createdAt: { type: String, required: true },
  cart: {
    type: [{
      id: { type: String, required: true },
      productId: { type: String, required: true },
      quantity: { type: Number, required: true },
      selectedSize: { type: String },
      selectedColor: {
        name: { type: String },
        hex: { type: String }
      },
      customPrint: {
        playerName: { type: String },
        playerNumber: { type: String },
        sleeveBadge: { type: String },
        additionalNotes: { type: String }
      },
      customization: {
        nameNumber: {
          enabled: { type: Boolean, default: false },
          name: { type: String },
          number: { type: String },
          price: { type: Number, default: 0 }
        },
        patches: {
          enabled: { type: Boolean, default: false },
          quantity: { type: Number, default: 0 },
          pricePerPatch: { type: Number, default: 0 },
          totalPrice: { type: Number, default: 0 }
        },
        sleeveBadges: {
          enabled: { type: Boolean, default: false },
          selectedBadges: [{
            badgeId: { type: String },
            name: { type: String },
            badgeName: { type: String },
            image: { type: String, default: '' },
            badgeImage: { type: String, default: '' },
            price: { type: Number, default: 0 },
            badgePrice: { type: Number, default: 0 }
          }],
          quantity: { type: Number, default: 0 },
          pricePerBadge: { type: Number, default: 0 },
          totalPrice: { type: Number, default: 0 }
        }
      }
    }],
    default: []
  },
  wishlist: {
    type: [String],
    default: []
  }
});

UserSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: /^01[3-9]\d{8}$/ } }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

interface IProduct {
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
  specifications: { key: string; value: string }[];
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
  sizeOptions?: {
    enabled: boolean;
    required: boolean;
    label: string;
    sizes: string[];
    showKidsSizes?: boolean;
    kidsSizes?: string[];
    showSizeChart?: boolean;
    sizeChart?: Array<{ size: string; length: number; chest: number }>;
  };
  colors: { name: string; hex: string }[];
  tags: string[];
  weight?: string;
  featured: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isFlashSale: boolean;
  allowCustomPrint?: boolean;
  showCustomNameNumber?: boolean;
  showSleevePatches?: boolean;
  showKidsSizes?: boolean;
  kidsSizes?: string[];
  showSizeChart?: boolean;
  sizeChart?: Array<{ size: string; length: number; chest: number }>;
  returnPolicy: string;
  warranty: string;
  status: string;
  rating: number;
  reviewCount: number;
  homepageSections?: string[];
  sleeveBadges?: string[];
  createdAt: string;
}

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  sku: { type: String, required: true, index: true },
  barcode: { type: String, default: '' },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  discountPercent: { type: Number, default: 0 },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  specifications: [{ key: String, value: String }],
  images: [{ type: String }],
  videoUrl: { type: String, default: '' },
  categoryId: { type: String, required: true, index: true },
  categoryName: { type: String, required: true },
  subcategoryId: { type: String, default: '' },
  subcategoryName: { type: String, default: '' },
  brandId: { type: String, default: '' },
  brandName: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  lowStockAlert: { type: Number, default: 0 },
  isOutOfStock: { type: Boolean, default: false },
  sizes: [{ type: String }],
  sizeOptions: {
    enabled: { type: Boolean, default: true },
    required: { type: Boolean, default: true },
    label: { type: String, default: 'Select Size:' },
    sizes: [{ type: String }],
    showKidsSizes: { type: Boolean, default: false },
    kidsSizes: [{ type: String }],
    showSizeChart: { type: Boolean, default: false },
    sizeChart: [{
      size: { type: String },
      length: { type: Number },
      chest: { type: Number }
    }]
  },
  colors: [{ name: String, hex: String }],
  tags: [{ type: String }],
  weight: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  allowCustomPrint: { type: Boolean, default: true },
  showCustomNameNumber: { type: Boolean, default: false },
  showSleevePatches: { type: Boolean, default: false },
  showKidsSizes: { type: Boolean, default: false },
  kidsSizes: [{ type: String }],
  showSizeChart: { type: Boolean, default: false },
  sizeChart: [{
    size: { type: String },
    length: { type: Number },
    chest: { type: Number }
  }],
  returnPolicy: { type: String, default: '' },
  warranty: { type: String, default: '' },
  status: { type: String, required: true, default: 'active' },
  rating: { type: Number, default: 5 },
  reviewCount: { type: Number, default: 0 },
  homepageSections: {
    type: [{
      type: String,
      enum: ['flash_sale', 'featured', 'best_sellers', 'trending', 'new_arrivals', 'limited_time_deals', 'trending_sports_match_gear']
    }],
    default: []
  },
  sleeveBadges: [{ type: String }],
  createdAt: { type: String, required: true }
});

export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

interface ICategory {
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
  navbarLocation?: string;
  navbarPosition?: number;
}

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  image: { type: String, default: '' },
  banner: { type: String, default: '' },
  parentId: { type: String, default: '' },
  parentName: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  featured: { type: Boolean, default: true },
  productCount: { type: Number, default: 0 },
  navbarLocation: { type: String, default: 'hidden' },
  navbarPosition: { type: Number, default: 0 }
});

export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);


// ==========================================
// ADDITIONAL MONGODB SCHEMAS & MODELS
// ==========================================

// Brand Schema
const BrandSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  logo: { type: String, default: '' },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  productCount: { type: Number, default: 0 }
});
export const BrandModel = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);

// HeroSlide Schema
const HeroSlideSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  image: { type: String, required: true },
  badge: { type: String, default: '' },
  link: { type: String, required: true },
  buttonText: { type: String, required: true },
  order: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
});
export const HeroSlideModel = mongoose.models.HeroSlide || mongoose.model('HeroSlide', HeroSlideSchema);

// SiteSettings Schema
const SiteSettingsSchema = new mongoose.Schema({
  siteName: { type: String, required: true },
  tagLine: { type: String, default: '' },
  logo: { type: String, default: '' },
  favicon: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  whatsappNumber: { type: String, default: '' },
  address: { type: String, default: '' },
  facebookUrl: { type: String, default: '' },
  instagramUrl: { type: String, default: '' },
  youtubeUrl: { type: String, default: '' },
  currencySymbol: { type: String, default: '৳' },
  taxRate: { type: Number, default: 0 },
  insideDhakaShippingFee: { type: Number, default: 0 },
  outsideDhakaShippingFee: { type: Number, default: 0 },
  freeShippingThreshold: { type: Number, default: 0 },
  freeDeliveryEnabled: { type: Boolean, default: true },
  aboutUsText: { type: String, default: '' },
  privacyPolicy: { type: String, default: '' },
  termsAndConditions: { type: String, default: '' },
  refundPolicy: { type: String, default: '' },
  shippingPolicy: { type: String, default: '' },
  paymentGatewayBkash: { type: Boolean, default: false },
  paymentGatewayNagad: { type: Boolean, default: false },
  paymentGatewayRocket: { type: Boolean, default: false },
  paymentGatewaySsl: { type: Boolean, default: false },
  paymentGatewayStripe: { type: Boolean, default: false },
  bkashPersonalNumber: { type: String, default: '01571305964' },
  nagadPersonalNumber: { type: String, default: '01571305964' },
  seoSection1Title: { type: String, default: '' },
  seoSection1Text: { type: String, default: '' },
  seoSection2Title: { type: String, default: '' },
  seoSection2Text: { type: String, default: '' },
  customNameNumberPrice: { type: Number, default: 250 },
  patchPrice: { type: Number, default: 100 },
  sizeRanges: { type: String, default: '' }
});
export const SiteSettingsModel = mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);

// Sub-schemas for Order
const AddressSchema = new mongoose.Schema({
  id: { type: String },
  userId: { type: String },
  name: { type: String },
  phone: { type: String },
  alternativePhone: { type: String },
  division: { type: String },
  district: { type: String },
  city: { type: String },
  address: { type: String },
  area: { type: String },
  postalCode: { type: String },
  zipCode: { type: String },
  isDefaultShipping: { type: Boolean },
  isDefaultBilling: { type: Boolean },
  label: { type: String }
});

const OrderItemSchema = new mongoose.Schema({
  id: { type: String },
  productId: { type: String },
  sku: { type: String, default: '' },
  name: { type: String },
  productName: { type: String },
  basePrice: { type: Number },
  salePrice: { type: Number },
  discountPercent: { type: Number, default: 0 },
  price: { type: Number },
  finalItemPrice: { type: Number },
  lineTotal: { type: Number },
  quantity: { type: Number },
  image: { type: String },
  productImage: { type: String },
  size: { type: String },
  isKidsSize: { type: Boolean, default: false },
  color: { type: String },
  priceBreakdown: {
    baseProductPrice: { type: Number },
    regularPrice: { type: Number },
    salePrice: { type: Number },
    customNameNumberPrice: { type: Number, default: 0 },
    sleeveBadgesPrice: { type: Number, default: 0 },
    finalItemPrice: { type: Number },
    lineTotal: { type: Number }
  },
  customPrint: {
    playerName: { type: String },
    playerNumber: { type: String },
    sleeveBadge: { type: String },
    additionalNotes: { type: String }
  },
  customization: {
    nameNumber: {
      enabled: { type: Boolean, default: false },
      name: { type: String },
      number: { type: String },
      price: { type: Number, default: 0 }
    },
    patches: {
      enabled: { type: Boolean, default: false },
      quantity: { type: Number, default: 0 },
      pricePerPatch: { type: Number, default: 0 },
      totalPrice: { type: Number, default: 0 }
    },
    sleeveBadges: {
      enabled: { type: Boolean, default: false },
      selectedBadges: [{
        badgeId: { type: String },
        name: { type: String },
        badgeName: { type: String },
        image: { type: String, default: '' },
        badgeImage: { type: String, default: '' },
        price: { type: Number, default: 0 },
        badgePrice: { type: Number, default: 0 }
      }],
      quantity: { type: Number, default: 0 },
      pricePerBadge: { type: Number, default: 0 },
      totalPrice: { type: Number, default: 0 }
    }
  }
});

const OrderTimelineItemSchema = new mongoose.Schema({
  status: { type: String },
  title: { type: String },
  description: { type: String },
  timestamp: { type: String }
});

// Order Schema
const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  orderNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: '' },
  customerPhone: { type: String, required: true, index: true },
  shippingAddress: { type: AddressSchema, required: true },
  items: [{ type: OrderItemSchema }],
  subtotal: { type: Number, required: true },
  itemsSubtotal: { type: Number },
  customizationTotal: { type: Number, default: 0 },
  tax: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  deliveryLocation: { type: String, default: '' },
  customerNotes: { type: String, default: '' },
  discount: { type: Number, default: 0 },
  couponCode: { type: String, default: '' },
  grandTotal: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, required: true, default: 'pending' },
  paymentVerificationStatus: { type: String, default: 'pending', enum: ['pending', 'verified', 'rejected'], index: true },
  paymentMobileNumber: { type: String, default: '' },
  transactionId: { type: String, default: '' },
  advancePaymentPercentage: { type: Number, default: 25 },
  amountPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentDetails: {
    transactionId: { type: String },
    senderNumber: { type: String },
    paidAt: { type: String },
    cardBrand: { type: String }
  },
  orderStatus: { type: String, required: true, default: 'pending', index: true },
  notes: { type: String, default: '' },
  trackingNumber: { type: String, default: '' },
  customName: { type: String, default: '' },
  courierProvider: { type: String, default: '' },
  courierTrackingCode: { type: String, default: '' },
  timeline: [{ type: OrderTimelineItemSchema }],
  payment: {
    type: { type: String },
    totalAmount: { type: Number },
    advanceAmount: { type: Number },
    remainingAmount: { type: Number }
  },
  delivery: {
    location: { type: String, default: '' },
    charge: { type: Number, default: 0 }
  },
  createdAt: { type: String, required: true, index: true }
});
export const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// Coupon Schema
const CouponSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, index: true },
  discountType: { type: String, required: true },
  discountValue: { type: Number, required: true },
  minPurchase: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  expireDate: { type: String, required: true },
  usageLimit: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});
export const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

// Review Schema
const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  productId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  images: [{ type: String }],
  isApproved: { type: Boolean, default: true },
  likesCount: { type: Number, default: 0 },
  reported: { type: Boolean, default: false },
  createdAt: { type: String, required: true }
});
export const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

// InventoryLog Schema
const InventoryLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  productId: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  type: { type: String, required: true },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  notes: { type: String, default: '' },
  createdByName: { type: String, required: true },
  createdAt: { type: String, required: true }
});
export const InventoryLogModel = mongoose.models.InventoryLog || mongoose.model('InventoryLog', InventoryLogSchema);

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: '' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: String, required: true }
});
export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

const AdminActivityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedById: { type: String, required: true },
  performedByName: { type: String, required: true },
  targetAdminId: { type: String, required: true },
  targetAdminName: { type: String, required: true },
  details: { type: String, default: '' },
  createdAt: { type: Date, required: true }
});
export const AdminActivityLogModel = mongoose.models.AdminActivityLog || mongoose.model('AdminActivityLog', AdminActivityLogSchema);

interface ISleeveBadgeOption {
  id: string;
  name: string;
  image?: string;
  price?: number;
  isActive: boolean;
  createdAt: string;
}

const SleeveBadgeOptionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: String, required: true }
});

export const SleeveBadgeOptionModel = mongoose.models.SleeveBadgeOption || mongoose.model<ISleeveBadgeOption>('SleeveBadgeOption', SleeveBadgeOptionSchema);

// Fallback helper functions for Database CRUD operations
export async function findUserByEmail(email: string) {
  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() } as any);
    return user;
  } catch (e: any) {
    console.error('[MongoDB findUserByEmail Error]:', e);
    throw new Error(e.message || 'Error querying database');
  }
}

export function normalizePhone(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('880')) return `0${digits.slice(3)}`;
  return digits;
}

export async function findUserByPhone(phone: string) {
  try {
    const normalized = normalizePhone(phone);
    const users = await UserModel.find({ phone: { $exists: true, $ne: '' } } as any);
    return users.find((user: any) => normalizePhone(user.phone) === normalized) || null;
  } catch (e: any) {
    console.error('[MongoDB findUserByPhone Error]:', e);
    throw new Error(e.message || 'Error querying database');
  }
}

export async function findUserById(id: string) {
  try {
    const user = await UserModel.findOne({ id } as any);
    return user;
  } catch (e: any) {
    console.error('[MongoDB findUserById Error]:', e);
    throw new Error(e.message || 'Error querying database');
  }
}

export async function createUser(userObj: any) {
  try {
    const user = await UserModel.create(userObj);
    return user;
  } catch (e: any) {
    console.error('[MongoDB createUser Error]:', e);
    throw new Error(e.message || 'Error creating user in database');
  }
}

async function seedInitialUsers() {
  try {
    const count = await UserModel.countDocuments();
    if (count === 0) {
      console.log('[MongoDB Atlas] Seeding initial user accounts...');
      const initialUsers = [
        {
          id: 'usr-admin-1',
          name: 'Super Admin',
          email: 'admin@jerseymentionbd.com',
          role: 'super_admin',
          phone: process.env.INITIAL_ADMIN_PHONE || '01571305964',
          avatar: '',
          status: 'active',
          password: bcrypt.hashSync(process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!', 10),
          createdAt: new Date().toISOString()
        },
        {
          id: 'usr-staff-1',
          name: 'Order Fulfillment Manager',
          email: 'staff@jerseymentionbd.com',
          role: 'staff',
          phone: process.env.INITIAL_STAFF_PHONE || '01711000222',
          avatar: '',
          status: 'active',
          password: bcrypt.hashSync(process.env.INITIAL_STAFF_PASSWORD || 'Staff@ChangeMe123!', 10),
          createdAt: new Date().toISOString()
        }
      ];
      await UserModel.insertMany(initialUsers);
      console.log('[MongoDB Atlas] Seeding complete.');
    }
  } catch (err) {
    console.error('[MongoDB Atlas Seeding Error]:', err);
  }
}

async function migrateAdminPhone() {
  const adminPhone = '01571305964';
  const admin = await UserModel.findOne({ id: 'usr-admin-1', role: 'super_admin' } as any);
  if (!admin) return;

  const conflictingUser = await UserModel.findOne({
    phone: adminPhone,
    id: { $ne: admin.id }
  } as any);
  if (conflictingUser) {
    throw new Error('Admin mobile number is already assigned to another account.');
  }

  if (admin.phone !== adminPhone) {
    admin.phone = adminPhone;
    await admin.save();
  }
}

async function normalizeUserEmailIndex() {
  const indexes = await UserModel.collection.indexes();
  const emailIndex = indexes.find((index) => index.name === 'email_1');
  if (emailIndex && (!emailIndex.unique || !emailIndex.sparse)) {
    try {
      await UserModel.collection.dropIndex('email_1');
    } catch (e) {
      console.warn('[MongoDB Migration] Failed to drop email_1 index, attempting to proceed:', e);
    }
  }
  await UserModel.updateMany({ email: '' }, { $unset: { email: 1 } });
  await UserModel.collection.createIndex({ email: 1 }, { unique: true, sparse: true, name: 'email_1' });
}

async function seedProducts() {
  try {
    const count = await ProductModel.countDocuments();
    if (count === 0 && db.products.length > 0) {
      console.log('[MongoDB Atlas] Seeding initial products...');
      await ProductModel.insertMany(db.products);
    }
  } catch (err) {
    console.error('[MongoDB Seeding Products Error]:', err);
  }
}

async function seedCategories() {
  try {
    const count = await CategoryModel.countDocuments();
    if (count === 0 && db.categories.length > 0) {
      console.log('[MongoDB Atlas] Seeding initial categories...');
      await CategoryModel.insertMany(db.categories);
    }
  } catch (err) {
    console.error('[MongoDB Seeding Categories Error]:', err);
  }
}

async function seedBrands() {
  try {
    const count = await BrandModel.countDocuments();
    if (count === 0 && db.brands.length > 0) {
      console.log('[MongoDB Atlas] Seeding initial brands...');
      await (BrandModel as any).insertMany(db.brands);
    }
  } catch (err) {
    console.error('[MongoDB Seeding Brands Error]:', err);
  }
}

async function seedHeroSlides() {
  try {
    const count = await HeroSlideModel.countDocuments();
    if (count === 0 && db.heroSlides.length > 0) {
      console.log('[MongoDB Atlas] Seeding initial hero slides...');
      await (HeroSlideModel as any).insertMany(db.heroSlides);
    }
  } catch (err) {
    console.error('[MongoDB Seeding HeroSlides Error]:', err);
  }
}

async function seedSettings() {
  try {
    const count = await SiteSettingsModel.countDocuments();
    if (count === 0 && db.settings) {
      console.log('[MongoDB Atlas] Seeding initial settings...');
      await SiteSettingsModel.create(db.settings);
    } else {
      const settingsObj = await SiteSettingsModel.findOne();
      if (settingsObj) {
        let changed = false;
        const update: any = {};
        if (settingsObj.customNameNumberPrice === undefined) {
          update.customNameNumberPrice = 250;
          changed = true;
        }
        if (settingsObj.patchPrice === undefined) {
          update.patchPrice = 100;
          changed = true;
        }
        if (settingsObj.logo.includes('unsplash.com') || settingsObj.logo.includes('photo-1511512578047-dfb367046420')) {
          update.logo = '/images/logo.png';
          update.favicon = '/images/logo.png';
          changed = true;
        }
        if (!settingsObj.sizeRanges) {
          const defaultRanges = {
            S: { maxHeight: 165, maxWeight: 60, maxChest: 37 },
            M: { maxHeight: 173, maxWeight: 70, maxChest: 39 },
            L: { maxHeight: 180, maxWeight: 80, maxChest: 41 },
            XL: { maxHeight: 185, maxWeight: 90, maxChest: 43 },
            XXL: { maxHeight: 190, maxWeight: 100, maxChest: 45 },
            "3XL": { maxHeight: 210, maxWeight: 120, maxChest: 48 }
          };
          update.sizeRanges = JSON.stringify(defaultRanges);
          changed = true;
        }
        const rawDbDoc = await mongoose.connection.db.collection('sitesettings').findOne();
        if (settingsObj.freeDeliveryEnabled === undefined) {
          update.freeDeliveryEnabled = true;
          changed = true;
        }
        if (rawDbDoc && rawDbDoc.bkashPersonalNumber === undefined) {
          update.bkashPersonalNumber = '01571305964';
          changed = true;
        }
        if (rawDbDoc && rawDbDoc.nagadPersonalNumber === undefined) {
          update.nagadPersonalNumber = '01571305964';
          changed = true;
        }
        if (settingsObj.whatsappNumber !== '01640581442') {
          update.whatsappNumber = '01640581442';
          changed = true;
        }
        if (settingsObj.contactPhone !== '01640581442') {
          update.contactPhone = '01640581442';
          changed = true;
        }
        if (changed) {
          console.log('[Migration] Updating database site settings fields...');
          await SiteSettingsModel.updateOne({}, { $set: update });
        }
      }
    }
  } catch (err) {
    console.error('[MongoDB Seeding Settings Error]:', err);
  }
}

async function seedOrders() {
  try {
    const count = await OrderModel.countDocuments();
    if (count === 0 && db.orders.length > 0) {
      console.log('[MongoDB Atlas] Seeding initial orders...');
      await (OrderModel as any).insertMany(db.orders);
    }
  } catch (err) {
    console.error('[MongoDB Seeding Orders Error]:', err);
  }
}

async function seedCoupons() {
  try {
    const count = await CouponModel.countDocuments();
    if (count === 0 && db.coupons.length > 0) {
      console.log('[MongoDB Atlas] Seeding initial coupons...');
      await (CouponModel as any).insertMany(db.coupons);
    }
  } catch (err) {
    console.error('[MongoDB Seeding Coupons Error]:', err);
  }
}

async function seedReviews() {
  try {
    const count = await ReviewModel.countDocuments();
    if (count === 0 && db.reviews.length > 0) {
      console.log('[MongoDB Atlas] Seeding initial reviews...');
      await (ReviewModel as any).insertMany(db.reviews);
    }
  } catch (err) {
    console.error('[MongoDB Seeding Reviews Error]:', err);
  }
}

async function seedInventoryLogs() {
  try {
    const count = await InventoryLogModel.countDocuments();
    if (count === 0 && db.inventoryLogs.length > 0) {
      console.log('[MongoDB Atlas] Seeding initial inventory logs...');
      await (InventoryLogModel as any).insertMany(db.inventoryLogs);
    }
  } catch (err) {
    console.error('[MongoDB Seeding InventoryLogs Error]:', err);
  }
}

async function seedNotifications() {
  try {
    const count = await NotificationModel.countDocuments();
    if (count === 0 && db.notifications.length > 0) {
      console.log('[MongoDB Atlas] Seeding initial notifications...');
      await (NotificationModel as any).insertMany(db.notifications);
    }
  } catch (err) {
    console.error('[MongoDB Seeding Notifications Error]:', err);
  }
}

export async function migrateProductSizeOptions() {
  if (mongoose.connection.readyState === 1) {
    try {
      console.log('[Migration] Migrating existing products to use the new size system...');
      const products = await ProductModel.find().lean();
      for (const p of products) {
        if (!p.sizeOptions || p.sizeOptions.enabled === undefined) {
          const nameLower = (p.name || '').toLowerCase();
          const categoryNameLower = (p.categoryName || '').toLowerCase();
          const categoryIdLower = (p.categoryId || '').toLowerCase();
          const isJersey = nameLower.includes('jersey') || 
                           nameLower.includes('kit') || 
                           categoryNameLower.includes('player') || 
                           categoryNameLower.includes('retro') || 
                           categoryNameLower.includes('fan') ||
                           categoryIdLower.includes('player') ||
                           categoryIdLower.includes('retro') ||
                           categoryIdLower.includes('fan');
          
          const sizeOptions = {
            enabled: isJersey,
            required: isJersey,
            label: isJersey ? 'Select Jersey Size:' : 'Select Size:',
            sizes: p.sizes && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL', 'XXL']
          };

          await ProductModel.updateOne({ id: p.id }, { $set: { sizeOptions } });
        }
      }
      console.log('[Migration] Product size migration completed successfully.');
    } catch (err) {
      console.error('[Migration Error]: Failed migrating product sizes:', err);
    }
  }
}

export async function cleanDatabasePlaceholderImages() {
  console.log('[Migration] Cleaning up automatic/default placeholder images from database...');
  if (mongoose.connection.readyState === 1) {
    try {
      const products = await ProductModel.find().lean();
      for (const p of products) {
        if (p.images && p.images.some(img => img.includes('unsplash.com'))) {
          const cleanedImages = p.images.filter(img => !img.includes('unsplash.com'));
          await ProductModel.updateOne({ id: p.id }, { $set: { images: cleanedImages } });
        }
      }
      const categories = await CategoryModel.find().lean();
      for (const c of categories) {
        let changed = false;
        let cleanedImg = c.image;
        let cleanedBanner = c.banner;
        if (c.image && c.image.includes('unsplash.com')) {
          cleanedImg = '';
          changed = true;
        }
        if (c.banner && c.banner.includes('unsplash.com')) {
          cleanedBanner = '';
          changed = true;
        }
        if (changed) {
          await CategoryModel.updateOne({ id: c.id }, { $set: { image: cleanedImg, banner: cleanedBanner } });
        }
      }
      const brands = await BrandModel.find().lean();
      for (const b of brands) {
        if (b.logo && b.logo.includes('unsplash.com')) {
          await BrandModel.updateOne({ id: b.id }, { $set: { logo: '' } });
        }
      }
    } catch (e) {
      console.error('[Migration Error]:', e);
    }
  }
}

export async function deleteUploadedFileByUrl(imageUrl: string) {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  const filename = imageUrl.substring('/uploads/'.length);
  const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

  // Delete local file
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Image Clean] Deleted local file: ${filePath}`);
    }
  } catch (err) {
    console.error(`[Image Clean] Error deleting local file ${filePath}:`, err);
  }
}

async function seedSleeveBadgeOptions() {
  try {
    const count = await SleeveBadgeOptionModel.countDocuments();
    if (count === 0) {
      console.log('[MongoDB Atlas] Seeding initial sleeve badge options...');
      const defaultBadges = [
        { id: 'badge-ucl', name: 'Champions League', image: '', price: 100, isActive: true, createdAt: new Date().toISOString() },
        { id: 'badge-cwc', name: 'FIFA Club World Cup', image: '', price: 100, isActive: true, createdAt: new Date().toISOString() },
        { id: 'badge-laliga', name: 'La Liga Patch', image: '', price: 100, isActive: true, createdAt: new Date().toISOString() },
        { id: 'badge-epl', name: 'Premier League Badge', image: '', price: 100, isActive: true, createdAt: new Date().toISOString() }
      ];
      await SleeveBadgeOptionModel.insertMany(defaultBadges);
      console.log('[MongoDB Atlas] Seeding sleeve badges complete.');

      const badgeIds = ['badge-ucl', 'badge-cwc', 'badge-laliga', 'badge-epl'];
      await ProductModel.updateMany({ showSleevePatches: true }, { $set: { sleeveBadges: badgeIds } });
    } else {
      // Ensure all existing badge records have price and image properties
      await SleeveBadgeOptionModel.updateMany({ price: { $exists: false } }, { $set: { price: 100 } });
      await SleeveBadgeOptionModel.updateMany({ image: { $exists: false } }, { $set: { image: '' } });
      await SleeveBadgeOptionModel.deleteOne({ id: 'badge-none' });
    }
  } catch (err) {
    console.error('[MongoDB Seeding Sleeve Badges Error]:', err);
  }
}

