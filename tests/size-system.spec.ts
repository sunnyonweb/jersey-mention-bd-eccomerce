import { test, expect } from '@playwright/test';

test.describe('Configurable Product Size Selection System', () => {
  let adminToken: string;
  let customerToken: string;
  let customerUserId: string;

  const testPassword = 'customer123';
  const adminEmail = 'admin@jerseymentionbd.com';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!';

  const uniqueSuffix = Date.now();
  const testEmail = `cust-size-${uniqueSuffix}@example.com`;
  const testPhone = '01711223344';

  test.beforeAll(async ({ request }) => {
    // 1. Authenticate as Admin
    console.log('[TEST] Authenticating as Admin...');
    const adminLoginRes = await request.post('/api/auth/login', {
      data: { email: adminEmail, password: adminPassword }
    });
    const adminLoginJson = await adminLoginRes.json();
    adminToken = adminLoginJson.accessToken;
    expect(adminToken).toBeTruthy();

    // 2. Register new Customer
    console.log('[TEST] Registering new customer...');
    const regRes = await request.post('/api/auth/register', {
      data: {
        name: 'Size Cust',
        email: testEmail,
        password: testPassword,
        phone: testPhone
      }
    });
    const regJson = await regRes.json();
    customerToken = regJson.accessToken;
    customerUserId = regJson.user.id;
    expect(customerToken).toBeTruthy();
  });

  test('should execute the entire size system E2E scenario successfully', async ({ page, request }) => {
    test.setTimeout(60000);
    const navigateToProduct = async (name: string) => {
      console.log(`[TEST] Navigating to product "${name}" client-side...`);
      // 1. Fill search input and press Enter
      const searchInput = page.locator('input[placeholder*="Search jerseys"]').first();
      await searchInput.fill(name);
      await searchInput.press('Enter');
      
      // 2. Click outside on the H1 title to close search focus overlay
      const h1Title = page.locator('h1:has-text("Search results for")').first();
      await expect(h1Title).toBeVisible({ timeout: 5000 });
      await h1Title.click();
      await page.waitForTimeout(500); // let overlay fade out
      
      // 3. Click on the product card container matching the specific name
      const productCard = page.locator('.grid >> .group', { hasText: name }).first();
      await expect(productCard).toBeVisible({ timeout: 5000 });
      await productCard.click();
    };

    // 1. Seed test products via Admin API
    console.log('[TEST] Seeding products with different size options...');
    
    // Product A: Jersey (Sizes S, M, L, XL, XXL, required)
    const seedJerseyRes = await request.post('/api/products', {
      data: {
        name: `E2E Test Jersey ${uniqueSuffix}`,
        price: 2000,
        categoryId: 'cat-player-edition',
        stock: 50,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        sizeOptions: {
          enabled: true,
          required: true,
          label: 'Select Jersey Size:',
          sizes: ['S', 'M', 'L', 'XL', 'XXL']
        }
      },
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const jerseyJson = await seedJerseyRes.json();
    const jerseyId = jerseyJson.product.id;
    const jerseySlug = jerseyJson.product.slug;
    expect(jerseyId).toBeTruthy();

    // Product B: Football (Sizes Size 3, Size 4, Size 5, optional)
    const seedFootballRes = await request.post('/api/products', {
      data: {
        name: `E2E Test Football ${uniqueSuffix}`,
        price: 1500,
        categoryId: 'cat-accessories',
        stock: 50,
        sizes: ['Size 3', 'Size 4', 'Size 5'],
        sizeOptions: {
          enabled: true,
          required: false,
          label: 'Select Football Size:',
          sizes: ['Size 3', 'Size 4', 'Size 5']
        }
      },
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const footballJson = await seedFootballRes.json();
    const footballId = footballJson.product.id;
    const footballSlug = footballJson.product.slug;
    expect(footballId).toBeTruthy();

    // Product C: Cap (Size selection disabled)
    const seedCapRes = await request.post('/api/products', {
      data: {
        name: `E2E Test Cap ${uniqueSuffix}`,
        price: 800,
        categoryId: 'cat-accessories',
        stock: 50,
        sizes: [],
        sizeOptions: {
          enabled: false,
          required: false,
          label: 'Select Size:',
          sizes: []
        }
      },
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const capJson = await seedCapRes.json();
    const capId = capJson.product.id;
    const capSlug = capJson.product.slug;
    expect(capId).toBeTruthy();

    // 2. Perform direct API security validation: Submit invalid size size options
    console.log('[TEST] Verifying API validation blocks invalid size selections...');
    
    // Fails because selection is required for Jersey, but none provided
    const failOrder1 = await request.post('/api/orders', {
      data: {
        items: [{ productId: jerseyId, quantity: 1 }], // missing size
        shippingAddress: { fullName: 'T', phone: '01812345678', address: 'M', city: 'D', district: 'D', zone: 'inside_dhaka' }
      },
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    expect(failOrder1.status()).toBe(400);

    // Fails because '5XL' is not a configured size for Jersey
    const failOrder2 = await request.post('/api/orders', {
      data: {
        items: [{ productId: jerseyId, quantity: 1, size: '5XL' }],
        shippingAddress: { fullName: 'T', phone: '01812345678', address: 'M', city: 'D', district: 'D', zone: 'inside_dhaka' }
      },
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    expect(failOrder2.status()).toBe(400);

    // 3. Log in customer on storefront browser context
    console.log('[TEST] Logging in customer programmatically via cookie...');
    await page.context().addCookies([{
      name: 'accessToken',
      value: customerToken,
      url: 'http://127.0.0.1:3000'
    }]);

    // Initial page load to seed cookie
    await page.goto('/');

    // 4. Test product A (Jersey - Required size selection)
    console.log('[TEST] Verifying product details for Jersey...');
    await navigateToProduct(jerseyJson.product.name);

    // Verify correct custom size label is displayed
    await expect(page.locator('text=Select Jersey Size:')).toBeVisible();

    // Try adding to cart without choosing a size -> should toast block
    await page.click('button:has-text("ADD TO SHOPPING CART")');
    await expect(page.locator('text=Please select a size before adding the product to cart')).toBeVisible();

    // Choose size XL and add to cart -> should work
    await page.click('button:text("XL")');
    await page.click('button:has-text("ADD TO SHOPPING CART")');
    await expect(page.locator('text=Added "')).toBeVisible();

    // 5. Test product B (Football - Optional size selection)
    console.log('[TEST] Verifying product details for Football (Optional)...');
    await navigateToProduct(footballJson.product.name);

    // Verify custom size label
    await expect(page.locator('text=Select Football Size:')).toBeVisible();

    // Add to cart directly without choosing size (since optional) -> should succeed
    await page.click('button:has-text("ADD TO SHOPPING CART")');
    await expect(page.locator('text=Added "')).toBeVisible();

    // 6. Test product C (Cap - Size selector disabled)
    console.log('[TEST] Verifying product details for Cap (Disabled)...');
    await navigateToProduct(capJson.product.name);

    // Size selector block should NOT be visible
    await expect(page.locator('text=Select Size:')).not.toBeVisible();
    await expect(page.locator('text=Select Football Size:')).not.toBeVisible();
    await expect(page.locator('text=Select Jersey Size:')).not.toBeVisible();

    // Add to cart -> should succeed
    await page.click('button:has-text("ADD TO SHOPPING CART")');
    await page.waitForTimeout(500);

    // 7. Verify items metadata inside the Cart Drawer
    console.log('[TEST] Checking cart drawer items...');
    await page.click('button:has-text("Cart")');
    
    // Jersey item should show XL size badge
    await expect(page.locator('.group', { hasText: jerseyJson.product.name }).locator('text=Size: XL')).toBeVisible();
    // Football & Cap items should NOT show any size badges (undefined)
    await expect(page.locator('.group', { hasText: footballJson.product.name }).locator('text=Size:')).not.toBeVisible();
    await expect(page.locator('.group', { hasText: capJson.product.name }).locator('text=Size:')).not.toBeVisible();

    // 8. Place order and verify database integrity
    console.log('[TEST] Placing checkout order...');
    await page.click('button:has-text("Proceed to Checkout")');
    
    // Fill shipping address
    await page.fill('input[name="fullName"]', 'Size User');
    await page.fill('input[name="phone"]', testPhone);
    await page.fill('textarea[name="address"]', 'Size Road 11, Banani');
    await page.fill('input[name="city"]', 'Dhaka');
    await page.fill('input[name="district"]', 'Dhaka');
    await page.fill('input[name="postalCode"]', '1205');
    await page.selectOption('select[name="shippingZone"]', 'inside_dhaka');

    // Select 25% Advance payment
    const advanceOption = page.locator('text=25% Advance Payment').first();
    await advanceOption.scrollIntoViewIfNeeded();
    await advanceOption.click({ force: true });
    await page.fill('input[placeholder="Enter Transaction ID"]', 'TRXSIZE1234');
    await page.fill('input[placeholder="01XXXXXXXXX"]', testPhone);

    // Place Order
    await page.click('button:has-text("PLACE ORDER")');
    await expect(page.locator('text=Order Placed Successfully!')).toBeVisible({ timeout: 10000 });

    // Verify sizes in DB order document
    console.log('[TEST] Verifying placed order items sizes in database...');
    const ordersRes = await request.get('/api/orders/my-orders', {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const ordersJson = await ordersRes.json();
    expect(ordersJson.success).toBe(true);
    
    const placedOrder = ordersJson.orders[0];
    expect(placedOrder).toBeTruthy();
    
    // Find Jersey item
    const jerseyItem = placedOrder.items.find((i: any) => i.productId === jerseyId);
    expect(jerseyItem.size).toBe('XL');

    // Find Football item
    const footballItem = placedOrder.items.find((i: any) => i.productId === footballId);
    expect(footballItem.size).toBeFalsy(); // Omitted/empty since selection was skipped

    // Find Cap item
    const capItem = placedOrder.items.find((i: any) => i.productId === capId);
    expect(capItem.size).toBeFalsy(); // Disabled/omitted

    // 9. Admin UI test: configure custom size for Football
    console.log('[TEST] Testing Admin UI sizes customization...');
    
    // Log out customer, log in as Admin programmatically via cookie
    await page.context().clearCookies();
    await page.context().addCookies([{
      name: 'accessToken',
      value: adminToken,
      url: 'http://127.0.0.1:3000'
    }]);

    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to Admin dashboard via profile dropdown
    await page.click('button:has-text("Profile")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Admin Dashboard")');
    await page.waitForTimeout(1000);

    // Open Products list page from sidebar
    await page.click('text=Products');
    await page.waitForTimeout(1000);

    // Edit football product
    const editBtn = page.locator(`tr:has-text("${footballJson.product.name}") >> button[title="Edit Product details"]`).first();
    await editBtn.click();

    // Scroll to PRODUCT SIZE OPTIONS section inside modal
    const sizeOptionsHeader = page.locator('text=Product Size Options');
    await sizeOptionsHeader.scrollIntoViewIfNeeded();

    // Verify initial values
    await expect(page.locator('input[placeholder="e.g. Select Jersey Size:"]')).toHaveValue('Select Football Size:');

    // Change Size label to "Pick Football Size:"
    await page.fill('input[placeholder="e.g. Select Jersey Size:"]', 'Pick Football Size:');

    // Add a custom size: "Official Size 5"
    await page.fill('input[placeholder="e.g. Size 5 or 3XL"]', 'Official Size 5');
    await page.click('button:has-text("Add Size")');

    // Save product details
    const saveBtn = page.locator('button:text("Save Catalog")').first();
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    // 10. Customer storefront updates verification
    console.log('[TEST] Verifying frontend customer page immediately displays custom sizes...');
    await navigateToProduct(footballJson.product.name);

    // Check updated custom size label
    await expect(page.locator('text=Pick Football Size:')).toBeVisible();

    // Check newly added size displays
    await expect(page.locator('button:text("Official Size 5")')).toBeVisible();
    console.log('[TEST] Configurable Size Selection System E2E flow tests passed successfully.');
  });
});
