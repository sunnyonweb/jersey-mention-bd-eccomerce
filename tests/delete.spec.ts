import { test, expect } from '@playwright/test';

test.describe('Jersey Mention BD Admin Product Deletion Flow', () => {

  test('should delete product and not crash/go blank', async ({ page }) => {
    // Collect browser console messages and errors
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.log(`[BROWSER PAGEERROR] ${err.message}\nStack:\n${err.stack}`);
    });
    page.on('request', req => {
      if (req.url().includes('/api/')) {
        console.log(`[API REQUEST] ${req.method()} ${req.url()}`);
      }
    });
    page.on('response', res => {
      if (res.url().includes('/api/')) {
        console.log(`[API RESPONSE] ${res.status()} ${res.url()}`);
      }
    });

    // 1. Authenticate programmatically to get token and set cookies
    console.log('[TEST] Authenticating programmatically...');
    const loginRes = await page.context().request.post('/api/auth/login', {
      data: {
        email: 'admin@jerseymentionbd.com',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!'
      }
    });
    const loginJson = await loginRes.json();
    console.log(`[TEST] Login result: ${JSON.stringify(loginJson)}`);
    expect(loginJson.success).toBe(true);

    await page.context().addCookies([{
      name: 'accessToken',
      value: loginJson.accessToken,
      url: 'http://127.0.0.1:3000'
    }]);

    // 2. Programmatically create a product to ensure we have one to delete
    const uniqueId = Date.now().toString();
    const productName = `Test Product Delete ${uniqueId}`;
    const productSku = `TEST-DEL-${uniqueId}`;

    console.log(`[TEST] Programmatically creating test product: ${productName} (${productSku})`);
    const createResponse = await page.context().request.post('/api/products', {
      data: {
        name: productName,
        price: 1490,
        categoryId: 'cat-player-edition',
        sku: productSku,
        stock: 10
      }
    });
    const createResult = await createResponse.json();
    console.log(`[TEST] Product creation result: ${JSON.stringify(createResult)}`);
    expect(createResult.success).toBe(true);

    // Wait a brief moment to let Vite file watcher settle on the fallback file change
    console.log('[TEST] Waiting 2s for Vite file watcher...');
    await page.waitForTimeout(2000);

    // 3. Navigate to application homepage (already authenticated!)
    console.log('[TEST] Navigating to page...');
    await page.goto('/');

    // 4. Open Admin Control Panel
    const adminLink = page.locator('button:has-text("Admin Control Panel")').first();
    await adminLink.click();

    // Verify we are logged in as Admin in the Dashboard
    await expect(page.locator('text=Super Admin').first()).toBeVisible();

    // 5. Navigate to Products tab
    const productsTab = page.locator('button:has-text("Products")').first();
    await productsTab.click();

    // Confirm that the products list is loaded and visible
    await expect(page.locator('input[placeholder="Search by jersey name, SKU..."]').first()).toBeVisible();

    // Search for our test product
    const searchInput = page.locator('input[placeholder="Search by jersey name, SKU..."]').first();
    await searchInput.fill(productSku);
    
    // Verify it is visible in the list
    await expect(page.locator(`text=${productName}`).first()).toBeVisible();

    // 6. Handle delete dialog and click Delete
    page.once('dialog', async dialog => {
      console.log(`[DIALOG MESSAGE] ${dialog.message()}`);
      await dialog.accept();
    });

    const deleteBtn = page.locator('button[title="Delete permanently"]').first();
    await deleteBtn.click();

    // 7. Wait to see if any console errors occur, or if page goes blank
    console.log('[TEST] Clicked delete and accepted dialog. Waiting 5s to observe UI state...');
    await page.waitForTimeout(5000);

    // Let's print current URL
    console.log(`[TEST] Current URL: ${page.url()}`);

    // Under Vite dev server, updating the fallback json file triggers a hot reload
    // which resets the active tab back to the default "dashboard" section.
    // If that happens, click back to "Products" tab to check deletion.
    const productsTabBtn = page.locator('button:has-text("Products")').first();
    const isSearchInputVisible = await page.locator('input[placeholder="Search by jersey name, SKU..."]').first().isVisible();
    
    if (!isSearchInputVisible) {
      console.log('[TEST] Search input not visible (due to HMR reload). Clicking Products tab...');
      await productsTabBtn.click();
    }

    // Verify if the products list/header is still visible (should not crash/go blank)
    const isHeaderVisible = await page.locator('input[placeholder="Search by jersey name, SKU..."]').first().isVisible();
    console.log(`[TEST] Search input visible: ${isHeaderVisible}`);
    expect(isHeaderVisible).toBe(true);

    // Search for our test product again to verify it is gone
    const searchInput2 = page.locator('input[placeholder="Search by jersey name, SKU..."]').first();
    await searchInput2.fill(productSku);

    // Verify test product is no longer displayed
    await expect(page.locator(`text=${productName}`).first()).not.toBeVisible();
  });

});
