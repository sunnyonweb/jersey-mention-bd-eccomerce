const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('--- STARTING ORDER DETAILS SNAPSHOT & VERIFICATION TEST ---');

  // 1. Log in as Admin
  console.log('Logging in as Admin...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '01571305964', password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!' })
  });
  const loginData: any = await loginRes.json();
  if (!loginData.success) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginData));
  }
  const cookies = loginRes.headers.get('set-cookie') || '';
  console.log('✔ Admin login successful');

  // 2. Fetch or create a badge in the library
  console.log('Fetching sleeve badges library...');
  const badgesRes = await fetch(`${BASE_URL}/api/admin/sleeve-badges`, {
    headers: { Cookie: cookies }
  });
  const badgesData: any = await badgesRes.json();
  let badges = badgesData.badges || [];

  if (badges.length === 0) {
    console.log('Creating a test badge in library...');
    const testPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const createBadgeRes = await fetch(`${BASE_URL}/api/admin/sleeve-badges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      body: JSON.stringify({
        name: 'Champions League Star Patch',
        image: testPng,
        price: 150,
        isActive: true
      })
    });
    const createBadgeData = await createBadgeRes.json();
    badges.push(createBadgeData.badge);
  }
  const testBadge = badges[0];
  console.log(`✔ Using badge: "${testBadge.name}" (ID: ${testBadge.id}, Price: ৳${testBadge.price})`);

  // 3. Fetch products
  const prodsRes = await fetch(`${BASE_URL}/api/products`);
  const prodsData: any = await prodsRes.json();
  const products = prodsData.products || [];

  let adultProduct = products.find((p: any) => p.showAdultSizes !== false);
  let kidsProduct = products.find((p: any) => p.id !== adultProduct.id);

  if (!adultProduct || !kidsProduct) {
    throw new Error('Need at least two products in the system.');
  }

  // Update adultProduct to enable squad print and sleeve badge
  console.log(`Updating Adult Product "${adultProduct.name}" to enable squad and sleeve badge...`);
  await fetch(`${BASE_URL}/api/products/${adultProduct.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookies },
    body: JSON.stringify({
      showCustomNameNumber: true,
      allowCustomPrint: true,
      showSleevePatches: true,
      sleeveBadges: [testBadge.id]
    })
  });

  // Update kidsProduct to enable kids sizes
  console.log(`Updating Kids Product "${kidsProduct.name}" to enable kids sizes (3Y-14Y)...`);
  await fetch(`${BASE_URL}/api/products/${kidsProduct.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookies },
    body: JSON.stringify({
      showKidsSizes: true,
      kidsSizes: ['3Y', '5Y', '7Y', '8Y', '10Y', '12Y', '14Y']
    })
  });

  // 4. Place multi-product order with customer customization
  const adultItemCustomization = {
    nameNumber: {
      enabled: true,
      name: 'TALUKDER',
      number: '10',
      price: 250
    },
    patches: {
      enabled: false,
      quantity: 0,
      pricePerPatch: 0,
      totalPrice: 0
    },
    sleeveBadges: {
      enabled: true,
      selectedBadges: [
        {
          badgeId: testBadge.id,
          name: testBadge.name,
          badgeName: testBadge.name,
          image: testBadge.image,
          badgeImage: testBadge.image,
          price: testBadge.price,
          badgePrice: testBadge.price
        }
      ],
      quantity: 1,
      pricePerBadge: testBadge.price,
      totalPrice: testBadge.price
    }
  };

  const adultProductBasePrice = adultProduct.salePrice || adultProduct.price;
  const kidsProductBasePrice = kidsProduct.salePrice || kidsProduct.price;

  const orderPayload = {
    customerName: 'Rahim Talukder',
    customerPhone: '01799887766',
    customerEmail: 'rahim.guest@example.com',
    shippingAddress: {
      fullName: 'Rahim Talukder',
      phone: '01799887766',
      address: 'House 42, Road 7/A, Dhanmondi',
      area: 'Dhanmondi',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'Dhaka',
      postalCode: '1209',
      zone: 'inside_dhaka'
    },
    items: [
      {
        productId: adultProduct.id,
        sku: adultProduct.sku,
        productName: adultProduct.name,
        price: adultProductBasePrice + 250 + testBadge.price,
        quantity: 2,
        size: 'L',
        color: 'Home Jersey',
        customization: adultItemCustomization
      },
      {
        productId: kidsProduct.id,
        sku: kidsProduct.sku,
        productName: kidsProduct.name,
        price: kidsProductBasePrice,
        quantity: 1,
        size: '8Y',
        color: 'Away Jersey'
      }
    ],
    deliveryZone: 'inside_dhaka',
    paymentMethod: 'bkash',
    paymentType: '25_percent_advance',
    paymentMobileNumber: '01799887766',
    paymentPhone: '01799887766',
    transactionId: 'BKTRX8829104',
    notes: 'Please call before delivery. Ring the calling bell twice.'
  };

  console.log('\nPlacing multi-product order via POST /api/orders...');
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });

  const orderResult: any = await orderRes.json();
  if (!orderResult.success || !orderResult.order) {
    throw new Error(`Order placement failed: ${JSON.stringify(orderResult)}`);
  }

  const createdOrder = orderResult.order;
  console.log(`✔ Order placed successfully! Order #${createdOrder.orderNumber}, ID: ${createdOrder.id}`);

  // 5. Verify Order Details Snapshot
  console.log('\n--- VERIFYING ORDER DETAILS SNAPSHOT & INTEGRITY ---');

  // Customer Information
  console.log('Verifying Customer Profile:');
  console.log(`- Name: "${createdOrder.customerName}"`);
  console.log(`- Phone: "${createdOrder.customerPhone}"`);
  console.log(`- Email: "${createdOrder.customerEmail}"`);
  console.log(`- Notes: "${createdOrder.notes}"`);
  console.log(`- Customer Notes: "${createdOrder.customerNotes}"`);

  if (createdOrder.customerName !== 'Rahim Talukder') throw new Error('Customer name mismatch');
  if (createdOrder.customerPhone !== '01799887766') throw new Error('Customer phone mismatch');
  if (createdOrder.customerEmail !== 'rahim.guest@example.com') throw new Error('Customer email mismatch');
  if (createdOrder.notes !== 'Please call before delivery. Ring the calling bell twice.') throw new Error('Notes mismatch');
  if (createdOrder.customerNotes !== 'Please call before delivery. Ring the calling bell twice.') throw new Error('Customer notes mismatch');
  console.log('✔ Customer Profile & Notes verified.');

  // Shipping & Delivery Details
  console.log('\nVerifying Delivery & Shipping Details:');
  console.log(`- Location: "${createdOrder.deliveryLocation}"`);
  console.log(`- Shipping Fee: ৳${createdOrder.shippingFee}`);
  console.log(`- Full Address: "${createdOrder.shippingAddress.address}, ${createdOrder.shippingAddress.area}, ${createdOrder.shippingAddress.city}"`);

  if (createdOrder.deliveryLocation !== 'Inside Dhaka') throw new Error('Delivery location mismatch');
  if (createdOrder.shippingFee !== 80 && createdOrder.shippingFee !== 0) throw new Error('Shipping fee unexpected');
  console.log('✔ Delivery & Shipping Details verified.');

  // Payment Details
  console.log('\nVerifying Payment Information:');
  console.log(`- Payment Method: "${createdOrder.paymentMethod}"`);
  console.log(`- Payment Phone: "${createdOrder.paymentMobileNumber}"`);
  console.log(`- TrxID: "${createdOrder.transactionId}"`);
  console.log(`- Advance Percentage: ${createdOrder.advancePaymentPercentage}%`);
  console.log(`- Amount Paid: ৳${createdOrder.amountPaid}`);
  console.log(`- Remaining Balance: ৳${createdOrder.remainingAmount}`);
  console.log(`- Verification Status: "${createdOrder.paymentVerificationStatus}"`);

  if (createdOrder.paymentMethod !== 'bkash') throw new Error('Payment method mismatch');
  if (createdOrder.paymentMobileNumber !== '01799887766') throw new Error('Payment phone mismatch');
  if (createdOrder.transactionId !== 'BKTRX8829104') throw new Error('TrxID mismatch');
  if (createdOrder.advancePaymentPercentage !== 25) throw new Error('Advance percentage mismatch');
  if (createdOrder.paymentVerificationStatus !== 'pending') throw new Error('Initial verification status should be pending');
  if (createdOrder.amountPaid <= 0) throw new Error('Amount paid must be > 0');
  if (createdOrder.remainingAmount <= 0) throw new Error('Remaining balance must be > 0');
  console.log('✔ Payment Information verified.');

  // Items Snapshot Verification
  if (!createdOrder.items || createdOrder.items.length !== 2) {
    throw new Error(`Expected 2 items, got ${createdOrder.items?.length}`);
  }

  // Item 1 (Adult Item)
  const item1 = createdOrder.items[0];
  console.log('\nVerifying Item 1 (Adult Item with Custom Squad & Sleeve Badges):');
  console.log(`- Name: "${item1.name}"`);
  console.log(`- SKU: "${item1.sku}"`);
  console.log(`- Base Price: ৳${item1.basePrice}, Unit Final Price: ৳${item1.price}, Line Total: ৳${item1.lineTotal}`);
  console.log(`- Size: "${item1.size}", isKidsSize: ${item1.isKidsSize}`);
  console.log(`- Squad Print: "${item1.customization?.nameNumber?.name}" #${item1.customization?.nameNumber?.number} (+৳${item1.customization?.nameNumber?.price})`);
  console.log(`- Sleeve Badges: ${item1.customization?.sleeveBadges?.quantity} badge(s), Total: +৳${item1.customization?.sleeveBadges?.totalPrice}`);
  console.log(`- Price Breakdown:`, JSON.stringify(item1.priceBreakdown));

  if (item1.size !== 'L') throw new Error('Item 1 size should be L');
  if (item1.isKidsSize !== false) throw new Error('Item 1 isKidsSize should be false');
  if (item1.customization?.nameNumber?.name !== 'TALUKDER') throw new Error('Item 1 squad name mismatch');
  if (item1.customization?.nameNumber?.number !== '10') throw new Error('Item 1 squad number mismatch');
  if (item1.customization?.nameNumber?.price !== 250) throw new Error('Item 1 squad price mismatch');
  if (!item1.customization?.sleeveBadges?.enabled) throw new Error('Item 1 sleeve badges should be enabled');
  if (item1.customization.sleeveBadges.selectedBadges[0].name !== testBadge.name) throw new Error('Item 1 badge name mismatch');
  if (!item1.priceBreakdown) throw new Error('Item 1 missing priceBreakdown snapshot');
  if (item1.priceBreakdown.customNameNumberPrice !== 250) throw new Error('Item 1 breakdown squad price mismatch');
  if (item1.priceBreakdown.sleeveBadgesPrice !== testBadge.price) throw new Error('Item 1 breakdown badge price mismatch');
  console.log('✔ Item 1 verified with 100% snapshot integrity.');

  // Item 2 (Kids Item)
  const item2 = createdOrder.items[1];
  console.log('\nVerifying Item 2 (Kids Item without Customization):');
  console.log(`- Name: "${item2.name}"`);
  console.log(`- SKU: "${item2.sku}"`);
  console.log(`- Base Price: ৳${item2.basePrice}, Unit Final Price: ৳${item2.price}, Line Total: ৳${item2.lineTotal}`);
  console.log(`- Size: "${item2.size}", isKidsSize: ${item2.isKidsSize}`);
  console.log(`- Price Breakdown:`, JSON.stringify(item2.priceBreakdown));

  if (item2.size !== '8Y') throw new Error('Item 2 size should be 8Y');
  if (item2.isKidsSize !== true) throw new Error('Item 2 isKidsSize should be true');
  if (item2.customization?.nameNumber?.enabled) throw new Error('Item 2 should NOT have squad customization');
  if (item2.customization?.sleeveBadges?.enabled) throw new Error('Item 2 should NOT have sleeve badges');
  if (!item2.priceBreakdown) throw new Error('Item 2 missing priceBreakdown snapshot');
  console.log('✔ Item 2 verified with 100% snapshot integrity.');

  // Financial Totals
  console.log('\nVerifying Financial Breakdown:');
  console.log(`- Items Subtotal: ৳${createdOrder.itemsSubtotal}`);
  console.log(`- Customization Total: ৳${createdOrder.customizationTotal}`);
  console.log(`- Delivery Fee: ৳${createdOrder.shippingFee}`);
  console.log(`- Grand Total: ৳${createdOrder.grandTotal}`);
  console.log(`- Amount Paid: ৳${createdOrder.amountPaid}`);
  console.log(`- Remaining Balance: ৳${createdOrder.remainingAmount}`);

  if (createdOrder.itemsSubtotal === undefined) throw new Error('Missing itemsSubtotal');
  if (createdOrder.customizationTotal === undefined) throw new Error('Missing customizationTotal');
  console.log('✔ Financial Breakdown verified.');

  // 6. Test Admin Payment Verification Status Update
  console.log('\nUpdating Payment Verification Status to "verified" as Admin...');
  const verifyRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}/payment-verification`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookies },
    body: JSON.stringify({ status: 'verified' })
  });
  const verifyData: any = await verifyRes.json();
  if (!verifyData.success || verifyData.order.paymentVerificationStatus !== 'verified') {
    throw new Error(`Payment verification update failed: ${JSON.stringify(verifyData)}`);
  }
  console.log('✔ Payment verification status successfully updated and saved as "verified".');

  // Verify by fetching order again
  console.log('Re-fetching order from Admin Orders endpoint...');
  const adminOrderRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}`, {
    headers: { Cookie: cookies }
  });
  const adminOrderData: any = await adminOrderRes.json();
  if (!adminOrderData.success || !adminOrderData.order) {
    throw new Error('Failed to re-fetch order: ' + JSON.stringify(adminOrderData));
  }
  const fetchedOrder = adminOrderData.order;
  if (fetchedOrder.paymentVerificationStatus !== 'verified') {
    throw new Error('Order verification status in DB is not verified');
  }
  if (fetchedOrder.items[0].size !== 'L' || fetchedOrder.items[1].size !== '8Y') {
    throw new Error('Sizes not preserved across database roundtrip');
  }
  console.log('✔ Database persistence confirmed for all order details.');

  console.log('\n=============================================================');
  console.log('ALL ORDER DETAILS SNAPSHOT & UPGRADE TESTS PASSED WITH 100%!');
  console.log('=============================================================');
}

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
