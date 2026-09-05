import mongoose from 'mongoose';
import { ProductModel, UserModel } from '../server/mongodb';
import { isProductSizeEnabled, getProductAvailableSizes, isCartItemSizeValid, getIncompleteSizeCartItems } from '../src/utils/productUtils';
import { Product, CartItem } from '../src/types';

async function runTests() {
  console.log('=== RUNNING SIZE REQUIREMENT TESTS ===');

  // Test 1: Utility Tests
  console.log('\n--- 1. Utility Functions ---');
  
  const sizeEnabledProduct: Product = {
    id: 'prod-jersey-1',
    name: 'Real Madrid 2026 Jersey',
    slug: 'real-madrid-2026-jersey',
    sku: 'RM-2026',
    barcode: '123456',
    price: 1500,
    description: 'Test jersey',
    specifications: [],
    images: ['/test.jpg'],
    categoryId: 'cat-jerseys',
    categoryName: 'Jerseys',
    stock: 50,
    lowStockAlert: 5,
    isOutOfStock: false,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    sizeOptions: {
      enabled: true,
      required: true,
      label: 'Select Size:',
      sizes: ['S', 'M', 'L', 'XL', 'XXL']
    },
    colors: [{ name: 'White', hex: '#fff' }],
    tags: [],
    featured: true,
    isBestSeller: true,
    isTrending: false,
    isNewArrival: true,
    isFlashSale: false,
    returnPolicy: '',
    warranty: '',
    status: 'active',
    rating: 5,
    reviewCount: 10,
    createdAt: new Date().toISOString()
  };

  const sizeDisabledProduct: Product = {
    id: 'prod-ball-1',
    name: 'Official Match Football',
    slug: 'official-match-football',
    sku: 'BALL-01',
    barcode: '654321',
    price: 2500,
    description: 'Test football',
    specifications: [],
    images: ['/ball.jpg'],
    categoryId: 'cat-gear',
    categoryName: 'Gear',
    stock: 20,
    lowStockAlert: 2,
    isOutOfStock: false,
    sizes: [],
    sizeOptions: {
      enabled: false,
      required: false,
      label: 'Select Size:',
      sizes: []
    },
    colors: [],
    tags: [],
    featured: false,
    isBestSeller: false,
    isTrending: false,
    isNewArrival: false,
    isFlashSale: false,
    returnPolicy: '',
    warranty: '',
    status: 'active',
    rating: 5,
    reviewCount: 3,
    createdAt: new Date().toISOString()
  };

  console.log('isProductSizeEnabled(sizeEnabledProduct):', isProductSizeEnabled(sizeEnabledProduct) === true ? 'PASS' : 'FAIL');
  console.log('isProductSizeEnabled(sizeDisabledProduct):', isProductSizeEnabled(sizeDisabledProduct) === false ? 'PASS' : 'FAIL');
  console.log('getProductAvailableSizes(sizeEnabledProduct):', JSON.stringify(getProductAvailableSizes(sizeEnabledProduct)));
  console.log('getProductAvailableSizes(sizeDisabledProduct):', JSON.stringify(getProductAvailableSizes(sizeDisabledProduct)));

  const validJerseyCartItem: CartItem = {
    id: 'item-1',
    productId: sizeEnabledProduct.id,
    product: sizeEnabledProduct,
    quantity: 1,
    selectedSize: 'L'
  };

  const missingSizeJerseyCartItem: CartItem = {
    id: 'item-2',
    productId: sizeEnabledProduct.id,
    product: sizeEnabledProduct,
    quantity: 1,
    selectedSize: ''
  };

  const validFootballCartItem: CartItem = {
    id: 'item-3',
    productId: sizeDisabledProduct.id,
    product: sizeDisabledProduct,
    quantity: 1
  };

  console.log('isCartItemSizeValid(validJerseyCartItem):', isCartItemSizeValid(validJerseyCartItem) === true ? 'PASS' : 'FAIL');
  console.log('isCartItemSizeValid(missingSizeJerseyCartItem):', isCartItemSizeValid(missingSizeJerseyCartItem) === false ? 'PASS' : 'FAIL');
  console.log('isCartItemSizeValid(validFootballCartItem):', isCartItemSizeValid(validFootballCartItem) === true ? 'PASS' : 'FAIL');

  const cartWithIncomplete = [validJerseyCartItem, missingSizeJerseyCartItem, validFootballCartItem];
  const incomplete = getIncompleteSizeCartItems(cartWithIncomplete);
  console.log('getIncompleteSizeCartItems length === 1:', incomplete.length === 1 && incomplete[0].id === 'item-2' ? 'PASS' : 'FAIL');

  console.log('\n--- 2. API Validation Tests ---');
  // Connect to DB for API verification
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jersey_mention_bd';
  await mongoose.connect(MONGODB_URI);

  const sampleJersey = await ProductModel.findOne({
    $or: [
      { 'sizeOptions.enabled': true },
      { sizes: { $exists: true, $ne: [] } }
    ]
  }).lean();

  if (sampleJersey) {
    console.log(`Found sample jersey in DB: "${sampleJersey.name}" (sizes: ${sampleJersey.sizes?.join(', ')})`);

    // Test order placement without size via API
    try {
      const orderPayloadNoSize = {
        customerName: 'Test Customer',
        customerPhone: '01711223344',
        paymentType: '25_percent_advance',
        paymentMethod: 'bkash',
        paymentMobileNumber: '01711223344',
        transactionId: 'TRX123456TEST',
        shippingAddress: {
          fullName: 'Test Customer',
          phone: '01711223344',
          address: 'Test House, Test Road',
          city: 'Dhaka',
          district: 'Dhaka',
          zone: 'inside_dhaka'
        },
        items: [
          {
            productId: sampleJersey.id,
            productName: sampleJersey.name,
            price: sampleJersey.price,
            quantity: 1,
            size: '' // MISSING SIZE
          }
        ]
      };

      const res = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayloadNoSize)
      });
      const data = await res.json();
      console.log('Order with MISSING size response status:', res.status, 'message:', data.message);
      if (res.status === 400 && data.message.includes('Size selection is required')) {
        console.log('Missing size rejection: PASS');
      } else {
        console.log('Missing size rejection: FAIL', data);
      }
    } catch (e: any) {
      console.error('Error testing order API:', e.message);
    }

    // Test order placement with INVALID size
    try {
      const orderPayloadInvalidSize = {
        customerName: 'Test Customer',
        customerPhone: '01711223344',
        paymentType: '25_percent_advance',
        paymentMethod: 'bkash',
        paymentMobileNumber: '01711223344',
        transactionId: 'TRX123456TEST',
        shippingAddress: {
          fullName: 'Test Customer',
          phone: '01711223344',
          address: 'Test House, Test Road',
          city: 'Dhaka',
          district: 'Dhaka',
          zone: 'inside_dhaka'
        },
        items: [
          {
            productId: sampleJersey.id,
            productName: sampleJersey.name,
            price: sampleJersey.price,
            quantity: 1,
            size: 'INVALID_SIZE_999' // INVALID SIZE
          }
        ]
      };

      const res = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayloadInvalidSize)
      });
      const data = await res.json();
      console.log('Order with INVALID size response status:', res.status, 'message:', data.message);
      if (res.status === 400 && data.message.includes('invalid for product')) {
        console.log('Invalid size rejection: PASS');
      } else {
        console.log('Invalid size rejection: FAIL', data);
      }
    } catch (e: any) {
      console.error('Error testing invalid size order API:', e.message);
    }

    // Test order placement with valid size + size-disabled item
    try {
      const sampleFootball = await ProductModel.findOne({
        $or: [
          { 'sizeOptions.enabled': false },
          { sizes: { $size: 0 } }
        ]
      }).lean();

      const validOrderPayload = {
        customerName: 'Test Customer',
        customerPhone: '01711223344',
        paymentType: '25_percent_advance',
        paymentMethod: 'bkash',
        paymentMobileNumber: '01711223344',
        transactionId: 'TRX123456TEST',
        shippingAddress: {
          fullName: 'Test Customer',
          phone: '01711223344',
          address: 'Test House, Test Road',
          city: 'Dhaka',
          district: 'Dhaka',
          zone: 'inside_dhaka'
        },
        items: [
          {
            productId: sampleJersey.id,
            productName: sampleJersey.name,
            price: sampleJersey.price,
            quantity: 1,
            size: sampleJersey.sizes?.[0] || 'L'
          },
          ...(sampleFootball ? [{
            productId: sampleFootball.id,
            productName: sampleFootball.name,
            price: sampleFootball.price,
            quantity: 1
          }] : [])
        ]
      };

      const res = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validOrderPayload)
      });
      const data = await res.json();
      console.log('Order with VALID size response status:', res.status, 'success:', data.success);
      if ((res.status === 200 || res.status === 201) && data.success) {
        console.log('Valid multi-item order placement: PASS (Order #' + data.order?.orderNumber + ')');
      } else {
        console.log('Valid multi-item order placement: FAIL', data);
      }
    } catch (e: any) {
      console.error('Error testing valid order placement:', e.message);
    }
  } else {
    console.log('No jersey products found in DB to test with.');
  }

  await mongoose.disconnect();
  console.log('\n=== ALL TESTS FINISHED ===');
  process.exit(0);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
