import { Router, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { AuthenticatedRequest, requireAuth, requireRole, requirePermission } from './middleware';
import {
  findUserByEmail,
  findUserByPhone,
  normalizePhone,
  createUser,
  deleteUploadedFileByUrl,
  UserModel,
  ProductModel,
  CategoryModel,
  BrandModel,
  HeroSlideModel,
  SiteSettingsModel,
  OrderModel,
  CouponModel,
  ReviewModel,
  InventoryLogModel,
  NotificationModel,
  AdminActivityLogModel,
  SleeveBadgeOptionModel
} from './mongodb';
import { sendPasswordResetEmail } from './email';
import {
  User,
  Product,
  Category,
  Brand,
  Order,
  Coupon,
  Review,
  HeroSlide,
  OfferBanner,
  SiteSettings,
  OrderStatus,
  PaymentMethod,
  InventoryLog
} from '../src/types';
import { ALL_KIDS_SIZES } from '../src/utils/productUtils';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'jersey_mention_bd_jwt_super_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'jersey_mention_bd_refresh_secret_key_2026';
const resetRequests = new Map<string, number[]>();
const authRequests = new Map<string, number[]>();

function authRateLimit(req: AuthenticatedRequest, res: Response, next: any) {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const recent = (authRequests.get(key) || []).filter((time) => now - time < 15 * 60 * 1000);
  if (recent.length >= 10) {
    return res.status(429).json({ success: false, message: 'Too many authentication attempts. Please try again later.' });
  }
  authRequests.set(key, [...recent, now]);
  next();
}

const requireDB = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({
      success: false,
      message: 'Database connection is offline. Please configure a valid MONGODB_URI in your .env file to enable persistence.'
    });
  }
  next();
};

async function logAdminActivity(req: AuthenticatedRequest, action: string, target: any, details = '') {
  if (!req.user) return;
  await AdminActivityLogModel.create({
    action,
    performedById: req.user.id,
    performedByName: req.user.name,
    targetAdminId: target.id,
    targetAdminName: target.name,
    details,
    createdAt: new Date()
  });
}


// Initialize Gemini Client Lazily
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Helper to generate JWT tokens
function generateTokens(user: User) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

router.post('/auth/forgot-password', authRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const now = Date.now();
  const recent = (resetRequests.get(email) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 3) {
    return res.json({ success: true, message: 'If an account exists with this email, a password reset link has been sent.' });
  }
  resetRequests.set(email, [...recent, now]);

  try {
    const user = email ? await findUserByEmail(email) : null;
    if (user?.email) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      await sendPasswordResetEmail(user.email, user.name, `${baseUrl}/reset-password?token=${rawToken}`);
    }
  } catch (err) {
    console.error('[Password Reset Email Error]:', err instanceof Error ? err.message : 'Unknown error');
  }

  res.json({ success: true, message: 'If an account exists with this email, a password reset link has been sent.' });
});

router.post('/auth/reset-password', authRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  const confirmation = String(req.body.confirmPassword || '');
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  if (password !== confirmation) return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  if (!token) return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });

  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await UserModel.findOne({ passwordResetTokenHash: hash, passwordResetExpires: { $gt: new Date() } } as any);
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });
    user.password = bcrypt.hashSync(password, 10);
    user.passwordResetTokenHash = '';
    user.passwordResetExpires = null;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully. Please sign in with your mobile number.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Unable to reset password' });
  }
});

router.post('/auth/change-password', authRateLimit, requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All password fields are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New passwords do not match.' });
  }

  try {
    const user = await UserModel.findOne({ id: req.user?.id } as any);
    if (!user || !bcrypt.compareSync(currentPassword, user.password || '')) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    res.clearCookie('accessToken');
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Unable to change password. Please try again.' });
  }
});

// POST /api/auth/register
router.post('/auth/register', authRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, phone } = req.body;

  if (!phone || !String(phone).trim()) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }
  if (!name || !password) {
    return res.status(400).json({ success: false, message: 'Name and password are required' });
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number.' });
    }
    const existing = await findUserByPhone(normalizedPhone);
    if (existing) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered. Please sign in.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUserObj = {
      id: `usr-${Date.now()}`,
      name,
      email: email ? String(email).trim().toLowerCase() : undefined,
      role: 'customer',
      phone: normalizedPhone,
      status: 'active',
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    const newUser = await createUser(newUserObj);
    const { accessToken, refreshToken } = generateTokens(newUser.toObject() as User);

    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    
    const sanitizedUser = newUser.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.passwordResetTokenHash;
    delete sanitizedUser.passwordResetExpires;

    res.json({
      success: true,
      message: 'Registration successful',
      user: sanitizedUser,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    if (err?.code === 11000 && err?.keyPattern?.phone) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered. Please sign in.' });
    }
    res.status(500).json({ success: false, message: err.message || 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/auth/login', authRateLimit, async (req: AuthenticatedRequest, res: Response) => {
  const { phone, password } = req.body;

  if (!phone || !String(phone).trim()) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }
  if (!password) {
    return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }
    const user = await findUserByPhone(normalizedPhone);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is suspended or inactive' });
    }

    const userObj = user.toObject() as User;
    const { accessToken, refreshToken } = generateTokens(userObj);

    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    
    const sanitizedUser = { ...userObj };
    delete sanitizedUser.password;
    delete (sanitizedUser as any).passwordResetTokenHash;
    delete (sanitizedUser as any).passwordResetExpires;

    res.json({
      success: true,
      message: 'Login successful',
      user: sanitizedUser,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error during login' });
  }
});

// POST /api/auth/google
router.post('/auth/google', async (req: AuthenticatedRequest, res: Response) => {
  const { email, name, avatar } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Google email required' });
  }

  try {
    let user = await UserModel.findOne({ email: email.toLowerCase() } as any);
    if (!user) {
      user = await UserModel.create({
        id: `usr-google-${Date.now()}`,
        name: name || 'Google User',
        email: email.toLowerCase(),
        role: 'customer',
        avatar: avatar || '',
        status: 'active',
        password: bcrypt.hashSync(Math.random().toString(36), 10),
        createdAt: new Date().toISOString()
      });
    }

    const userObj = user.toObject() as User;
    const { accessToken, refreshToken } = generateTokens(userObj);

    res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    
    const sanitizedUser = { ...userObj };
    delete sanitizedUser.password;

    res.json({
      success: true,
      message: 'Google authentication successful',
      user: sanitizedUser,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Google Auth error' });
  }
});

// GET /api/auth/me
router.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  res.json({ success: true, user: req.user });
});

// GET /api/user/shipping-address
router.get('/user/shipping-address', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, savedShippingAddress: userObj.savedShippingAddress || null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/user/shipping-address
router.put('/user/shipping-address', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  const { fullName, phone, address, city, district, postalCode, zone } = req.body;

  if (!fullName || !phone || !address || !city || !district || !zone) {
    return res.status(400).json({ success: false, message: 'Missing required shipping address fields' });
  }

  const phoneRegex = /^(?:\+88|88)?01[3-9]\d{8}$/;
  if (!phoneRegex.test(phone.trim())) {
    return res.status(400).json({ success: false, message: 'Please enter a valid Bangladesh mobile number format (e.g. 01XXXXXXXXX).' });
  }

  try {
    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    userObj.savedShippingAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      district: district.trim(),
      postalCode: (postalCode || '').trim(),
      zone: zone.trim()
    };

    await userObj.save();
    res.json({ success: true, message: 'Shipping address saved successfully', savedShippingAddress: userObj.savedShippingAddress });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  res.clearCookie('accessToken');
  res.json({ success: true, message: 'Logged out successfully' });
});


// Helper to populate and sanitize user's cart from MongoDB
async function getPopulatedCart(userObj: any) {
  const cartItems = userObj.cart || [];
  const populatedCart = [];
  const cleanedCartItems = [];
  let cartModified = false;

  for (const item of cartItems) {
    const dbProduct = await ProductModel.findOne({ id: item.productId } as any).lean();
    if (dbProduct) {
      let populatedCustomization = item.customization;
      if (populatedCustomization?.sleeveBadges?.enabled && Array.isArray(populatedCustomization.sleeveBadges.selectedBadges)) {
        const badgeIds = populatedCustomization.sleeveBadges.selectedBadges.map((b: any) => b.badgeId).filter(Boolean);
        if (badgeIds.length > 0) {
          const liveBadges = await SleeveBadgeOptionModel.find({ id: { $in: badgeIds } } as any).lean();
          const updatedBadges = populatedCustomization.sleeveBadges.selectedBadges.map((b: any) => {
            const live = liveBadges.find((lb: any) => lb.id === b.badgeId);
            const livePrice = live?.price !== undefined ? live.price : (b.price || 0);
            return {
              ...b,
              name: live?.name || b.name || 'Badge',
              badgeName: live?.name || b.badgeName || b.name || 'Badge',
              image: live?.image || b.image || '',
              badgeImage: live?.image || b.badgeImage || b.image || '',
              price: livePrice,
              badgePrice: livePrice
            };
          });
          const totalPrice = updatedBadges.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
          populatedCustomization = {
            ...populatedCustomization,
            sleeveBadges: {
              ...populatedCustomization.sleeveBadges,
              selectedBadges: updatedBadges,
              quantity: updatedBadges.length,
              totalPrice
            }
          };
        }
      }

      populatedCart.push({
        id: item.id,
        productId: item.productId,
        product: dbProduct,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        customPrint: item.customPrint,
        customization: populatedCustomization
      });
      cleanedCartItems.push(item);
    } else {
      cartModified = true;
    }
  }

  if (cartModified) {
    userObj.cart = cleanedCartItems;
    await userObj.save();
  }

  return populatedCart;
}

// Helper to populate and sanitize user's wishlist from MongoDB
async function getPopulatedWishlist(userObj: any) {
  const wishlistIds = userObj.wishlist || [];
  const populatedWishlist = [];
  const cleanedWishlistIds = [];
  let wishlistModified = false;

  for (const prodId of wishlistIds) {
    const dbProduct = await ProductModel.findOne({ id: prodId } as any).lean();
    if (dbProduct) {
      populatedWishlist.push(dbProduct);
      cleanedWishlistIds.push(prodId);
    } else {
      wishlistModified = true;
    }
  }

  if (wishlistModified) {
    userObj.wishlist = cleanedWishlistIds;
    await userObj.save();
  }

  return populatedWishlist;
}

// ==========================================
// CART & WISHLIST PERSISTENCE ENDPOINTS
// ==========================================

// GET /api/cart
router.get('/cart', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const cart = await getPopulatedCart(userObj);
    res.json({ success: true, cart });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching cart' });
  }
});

