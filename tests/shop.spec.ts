import { test, expect } from '@playwright/test';

test.describe('Jersey Mention BD E2E Checkout Flow', () => {

  test('should go through the entire purchase and invoice download flow successfully', async ({ page }) => {
    // 1. Authenticate programmatically to get cookies
    console.log('[TEST] Authenticating programmatically...');
    const loginRes = await page.context().request.post('/api/auth/login', {
      data: {
        email: 'admin@jerseymentionbd.com',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!'
      }
    });
    const loginJson = await loginRes.json();
    expect(loginJson.success).toBe(true);

    await page.context().addCookies([{
      name: 'accessToken',
      value: loginJson.accessToken,
      url: 'http://127.0.0.1:3000'
    }]);

    // 2. Programmatically seed catalog products
    console.log('[TEST] Programmatically seeding shop products...');
    const prod1Res = await page.context().request.post('/api/products', {
      data: {
        name: 'Bangladesh National Football Team Official Home Jersey 2026',
        price: 1850,
        salePrice: 1490,
        categoryId: 'cat-player-edition',
        sku: 'JM-BD-2201',
        stock: 50,
        isFlashSale: true,
        featured: true,
        isTrending: true,
        isNewArrival: true,
        homepageSections: ['limited_time_deals', 'trending_sports_match_gear']
      }
    });
    await prod1Res.json();

    const prod2Res = await page.context().request.post('/api/products', {
      data: {
        name: 'Real Madrid CF Home Player Edition Jersey 2025/26',
        price: 1850,
        salePrice: 1490,
        categoryId: 'cat-player-edition',
        sku: 'JM-RM-1102',
        stock: 50,
        isFlashSale: true,
        featured: true,
        isTrending: true,
        isNewArrival: true,
        homepageSections: ['limited_time_deals', 'trending_sports_match_gear']
      }
    });
    await prod2Res.json();

    // Wait a brief moment to let Vite file watcher settle on the fallback file change
    console.log('[TEST] Waiting 2s for Vite file watcher...');
    await page.waitForTimeout(2000);

    // 3. Navigate to local application
    console.log('[TEST] Navigating to page...');
    await page.goto('/');

    // Verify homepage loads successfully
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('text=JERSEY').first()).toBeVisible();
    await expect(page.locator('text=MENTION').first()).toBeVisible();

    // 2. Open cart drawer initially and verify it is empty
    await page.locator('button:has-text("Cart")').first().click();
    await expect(page.locator('text=Your Cart is Empty').first()).toBeVisible();

    // Close the cart drawer
    await page.locator('button:has(.lucide-x)').first().click();

    // 3. Add first product from Flash Sale to Cart
    const addCartButton = page.locator('button[title="Add to Cart"]').first();
    await expect(addCartButton).toBeVisible();
    await addCartButton.click();

    // Wait for the cart badge to update to 1 to ensure React state has settled
    await expect(page.locator('button:has-text("Cart")').locator('text=1').first()).toBeVisible();

    // 4. Open the cart drawer and check redesigned layout
    await page.locator('button:has-text("Cart")').first().click();

    // Verify the product item is in the cart drawer
    await expect(page.locator('text=Bangladesh National Football Team').first()).toBeVisible();

    // Verify Free Shipping progress indicator is visible
    await expect(page.locator('text=/Threshold:\\s*৳\\s*3[.,]?000/').first()).toBeVisible();

    // 5. Test Coupon Code application
    const couponInput = page.locator('input[placeholder="ENTER COUPON CODE"]').first();
    await expect(couponInput).toBeVisible();
    await couponInput.fill('JERSEYBD100');

    const applyCouponBtn = page.locator('button:has-text("Apply")').first();
    await applyCouponBtn.click();

    // Verify coupon activation alert is displayed
    await expect(page.locator('text=Coupon "JERSEYBD100" Activated').first()).toBeVisible({ timeout: 5000 });

    // 6. Proceed to Checkout
    const checkoutBtn = page.locator('button:has-text("PROCEED TO CHECKOUT")').first();
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // 7. Verify Checkout Page loads
    await expect(page.locator('text=1. Delivery Shipping Information').first()).toBeVisible();

    // Fill out shipping address information
    await page.fill('input[name="fullName"]', 'Tanvir Ahmed');
    await page.fill('input[name="phone"]', '01812345678');
    await page.fill('input[name="email"]', 'customer@jerseymention.bd');
    await page.fill('textarea[name="address"]', 'House 12, Road 4, Sector 7, Uttara, Dhaka');

    // 8. Verify Payment Options (25% or 100% advance)
    await expect(page.locator('text=2. Select Advance Payment Option').first()).toBeVisible();
    await expect(page.locator('text=25% Advance Payment').first()).toBeVisible();
    await expect(page.locator('text=100% Advance Payment').first()).toBeVisible();

    // Select 25% Advance Payment
    const paymentOption = page.locator('text=25% Advance Payment').first();
    await paymentOption.scrollIntoViewIfNeeded();
    await paymentOption.click({ force: true });

    // 9. Confirm and Submit Order
    const placeOrderBtn = page.locator('button:has-text("PLACE ORDER (CASH ON DELIVERY)")').first();
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // 10. Verify Order Tracking Page loads & Success Banner shows up
    await expect(page.locator('text=Order Placed Successfully!').first()).toBeVisible({ timeout: 10000 });

    // 11. Open Invoice Modal
    const viewInvoiceBtn = page.locator('button:has-text("View Official Invoice")').first();
    await expect(viewInvoiceBtn).toBeVisible();
    await viewInvoiceBtn.click();

    // 12. Verify Invoice Details
    await expect(page.locator('text=Official Order Invoice').first()).toBeVisible();
    await expect(page.locator('text=JERSEY MENTION BD').first()).toBeVisible();
    await expect(page.locator('text=Billed to').first()).toBeVisible();
    await expect(page.locator('text=Tanvir Ahmed').first()).toBeVisible();
    await expect(page.locator('text=Payment Status:').first()).toBeVisible();
    await expect(page.locator('button:has-text("Print or Download PDF")').first()).toBeVisible();

    // Close the invoice modal
    await page.click('button:has-text("Close Invoice")');
    await expect(page.locator('text=Official Order Invoice').first()).not.toBeVisible();
  });

  test('should allow admin to edit customization prices independently', async ({ page }) => {
    // 1. Authenticate programmatically to get cookies
    console.log('[TEST] Authenticating as Admin...');
    const loginRes = await page.context().request.post('/api/auth/login', {
      data: {
        email: 'admin@jerseymentionbd.com',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!'
      }
    });
    const loginJson = await loginRes.json();
    expect(loginJson.success).toBe(true);

    await page.context().addCookies([{
      name: 'accessToken',
      value: loginJson.accessToken,
      url: 'http://127.0.0.1:3000'
    }]);

    // 2. Go to homepage
    await page.goto('/');

    // 3. Open Admin Control Panel
    const adminLink = page.locator('button:has-text("Admin Control Panel")').first();
    await adminLink.click();

    // Verify we are logged in as Admin in the Dashboard
    await expect(page.locator('text=Super Admin').first()).toBeVisible();

    // 4. Click Customization Pricing under Store Settings
    const storeSettingsBtn = page.locator('button:has-text("Store Settings")').first();
    const isCustomizationPricingVisible = await page.locator('button:has-text("Customization Pricing")').first().isVisible();
    if (!isCustomizationPricingVisible) {
      await storeSettingsBtn.click();
    }

    const customizationPricingBtn = page.locator('button:has-text("Customization Pricing")').first();
    await expect(customizationPricingBtn).toBeVisible();
    await customizationPricingBtn.click();

    // 5. Verify the heading loads
    await expect(page.locator('h2:has-text("PRODUCT CUSTOMIZATION PRICING")').first()).toBeVisible();

    // 6. Locate prices and change them
    const patchPriceInput = page.locator('input[name="patchPrice"]').first();
    await expect(patchPriceInput).toBeVisible();
    await patchPriceInput.fill('150');

    // Click Save on Sleeve/Badge Price
    const savePatchBtn = page.locator('form:has(input[name="patchPrice"]) button:has-text("Save")').first();
    await savePatchBtn.click();

    // Verify Success Toast
    await expect(page.locator('text=Store settings saved successfully').first()).toBeVisible();

    // Change Squad Print Price
    const nameNumberPriceInput = page.locator('input[name="customNameNumberPrice"]').first();
    await expect(nameNumberPriceInput).toBeVisible();
    await nameNumberPriceInput.fill('300');

    // Click Save on Custom Squad Print Price
    const saveNameNumberBtn = page.locator('form:has(input[name="customNameNumberPrice"]) button:has-text("Save")').first();
    await saveNameNumberBtn.click();

    // Verify Success Toast
    await expect(page.locator('text=Store settings saved successfully').first()).toBeVisible();
  });

});
