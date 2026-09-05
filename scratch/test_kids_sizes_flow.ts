const BASE_URL = 'http://localhost:3000';

async function testKidsSizesFlow() {
  console.log('=== TESTING KIDS / CHILDREN SIZE OPTIONS (3Y–14Y) FLOW ===\n');

  // Step 1: Admin Login
  console.log('1. Logging in as Admin...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '01571305964', password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!' })
  });
  const loginData: any = await loginRes.json();
  if (!loginData.success) throw new Error('Admin login failed');
  const cookies = loginRes.headers.get('set-cookie');
  console.log('✓ Admin login successful');

  // Step 2: Get categories
  const catRes = await fetch(`${BASE_URL}/api/categories`);
  const catData: any = await catRes.json();
  const category = catData.categories?.[0] || { id: 'cat-kids-corner', name: 'Kids Corner' };

  // Step 3: Create Product with Kids Sizes Enabled (3Y, 5Y, 7Y, 10Y, 14Y)
  console.log('\n2. Creating product with Kids Sizes (3Y–14Y)...');
  const timestamp = Date.now();
  const configuredKidsSizes = ['3Y', '5Y', '7Y', '10Y', '14Y'];
  const configuredAdultSizes = ['S', 'M', 'L'];

  const createRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      name: `Kids & Adult Match Jersey ${timestamp}`,
      slug: `kids-adult-match-jersey-${timestamp}`,
      sku: `KIDS-${timestamp}`,
      price: 1500,
      stock: 40,
      categoryId: category.id,
      categoryName: category.name,
      sizes: configuredAdultSizes,
      sizeOptions: {
        enabled: true,
        required: true,
        label: 'Select Size:',
        sizes: configuredAdultSizes,
        showKidsSizes: true,
        kidsSizes: configuredKidsSizes
      },
      showKidsSizes: true,
      kidsSizes: configuredKidsSizes,
      images: ['/images/products/brazil_2002.jpg'],
      status: 'active'
    })
  });

  const createData: any = await createRes.json();
  if (!createData.success || !createData.product) {
    throw new Error('Create product failed: ' + JSON.stringify(createData));
  }
  const product1 = createData.product;
  console.log(`✓ Product created! ID: ${product1.id}`);
  console.log(`  Show Kids Sizes: ${product1.showKidsSizes}`);
  console.log(`  Configured Kids Sizes:`, product1.kidsSizes);

  if (!product1.showKidsSizes) throw new Error('showKidsSizes was not saved as true');
  if (product1.kidsSizes.length !== 5 || !product1.kidsSizes.includes('14Y') || !product1.kidsSizes.includes('3Y')) {
    throw new Error('kidsSizes array was not preserved properly');
  }

  // Step 4: Test Add to Cart with valid Kids size (14Y)
  console.log('\n3. Testing Add to Cart with valid kids size (14Y)...');
  const cartRes1 = await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      productId: product1.id,
      quantity: 1,
      selectedSize: '14Y'
    })
  });
  const cartData1: any = await cartRes1.json();
  if (!cartData1.success) {
    throw new Error('Add to cart with 14Y failed: ' + JSON.stringify(cartData1));
  }
  console.log('✓ Successfully added product to cart with kids size 14Y');

  // Step 5: Test Add to Cart with unconfigured kids size (12Y) -> Expect Rejection
  console.log('\n4. Testing Add to Cart with unconfigured kids size (12Y - not enabled for this product)...');
  const cartRes2 = await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      productId: product1.id,
      quantity: 1,
      selectedSize: '12Y'
    })
  });
  const cartData2: any = await cartRes2.json();
  if (cartRes2.status === 400 && !cartData2.success) {
    console.log(`✓ Correctly rejected unconfigured kids size 12Y: "${cartData2.message}"`);
  } else {
    throw new Error('Backend failed to reject unconfigured kids size!');
  }

  // Step 6: Test Add to Cart with valid adult size (M)
  console.log('\n5. Testing Add to Cart with valid adult size (M)...');
  const cartRes3 = await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      productId: product1.id,
      quantity: 1,
      selectedSize: 'M'
    })
  });
  const cartData3: any = await cartRes3.json();
  if (!cartData3.success) {
    throw new Error('Add to cart with adult size M failed: ' + JSON.stringify(cartData3));
  }
  console.log('✓ Successfully added product to cart with adult size M');

  // Step 7: Create Product 2 with Kids Sizes Disabled (showKidsSizes: false)
  console.log('\n6. Creating product with Kids Sizes DISABLED...');
  const createRes2 = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      name: `Adult Only Jersey ${timestamp}`,
      slug: `adult-only-jersey-${timestamp}`,
      sku: `ADULT-${timestamp}`,
      price: 1600,
      stock: 30,
      categoryId: category.id,
      categoryName: category.name,
      sizes: ['S', 'M', 'L'],
      sizeOptions: {
        enabled: true,
        required: true,
        label: 'Select Size:',
        sizes: ['S', 'M', 'L'],
        showKidsSizes: false,
        kidsSizes: []
      },
      showKidsSizes: false,
      kidsSizes: [],
      images: ['/images/products/brazil_2002.jpg'],
      status: 'active'
    })
  });
  const createData2: any = await createRes2.json();
  const product2 = createData2.product;
  console.log(`✓ Product created with showKidsSizes = false! ID: ${product2.id}`);

  // Test Add to Cart with kids size 7Y on Product 2 -> Expect Rejection
  console.log('Testing Add to Cart with kids size 7Y on adult-only product...');
  const cartRes4 = await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      productId: product2.id,
      quantity: 1,
      selectedSize: '7Y'
    })
  });
  const cartData4: any = await cartRes4.json();
  if (cartRes4.status === 400 && !cartData4.success) {
    console.log(`✓ Correctly rejected kids size 7Y when kids sizes are OFF: "${cartData4.message}"`);
  } else {
    throw new Error('Backend failed to reject kids size when showKidsSizes is OFF!');
  }

  // Step 8: Test Order Checkout with kids size item
  console.log('\n7. Testing Order Checkout with Kids size item (14Y)...');
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      customerName: 'Test Kids Buyer',
      customerPhone: '01711223344',
      shippingAddress: {
        fullName: 'Test Kids Buyer',
        phone: '01711223344',
        address: 'House 1, Road 2, Block C, Mirpur-10',
        city: 'Dhaka',
        district: 'Dhaka',
        zone: 'inside_dhaka'
      },
      paymentMethod: 'bkash',
      paymentType: '25_percent_advance',
      paymentMobileNumber: '01711223344',
      transactionId: 'TRX12345678',
      shippingFee: 70,
      items: [
        {
          productId: product1.id,
          name: product1.name,
          price: product1.price,
          quantity: 1,
          size: '14Y'
        }
      ]
    })
  });
  const orderData: any = await orderRes.json();
  if (!orderData.success || !orderData.order) {
    throw new Error('Order creation failed: ' + JSON.stringify(orderData));
  }
  const order = orderData.order;
  console.log(`✓ Order created successfully! ID: ${order.id}`);
  const orderedItem = order.items?.[0];
  console.log(`  Saved item size in order: "${orderedItem.size}"`);
  if (orderedItem.size !== '14Y') {
    throw new Error('Order item size mismatch! Expected 14Y, got: ' + orderedItem.size);
  }

  // Step 9: Update product kids sizes to include 12Y and 13Y
  console.log('\n8. Updating product kids sizes to include 12Y, 13Y...');
  const updatedKidsList = ['3Y', '5Y', '7Y', '10Y', '12Y', '13Y', '14Y'];
  const updateRes = await fetch(`${BASE_URL}/api/products/${product1.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      ...product1,
      kidsSizes: updatedKidsList,
      sizeOptions: {
        ...product1.sizeOptions,
        kidsSizes: updatedKidsList
      }
    })
  });
  const updateData: any = await updateRes.json();
  if (!updateData.success || !updateData.product) {
    throw new Error('Update failed');
  }
  const updatedProd = updateData.product;
  console.log(`✓ Product updated! Kids sizes count: ${updatedProd.kidsSizes.length}`);
  if (!updatedProd.kidsSizes.includes('12Y') || !updatedProd.kidsSizes.includes('13Y')) {
    throw new Error('Updated kids sizes not found in product!');
  }

  // Step 10: Clean up
  console.log('\n9. Cleaning up test products and order...');
  await fetch(`${BASE_URL}/api/products/${product1.id}`, { method: 'DELETE', headers: { Cookie: cookies || '' } });
  await fetch(`${BASE_URL}/api/products/${product2.id}`, { method: 'DELETE', headers: { Cookie: cookies || '' } });
  await fetch(`${BASE_URL}/api/orders/${order.id}`, { method: 'DELETE', headers: { Cookie: cookies || '' } });
  console.log('✓ Clean up complete.');

  console.log('\n=== ALL KIDS / CHILDREN SIZES (3Y–14Y) TESTS PASSED PERFECTLY ===');
}

testKidsSizesFlow().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