// POST /api/cart
router.post('/cart', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, quantity, selectedSize, selectedColor, customPrint, customization } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive whole number' });
    }

    const product = await ProductModel.findOne({ id: productId } as any).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const isAdultSizeEnabled = product.sizeOptions && typeof product.sizeOptions.enabled === 'boolean'
      ? product.sizeOptions.enabled
      : (Array.isArray(product.sizes) && product.sizes.length > 0);
    const isKidsEnabled = Boolean(product.showKidsSizes || product.sizeOptions?.showKidsSizes);

    const adultSizes = isAdultSizeEnabled
      ? ((product.sizeOptions?.sizes && Array.isArray(product.sizeOptions.sizes) && product.sizeOptions.sizes.length > 0) ? product.sizeOptions.sizes : (Array.isArray(product.sizes) ? product.sizes : []))
      : [];
    const kidsSizes = isKidsEnabled
      ? (Array.isArray(product.kidsSizes) && product.kidsSizes.length > 0 ? product.kidsSizes : (product.sizeOptions?.kidsSizes || []))
      : [];

    const allowedSizes = [...adultSizes, ...kidsSizes];
    const isSizeEnabled = Boolean(isAdultSizeEnabled || isKidsEnabled || allowedSizes.length > 0);
    const isSizeRequired = isKidsEnabled || (Boolean(product.sizeOptions?.required ?? true) && isAdultSizeEnabled);

    if (isSizeRequired && (!selectedSize || !String(selectedSize).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please select a size first.'
      });
    }

    if (allowedSizes.length > 0 && selectedSize && !allowedSizes.includes(String(selectedSize).trim())) {
      return res.status(400).json({
        success: false,
        message: `Selected size "${selectedSize}" is invalid for product "${product.name}". Available sizes: ${allowedSizes.join(', ')}`
      });
    }

    if (customization?.nameNumber?.enabled && !product.showCustomNameNumber && !product.allowCustomPrint) {
      return res.status(400).json({
        success: false,
        message: `Squad name/number customization not allowed for ${product.name}.`
      });
    }

    if (customization?.sleeveBadges?.enabled) {
      if (!product.showSleevePatches) {
        return res.status(400).json({
          success: false,
          message: `Sleeve patches not allowed for ${product.name}.`
        });
      }
      const clientBadges = customization.sleeveBadges.selectedBadges || [];
      if (clientBadges.length > 0) {
        const badgeIds = clientBadges.map((b: any) => b.badgeId).filter(Boolean);
        const dbBadges = await SleeveBadgeOptionModel.find({ id: { $in: badgeIds }, isActive: true } as any).lean();
        if (dbBadges.length !== badgeIds.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more selected sleeve badges are invalid or inactive.'
          });
        }
        const allowedBadgeIds = product.sleeveBadges || [];
        const isAllAssigned = badgeIds.every((id: string) => allowedBadgeIds.includes(id));
        if (!isAllAssigned) {
          return res.status(400).json({
            success: false,
            message: `One or more selected badges are not available for ${product.name}.`
          });
        }
        const validatedBadges = clientBadges.map((cb: any) => {
          const dbB = dbBadges.find((b: any) => b.id === cb.badgeId)!;
          const badgePrice = dbB.price !== undefined ? dbB.price : 0;
          return {
            badgeId: dbB.id,
            name: dbB.name,
            badgeName: dbB.name,
            image: dbB.image || '',
            badgeImage: dbB.image || '',
            price: badgePrice,
            badgePrice: badgePrice
          };
        });
        const badgesTotalPrice = validatedBadges.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
        customization.sleeveBadges = {
          enabled: true,
          selectedBadges: validatedBadges,
          quantity: validatedBadges.length,
          pricePerBadge: validatedBadges.length > 0 ? validatedBadges[0].price : 0,
          totalPrice: badgesTotalPrice
        };
      }
    } else if (customization?.patches?.enabled && !product.showSleevePatches) {
      return res.status(400).json({
        success: false,
        message: `Sleeve patches not allowed for ${product.name}.`
      });
    }

    const size = isSizeEnabled ? String(selectedSize).trim() : undefined;
    const color = selectedColor || product.colors[0] || { name: 'Default', hex: '#000' };

    const badgeIdsStr = customization?.sleeveBadges?.enabled
      ? customization.sleeveBadges.selectedBadges.map((b: any) => b.badgeId).sort().join(',')
      : '';
    const itemId = `cart-${product.id}-${size || 'nosize'}-${color.name}-${customPrint?.playerName || ''}-${customization?.nameNumber?.name || ''}-${badgeIdsStr || customization?.patches?.quantity || 0}`;

    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const dbCart = userObj.cart || [];
    const existingIdx = dbCart.findIndex((item: any) => item.id === itemId);

    if (existingIdx > -1) {
      dbCart[existingIdx].quantity += quantity;
    } else {
      dbCart.push({
        id: itemId,
        productId,
        quantity,
        selectedSize: size,
        selectedColor: color,
        customPrint,
        customization
      });
    }

    userObj.cart = dbCart;
    await userObj.save();

    const cart = await getPopulatedCart(userObj);
    res.json({ success: true, cart });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error adding to cart' });
  }
});

// POST /api/cart/merge
router.post('/cart/merge', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cartItems } = req.body;
    if (!Array.isArray(cartItems)) {
      return res.status(400).json({ success: false, message: 'Invalid cartItems format' });
    }

    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const dbCart = userObj.cart || [];

    for (const gItem of cartItems) {
      const existingIdx = dbCart.findIndex((item: any) => item.id === gItem.id);
      if (existingIdx > -1) {
        dbCart[existingIdx].quantity += gItem.quantity;
      } else {
        const productExists = await ProductModel.countDocuments({ id: gItem.productId });
        if (productExists > 0) {
          dbCart.push({
            id: gItem.id,
            productId: gItem.productId,
            quantity: gItem.quantity,
            selectedSize: gItem.selectedSize,
            selectedColor: gItem.selectedColor,
            customPrint: gItem.customPrint,
            customization: gItem.customization
          });
        }
      }
    }

    userObj.cart = dbCart;
    await userObj.save();

    const cart = await getPopulatedCart(userObj);
    res.json({ success: true, cart });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error merging cart' });
  }
});

// PUT /api/cart/:itemId
router.put('/cart/:itemId', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Quantity is required' });
    }
    if (!Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number' });
    }

    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let dbCart = userObj.cart || [];
    const existingIdx = dbCart.findIndex((item: any) => item.id === itemId);

    if (existingIdx > -1) {
      if (quantity <= 0) {
        dbCart = dbCart.filter((item: any) => item.id !== itemId);
      } else {
        dbCart[existingIdx].quantity = quantity;
      }
      userObj.cart = dbCart;
      await userObj.save();
    }

    const cart = await getPopulatedCart(userObj);
    res.json({ success: true, cart });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating cart quantity' });
  }
});

// PUT /api/cart/:itemId/size
router.put('/cart/:itemId/size', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { size } = req.body;

    if (!size || typeof size !== 'string' || !size.trim()) {
      return res.status(400).json({ success: false, message: 'Valid size is required' });
    }

    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let dbCart = userObj.cart || [];
    const itemIndex = dbCart.findIndex((item: any) => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    const currentItem = dbCart[itemIndex];
    const product = await ProductModel.findOne({ id: currentItem.productId } as any).lean();
    if (product) {
      const isAdultSizeEnabled = product.sizeOptions && typeof product.sizeOptions.enabled === 'boolean'
        ? product.sizeOptions.enabled
        : (Array.isArray(product.sizes) && product.sizes.length > 0);
      const isKidsEnabled = Boolean(product.showKidsSizes || product.sizeOptions?.showKidsSizes);

      const adultSizes = isAdultSizeEnabled
        ? ((product.sizeOptions?.sizes && Array.isArray(product.sizeOptions.sizes) && product.sizeOptions.sizes.length > 0) ? product.sizeOptions.sizes : (Array.isArray(product.sizes) ? product.sizes : []))
        : [];
      const kidsSizes = isKidsEnabled
        ? (Array.isArray(product.kidsSizes) && product.kidsSizes.length > 0 ? product.kidsSizes : (product.sizeOptions?.kidsSizes || []))
        : [];

      const allowedSizes = [...adultSizes, ...kidsSizes];
      const isSizeRequired = isKidsEnabled || (Boolean(product.sizeOptions?.required ?? true) && isAdultSizeEnabled);
      if (isSizeRequired && (!size || !String(size).trim())) {
        return res.status(400).json({ success: false, message: 'Please select a size first.' });
      }
      if (allowedSizes.length > 0 && !allowedSizes.includes(size.trim())) {
        return res.status(400).json({ success: false, message: `Invalid size "${size}" for product "${product.name}"` });
      }
    }

    const trimmedSize = size.trim();
    const colorName = currentItem.selectedColor?.name || 'Default';
    const badgeIdsStr = currentItem.customization?.sleeveBadges?.enabled
      ? currentItem.customization.sleeveBadges.selectedBadges.map((b: any) => b.badgeId).sort().join(',')
      : '';
    const newItemId = `cart-${currentItem.productId}-${trimmedSize}-${colorName}-${currentItem.customPrint?.playerName || ''}-${currentItem.customization?.nameNumber?.name || ''}-${badgeIdsStr || currentItem.customization?.patches?.quantity || 0}`;

    const existingNewIdx = dbCart.findIndex((item: any) => item.id === newItemId);
    if (existingNewIdx > -1 && existingNewIdx !== itemIndex) {
      dbCart[existingNewIdx].quantity += currentItem.quantity;
      dbCart.splice(itemIndex, 1);
    } else {
      dbCart[itemIndex].id = newItemId;
      dbCart[itemIndex].selectedSize = trimmedSize;
    }

    userObj.cart = dbCart;
    await userObj.save();

    const cart = await getPopulatedCart(userObj);
    res.json({ success: true, cart });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating item size' });
  }
});

// DELETE /api/cart/:itemId
router.delete('/cart/:itemId', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let dbCart = userObj.cart || [];
    dbCart = dbCart.filter((item: any) => item.id !== itemId);
    userObj.cart = dbCart;
    await userObj.save();

    const cart = await getPopulatedCart(userObj);
    res.json({ success: true, cart });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error removing from cart' });
  }
});

// DELETE /api/cart
router.delete('/cart', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    userObj.cart = [];
    await userObj.save();
    res.json({ success: true, cart: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error clearing cart' });
  }
});

// GET /api/wishlist
router.get('/wishlist', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const wishlist = await getPopulatedWishlist(userObj);
    res.json({ success: true, wishlist });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching wishlist' });
  }
});

// POST /api/wishlist
router.post('/wishlist', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await ProductModel.findOne({ id: productId } as any).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const dbWishlist = userObj.wishlist || [];
    if (!dbWishlist.includes(productId)) {
      dbWishlist.push(productId);
      userObj.wishlist = dbWishlist;
      await userObj.save();
    }

    const wishlist = await getPopulatedWishlist(userObj);
    res.json({ success: true, wishlist });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error adding to wishlist' });
  }
});

// POST /api/wishlist/merge
router.post('/wishlist/merge', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wishlistProductIds } = req.body;
    if (!Array.isArray(wishlistProductIds)) {
      return res.status(400).json({ success: false, message: 'Invalid wishlistProductIds format' });
    }

    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const dbWishlist = userObj.wishlist || [];

    for (const id of wishlistProductIds) {
      if (!dbWishlist.includes(id)) {
        const productExists = await ProductModel.countDocuments({ id });
        if (productExists > 0) {
          dbWishlist.push(id);
        }
      }
    }

    userObj.wishlist = dbWishlist;
    await userObj.save();

    const wishlist = await getPopulatedWishlist(userObj);
    res.json({ success: true, wishlist });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error merging wishlist' });
  }
});

// DELETE /api/wishlist/:productId
router.delete('/wishlist/:productId', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;

    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let dbWishlist = userObj.wishlist || [];
    dbWishlist = dbWishlist.filter((id: string) => id !== productId);
    userObj.wishlist = dbWishlist;
    await userObj.save();

    const wishlist = await getPopulatedWishlist(userObj);
    res.json({ success: true, wishlist });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error removing from wishlist' });
  }
});

// DELETE /api/wishlist
router.delete('/wishlist', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userObj = await UserModel.findOne({ id: req.user?.id } as any);
    if (!userObj) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    userObj.wishlist = [];
    await userObj.save();
    res.json({ success: true, wishlist: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error clearing wishlist' });
  }
});



// ==========================================
// PRODUCT CATALOG & SEARCH ENDPOINTS
// ==========================================

