import { test, expect } from '@playwright/test';

test.describe('Saved Shipping Address E2E Flow & Security', () => {
  const uniqueSuffix = Date.now().toString();
  const testEmail = `cust-${uniqueSuffix}@example.com`;
  const testPassword = `Pass1234!`;
  const testName = `Tanvir Ahmed ${uniqueSuffix}`;
  const testPhone = `01712345678`;
  let customerToken = '';
  let customerUserId = '';

  test('should execute the entire saved address flow successfully and enforce security', async ({ page }) => {
    // 1. Authenticate as Admin programmatically to seed the test product
    console.log('[TEST] Authenticating as Admin to seed product...');
    const adminLoginRes = await page.context().request.post('/api/auth/login', {
      data: {
        email: 'admin@jerseymentionbd.com',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!'
      }
    });
    const adminLoginJson = await adminLoginRes.json();
    expect(adminLoginJson.success).toBe(true);

    const adminToken = adminLoginJson.accessToken;

    // 2. Programmatically seed a product for checkout using Admin authorization
    const testSku = `SH-TEST-${uniqueSuffix}`;
    const testProductName = `Premium Match Kit ${uniqueSuffix}`;
    console.log('[TEST] Seeding a test product...');
    const prodRes = await page.context().request.post('/api/products', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        name: testProductName,
        price: 1850,
        salePrice: 1490,
        categoryId: 'cat-player-edition',
        sku: testSku,
        stock: 50,
        isFlashSale: true,
        featured: true,
        homepageSections: ['limited_time_deals']
      }
    });
    const prodJson = await prodRes.json();
    expect(prodJson.success).toBe(true);

    // 3. Register a new customer programmatically
    console.log('[TEST] Registering new customer...');
    const regRes = await page.context().request.post('/api/auth/register', {
      data: {
        name: testName,
        email: testEmail,
        password: testPassword,
        phone: testPhone
      }
    });
    const regJson = await regRes.json();
    expect(regJson.success).toBe(true);
    customerToken = regJson.accessToken;
    customerUserId = regJson.user.id;

    // Set the customer token cookie for UI navigation
    await page.context().addCookies([{
      name: 'accessToken',
      value: customerToken,
      url: 'http://127.0.0.1:3000'
    }]);

    // Wait a brief moment for Vite watcher to settle on catalog JSON changes
    await page.waitForTimeout(2000);

    // 3. Navigate to application and verify empty shipping form on checkout
    console.log('[TEST] Navigating to page and adding product to cart...');
    await page.goto('/');
    
    // Add product to cart
    const addCartBtn = page.locator('button[title="Add to Cart"]').first();
    await expect(addCartBtn).toBeVisible();
    await addCartBtn.click();
    await page.waitForTimeout(500);

    // Open Cart and click Proceed to Checkout
    await page.locator('button:has-text("Cart")').first().click();
    const checkoutBtn = page.locator('button:has-text("PROCEED TO CHECKOUT")').first();
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // Verify checkout page loaded
    await expect(page.locator('text=1. Delivery Shipping Information').first()).toBeVisible();

    // Verify address input is visible and address textarea is empty
    const addressTextarea = page.locator('textarea[name="address"]').first();
    await expect(addressTextarea).toBeVisible();
    await expect(addressTextarea).toHaveValue('');

    // Fill in shipping information for Order #1
    console.log('[TEST] Filling shipping info for Order #1...');
    await page.fill('input[name="fullName"]', testName);
    await page.fill('input[name="phone"]', testPhone);
    await page.fill('textarea[name="address"]', 'House 12, Road 4, Mirpur-10, Dhaka');
    await page.fill('input[name="city"]', 'Dhaka');
    await page.fill('input[name="district"]', 'Dhaka');
    
    // Select Shipping Zone: Inside Dhaka (shipping charge recalculation check)
    await page.selectOption('select[name="shippingZone"]', 'inside_dhaka');
    
    // Verify shipping fee in checkout summary shows inside Dhaka rate (৳80)
    await expect(page.locator('text=Delivery Charge').locator('..').locator('text=৳80').first()).toBeVisible();

    // Select 25% Advance Payment option
    const advanceOption = page.locator('text=25% Advance Payment').first();
    await advanceOption.scrollIntoViewIfNeeded();
    await advanceOption.click({ force: true });

    // Fill transaction details
    await page.fill('input[placeholder="Enter Transaction ID"]', 'TRX123456MIR');
    await page.fill('input[placeholder="01XXXXXXXXX"]', testPhone);

    // Place Order #1
    console.log('[TEST] Placing Order #1...');
    const placeOrderBtn = page.locator('button:has-text("PLACE ORDER")').first();
    await placeOrderBtn.click();

    // Verify order successful
    await expect(page.locator('text=Order Placed Successfully!').first()).toBeVisible({ timeout: 10000 });

    // 4. Verify address is permanently saved to MongoDB under the user profile
    console.log('[TEST] Verifying address saved in user profile via API...');
    const checkAddressRes = await page.context().request.get('/api/user/shipping-address', {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const checkAddressJson = await checkAddressRes.json();
    expect(checkAddressJson.success).toBe(true);
    expect(checkAddressJson.savedShippingAddress.address).toBe('House 12, Road 4, Mirpur-10, Dhaka');

    // 5. Navigate to Home, add product to cart again, and start next order
    console.log('[TEST] Navigating to Home for next order checkout...');
    await page.goto('/');
    await addCartBtn.click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Cart")').first().click();
    await checkoutBtn.click();

    // 6. Verify shipping address automatically pre-fills/displays in Saved Address display card
    console.log('[TEST] Verifying saved address displays automatically...');
    await expect(page.locator('text=Saved Shipping Address').first()).toBeVisible();
    await expect(page.locator(`text=${testName}`).first()).toBeVisible();
    await expect(page.locator('text=Mirpur-10').first()).toBeVisible();

    // 7. Click Edit Address, modify street address, and click Save Address
    console.log('[TEST] Editing saved shipping address...');
    const editAddressBtn = page.locator('button:has-text("Edit Address")').first();
    await editAddressBtn.click();
    
    // Modify street address from Mirpur to Uttara
    await page.fill('textarea[name="address"]', 'House 20, Road 8, Sector 12, Uttara, Dhaka');
    
    // Click Save Address
    const saveAddressBtn = page.locator('button:has-text("Save Address")').first();
    await saveAddressBtn.click();

    // Verify it updates and switches back to display mode showing Uttara
    await expect(page.locator('text=Saved Shipping Address').first()).toBeVisible();
    await expect(page.locator('text=Uttara').first()).toBeVisible();

    // Verify address is updated in MongoDB profile via API
    const checkAddressRes2 = await page.context().request.get('/api/user/shipping-address', {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const checkAddressJson2 = await checkAddressRes2.json();
    expect(checkAddressJson2.savedShippingAddress.address).toBe('House 20, Road 8, Sector 12, Uttara, Dhaka');

    // 8. Test recalculating shipping fee dynamically on zone change
    console.log('[TEST] Checking shipping fee recalculation on delivery zone change...');
    await editAddressBtn.click(); // Open edit mode
    
    // Change Shipping Zone to Outside Dhaka (৳150)
    await page.selectOption('select[name="shippingZone"]', 'outside_dhaka');
    
    // Verify delivery fee recalculated to ৳150
    await expect(page.locator('text=Delivery Charge').locator('..').locator('text=৳150').first()).toBeVisible();
    
    // Change back to Inside Dhaka (৳80)
    await page.selectOption('select[name="shippingZone"]', 'inside_dhaka');
    await expect(page.locator('text=Delivery Charge').locator('..').locator('text=৳80').first()).toBeVisible();

    // 9. Test Free Delivery Threshold system (subtotal >= 3000)
    console.log('[TEST] Checking Free Delivery Threshold (add more items)...');
    // Increase quantity in checkout summary if possible, or go back and add multiple items
    // Let's go to cart page and change item quantity to 3 (3 * 1490 = 4470 >= 3000)
    await page.goto('/');
    // Add product again (now total quantity = 2)
    await addCartBtn.click();
    await page.waitForTimeout(500);
    // Add product again (now total quantity = 3)
    await addCartBtn.click();
    await page.waitForTimeout(500);
    
    // Go to checkout
    await page.locator('button:has-text("Cart")').first().click();
    await checkoutBtn.click();

    // Verify shipping fee is Free Delivery
    await expect(page.locator('text=Delivery Charge').locator('..').locator('text=Free Delivery').first()).toBeVisible();

    // 10. Place Order #2
    const advanceOption2 = page.locator('text=25% Advance Payment').first();
    await advanceOption2.scrollIntoViewIfNeeded();
    await advanceOption2.click({ force: true });
    await page.fill('input[placeholder="Enter Transaction ID"]', 'TRX999999UTT');
    await page.fill('input[placeholder="01XXXXXXXXX"]', testPhone);
    
    console.log('[TEST] Placing Order #2...');
    const placeOrderBtn2 = page.locator('button:has-text("PLACE ORDER")').first();
    await placeOrderBtn2.click();
    await expect(page.locator('text=Order Placed Successfully!').first()).toBeVisible({ timeout: 10000 });

    // 11. Verify Order snapshot integrity (Order #1 still shows Mirpur, Order #2 shows Uttara)
    console.log('[TEST] Verifying order snapshots...');
    const ordersRes = await page.context().request.get(`/api/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const ordersJson = await ordersRes.json();
    expect(ordersJson.success).toBe(true);
    
    // Order #1 is the older order (second in returned array if sorted descending, or search by transactionId)
    const order1 = ordersJson.orders.find((o: any) => o.paymentDetails?.transactionId === 'TRX123456MIR');
    const order2 = ordersJson.orders.find((o: any) => o.paymentDetails?.transactionId === 'TRX999999UTT');
    
    expect(order1).toBeDefined();
    expect(order2).toBeDefined();
    expect(order1.shippingAddress.address).toContain('Mirpur-10');
    expect(order2.shippingAddress.address).toContain('Uttara');

    // 12. Security Verification: Different customer cannot query or modify this customer's saved address
    console.log('[TEST] Enforcing backend API security constraints...');
    
    // Register another customer
    const regRes2 = await page.context().request.post('/api/auth/register', {
      data: {
        name: `Different Cust`,
        email: `diff-${uniqueSuffix}@example.com`,
        password: testPassword,
        phone: `01899999999`
      }
    });
    const regJson2 = await regRes2.json();
    const token2 = regJson2.accessToken;

    // Fetch address with token2 (should yield token2's empty address, not customer 1's)
    const checkAddressRes3 = await page.context().request.get('/api/user/shipping-address', {
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    const checkAddressJson3 = await checkAddressRes3.json();
    expect(checkAddressJson3.success).toBe(true);
    // Mongoose schema initializes empty nested subdocs with default values, so verify fields are empty
    expect(checkAddressJson3.savedShippingAddress.address).toBe('');
  });
});
