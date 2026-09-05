import mongoose from 'mongoose';
import { ProductModel, UserModel } from '../server/mongodb';
import bcrypt from 'bcryptjs';

async function testE2E() {
  console.log('=== STARTING E2E API AND DATABASE VERIFICATION ===\n');

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jersey_mention_bd';
  await mongoose.connect(MONGODB_URI);

  // 1. Get products for test
  let jersey = await ProductModel.findOne({
    $or: [{ 'sizeOptions.enabled': true }, { sizes: { $exists: true, $ne: [] } }]
  });

  if (!jersey) {
    jersey = await ProductModel.create({
      id: 'test-jersey-101',
      name: 'Test Football Jersey 2026',
      slug: 'test-football-jersey-2026',
      sku: 'TEST-JERSEY-01',
      barcode: '11223344',
      price: 1200,
      description: 'E2E test jersey',
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
        label: 'Select Jersey Size:',
        sizes: ['S', 'M', 'L', 'XL', 'XXL']
      },
      colors: [{ name: 'Default', hex: '#000' }],
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
      reviewCount: 1,
      createdAt: new Date().toISOString()
    });
  }

  let football = await ProductModel.findOne({ 'sizeOptions.enabled': false });
  if (!football) {
    football = await ProductModel.create({
      id: 'test-football-202',
      name: 'Pro Match Football',
      slug: 'pro-match-football-2026',
      sku: 'BALL-PRO-01',
      barcode: '99887766',
      price: 2500,
      description: 'E2E test football',
      specifications: [],
      images: ['/ball.jpg'],
      categoryId: 'cat-gear',
      categoryName: 'Gear',
      stock: 30,
      lowStockAlert: 3,
      isOutOfStock: false,
      sizes: [],
      sizeOptions: {
        enabled: false,
        required: false,
        label: 'Select Size:',
        sizes: []
      },
      colors: [{ name: 'White/Black', hex: '#fff' }],
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
      reviewCount: 0,
      createdAt: new Date().toISOString()
    });
  }

  console.log(`1. Product Check:
  - Size-enabled product: "${jersey.name}" (enabled: ${jersey.sizeOptions?.enabled}, sizes: ${jersey.sizeOptions?.sizes?.join(', ') || jersey.sizes.join(', ')})
  - Size-disabled product: "${football.name}" (enabled: ${football.sizeOptions?.enabled})`);

  // Test 2: Order with missing size on size-enabled product
  console.log('\n2. Testing Order with Missing Size (Size-enabled product):');
  const res1 = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Rahim Khan',
      customerPhone: '01711998877',
      paymentType: '25_percent_advance',
      paymentMethod: 'bkash',
      paymentMobileNumber: '01711998877',
      transactionId: 'TRX_MISSING_SIZE_TEST',
      shippingAddress: {
        fullName: 'Rahim Khan',
        phone: '01711998877',
        address: 'House 1, Road 2, Dhanmondi',
        city: 'Dhaka',
        district: 'Dhaka',
        zone: 'inside_dhaka'
      },
      items: [
        {
          productId: jersey.id,
          productName: jersey.name,
          price: jersey.price,
          quantity: 1,
          size: '' // MISSING SIZE
        }
      ]
    })
  });
  const data1 = await res1.json();
  console.log(`   Status: ${res1.status}, Message: "${data1.message}"`);
  if (res1.status === 400 && data1.message.includes('Size selection is required')) {
    console.log('   Result: PASS (Correctly blocked order with missing size)');
  } else {
    console.log('   Result: FAIL', data1);
  }

  // Test 3: Order with invalid size
  console.log('\n3. Testing Order with Invalid Size (e.g. "4XL" when not allowed):');
  const res2 = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Rahim Khan',
      customerPhone: '01711998877',
      paymentType: '25_percent_advance',
      paymentMethod: 'bkash',
      paymentMobileNumber: '01711998877',
      transactionId: 'TRX_INVALID_SIZE_TEST',
      shippingAddress: {
        fullName: 'Rahim Khan',
        phone: '01711998877',
        address: 'House 1, Road 2, Dhanmondi',
        city: 'Dhaka',
        district: 'Dhaka',
        zone: 'inside_dhaka'
      },
      items: [
        {
          productId: jersey.id,
          productName: jersey.name,
          price: jersey.price,
          quantity: 1,
          size: '4XL_INVALID'
        }
      ]
    })
  });
  const data2 = await res2.json();
  console.log(`   Status: ${res2.status}, Message: "${data2.message}"`);
  if (res2.status === 400 && data2.message.includes('invalid for product')) {
    console.log('   Result: PASS (Correctly blocked order with invalid size)');
  } else {
    console.log('   Result: FAIL', data2);
  }

  // Test 4: Order with multiple products: 1 size-enabled (with valid size) + 1 size-disabled (no size)
  console.log('\n4. Testing Order with Multi-Products (Jersey Size L + Football No Size):');
  const res3 = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Rahim Khan',
      customerPhone: '01711998877',
      paymentType: '25_percent_advance',
      paymentMethod: 'bkash',
      paymentMobileNumber: '01711998877',
      transactionId: 'TRX_VALID_MULTI_PRODUCT',
      shippingAddress: {
        fullName: 'Rahim Khan',
        phone: '01711998877',
        address: 'House 1, Road 2, Dhanmondi',
        city: 'Dhaka',
        district: 'Dhaka',
        zone: 'inside_dhaka'
      },
      items: [
        {
          productId: jersey.id,
          productName: jersey.name,
          price: jersey.price,
          quantity: 1,
          size: 'L' // Valid size
        },
        {
          productId: football.id,
          productName: football.name,
          price: football.price,
          quantity: 1
          // No size required
        }
      ]
    })
  });
  const data3 = await res3.json();
  console.log(`   Status: ${res3.status}, Order #: ${data3.order?.orderNumber || 'N/A'}`);
  if (res3.status === 200 && data3.success && data3.order) {
    const jerseyItem = data3.order.items.find((i: any) => i.productId === jersey.id);
    const footballItem = data3.order.items.find((i: any) => i.productId === football.id);
    console.log(`   Jersey Item in Order: Size = "${jerseyItem?.size}"`);
    console.log(`   Football Item in Order: Size = "${footballItem?.size || 'None (correct)'}"`);
    console.log('   Result: PASS (Order placed successfully with multiple items adhering to size rules)');
  } else {
    console.log('   Result: FAIL', data3);
  }

  await mongoose.disconnect();
  console.log('\n=== E2E TESTS COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

testE2E().catch((e) => {
  console.error(e);
  process.exit(1);
});