// GET /api/products
router.get('/products', requireDB, async (req: AuthenticatedRequest, res: Response) => {
  const {
    category,
    brand,
    search,
    minPrice,
    maxPrice,
    size,
    color,
    tag,
    featured,
    bestSeller,
    trending,
    flashSale,
    sort,
    page = '1',
    limit = '12'
  } = req.query as Record<string, string>;

  try {
    const pipeline: any[] = [];
    
    // Project the finalPrice field (conditional helper since salePrice is optional)
    pipeline.push({
      $addFields: {
        finalPrice: { $ifNull: ["$salePrice", "$price"] }
      }
    });

    const matchStage: any = { status: 'active' };
    
    // Search Filter
    if (search) {
      const queryTerms = search.toLowerCase().split(/\s+/).filter(Boolean);
      if (queryTerms.length > 0) {
        matchStage.$and = queryTerms.map(term => {
          const regex = new RegExp(term, 'i');
          return {
            $or: [
              { name: regex },
              { description: regex },
              { shortDescription: regex },
              { sku: regex },
              { categoryName: regex },
              { subcategoryName: regex },
              { brandName: regex },
              { tags: regex }
            ]
          };
        });
      }
    }

    // Category Filter (id or slug)
    if (category) {
      const catObj = await CategoryModel.findOne({ $or: [{ slug: category }, { id: category }] } as any).lean();
      if (catObj) {
        if (catObj.id === 'cat-clubs') {
          const childClubs = await CategoryModel.find({ parentId: 'cat-clubs' } as any).lean();
          const childClubIds = childClubs.map((c) => c.id);
          matchStage.categoryId = { $in: childClubIds };
        } else if (catObj.id === 'cat-national-teams') {
          const childNats = await CategoryModel.find({ parentId: 'cat-national-teams' } as any).lean();
          const childNatIds = childNats.map((c) => c.id);
          matchStage.categoryId = { $in: childNatIds };
        } else if (catObj.navbarLocation === 'main' || catObj.navbarLocation === 'more') {
          matchStage.$or = [
            { categoryId: catObj.id },
            { subcategoryId: catObj.id },
            { subcategoryName: new RegExp('^' + catObj.name + '$', 'i') }
          ];
        } else {
          matchStage.$or = [
            { categoryId: catObj.id },
            { subcategoryId: catObj.id }
          ];
        }
      }
    }

    // Subcategory Filter (id or slug)
    if (req.query.subcategory) {
      const sub = req.query.subcategory as string;
      const subCatObj = await CategoryModel.findOne({ $or: [{ slug: sub }, { id: sub }] } as any).lean();
      if (subCatObj) {
        matchStage.subcategoryId = subCatObj.id;
      } else {
        matchStage.$or = [
          { subcategoryId: sub },
          { subcategoryName: new RegExp('^' + sub + '$', 'i') }
        ];
      }
    }

    // Brand Filter
    if (brand) {
      const brandObj = await BrandModel.findOne({ $or: [{ slug: brand }, { id: brand }] } as any).lean();
      if (brandObj) {
        matchStage.brandId = brandObj.id;
      }
    }

    // Price Filter
    if (minPrice || maxPrice) {
      const priceQuery: any = {};
      if (minPrice) priceQuery.$gte = Number(minPrice);
      if (maxPrice) priceQuery.$lte = Number(maxPrice);
      matchStage.finalPrice = priceQuery;
    }

    // Size Filter
    if (size) {
      matchStage.sizes = size;
    }

    // Tag Filter
    if (tag) {
      matchStage.tags = new RegExp('^' + tag + '$', 'i');
    }

    // Highlight Flags
    if (featured === 'true') {
      if (!matchStage.$and) matchStage.$and = [];
      matchStage.$and.push({
        $or: [
          { homepageSections: 'featured' },
          { homepageSections: { $exists: false }, featured: true }
        ]
      });
    }
    if (bestSeller === 'true') {
      if (!matchStage.$and) matchStage.$and = [];
      matchStage.$and.push({
        $or: [
          { homepageSections: 'best_sellers' },
          { homepageSections: { $exists: false }, isBestSeller: true }
        ]
      });
    }
    if (trending === 'true') {
      if (!matchStage.$and) matchStage.$and = [];
      matchStage.$and.push({
        $or: [
          { homepageSections: 'trending' },
          { homepageSections: { $exists: false }, isTrending: true }
        ]
      });
    }
    if (flashSale === 'true') {
      if (!matchStage.$and) matchStage.$and = [];
      matchStage.$and.push({
        $or: [
          { homepageSections: 'flash_sale' },
          { homepageSections: { $exists: false }, isFlashSale: true }
        ]
      });
    }

    pipeline.push({ $match: matchStage });

    // Sorting
    let sortStage: any = { createdAt: -1 };
    if (sort === 'price_asc') sortStage = { finalPrice: 1 };
    else if (sort === 'price_desc') sortStage = { finalPrice: -1 };
    else if (sort === 'rating') sortStage = { rating: -1 };
    else if (sort === 'newest') sortStage = { createdAt: -1 };

    pipeline.push({ $sort: sortStage });

    // Count Pipeline to get Total matching documents
    const countPipeline = [...pipeline, { $count: "count" }];
    const countResult = await ProductModel.aggregate(countPipeline);
    const total = countResult[0]?.count || 0;

    // Pagination
    const pNum = parseInt(page, 10) || 1;
    const lNum = parseInt(limit, 10) || 12;
    const startIndex = (pNum - 1) * lNum;

    pipeline.push({ $skip: startIndex });
    pipeline.push({ $limit: lNum });

    const products = await ProductModel.aggregate(pipeline);

    res.json({
      success: true,
      total,
      page: pNum,
      totalPages: Math.ceil(total / lNum),
      products
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error loading products from database' });
  }
});

// GET /api/products/:id
router.get('/products/:id', requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await ProductModel.findOne({ $or: [{ id: req.params.id }, { slug: req.params.id }] } as any).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Related products (from same category)
    const related = await ProductModel.find({ id: { $ne: product.id }, categoryId: product.categoryId } as any).limit(4).lean();
    res.json({ success: true, product, related });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error querying product' });
  }
});

function sanitizeSizeChart(raw: any): Array<{ size: string; length: number; chest: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const size = typeof item.size === 'string' ? item.size.trim() : String(item.size || '').trim();
      if (!size) return null;
      const length = typeof item.length === 'number' ? item.length : parseFloat(String(item.length));
      const chest = typeof item.chest === 'number' ? item.chest : parseFloat(String(item.chest));
      return {
        size,
        length: !isNaN(length) && length >= 0 ? length : 0,
        chest: !isNaN(chest) && chest >= 0 ? chest : 0
      };
    })
    .filter((item): item is { size: string; length: number; chest: number } => item !== null);
}

