import {
  isProductKidsSizesEnabled,
  getProductKidsSizes,
  isProductSizeEnabled,
  isProductSizeRequired,
  isCartItemSizeValid,
  ALL_KIDS_SIZES
} from '../src/utils/productUtils';
import { Product, CartItem } from '../src/types';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== TEST SUITE: KIDS / CHILDREN SIZE REQUIRED SELECTION VALIDATION ===\n');

  // TEST 1: Unit testing utility validation logic
  console.log('--- TEST 1: Utility functions & size required behavior ---');
  
  const kidsOnlyProduct: Product = {
    id: 'test-kids-jersey-1',
    name: 'Kids Club Kit 2026',
    slug: 'kids-club-kit-2026',
    sku: 'KIDS-TEST-001',
    price: 1200,
    stock: 25,
    lowStockAlert: 5,
    isOutOfStock: false,
    categoryId: 'cat-kids',
    categoryName: 'Kids Corner',
    sizes: [],
    sizeOptions: {
      enabled: false,
      required: false,
      label: 'Select Kids Size:',
      sizes: [],
      showKidsSizes: true,
      kidsSizes: ['3Y', '6Y', '8Y', '10Y', '14Y']
    },
    showKidsSizes: true,
    kidsSizes: ['3Y', '6Y', '8Y', '10Y', '14Y'],
    colors: [{ name: 'Blue', hex: '#0000ff' }],
    tags: ['Kids'],
    featured: false,
    isBestSeller: false,
    isTrending: false,
    isNewArrival: false,
    isFlashSale: false,
    returnPolicy: '7 days',
    warranty: '100%',
    status: 'active',
    rating: 5,
    reviewCount: 0
  };

  const adultOnlyProduct: Product = {
    ...kidsOnlyProduct,
    id: 'test-adult-jersey-1',
    name: 'Adult Pro Jersey',
    slug: 'adult-pro-jersey',
    showKidsSizes: false,
    kidsSizes: [],
    sizes: ['S', 'M', 'L', 'XL'],
    sizeOptions: {
      enabled: true,
      required: true,
      label: 'Select Size:',
      sizes: ['S', 'M', 'L', 'XL'],
      showKidsSizes: false,
      kidsSizes: []
    }
  };

  console.log('Checking Kids Only Product:');
  const isKidsOn = isProductKidsSizesEnabled(kidsOnlyProduct);
  const kidsSizes = getProductKidsSizes(kidsOnlyProduct);
  const isSizeReq = isProductSizeRequired(kidsOnlyProduct);
  console.log(`- isProductKidsSizesEnabled: ${isKidsOn} (expected true)`);
  console.log(`- getProductKidsSizes: [${kidsSizes.join(', ')}] (count: ${kidsSizes.length})`);
  console.log(`- isProductSizeRequired: ${isSizeReq} (expected true)`);
  if (!isKidsOn || kidsSizes.length !== 5 || !isSizeReq) {
    throw new Error('Test 1 failed: kidsOnlyProduct requirement checks');
  }

  // Cart item validation checks
  const itemNoSize: CartItem = {
    id: 'cart-1',
    productId: kidsOnlyProduct.id,
    product: kidsOnlyProduct,
    quantity: 1,
    selectedSize: undefined
  };
  const itemBlankSize: CartItem = {
    ...itemNoSize,
    selectedSize: '   '
  };
  const itemValidKidsSize: CartItem = {
    ...itemNoSize,
    selectedSize: '8Y'
  };
  const itemInvalidKidsSize: CartItem = {
    ...itemNoSize,
    selectedSize: '12Y' // not in configured ['3Y', '6Y', '8Y', '10Y', '14Y']
  };

  console.log('\nValidating CartItem size validity:');
  console.log(`- Missing size valid: ${isCartItemSizeValid(itemNoSize)} (expected false)`);
  console.log(`- Blank size valid: ${isCartItemSizeValid(itemBlankSize)} (expected false)`);
  console.log(`- Valid kids size 8Y valid: ${isCartItemSizeValid(itemValidKidsSize)} (expected true)`);
  console.log(`- Unconfigured kids size 12Y valid: ${isCartItemSizeValid(itemInvalidKidsSize)} (expected false)`);

  if (isCartItemSizeValid(itemNoSize) || isCartItemSizeValid(itemBlankSize)) {
    throw new Error('Test 1 failed: Missing or blank kids size must be invalid!');
  }
  if (!isCartItemSizeValid(itemValidKidsSize)) {
    throw new Error('Test 1 failed: Valid kids size 8Y should be valid!');
  }
  if (isCartItemSizeValid(itemInvalidKidsSize)) {
    throw new Error('Test 1 failed: Unconfigured kids size 12Y must be invalid!');
  }
  console.log('✓ Unit tests passed!');

  // TEST 2: Backend API End-to-End Anti-Bypass Testing
  console.log('\n--- TEST 2: Backend API Anti-Bypass & Validation Checks ---');
  
  // Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '01571305964', password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!' })
  });
  const loginData: any = await loginRes.json();
  const cookies = loginRes.headers.get('set-cookie') || '';
  console.log('✓ Logged in as admin');

  // Create Product with Kids Sizes ON
  const timestamp = Date.now();
  const createProductRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies
    },
    body: JSON.stringify({
      name: `Junior Champions Kit ${timestamp}`,
      slug: `junior-champions-kit-${timestamp}`,
      sku: `JUNIOR-${timestamp}`,
      price: 1350,
      stock: 50,
      categoryId: 'cat-kids-corner',
      categoryName: 'Kids Corner',
      showKidsSizes: true,
      kidsSizes: ['3Y', '5Y', '7Y', '8Y', '10Y', '14Y'],
      sizeOptions: {
        enabled: false,
        required: true,
        label: 'Select Kids Size:',
        sizes: [],
        showKidsSizes: true,
        kidsSizes: ['3Y', '5Y', '7Y', '8Y', '10Y', '14Y']
      },
      status: 'active'
    })
  });
  const createdProdData: any = await createProductRes.json();
  if (!createdProdData.success || !createdProdData.product) {
    throw new Error('Failed to create test kids product: ' + JSON.stringify(createdProdData));
  }
  const kidsProduct = createdProdData.product;
  console.log(`✓ Created test kids product: ${kidsProduct.id}`);

  // Test 2a: Attempt to Add to Cart WITHOUT size (Bypass test)
  console.log('\nAttempting to Add to Cart with NO size:');
  const addNoSizeRes = await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies
    },
    body: JSON.stringify({
      productId: kidsProduct.id,
      quantity: 1
      // No selectedSize provided!
    })
  });
  const addNoSizeData: any = await addNoSizeRes.json();
  console.log(`Status: ${addNoSizeRes.status}, Response:`, addNoSizeData);
  if (addNoSizeRes.status !== 400 || addNoSizeData.message !== 'Please select a size first.') {
    throw new Error(`API failed to block missing size! Expected 400 "Please select a size first.", got: ${JSON.stringify(addNoSizeData)}`);
  }
  console.log('✓ Successfully blocked missing size on POST /api/cart with exact message: "Please select a size first."');

  // Test 2b: Attempt to Add to Cart with empty string size
  console.log('\nAttempting to Add to Cart with EMPTY string size (""):');
  const addEmptySizeRes = await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies
    },
    body: JSON.stringify({
      productId: kidsProduct.id,
      quantity: 1,
      selectedSize: '   '
    })
  });
  const addEmptySizeData: any = await addEmptySizeRes.json();
  console.log(`Status: ${addEmptySizeRes.status}, Response:`, addEmptySizeData);
  if (addEmptySizeRes.status !== 400 || addEmptySizeData.message !== 'Please select a size first.') {
    throw new Error(`API failed to block whitespace size! Got: ${JSON.stringify(addEmptySizeData)}`);
  }
  console.log('✓ Successfully blocked empty string size on POST /api/cart with message: "Please select a size first."');

  // Test 2c: Add to Cart with VALID Kids Size (8Y)
  console.log('\nAdding to Cart with VALID Kids Size (8Y):');
  const addValidRes = await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies
    },
    body: JSON.stringify({
      productId: kidsProduct.id,
      quantity: 2,
      selectedSize: '8Y'
    })
  });
  const addValidData: any = await addValidRes.json();
  console.log(`Status: ${addValidRes.status}, Success: ${addValidData.success}`);
  if (!addValidData.success) {
    throw new Error('Failed to add valid kids size to cart: ' + JSON.stringify(addValidData));
  }
  console.log('✓ Successfully added kids size 8Y to cart!');

  // Test 2d: Attempt to Create Order WITHOUT size (Bypass test)
  console.log('\nAttempting Order Checkout with missing size on kids product:');
  const orderNoSizeRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies
    },
    body: JSON.stringify({
      customerName: 'Amina Rahman',
      customerPhone: '01811223344',
      shippingAddress: {
        fullName: 'Amina Rahman',
        phone: '01811223344',
        address: 'Sector 4, Uttara',
        city: 'Dhaka',
        district: 'Dhaka',
        zone: 'inside_dhaka'
      },
      paymentMethod: 'bkash',
      paymentType: '25_percent_advance',
      paymentMobileNumber: '01811223344',
      transactionId: 'TRX99887766',
      shippingFee: 70,
      items: [
        {
          productId: kidsProduct.id,
          name: kidsProduct.name,
          price: kidsProduct.price,
          quantity: 1,
          size: '' // Blank size!
        }
      ]
    })
  });
  const orderNoSizeData: any = await orderNoSizeRes.json();
  console.log(`Status: ${orderNoSizeRes.status}, Response:`, orderNoSizeData);
  if (orderNoSizeRes.status !== 400 || orderNoSizeData.message !== 'Please select a size first.') {
    throw new Error(`API failed to block missing size on order creation! Got: ${JSON.stringify(orderNoSizeData)}`);
  }
  console.log('✓ Successfully blocked missing size on POST /api/orders with exact message: "Please select a size first."');

  // Test 2e: Create Order with VALID Kids Size (8Y)
  console.log('\nSubmitting Order with VALID Kids Size (8Y):');
  const orderValidRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies
    },
    body: JSON.stringify({
      customerName: 'Amina Rahman',
      customerPhone: '01811223344',
      shippingAddress: {
        fullName: 'Amina Rahman',
        phone: '01811223344',
        address: 'Sector 4, Uttara',
        city: 'Dhaka',
        district: 'Dhaka',
        zone: 'inside_dhaka'
      },
      paymentMethod: 'bkash',
      paymentType: '25_percent_advance',
      paymentMobileNumber: '01811223344',
      transactionId: 'TRX99887766',
      shippingFee: 70,
      items: [
        {
          productId: kidsProduct.id,
          name: kidsProduct.name,
          price: kidsProduct.price,
          quantity: 1,
          size: '8Y'
        }
      ]
    })
  });
  const orderValidData: any = await orderValidRes.json();
  if (!orderValidData.success || !orderValidData.order) {
    throw new Error('Order creation failed: ' + JSON.stringify(orderValidData));
  }
  const createdOrder = orderValidData.order;
  console.log(`✓ Order placed successfully! Order ID: ${createdOrder.id}`);
  const itemInOrder = createdOrder.items?.[0];
  console.log(`- Saved Item Size in Order DB: "${itemInOrder.size}"`);
  if (itemInOrder.size !== '8Y') {
    throw new Error(`Order size mismatch! Expected "8Y", got: "${itemInOrder.size}"`);
  }
  console.log('✓ Verified: Kids size 8Y correctly saved in Order DB record!');

  // Cleanup
  console.log('\nCleaning up test product and order...');
  await fetch(`${BASE_URL}/api/products/${kidsProduct.id}`, { method: 'DELETE', headers: { Cookie: cookies } });
  await fetch(`${BASE_URL}/api/orders/${createdOrder.id}`, { method: 'DELETE', headers: { Cookie: cookies } });
  console.log('✓ Cleanup complete.');

  console.log('\n=== ALL TESTS PASSED: KIDS / CHILDREN SIZE REQUIRED SELECTION FULLY VALIDATED ===');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
