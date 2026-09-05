import { chromium } from '@playwright/test';

async function main() {
  console.log('[AUTO-BROWSER] Launching headed Chromium browser...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  console.log('[AUTO-BROWSER] Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  console.log('[AUTO-BROWSER] Successfully opened http://localhost:3000!');
  console.log('[AUTO-BROWSER] Keeping browser window open. Close it when you are done.');
  
  // Wait indefinitely
  await new Promise(() => {});
}

main().catch(err => {
  console.error('[AUTO-BROWSER] Error:', err);
});