// POST /api/products (Admin)
router.post('/products', requirePermission('products.add'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    if (!body.name || !body.price || !body.categoryId) {
      return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
    }

    const category = await CategoryModel.findOne({ id: body.categoryId } as any).lean();
    const subcategory = body.subcategoryId ? await CategoryModel.findOne({ id: body.subcategoryId } as any).lean() : null;

    const showSizeChart = Boolean(body.showSizeChart ?? body.sizeOptions?.showSizeChart);
    const sizeChart = sanitizeSizeChart(body.sizeChart ?? body.sizeOptions?.sizeChart);

    const sizeOptions = body.sizeOptions ? {
      ...body.sizeOptions,
      enabled: Boolean(body.sizeOptions.enabled ?? true),
      required: Boolean(body.sizeOptions.required ?? true),
      label: body.sizeOptions.label || 'Select Size:',
      sizes: body.sizeOptions.sizes || body.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
      showKidsSizes: Boolean(body.showKidsSizes || body.sizeOptions.showKidsSizes),
      kidsSizes: Array.isArray(body.kidsSizes) ? body.kidsSizes : (body.sizeOptions?.kidsSizes || []),
      showSizeChart,
      sizeChart
    } : {
      enabled: true,
      required: true,
      label: 'Select Size:',
      sizes: body.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
      showKidsSizes: false,
      kidsSizes: [],
      showSizeChart,
      sizeChart
    };

    const newProduct = {
      id: `prod-${Date.now()}`,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sku: body.sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: body.barcode || `893${Math.floor(100000000 + Math.random() * 900000000)}`,
      price: Number(body.price),
      discountPercent: (body.discountPercent !== undefined && body.discountPercent !== null) ? Number(body.discountPercent) : 0,
      salePrice: (body.discountPercent !== undefined && body.discountPercent !== null && Number(body.discountPercent) > 0) 
        ? Math.round(Number(body.price) - (Number(body.price) * Number(body.discountPercent) / 100)) 
        : undefined,
      description: body.description || '',
      shortDescription: body.shortDescription || '',
      specifications: body.specifications || [],
      images: body.images && body.images.length ? body.images : [],
      videoUrl: body.videoUrl || '',
      categoryId: body.categoryId,
      categoryName: category ? category.name : 'General',
      subcategoryId: body.subcategoryId || '',
      subcategoryName: subcategory ? subcategory.name : '',
      brandId: body.brandId || '',
      brandName: body.brandName || '',
      stock: Number(body.stock || 20),
      lowStockAlert: Number(body.lowStockAlert || 5),
      isOutOfStock: Number(body.stock || 20) <= 0,
      sizes: body.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
      sizeOptions,
      showSizeChart,
      sizeChart,
      colors: body.colors || [{ name: 'Standard', hex: '#006a4e' }],
      tags: body.tags || ['Jersey', 'Sports'],
      weight: body.weight || '200g',
      featured: Boolean(body.featured),
      isBestSeller: Boolean(body.isBestSeller),
      isTrending: Boolean(body.isTrending),
      isNewArrival: Boolean(body.isNewArrival),
      isFlashSale: Boolean(body.isFlashSale),
      allowCustomPrint: Boolean(body.allowCustomPrint ?? true),
      showCustomNameNumber: Boolean(body.showCustomNameNumber),
      showSleevePatches: Boolean(body.showSleevePatches),
      showKidsSizes: Boolean(body.showKidsSizes || body.sizeOptions?.showKidsSizes),
      kidsSizes: Array.isArray(body.kidsSizes) ? body.kidsSizes : (body.sizeOptions?.kidsSizes || []),
      returnPolicy: body.returnPolicy || '7 Days Return Policy',
      warranty: body.warranty || '100% Quality Guaranteed',
      status: body.status || 'active',
      rating: 5.0,
      reviewCount: 0,
      homepageSections: body.homepageSections || [],
      sleeveBadges: body.sleeveBadges || [],
      createdAt: new Date().toISOString()
    };

    await ProductModel.create(newProduct);
    res.status(201).json({ success: true, message: 'Product created successfully', product: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error saving product to database' });
  }
});

// PUT /api/products/:id (Admin)
router.put('/products/:id', requirePermission('products.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await ProductModel.findOne({ id: req.params.id } as any);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const body = req.body;
    const oldImages = product.images || [];

    const updatedFields: any = { ...body };
    if (body.categoryId) {
      const category = await CategoryModel.findOne({ id: body.categoryId } as any).lean();
      updatedFields.categoryName = category ? category.name : 'General';
    }
    if (body.hasOwnProperty('subcategoryId')) {
      const subcategory = body.subcategoryId ? await CategoryModel.findOne({ id: body.subcategoryId } as any).lean() : null;
      updatedFields.subcategoryId = body.subcategoryId || '';
      updatedFields.subcategoryName = subcategory ? subcategory.name : '';
    }
    if (body.hasOwnProperty('showCustomNameNumber')) updatedFields.showCustomNameNumber = Boolean(body.showCustomNameNumber);
    if (body.hasOwnProperty('showSleevePatches')) updatedFields.showSleevePatches = Boolean(body.showSleevePatches);
    if (body.hasOwnProperty('showKidsSizes')) updatedFields.showKidsSizes = Boolean(body.showKidsSizes);
    if (body.hasOwnProperty('kidsSizes')) updatedFields.kidsSizes = Array.isArray(body.kidsSizes) ? body.kidsSizes : [];

    const showSizeChart = body.hasOwnProperty('showSizeChart')
      ? Boolean(body.showSizeChart)
      : (body.sizeOptions && body.sizeOptions.hasOwnProperty('showSizeChart') ? Boolean(body.sizeOptions.showSizeChart) : undefined);
    if (showSizeChart !== undefined) {
      updatedFields.showSizeChart = showSizeChart;
    }

    const rawChart = body.hasOwnProperty('sizeChart')
      ? body.sizeChart
      : (body.sizeOptions && body.sizeOptions.hasOwnProperty('sizeChart') ? body.sizeOptions.sizeChart : undefined);
    if (rawChart !== undefined) {
      updatedFields.sizeChart = sanitizeSizeChart(rawChart);
    }

    if (body.sizeOptions) {
      updatedFields.sizeOptions = {
        ...body.sizeOptions,
        ...(showSizeChart !== undefined ? { showSizeChart } : {}),
        ...(rawChart !== undefined ? { sizeChart: sanitizeSizeChart(rawChart) } : {})
      };
    }

    if (body.hasOwnProperty('price') || body.hasOwnProperty('discountPercent')) {
      const price = Number(body.price !== undefined ? body.price : product.price);
      const discountPercent = (body.discountPercent !== undefined && body.discountPercent !== null) ? Number(body.discountPercent) : (product.discountPercent || 0);
      updatedFields.price = price;
      updatedFields.discountPercent = discountPercent;
      if (discountPercent > 0 && discountPercent <= 100) {
        updatedFields.salePrice = Math.round(price - (price * discountPercent / 100));
      } else {
        updatedFields.salePrice = null;
      }
    }

    const result = await ProductModel.findOneAndUpdate({ id: req.params.id } as any, updatedFields, { returnDocument: 'after' } as any).lean();

    // Clean up replaced/removed images
    const newImages = result.images || [];
    const removedImages = oldImages.filter(img => !newImages.includes(img));
    for (const imgUrl of removedImages) {
      await deleteUploadedFileByUrl(imgUrl);
    }

    res.json({ success: true, message: 'Product updated successfully', product: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating product in database' });
  }
});

// DELETE /api/products/:id (Admin)
router.delete('/products/:id', requirePermission('products.delete'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await ProductModel.findOne({ id: req.params.id } as any);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await ProductModel.deleteOne({ id: req.params.id } as any);
    
    // Delete associated images
    if (product.images) {
      for (const img of product.images) {
        await deleteUploadedFileByUrl(img);
      }
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error deleting product from database' });
  }
});

// POST /api/products/generate-ai-description
router.post('/products/generate-ai-description', requirePermission('products.edit'), async (req: AuthenticatedRequest, res: Response) => {
  const { title, category, features } = req.body;
  const ai = getGenAI();

  if (!ai) {
    return res.json({
      success: true,
      description: `Experience maximum breathability and style with the ${title || 'Official Jersey'}. Engineered with high-performance moisture-wicking technology and high-density crest detailing. Perfect for matches and casual fan wear.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate an engaging, SEO-rich product description for an e-commerce jersey store named Jersey Mention BD.
Title: ${title}
Category: ${category}
Key Features: ${features || 'Player version fit, breathable mesh, official crest'}

Provide a concise paragraph (60-80 words) and 3 bullet points.`
    });

    res.json({ success: true, description: response.text });
  } catch (err: any) {
    res.json({
      success: true,
      description: `Premium quality ${title} crafted for authentic matchday comfort. Features lightweight athletic mesh fabric, high-durability print, and athletic slim fit.`
    });
  }
});

// ==========================================
// CATEGORIES & BRANDS ENDPOINTS
// ==========================================

// GET /api/categories
router.get('/categories', requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await CategoryModel.find().lean();
    const sorted = categories.sort((a: any, b: any) => (a.displayOrder || 999) - (b.displayOrder || 999));
    res.json({ success: true, categories: sorted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error loading categories' });
  }
});

// POST /api/categories (Admin)
router.post('/categories', requirePermission('categories.add'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, image, banner, parentId, displayOrder, isActive, slug, navbarLocation, navbarPosition } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name required' });

    const parent = parentId ? await CategoryModel.findOne({ id: parentId } as any).lean() : null;
    const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const categoryId = parentId ? `subcat-${Date.now()}` : `cat-${Date.now()}`;

    const newCat = {
      id: categoryId,
      name,
      slug: categorySlug,
      image: image || '',
      banner: banner || '',
      parentId: parentId || '',
      parentName: parent ? parent.name : undefined,
      isActive: isActive !== false,
      displayOrder: displayOrder ? Number(displayOrder) : undefined,
      navbarLocation: navbarLocation || 'hidden',
      navbarPosition: navbarPosition ? Number(navbarPosition) : undefined,
      featured: true,
      productCount: 0
    };

    await CategoryModel.create(newCat);

    // If this is a team category, auto-generate standard subcategories
    if (parentId === 'cat-clubs' || parentId === 'cat-national-teams') {
      const defaultSubs = ['Player Edition', 'Retro Classic', 'Fan Edition'];
      for (const [idx, sub] of defaultSubs.entries()) {
        const subSlug = `${newCat.slug}-${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        await CategoryModel.create({
          id: `subcat-${newCat.slug}-${idx}-${Date.now()}`,
          name: sub,
          slug: subSlug,
          parentId: newCat.id,
          parentName: newCat.name,
          image: '',
          isActive: true,
          displayOrder: idx + 1,
          productCount: 0
        });
      }
    }

    res.status(201).json({ success: true, category: newCat });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error saving category to database' });
  }
});

// PUT /api/categories/:id (Admin)
router.put('/categories/:id', requirePermission('categories.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await CategoryModel.findOne({ id: req.params.id } as any);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, slug, image, banner, isActive, displayOrder, parentId, navbarLocation, navbarPosition } = req.body;
    const parent = parentId ? await CategoryModel.findOne({ id: parentId } as any).lean() : null;

    const updatedFields: any = {};
    if (name !== undefined) updatedFields.name = name;
    if (slug !== undefined) updatedFields.slug = slug;
    if (image !== undefined) updatedFields.image = image;
    if (banner !== undefined) updatedFields.banner = banner;
    if (isActive !== undefined) updatedFields.isActive = Boolean(isActive);
    if (displayOrder !== undefined) updatedFields.displayOrder = Number(displayOrder);
    if (parentId !== undefined) {
      updatedFields.parentId = parentId;
      updatedFields.parentName = parent ? parent.name : undefined;
    }
    if (navbarLocation !== undefined) updatedFields.navbarLocation = navbarLocation;
    if (navbarPosition !== undefined) updatedFields.navbarPosition = Number(navbarPosition);

    const result = await CategoryModel.findOneAndUpdate({ id: req.params.id } as any, updatedFields, { returnDocument: 'after' } as any).lean();

    if (name !== undefined && name !== existing.name) {
      await CategoryModel.updateMany({ parentId: existing.id } as any, { parentName: name });
    }

    // Clean up replaced images/banners
    if (existing.image && existing.image !== result.image) {
      await deleteUploadedFileByUrl(existing.image);
    }
    if (existing.banner && existing.banner !== result.banner) {
      await deleteUploadedFileByUrl(existing.banner);
    }

    res.json({ success: true, category: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating category in database' });
  }
});

// DELETE /api/categories/:id (Admin)
router.delete('/categories/:id', requirePermission('categories.delete'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await CategoryModel.findOne({ id: req.params.id } as any);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const toDeleteIds = [req.params.id];
    const findChildren = async (pid: string) => {
      const children = await CategoryModel.find({ parentId: pid } as any).lean();
      for (const child of children) {
        toDeleteIds.push(child.id);
        await findChildren(child.id);
      }
    };
    await findChildren(req.params.id);

    const categoriesToDelete = await CategoryModel.find({ id: { $in: toDeleteIds } } as any).lean();
    await CategoryModel.deleteMany({ id: { $in: toDeleteIds } } as any);

    // Clean up uploaded images/banners of deleted categories
    for (const cat of categoriesToDelete) {
      if (cat.image) await deleteUploadedFileByUrl(cat.image);
      if (cat.banner) await deleteUploadedFileByUrl(cat.banner);
    }

    res.json({ success: true, message: 'Category and its subcategories deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error deleting category from database' });
  }
});

router.get('/brands', requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brands = await BrandModel.find().lean();
    res.json({ success: true, brands });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error querying brands' });
  }
});

router.post('/brands', requirePermission('categories.add'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, logo, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Brand name required' });

    const newBrand = {
      id: `brd-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logo: logo || '',
      description: description || '',
      isActive: true,
      productCount: 0
    };

    await BrandModel.create(newBrand);
    res.status(201).json({ success: true, brand: newBrand });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error saving brand to database' });
  }
});

// ==========================================
// COUPON VALIDATION ENDPOINT
// ==========================================

router.post('/coupons/validate', async (req: AuthenticatedRequest, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

  try {
    const coupon = await CouponModel.findOne({
      code: code.toUpperCase(),
      isActive: true
    } as any).lean();

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ৳${coupon.minPurchase} required for this coupon`
      });
    }

    let discount = 0;
    if (coupon.discountType === 'fixed') {
      discount = coupon.discountValue;
    } else {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    res.json({
      success: true,
      message: 'Coupon applied successfully!',
      discount,
      coupon
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/coupons', requirePermission('coupons.view'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coupons = await CouponModel.find().lean();
    res.json({ success: true, coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/coupons', requirePermission('coupons.add'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, discountType, discountValue, minPurchase, maxDiscount, expireDate, usageLimit } = req.body;
    if (!code || !discountValue) return res.status(400).json({ success: false, message: 'Code and discount required' });

    const newCoupon = {
      id: `coup-${Date.now()}`,
      code: code.toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minPurchase: Number(minPurchase || 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expireDate: expireDate || '2026-12-31',
      usageLimit: Number(usageLimit || 100),
      usedCount: 0,
      isActive: true
    };

    await CouponModel.create(newCoupon);
    res.status(201).json({ success: true, coupon: newCoupon });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error saving coupon to database' });
  }
});

// ==========================================
// ORDERS ENDPOINTS
// ==========================================

// POST /api/orders
router.post('/orders', requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      shippingFee,
      couponCode,
      paymentMethod,
      paymentDetails,
      paymentType,
      paymentMobileNumber,
      transactionId,
      notes
    } = req.body;

    if (!customerName || !customerPhone || !shippingAddress || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required checkout information' });
    }

    const customer = req.user ? await UserModel.findOne({ id: req.user.id } as any) : null;
    const finalUserId = customer ? customer.id : (req.user?.id || undefined);

    const phoneRegex = /^(?:\+88|88)?01[3-9]\d{8}$/;
    if (!phoneRegex.test(customerPhone.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid customer phone number format. Must be a valid Bangladesh mobile number.' });
    }

    if (!shippingAddress.fullName || !shippingAddress.fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Shipping address full name is required.' });
    }

    if (!shippingAddress.phone || !phoneRegex.test(shippingAddress.phone.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid shipping address phone number format. Must be a valid Bangladesh mobile number.' });
    }

    if (!shippingAddress.address || !shippingAddress.address.trim()) {
      return res.status(400).json({ success: false, message: 'Shipping address street address is required.' });
    }

    if (!shippingAddress.city || !shippingAddress.city.trim()) {
      return res.status(400).json({ success: false, message: 'Shipping address city is required.' });
    }

    if (!shippingAddress.district || !shippingAddress.district.trim()) {
      return res.status(400).json({ success: false, message: 'Shipping address district is required.' });
    }

    if (!shippingAddress.zone || (shippingAddress.zone !== 'inside_dhaka' && shippingAddress.zone !== 'outside_dhaka')) {
      return res.status(400).json({ success: false, message: 'Valid shipping address delivery zone (inside_dhaka or outside_dhaka) is required.' });
    }

    if (!paymentType || (paymentType !== '25_percent_advance' && paymentType !== '100_percent_advance')) {
      return res.status(400).json({ success: false, message: 'Please select a payment option before placing your order.' });
    }

    const paymentPhone = (paymentMobileNumber || req.body.paymentPhone || paymentDetails?.senderNumber || '').trim();
    const cleanTrxId = (transactionId || req.body.trxId || paymentDetails?.transactionId || '').trim();

    if (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentType === '25_percent_advance' || paymentType === '100_percent_advance') {
      if (!paymentPhone) {
        return res.status(400).json({ success: false, message: 'Mobile Number is required' });
      }
      const phoneRegex = /^(?:\+88|88)?01[3-9]\d{8}$/;
      if (!phoneRegex.test(paymentPhone)) {
        return res.status(400).json({ success: false, message: 'Invalid Bangladesh mobile number format for sender mobile number.' });
      }
      if (!cleanTrxId) {
        return res.status(400).json({ success: false, message: 'Transaction ID / TrxID is required' });
      }
    }

    const settings = await SiteSettingsModel.findOne().lean();
    const taxRate = settings?.taxRate || 0;
    const nameNumberPriceSetting = settings?.customNameNumberPrice ?? 250;
    const patchPriceSetting = settings?.patchPrice ?? 100;

    let calculatedSubtotal = 0;
    let itemsSubtotal = 0;
    let customizationTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbProduct = await ProductModel.findOne({ id: item.productId } as any).lean();
      if (!dbProduct) {
        return res.status(400).json({ success: false, message: `Product ${item.name || 'item'} not found.` });
      }

      // Backend Size Options Validation (Adult + Kids Sizes)
      const isAdultSizeEnabled = dbProduct.sizeOptions && typeof dbProduct.sizeOptions.enabled === 'boolean'
        ? dbProduct.sizeOptions.enabled
        : (Array.isArray(dbProduct.sizes) && dbProduct.sizes.length > 0);
      const isKidsEnabled = Boolean(dbProduct.showKidsSizes || dbProduct.sizeOptions?.showKidsSizes);

      const adultSizes = isAdultSizeEnabled
        ? ((dbProduct.sizeOptions?.sizes && Array.isArray(dbProduct.sizeOptions.sizes) && dbProduct.sizeOptions.sizes.length > 0) ? dbProduct.sizeOptions.sizes : (Array.isArray(dbProduct.sizes) ? dbProduct.sizes : []))
        : [];
      const kidsSizes = isKidsEnabled
        ? (Array.isArray(dbProduct.kidsSizes) && dbProduct.kidsSizes.length > 0 ? dbProduct.kidsSizes : (dbProduct.sizeOptions?.kidsSizes || []))
        : [];

      const allowedSizes = [...adultSizes, ...kidsSizes];
      const isSizeEnabled = Boolean(isAdultSizeEnabled || isKidsEnabled || allowedSizes.length > 0);
      const isSizeRequired = isKidsEnabled || (Boolean(dbProduct.sizeOptions?.required ?? true) && isAdultSizeEnabled);

      if (isSizeRequired || allowedSizes.length > 0) {
        const itemSize = typeof item.size === 'string' ? item.size.trim() : '';
        if (isSizeRequired && !itemSize) {
          return res.status(400).json({
            success: false,
            message: 'Please select a size first.'
          });
        }
        if (allowedSizes.length > 0 && itemSize && !allowedSizes.includes(itemSize)) {
          return res.status(400).json({
            success: false,
            message: `Selected size "${itemSize}" is invalid for product "${dbProduct.name}". Available sizes: ${allowedSizes.join(', ')}`
          });
        }
        item.size = itemSize || undefined;
      } else {
        // If size selection is disabled, clear size value
        item.size = undefined;
      }

      const productPrice = dbProduct.salePrice || dbProduct.price;

      let nameNumberEnabled = false;
      let nameNumberName = '';
      let nameNumberNumber = '';
      let nameNumberPrice = 0;

      if (item.customization?.nameNumber?.enabled) {
        if (!dbProduct.showCustomNameNumber && !dbProduct.allowCustomPrint) {
          return res.status(400).json({ success: false, message: `Squad name/number customization not allowed for ${dbProduct.name}.` });
        }
        nameNumberName = item.customization.nameNumber.name?.trim() || '';
        nameNumberNumber = item.customization.nameNumber.number?.trim() || '';
        if (!nameNumberName || !nameNumberNumber) {
          return res.status(400).json({ success: false, message: `Please enter custom squad name and number.` });
        }
        nameNumberEnabled = true;
        nameNumberPrice = nameNumberPriceSetting;
      }

      let patchesEnabled = false;
      let patchesQuantity = 0;
      let patchesPricePerPatch = 0;
      let patchesTotalPrice = 0;

      let sleeveBadgesEnabled = false;
      let sleeveBadgesSelected: any[] = [];
      let sleeveBadgesQuantity = 0;
      let sleeveBadgesPricePerBadge = 0;
      let sleeveBadgesTotalPrice = 0;

      if (item.customization?.sleeveBadges?.enabled) {
        if (!dbProduct.showSleevePatches) {
          return res.status(400).json({ success: false, message: `Sleeve patches not allowed for ${dbProduct.name}.` });
        }
        const clientBadges = item.customization.sleeveBadges.selectedBadges || [];
        if (clientBadges.length < 1) {
          return res.status(400).json({ success: false, message: `Please select at least one sleeve badge.` });
        }
        const badgeIds = clientBadges.map((cb: any) => cb.badgeId).filter(Boolean);
        const dbBadges = await SleeveBadgeOptionModel.find({ id: { $in: badgeIds }, isActive: true } as any).lean();

        if (dbBadges.length !== badgeIds.length) {
          return res.status(400).json({ success: false, message: 'One or more selected sleeve badges are invalid or inactive.' });
        }

        const allowedBadgeIds = dbProduct.sleeveBadges || [];
        const isAllAssigned = badgeIds.every((id: string) => allowedBadgeIds.includes(id));
        if (!isAllAssigned) {
          return res.status(400).json({ success: false, message: `One or more selected badges are not available for ${dbProduct.name}.` });
        }

        sleeveBadgesEnabled = true;
        sleeveBadgesQuantity = clientBadges.length;

        sleeveBadgesSelected = clientBadges.map((cb: any) => {
          const matchedDb = dbBadges.find((dbB: any) => dbB.id === cb.badgeId)!;
          const badgePrice = matchedDb.price !== undefined ? matchedDb.price : 0;
          return {
            badgeId: matchedDb.id,
            name: matchedDb.name,
            badgeName: matchedDb.name,
            image: matchedDb.image || '',
            badgeImage: matchedDb.image || '',
            price: badgePrice,
            badgePrice: badgePrice
          };
        });

        sleeveBadgesTotalPrice = sleeveBadgesSelected.reduce((sum, b) => sum + (b.price || 0), 0);
        sleeveBadgesPricePerBadge = sleeveBadgesSelected.length > 0 ? sleeveBadgesSelected[0].price : 0;

        // Also set legacy patches values for backward compatibility
        patchesEnabled = true;
        patchesQuantity = sleeveBadgesQuantity;
        patchesPricePerPatch = sleeveBadgesPricePerBadge;
        patchesTotalPrice = sleeveBadgesTotalPrice;
      } else if (item.customization?.patches?.enabled) {
        // Fallback to legacy counter if sleeveBadges is not present
        if (!dbProduct.showSleevePatches) {
          return res.status(400).json({ success: false, message: `Sleeve patches not allowed for ${dbProduct.name}.` });
        }
        patchesQuantity = Number(item.customization.patches.quantity || 0);
        if (patchesQuantity < 1) {
          return res.status(400).json({ success: false, message: `Invalid patch quantity selected.` });
        }
        patchesEnabled = true;
        patchesPricePerPatch = patchPriceSetting;
        patchesTotalPrice = patchesQuantity * patchPriceSetting;
      }

      const itemCustomizationAddon = nameNumberPrice + (sleeveBadgesEnabled ? sleeveBadgesTotalPrice : patchesTotalPrice);
      const itemBasePrice = productPrice + itemCustomizationAddon;
      calculatedSubtotal += itemBasePrice * item.quantity;
      itemsSubtotal += productPrice * item.quantity;
      customizationTotal += itemCustomizationAddon * item.quantity;

      const isKidsSize = Boolean(isKidsEnabled && item.size && ALL_KIDS_SIZES.includes(item.size.trim()));

      validatedItems.push({
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: dbProduct.id,
        sku: dbProduct.sku || '',
        name: dbProduct.name,
        productName: dbProduct.name,
        basePrice: dbProduct.price,
        salePrice: dbProduct.salePrice || undefined,
        discountPercent: dbProduct.discountPercent || 0,
        price: itemBasePrice,
        finalItemPrice: itemBasePrice,
        lineTotal: itemBasePrice * item.quantity,
        quantity: item.quantity,
        image: dbProduct.images[0] || '',
        productImage: dbProduct.images[0] || '',
        size: isSizeEnabled ? item.size : undefined,
        isKidsSize,
        color: item.color || (dbProduct.colors[0]?.name || 'Standard'),
        priceBreakdown: {
          baseProductPrice: productPrice,
          regularPrice: dbProduct.price,
          salePrice: dbProduct.salePrice || undefined,
          customNameNumberPrice: nameNumberPrice,
          sleeveBadgesPrice: sleeveBadgesEnabled ? sleeveBadgesTotalPrice : patchesTotalPrice,
          finalItemPrice: itemBasePrice,
          lineTotal: itemBasePrice * item.quantity
        },
        customPrint: {
          playerName: nameNumberName,
          playerNumber: nameNumberNumber,
          sleeveBadge: 'None',
          additionalNotes: item.customPrint?.additionalNotes || ''
        },
        customization: {
          nameNumber: {
            enabled: nameNumberEnabled,
            name: nameNumberName,
            number: nameNumberNumber,
            price: nameNumberPrice
          },
          patches: {
            enabled: patchesEnabled,
            quantity: patchesQuantity,
            pricePerPatch: patchesPricePerPatch,
            totalPrice: patchesTotalPrice
          },
          sleeveBadges: sleeveBadgesEnabled ? {
            enabled: sleeveBadgesEnabled,
            selectedBadges: sleeveBadgesSelected,
            quantity: sleeveBadgesQuantity,
            pricePerBadge: sleeveBadgesPricePerBadge,
            totalPrice: sleeveBadgesTotalPrice
          } : undefined
        }
      });
    }

    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await CouponModel.findOne({ code: couponCode.toUpperCase(), isActive: true } as any).lean();
      if (coupon) {
        if (!coupon.minPurchase || calculatedSubtotal >= coupon.minPurchase) {
          if (coupon.discountType === 'fixed') {
            couponDiscount = coupon.discountValue;
          } else {
            couponDiscount = Math.round((calculatedSubtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
              couponDiscount = coupon.maxDiscount;
            }
          }
        }
      }
    }

    const dbFreeDeliveryEnabled = settings?.freeDeliveryEnabled !== false;
    const dbFreeShippingThreshold = settings?.freeShippingThreshold ?? 3000;
    let dbShippingFee = 0;
    const isDbFreeShipping = dbFreeDeliveryEnabled && (calculatedSubtotal >= dbFreeShippingThreshold);
    if (!isDbFreeShipping) {
      const zone = shippingAddress.zone || 'inside_dhaka';
      if (zone === 'inside_dhaka') {
        dbShippingFee = settings?.insideDhakaShippingFee ?? 80;
      } else {
        dbShippingFee = settings?.outsideDhakaShippingFee ?? 150;
      }
    }

    const calculatedTax = Math.round((calculatedSubtotal * taxRate) / 100);
    const calculatedGrandTotal = Math.max(0, calculatedSubtotal + calculatedTax + dbShippingFee - couponDiscount);

    let advanceAmount = 0;
    let remainingAmount = 0;
    const advancePercentage = paymentType === '100_percent_advance' ? 100 : 25;

    if (paymentType === '25_percent_advance') {
      advanceAmount = Math.round((calculatedGrandTotal * 0.25) * 100) / 100;
      remainingAmount = Math.round((calculatedGrandTotal - advanceAmount) * 100) / 100;
    } else if (paymentType === '100_percent_advance') {
      advanceAmount = calculatedGrandTotal;
      remainingAmount = 0;
    }

    const orderNum = `JMB-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialTimeline = [
      {
        status: 'pending' as OrderStatus,
        title: 'Order Placed',
        description: `Order received via ${paymentMethod.toUpperCase()} (${advancePercentage === 100 ? '100% Full Payment' : '25% Advance'}). Payment verification is pending admin review.`,
        timestamp: new Date().toISOString()
      }
    ];

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      userId: finalUserId,
      customerName,
      customerEmail: (customerEmail || req.user?.email || '').trim(),
      customerPhone,
      shippingAddress,
      items: validatedItems,
      subtotal: calculatedSubtotal,
      itemsSubtotal,
      customizationTotal,
      tax: calculatedTax,
      shippingFee: dbShippingFee,
      deliveryLocation: shippingAddress.zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka',
      delivery: {
        location: shippingAddress.zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka',
        charge: dbShippingFee
      },
      discount: couponDiscount,
      couponCode,
      grandTotal: calculatedGrandTotal,
      totalAmount: calculatedGrandTotal,
      paymentMethod,
      paymentStatus: 'pending',
      paymentVerificationStatus: 'pending',
      paymentMobileNumber: paymentPhone,
      transactionId: cleanTrxId,
      advancePaymentPercentage: advancePercentage,
      amountPaid: advanceAmount,
      remainingAmount: remainingAmount,
      paymentDetails: {
        transactionId: cleanTrxId,
        senderNumber: paymentPhone,
        paidAt: new Date().toISOString()
      },
      orderStatus: 'pending',
      notes: (notes || req.body.notes || '').trim(),
      customerNotes: (notes || req.body.notes || '').trim(),
      trackingNumber: `STEADFAST-${Math.floor(100000 + Math.random() * 900000)}`,
      timeline: initialTimeline,
      payment: {
        type: paymentType,
        totalAmount: calculatedGrandTotal,
        advanceAmount: advanceAmount,
        remainingAmount: remainingAmount
      },
      createdAt: new Date().toISOString()
    };

    await OrderModel.create(newOrder);

    // Save shipping address to user's profile if user is logged in
    if (req.user && req.user.id) {
      await UserModel.findOneAndUpdate(
        { id: req.user.id } as any,
        {
          $set: {
            savedShippingAddress: {
              fullName: shippingAddress.fullName || customerName,
              phone: shippingAddress.phone || customerPhone,
              address: shippingAddress.address,
              city: shippingAddress.city,
              district: shippingAddress.district,
              postalCode: shippingAddress.postalCode || '',
              zone: shippingAddress.zone || 'inside_dhaka'
            }
          }
        },
        {} as any
      );
    }

    // Update Product Inventory and create log directly in MongoDB
    for (const item of items) {
      const prod = await ProductModel.findOne({ id: item.productId } as any);
      if (prod) {
        const prev = prod.stock;
        prod.stock = Math.max(0, prod.stock - item.quantity);
        prod.isOutOfStock = prod.stock <= 0;
        await prod.save();

        await InventoryLogModel.create({
          id: `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: 'out',
          quantity: item.quantity,
          previousStock: prev,
          newStock: prod.stock,
          notes: `Order #${orderNum} purchase`,
          createdByName: customerName,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Admin notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'New Order Received',
      message: `Order #${orderNum} from ${customerName} (৳${calculatedGrandTotal})`,
      type: 'order',
      read: false,
      createdAt: new Date().toISOString()
    };
    await NotificationModel.create(newNotif);

    // Update coupon count if applicable
    if (couponCode) {
      await (CouponModel as any).findOneAndUpdate(
        { code: couponCode.toUpperCase() } as any,
        { $inc: { usedCount: 1 } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (err: any) {
    console.error('[BACKEND ERROR]', err);
    res.status(500).json({ success: false, message: err.message || 'Error processing checkout request' });
  }
});

// GET /api/orders/my-orders
router.get('/orders/my-orders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userOrders = await OrderModel.find({
      $or: [
        { userId: req.user!.id },
        { customerEmail: new RegExp('^' + req.user!.email + '$', 'i') }
      ]
    } as any).sort({ createdAt: -1 }).lean();
    res.json({ success: true, orders: userOrders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/track
router.get('/orders/track', async (req: AuthenticatedRequest, res: Response) => {
  const { orderNumber, identifier } = req.query as { orderNumber?: string; identifier?: string };
  if (!orderNumber) {
    return res.status(400).json({ success: false, message: 'Order number is required' });
  }

  try {
    const order = await OrderModel.findOne({
      $or: [
        { orderNumber: new RegExp('^' + orderNumber + '$', 'i') },
        { id: orderNumber }
      ]
    } as any).lean();

    const notFound = () => res.status(404).json({
      success: false,
      message: 'Order not found. Please check your Order ID and phone number/email and try again.'
    });

    if (!order) {
      return notFound();
    }

    const isAuth = !!req.user;
    const isOwnOrder = isAuth && (
      (order.userId && order.userId === req.user!.id) ||
      (order.customerEmail && req.user!.email && order.customerEmail.toLowerCase() === req.user!.email.toLowerCase())
    );

    if (isOwnOrder) {
      return res.json({ success: true, order });
    }

    if (!identifier) {
      return notFound();
    }

    const cleanInput = identifier.trim().toLowerCase();
    const cleanOrderEmail = (order.customerEmail || '').trim().toLowerCase();

    const normalizePhone = (num: string) => num.replace(/\D/g, '');
    const inputPhone = normalizePhone(cleanInput);
    const orderPhone = normalizePhone(order.customerPhone);

    const emailMatches = cleanOrderEmail === cleanInput;
    const phoneMatches = inputPhone.length > 0 && orderPhone.length > 0 && (
      orderPhone.endsWith(inputPhone) || inputPhone.endsWith(orderPhone)
    );

    if (emailMatches || phoneMatches) {
      return res.json({ success: true, order });
    }

    return notFound();
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/all (Admin)
router.get('/orders/all', requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  const { status, search } = req.query as { status?: string; search?: string };
  
  try {
    const query: any = {};
    if (status) {
      query.orderStatus = status;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { orderNumber: regex },
        { customerName: regex },
        { customerPhone: regex },
        { customerEmail: regex }
      ];
    }

    const list = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, orders: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id (Admin)
router.get('/orders/:id', requirePermission('orders.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await OrderModel.findOne({
      $or: [
        { id: req.params.id },
        { orderNumber: req.params.id }
      ]
    } as any).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/status (Admin)
router.patch('/orders/:id/status', requirePermission('orders.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  const { status, paymentStatus, note } = req.body;
  
  try {
    const order = await OrderModel.findOne({ id: req.params.id } as any);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) {
      order.orderStatus = status;
      order.timeline.push({
        status,
        title: `Status Updated to ${status.toUpperCase()}`,
        description: note || `Order status updated by staff`,
        timestamp: new Date().toISOString()
      });

      if (status === 'delivered' || status === 'completed') {
        order.paymentStatus = 'paid';
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      order.timeline.push({
        status: order.orderStatus,
        title: `Payment status updated to ${paymentStatus.toUpperCase()}`,
        description: note || `Payment status modified by Administrator`,
        timestamp: new Date().toISOString()
      });
    }

    const { paymentVerificationStatus } = req.body;
    if (paymentVerificationStatus && ['pending', 'verified', 'rejected'].includes(paymentVerificationStatus)) {
      order.paymentVerificationStatus = paymentVerificationStatus;
      if (paymentVerificationStatus === 'verified') {
        order.paymentStatus = 'paid';
      }
      order.timeline.push({
        status: order.orderStatus,
        title: `Payment Verification: ${paymentVerificationStatus.toUpperCase()}`,
        description: note || `Payment verification status set to ${paymentVerificationStatus.toUpperCase()} by Administrator`,
        timestamp: new Date().toISOString()
      });
    }

    await order.save();
    res.json({ success: true, message: 'Order status updated', order: order.toObject() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating order status in database' });
  }
});

// PATCH /api/orders/:id/payment-verification (Admin)
router.all('/orders/:id/payment-verification', requirePermission('orders.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  const paymentVerificationStatus = req.body.paymentVerificationStatus || req.body.status;
  const note = req.body.note;
  if (!paymentVerificationStatus || !['pending', 'verified', 'rejected'].includes(paymentVerificationStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid payment verification status. Must be pending, verified, or rejected.' });
  }

  try {
    const order = await OrderModel.findOne({ id: req.params.id } as any);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentVerificationStatus = paymentVerificationStatus;
    if (paymentVerificationStatus === 'verified') {
      order.paymentStatus = 'paid';
    }

    order.timeline.push({
      status: order.orderStatus,
      title: `Payment Verification: ${paymentVerificationStatus.toUpperCase()}`,
      description: note || `Payment marked as ${paymentVerificationStatus.toUpperCase()} by Administrator`,
      timestamp: new Date().toISOString()
    });

    await order.save();
    res.json({ success: true, message: `Payment verification status updated to ${paymentVerificationStatus}`, order: order.toObject() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating payment verification status' });
  }
});

// ==========================================
// REVIEWS ENDPOINTS
// ==========================================

router.get('/reviews', async (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.query as { productId: string };
  try {
    const query: any = { isApproved: true };
    if (productId) {
      query.productId = productId;
    }
    const list = await ReviewModel.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, reviews: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reviews', requireAuth, requireDB, async (req: AuthenticatedRequest, res: Response) => {
  const { productId, rating, comment, images } = req.body;
  if (!productId || !rating || !comment) {
    return res.status(400).json({ success: false, message: 'Product ID, rating, and comment required' });
  }

  try {
    const newReview = {
      id: `rev-${Date.now()}`,
      productId,
      userId: req.user!.id,
      userName: req.user!.name,
      userAvatar: req.user!.avatar,
      rating: Number(rating),
      comment,
      images: images || [],
      isApproved: true,
      likesCount: 0,
      reported: false,
      createdAt: new Date().toISOString()
    };

    await ReviewModel.create(newReview);

    // Recalculate average product rating and count in MongoDB
    const prodReviews = await ReviewModel.find({ productId, isApproved: true } as any).lean();
    const prod = await ProductModel.findOne({ id: productId } as any);
    if (prod && prodReviews.length) {
      const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
      prod.rating = parseFloat(avg.toFixed(1));
      prod.reviewCount = prodReviews.length;
      await prod.save();
    }

    res.status(201).json({ success: true, review: newReview });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error saving review to database' });
  }
});

// ==========================================
// INVENTORY ENDPOINTS
// ==========================================

router.post('/inventory/stock-in', requirePermission('products.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  const { productId, quantity, notes } = req.body;
  try {
    const prod = await ProductModel.findOne({ id: productId } as any);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const addQty = Number(quantity);
    const prev = prod.stock;
    const updatedStock = prod.stock + addQty;

    const log = {
      id: `inv-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: addQty >= 0 ? 'in' : 'out',
      quantity: Math.abs(addQty),
      previousStock: prev,
      newStock: updatedStock,
      notes: notes || 'Manual inventory restock',
      createdByName: req.user?.name || 'Admin',
      createdAt: new Date().toISOString()
    };

    prod.stock = updatedStock;
    prod.isOutOfStock = prod.stock <= 0;
    await prod.save();

    await InventoryLogModel.create(log);

    res.json({ success: true, message: 'Inventory updated successfully', product: prod.toObject(), log });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating inventory' });
  }
});

router.get('/inventory/logs', requirePermission('products.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await InventoryLogModel.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// ADMIN ANALYTICS & SETTINGS
// ==========================================

router.get('/admin/analytics', requirePermission('dashboard.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allOrders = await OrderModel.find().lean();
    const totalRevenue = allOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalOrders = allOrders.length;
    
    const totalCustomers = await UserModel.countDocuments({ role: 'customer' } as any);
    
    const lowStockItemsCount = await ProductModel.countDocuments({
      $expr: { $lte: ["$stock", "$lowStockAlert"] }
    } as any);

    const pendingOrdersCount = await OrderModel.countDocuments({
      orderStatus: { $in: ['pending', 'processing'] }
    } as any);

    const monthlySales = [
      { month: 'Oct 2025', sales: 184000, orders: 110 },
      { month: 'Nov 2025', sales: 245000, orders: 145 },
      { month: 'Dec 2025', sales: 310000, orders: 180 },
      { month: 'Jan 2026', sales: 390000, orders: 220 },
      { month: 'Feb 2026', sales: totalRevenue + 120000, orders: totalOrders + 75 }
    ];

    const categories = await CategoryModel.find().lean();
    const topCategories = categories.slice(0, 5).map((c) => ({
      name: c.name,
      sales: Math.floor(15000 + Math.random() * 80000),
      percent: Math.floor(15 + Math.random() * 30)
    }));

    const products = await ProductModel.find().limit(5).lean();
    const topProducts = products.map((p) => ({
      name: p.name,
      sales: Math.floor(20 + Math.random() * 80),
      revenue: (p.salePrice || p.price) * Math.floor(20 + Math.random() * 80)
    }));

    res.json({
      success: true,
      analytics: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalVisitors: 14250,
        lowStockItemsCount,
        pendingOrdersCount,
        monthlySales,
        topCategories,
        topProducts
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin/users', requirePermission('customers.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await UserModel.find().select('-password -passwordResetTokenHash -passwordResetExpires').sort({ createdAt: -1 }).lean();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin/role-manager', requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  const users = await UserModel.find({ role: { $in: ['admin', 'super_admin'] } } as any)
    .select('-password -passwordResetTokenHash -passwordResetExpires').sort({ createdAt: -1 }).lean();
  res.json({ success: true, users });
});

router.get('/admin/role-manager/activity', requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  const activities = await AdminActivityLogModel.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ success: true, activities });
});

router.post('/admin/role-manager', requireRole(['super_admin']), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  const { name, phone, email, password, permissions = [], preset } = req.body;
  const normalizedPhone = normalizePhone(phone);
  if (!name || !/^01[3-9]\d{8}$/.test(normalizedPhone)) {
    return res.status(400).json({ success: false, message: 'Name and a valid phone number are required.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }
  try {
    if (await findUserByPhone(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered. Please use another number.' });
    }
    const presetPermissions: Record<string, string[]> = {
      order_manager: ['orders.view', 'orders.edit', 'customers.view'],
      product_manager: ['products.view', 'products.add', 'products.edit', 'categories.view', 'categories.add', 'categories.edit'],
      customer_manager: ['customers.view', 'customers.edit', 'orders.view']
    };
    const user = await UserModel.create({
      id: `usr-admin-${Date.now()}`,
      name: String(name).trim(),
      phone: normalizedPhone,
      email: email ? String(email).trim().toLowerCase() : undefined,
      role: 'admin',
      permissions: presetPermissions[preset] || (Array.isArray(permissions) ? permissions : []),
      status: 'active',
      password: bcrypt.hashSync(password, 10),
      createdAt: new Date().toISOString()
    });
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.passwordResetTokenHash;
    delete safeUser.passwordResetExpires;
    await logAdminActivity(req, 'admin_created', safeUser);
    res.status(201).json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Unable to create admin' });
  }
});

router.patch('/admin/role-manager/:id', requireRole(['super_admin']), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await UserModel.findOne({ id: req.params.id } as any);
    if (!user || user.role === 'customer') return res.status(404).json({ success: false, message: 'Admin not found' });
    if (user.role === 'super_admin') return res.status(403).json({ success: false, message: 'Super Admin cannot be changed.' });
    if (req.body.role && req.body.role !== 'admin') return res.status(403).json({ success: false, message: 'Cannot promote an Admin to Super Admin.' });
    if (req.body.name !== undefined) user.name = String(req.body.name).trim();
    if (req.body.phone !== undefined) user.phone = normalizePhone(req.body.phone);
    if (req.body.email !== undefined) user.email = String(req.body.email || '').trim().toLowerCase();
    if (req.body.status === 'active' || req.body.status === 'disabled') user.status = req.body.status;
    if (Array.isArray(req.body.permissions)) user.permissions = req.body.permissions;
    if (req.body.preset) {
      const presets: Record<string, string[]> = {
        order_manager: ['orders.view', 'orders.edit', 'customers.view'],
        product_manager: ['products.view', 'products.add', 'products.edit', 'categories.view', 'categories.add', 'categories.edit'],
        customer_manager: ['customers.view', 'customers.edit', 'orders.view']
      };
      if (presets[req.body.preset]) user.permissions = presets[req.body.preset];
    }
    if (req.body.password) {
      if (req.body.password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      user.password = bcrypt.hashSync(req.body.password, 10);
    }
    await user.save();
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.passwordResetTokenHash;
    delete safeUser.passwordResetExpires;
    let activity = 'admin_updated';
    if (req.body.status === 'disabled') activity = 'admin_disabled';
    else if (req.body.status === 'active') activity = 'admin_enabled';
    else if (Array.isArray(req.body.permissions) || req.body.preset) activity = 'permissions_changed';
    else if (req.body.role) activity = 'role_changed';
    await logAdminActivity(req, activity, safeUser);
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Unable to update admin' });
  }
});

router.delete('/admin/role-manager/:id', requireRole(['super_admin']), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  const user = await UserModel.findOne({ id: req.params.id } as any);
  if (!user || user.role === 'customer') return res.status(404).json({ success: false, message: 'Admin not found' });
  if (user.role === 'super_admin') return res.status(403).json({ success: false, message: 'Super Admin cannot be deleted.' });
  await UserModel.deleteOne({ id: user.id } as any);
  await logAdminActivity(req, 'admin_deleted', user);
  res.json({ success: true, message: 'Admin deleted successfully.' });
});

router.patch('/admin/users/:id/role', requireRole(['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  const { role, status } = req.body;
  try {
    const user = await UserModel.findOne({ id: req.params.id } as any);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();
    res.json({ success: true, message: 'User permissions updated', user: user.toObject() });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin/settings', requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await SiteSettingsModel.findOne().lean();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/admin/settings', requirePermission('settings.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await SiteSettingsModel.findOneAndUpdate({} as any, req.body, { upsert: true, returnDocument: 'after' } as any).lean();
    res.json({ success: true, message: 'Settings saved', settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error saving site settings to database' });
  }
});

// ==========================================
// SLEEVE BADGE OPTIONS ENDPOINTS
// ==========================================

// GET /api/sleeve-badges (Public - Active badges)
router.get('/sleeve-badges', requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const badges = await SleeveBadgeOptionModel.find({ isActive: true } as any).lean();
    res.json({ success: true, badges });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching sleeve badge options' });
  }
});

// GET /api/admin/sleeve-badges (Admin - All badges)
router.get('/admin/sleeve-badges', requirePermission('products.view'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const badges = await SleeveBadgeOptionModel.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, badges });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error fetching sleeve badge options' });
  }
});

// POST /api/admin/sleeve-badges (Admin - Add)
router.post('/admin/sleeve-badges', requirePermission('products.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, image, price, isActive } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'Option name is required' });

    const newBadge = {
      id: `badge-${Date.now()}`,
      name: String(name).trim(),
      image: typeof image === 'string' ? image.trim() : '',
      price: Math.max(0, Number(price) || 0),
      isActive: isActive !== false,
      createdAt: new Date().toISOString()
    };

    await SleeveBadgeOptionModel.create(newBadge);
    res.status(201).json({ success: true, badge: newBadge });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error saving sleeve badge option' });
  }
});

// PUT /api/admin/sleeve-badges/:id (Admin - Edit)
router.put('/admin/sleeve-badges/:id', requirePermission('products.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await SleeveBadgeOptionModel.findOne({ id: req.params.id } as any);
    if (!existing) return res.status(404).json({ success: false, message: 'Sleeve badge option not found' });

    const { name, image, price, isActive } = req.body;
    const updated: any = {};
    if (name !== undefined) updated.name = String(name).trim();
    if (price !== undefined) updated.price = Math.max(0, Number(price) || 0);
    if (isActive !== undefined) updated.isActive = Boolean(isActive);

    if (image !== undefined) {
      const cleanImg = typeof image === 'string' ? image.trim() : '';
      if (existing.image && existing.image !== cleanImg && existing.image.startsWith('/uploads/')) {
        await deleteUploadedFileByUrl(existing.image);
      }
      updated.image = cleanImg;
    }

    const result = await SleeveBadgeOptionModel.findOneAndUpdate({ id: req.params.id } as any, updated, { returnDocument: 'after' } as any).lean();
    res.json({ success: true, badge: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating sleeve badge option' });
  }
});

// DELETE /api/admin/sleeve-badges/:id (Admin - Delete)
router.delete('/admin/sleeve-badges/:id', requirePermission('products.delete'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await SleeveBadgeOptionModel.findOne({ id: req.params.id } as any);
    if (!existing) return res.status(404).json({ success: false, message: 'Sleeve badge option not found' });

    // SAFETY CHECK: verify if any products are currently using this badge ID
    const count = await ProductModel.countDocuments({ sleeveBadges: req.params.id } as any);
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete badge as it is currently assigned to ${count} product(s). Please unassign it first.`
      });
    }

    if (existing.image && existing.image.startsWith('/uploads/')) {
      await deleteUploadedFileByUrl(existing.image);
    }

    await SleeveBadgeOptionModel.deleteOne({ id: req.params.id } as any);
    res.json({ success: true, message: 'Sleeve badge option deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error deleting sleeve badge option' });
  }
});

router.get('/admin/hero-slides', requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const slides = await HeroSlideModel.find().sort({ order: 1 }).lean();
    res.json({ success: true, slides });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin/hero-slides', requirePermission('settings.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await HeroSlideModel.countDocuments();
    const newSlide = {
      id: `slide-${Date.now()}`,
      title: req.body.title || 'NEW HERO SLIDE',
      subtitle: req.body.subtitle || '',
      image: req.body.image || '',
      badge: req.body.badge || 'PROMO',
      link: req.body.link || '/catalog',
      buttonText: req.body.buttonText || 'SHOP NOW',
      order: count + 1,
      isActive: true
    };

    await HeroSlideModel.create(newSlide);
    res.status(201).json({ success: true, slide: newSlide });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error saving slide to database' });
  }
});

router.put('/admin/hero-slides/:id', requirePermission('settings.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const oldSlide = await HeroSlideModel.findOne({ id: req.params.id } as any);
    if (!oldSlide) {
      return res.status(404).json({ success: false, message: 'Hero slide not found' });
    }

    const result = await HeroSlideModel.findOneAndUpdate({ id: req.params.id } as any, req.body, { returnDocument: 'after' } as any).lean();

    // Clean up replaced slide image if it changed
    if (oldSlide.image && oldSlide.image !== result.image) {
      await deleteUploadedFileByUrl(oldSlide.image);
    }
    res.json({ success: true, message: 'Hero slide updated successfully', slide: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error updating slide in database' });
  }
});

router.delete('/admin/hero-slides/:id', requirePermission('settings.edit'), requireDB, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const slide = await HeroSlideModel.findOne({ id: req.params.id } as any);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Hero slide not found' });
    }

    await HeroSlideModel.deleteOne({ id: req.params.id } as any);

    // Clean up deleted slide image
    if (slide.image) {
      await deleteUploadedFileByUrl(slide.image);
    }
    res.json({ success: true, message: 'Hero slide deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error deleting slide from database' });
  }
});

// ==========================================
// AI SHOPPING ASSISTANT ("Jersey AI Concierge")
// ==========================================

router.post('/ai/concierge', async (req: AuthenticatedRequest, res: Response) => {
  const { prompt, currentCart, userHeight, userWeight } = req.body;
  const ai = getGenAI();

  if (!prompt) {
    return res.status(400).json({ success: false, message: 'Prompt parameter required' });
  }

  // Stock summary context for Gemini
  const productContext = db.products
    .slice(0, 6)
    .map((p) => `- ${p.name} (৳${p.salePrice || p.price}): Sizes ${p.sizes.join(', ')}`)
    .join('\n');

  if (!ai) {
    // Intelligent fallback response
    let reply = `Hello from Jersey Mention BD! Based on your query "${prompt}", I highly recommend checking out our official **Bangladesh National Team 2026 Home Jersey** or our **Real Madrid Player Version Home Kit**!`;
    if (userHeight && userWeight) {
      reply += `\n\nFor height ${userHeight}cm and weight ${userWeight}kg, size **L (Large)** will provide an ideal slim matchday fit!`;
    }
    return res.json({ success: true, reply });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are "Jersey AI Concierge", the expert customer advisor for Jersey Mention BD (Bangladesh's premier jersey & sports apparel store).
Current available store highlights:
${productContext}

User Query: ${prompt}
${userHeight ? `User Height: ${userHeight} cm, Weight: ${userWeight} kg` : ''}

Provide a helpful, friendly recommendation with sizing advice or styling tips in 2-3 short sentences. Speak warmly and mention Jersey Mention BD quality guarantees!`
    });

    res.json({ success: true, reply: response.text });
  } catch (err: any) {
    res.json({
      success: true,
      reply: `Welcome to Jersey Mention BD! For your query, our best-selling Player Version jerseys offer lightweight breathability and official silicone crests. Need custom name/number printing? We offer express squad heat-press!`
    });
  }
});

// ==========================================
// SWAGGER / OPENAPI SPECIFICATIONS ENDPOINT
// ==========================================

router.get('/docs', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Jersey Mention BD API Documentation',
      version: '1.0.0',
      description: 'Enterprise REST API specification for Jersey Mention BD E-Commerce Platform'
    },
    paths: {
      '/api/auth/login': {
        post: { summary: 'Authenticate user with email and password' }
      },
      '/api/products': {
        get: { summary: 'Search and filter products catalog with pagination' },
        post: { summary: 'Create new product (Admin)' }
      },
      '/api/orders': {
        post: { summary: 'Submit new order with payment gateway selection' },
        get: { summary: 'Get order list' }
      },
      '/api/coupons/validate': {
        post: { summary: 'Validate discount voucher code' }
      },
      '/api/admin/analytics': {
        get: { summary: 'Retrieve dashboard sales and visitor reports' }
      }
    }
  });
});

// POST /api/upload (Admin/Staff)
router.post('/upload', requirePermission('products.edit'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image, filename } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid base64 string format' });
    }

    const mimeType = matches[1].toLowerCase();
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedMimeTypes.has(mimeType)) {
      return res.status(400).json({ success: false, message: 'Only JPG, PNG, and WebP images are allowed.' });
    }
    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    // Validate size (max 5MB)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit' });
    }

    const isPng = imageBuffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = imageBuffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
    const isWebp = imageBuffer.subarray(0, 4).toString() === 'RIFF' && imageBuffer.subarray(8, 12).toString() === 'WEBP';
    if (!isPng && !isJpeg && !isWebp) {
      return res.status(400).json({ success: false, message: 'Invalid image content.' });
    }

    const extension = matches[1].split('/')[1] || 'png';
    const cleanExt = extension === 'jpeg' ? 'jpg' : extension;
    const safeFilename = `${Date.now()}-${filename?.replace(/[^a-z0-9]/gi, '_') || 'upload'}.${cleanExt}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeFilename);
    fs.writeFileSync(filePath, imageBuffer);

    const publicUrl = `/uploads/${safeFilename}`;
    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// CUSTOMER DATA EXPORT ROUTES (ADMIN ONLY)
// =========================================================================

import * as XLSX from 'xlsx';

function getDateRangeBounds(range: string, fromDate?: string, toDate?: string) {
  let startStr = '';
  let endStr = new Date().toISOString();

  if (range === 'this_week') {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    startStr = start.toISOString();
  } else if (range === 'this_month') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    startStr = start.toISOString();
  } else if (range === 'this_year') {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    startStr = start.toISOString();
  } else if (range === 'custom') {
    if (!fromDate || !toDate) {
      throw new Error('From and To dates are required for custom range');
    }
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }
    if (start > end) {
      throw new Error('From date cannot be after To date');
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    startStr = start.toISOString();
    endStr = end.toISOString();
  }
  return { startStr, endStr };
}

router.get('/admin/customer-export/preview', requirePermission('customers.export'), async (req, res) => {
  try {
    const { range, fromDate, toDate } = req.query as { range: string; fromDate?: string; toDate?: string };
    const { startStr, endStr } = getDateRangeBounds(range, fromDate, toDate);

    const result = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startStr, $lte: endStr }
        }
      },
      {
        $group: {
          _id: "$customerPhone"
        }
      },
      {
        $count: "count"
      }
    ]);

    const count = result[0]?.count || 0;
    res.json({ success: true, count });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/admin/customer-export/download', requirePermission('customers.export'), async (req, res) => {
  try {
    const { range, fromDate, toDate, format } = req.query as { range: string; fromDate?: string; toDate?: string; format: string };
    const { startStr, endStr } = getDateRangeBounds(range, fromDate, toDate);

    const aggregated = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startStr, $lte: endStr }
        }
      },
      {
        $sort: { createdAt: 1 }
      },
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $last: "$customerName" },
          customerEmail: { $last: "$customerEmail" },
          street: { $last: "$shippingAddress.address" },
          city: { $last: "$shippingAddress.city" },
          state: { $last: "$shippingAddress.district" },
          postalCode: { $last: "$shippingAddress.postalCode" },
          totalOrders: { $sum: 1 },
          totalPurchaseAmount: { $sum: "$grandTotal" },
          firstOrderDate: { $first: "$createdAt" },
          lastOrderDate: { $last: "$createdAt" },
          customerId: { $last: "$userId" },
          paymentMethod: { $last: "$paymentMethod" },
          paymentStatus: { $last: "$paymentStatus" },
          orderStatus: { $last: "$orderStatus" }
        }
      }
    ]);

    if (aggregated.length === 0) {
      return res.status(200).json({ success: false, message: 'No customers found for the selected date range.' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    let fileRangeSuffix = '';
    if (range === 'this_week') fileRangeSuffix = 'weekly';
    else if (range === 'this_month') fileRangeSuffix = 'monthly';
    else if (range === 'this_year') fileRangeSuffix = 'yearly';
    else if (range === 'custom') fileRangeSuffix = `custom-${fromDate}-to-${toDate}`;

    const filename = `customer-data-${fileRangeSuffix}-${dateStr}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;

    if (format === 'xlsx') {
      const exportData = aggregated.map(c => ({
        'Customer ID': c.customerId || 'N/A',
        'Customer Name': c.customerName || 'N/A',
        'Mobile Number': c._id,
        'Email': c.customerEmail || 'N/A',
        'Delivery Address': `${c.street || ''}${c.postalCode ? ', ' + c.postalCode : ''}`,
        'City / Area': `${c.city || ''}${c.state ? ', ' + c.state : ''}`,
        'Total Orders': c.totalOrders,
        'Total Purchase Amount': c.totalPurchaseAmount,
        'First Order Date': c.firstOrderDate ? new Date(c.firstOrderDate).toLocaleDateString() : 'N/A',
        'Last Order Date': c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'N/A',
        'Payment Method': c.paymentMethod || 'N/A',
        'Payment Status': c.paymentStatus || 'N/A',
        'Order Status': c.orderStatus || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    } else {
      const headers = [
        'Customer ID',
        'Customer Name',
        'Mobile Number',
        'Email',
        'Delivery Address',
        'City / Area',
        'Total Orders',
        'Total Purchase Amount',
        'First Order Date',
        'Last Order Date',
        'Payment Method',
        'Payment Status',
        'Order Status'
      ];

      const rows = aggregated.map(c => [
        c.customerId || 'N/A',
        c.customerName || 'N/A',
        c._id,
        c.customerEmail || 'N/A',
        `${c.street || ''}${c.postalCode ? ', ' + c.postalCode : ''}`,
        `${c.city || ''}${c.state ? ', ' + c.state : ''}`,
        c.totalOrders,
        c.totalPurchaseAmount,
        c.firstOrderDate ? new Date(c.firstOrderDate).toLocaleDateString() : 'N/A',
        c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'N/A',
        c.paymentMethod || 'N/A',
        c.paymentStatus || 'N/A',
        c.orderStatus || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => {
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(','))
      ].join('\r\n');

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.send(Buffer.from(csvContent, 'utf-8'));
    }
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/admin/top-customers', requirePermission('customers.top'), async (req, res) => {
  try {
    const topCustomers = await OrderModel.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' },
          paymentStatus: { $nin: ['failed', 'refunded'] }
        }
      },
      {
        $sort: { createdAt: 1 }
      },
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $last: "$customerName" },
          customerEmail: { $last: "$customerEmail" },
          totalOrders: { $sum: 1 },
          totalPurchaseAmount: { $sum: "$grandTotal" },
          firstOrderDate: { $first: "$createdAt" },
          lastOrderDate: { $last: "$createdAt" },
          orders: {
            $push: {
              id: "$id",
              orderNumber: "$orderNumber",
              createdAt: "$createdAt",
              orderStatus: "$orderStatus",
              paymentStatus: "$paymentStatus",
              shippingAddress: "$shippingAddress",
              totalAmount: "$totalAmount",
              grandTotal: "$grandTotal",
              items: "$items",
              timeline: "$timeline",
              paymentMethod: "$paymentMethod",
              customerName: "$customerName",
              customerPhone: "$customerPhone",
              customerEmail: "$customerEmail"
            }
          }
        }
      },
      {
        $match: {
          totalOrders: { $gt: 3 }
        }
      },
      {
        $sort: {
          totalOrders: -1,
          totalPurchaseAmount: -1
        }
      }
    ]);

    res.json({ success: true, topCustomers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
