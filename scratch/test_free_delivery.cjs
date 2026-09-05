async function runTest() {
  console.log('Testing Free Delivery Threshold system...');

  // 1. Authenticate Admin
  const adminLoginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@jerseymentionbd.com',
      password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!'
    })
  });
  const adminLoginJson = await adminLoginRes.json();
  if (!adminLoginJson.success) {
    console.error('Failed to log in as admin:', adminLoginJson);
    process.exit(1);
  }
  const adminCookie = `accessToken=${adminLoginJson.accessToken}`;

  // Helper to update site settings
  async function updateSettings(enabled, threshold) {
    const res = await fetch('http://127.0.0.1:3000/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      },
      body: JSON.stringify({
        freeDeliveryEnabled: enabled,
        freeShippingThreshold: threshold
      })
    });
    const data = await res.json();
    if (!data.success) {
      console.error('Failed to update site settings:', data);
      process.exit(1);
    }
  }

  // 2. Authenticate Customer
  const customerLoginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@jerseymentionbd.com',
      password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!'
    })
  });
  const customerLoginJson = await customerLoginRes.json();
  if (!customerLoginJson.success) {
    console.error('Failed to log in as customer:', customerLoginJson);
    process.exit(1);
  }
  const customerCookie = `accessToken=${customerLoginJson.accessToken}`;

  // Helper to place test order
  async function placeOrder(itemsCount, zone) {
    const item = {
      productId: 'prod-1',
      productName: 'Bangladesh National Football Team Official Home Jersey 2026',
      price: 1290,
      quantity: itemsCount,
      size: 'L',
      color: 'Emerald Green'
    };

    const res = await fetch('http://127.0.0.1:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': customerCookie
      },
      body: JSON.stringify({
        customerName: 'Tanvir Ahmed',
        customerEmail: 'customer@jerseymention.bd',
        customerPhone: '01812345678',
        paymentType: '25_percent_advance',
        items: [item],
        shippingAddress: {
          fullName: 'Tanvir Ahmed',
          phone: '01812345678',
          address: 'House 12, Road 4, Sector 7, Uttara',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1230',
          zone: zone
        },
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        subtotal: 1290 * itemsCount,
        discount: 0,
        shippingFee: 9999, // Backend should recalculate!
        totalAmount: 99999
      })
    });
    const data = await res.json();
    if (!data.success) {
      console.error('Failed to place order:', data);
      process.exit(1);
    }
    return data.order;
  }

  // --- TEST CASE 1: Free Delivery = ON, Order >= Threshold (3000 BDT) ---
  console.log('\n--- Case 1: Free Delivery = ON, Order >= Threshold ---');
  await updateSettings(true, 3000);
  const order1 = await placeOrder(3, 'inside_dhaka'); // Subtotal = 3870 BDT
  console.log(`Order placed: Subtotal=৳${order1.subtotal}, ShippingFee=৳${order1.shippingFee}, GrandTotal=৳${order1.grandTotal}`);
  if (order1.shippingFee !== 0) {
    console.error('Expected shipping fee to be 0 BDT, got:', order1.shippingFee);
    process.exit(1);
  }

  // --- TEST CASE 2: Free Delivery = ON, Order < Threshold (3000 BDT) ---
  console.log('\n--- Case 2: Free Delivery = ON, Order < Threshold ---');
  const order2 = await placeOrder(1, 'inside_dhaka'); // Subtotal = 1290 BDT
  console.log(`Order placed: Subtotal=৳${order2.subtotal}, ShippingFee=৳${order2.shippingFee}, GrandTotal=৳${order2.grandTotal}`);
  if (order2.shippingFee !== 80) {
    console.error('Expected shipping fee to be 80 BDT, got:', order2.shippingFee);
    process.exit(1);
  }

  // --- TEST CASE 3: Free Delivery = OFF, Order >= Threshold (3000 BDT) ---
  console.log('\n--- Case 3: Free Delivery = OFF, Order >= Threshold ---');
  await updateSettings(false, 3000);
  const order3 = await placeOrder(3, 'inside_dhaka'); // Subtotal = 3870 BDT
  console.log(`Order placed: Subtotal=৳${order3.subtotal}, ShippingFee=৳${order3.shippingFee}, GrandTotal=৳${order3.grandTotal}`);
  if (order3.shippingFee !== 80) {
    console.error('Expected shipping fee to be 80 BDT (since Free Delivery is OFF), got:', order3.shippingFee);
    process.exit(1);
  }

  // Restore defaults
  await updateSettings(true, 3000);

  console.log('\nAll Free Delivery Threshold validation tests passed successfully!');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
