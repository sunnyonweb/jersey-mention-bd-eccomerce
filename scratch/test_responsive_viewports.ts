import { chromium } from '@playwright/test';

const TARGET_VIEWPORTS = [
  { width: 1300, height: 900, name: 'Desktop (1300px) - Should be object-cover' },
  { width: 1200, height: 800, name: 'Small Desktop (1200px) - Should be object-contain' },
  { width: 1024, height: 768, name: 'Tablet Landscape (1024px)' },
  { width: 900, height: 700, name: 'Small Laptop / Tablet (900px)' },
  { width: 768, height: 1024, name: 'Tablet Portrait (768px)' },
  { width: 600, height: 900, name: 'Phablet (600px)' },
  { width: 480, height: 850, name: 'Mobile Large (480px)' },
  { width: 414, height: 896, name: 'Mobile Max (414px)' },
  { width: 390, height: 844, name: 'iPhone 12/13/14 (390px)' },
  { width: 375, height: 667, name: 'iPhone SE (375px)' },
  { width: 360, height: 740, name: 'Android Standard (360px)' },
  { width: 320, height: 568, name: 'Small Mobile (320px)' },
];

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing Home Page and Product Cards across all target viewports...\n');

  for (const vp of TARGET_VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const results = await page.evaluate((width) => {
      // Check horizontal overflow
      const docWidth = document.documentElement.scrollWidth;
      const windowWidth = window.innerWidth;
      const hasHorizontalOverflow = docWidth > windowWidth;

      // Find product card images
      const images = Array.from(document.querySelectorAll('.product-image-container img')) as HTMLImageElement[];
      
      const imgStats = images.slice(0, 5).map(img => {
        const style = window.getComputedStyle(img);
        const rect = img.getBoundingClientRect();
        return {
          src: img.src.substring(img.src.lastIndexOf('/') + 1),
          objectFit: style.objectFit,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        };
      });

      return {
        hasHorizontalOverflow,
        docWidth,
        windowWidth,
        imageCount: images.length,
        imgStats
      };
    }, vp.width);

    const firstImg = results.imgStats[0];
    const expectedFit = vp.width >= 1220 ? 'cover' : 'contain';
    const fitPass = firstImg ? firstImg.objectFit === expectedFit : false;
    const overflowPass = !results.hasHorizontalOverflow;

    console.log(`[Viewport: ${vp.width}px x ${vp.height}px] (${vp.name})`);
    console.log(`  - Horizontal Overflow: ${results.hasHorizontalOverflow ? 'FAIL (overflow detected)' : 'PASS (No overflow)'}`);
    console.log(`  - Found ${results.imageCount} product images`);
    if (firstImg) {
      console.log(`  - First Product Image: ${firstImg.src}`);
      console.log(`  - Computed object-fit: "${firstImg.objectFit}" (Expected: "${expectedFit}") -> ${fitPass ? 'PASS' : 'FAIL'}`);
      console.log(`  - Rendered Dimensions: ${firstImg.width}px x ${firstImg.height}px`);
    }
    console.log('---');
  }

  // Now test Product Detail Page on mobile & desktop
  console.log('\nTesting Product Detail Page responsive image...\n');
  for (const w of [1300, 768, 375]) {
    await page.setViewportSize({ width: w, height: 800 });
    // Click first product card to navigate to detail
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const card = page.locator('.product-image-container').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(1000);

      const detailStats = await page.evaluate((width) => {
        const detailImg = document.querySelector('.product-image-container img') as HTMLImageElement;
        if (!detailImg) return null;
        const style = window.getComputedStyle(detailImg);
        const rect = detailImg.getBoundingClientRect();
        return {
          objectFit: style.objectFit,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      }, w);

      const expectedFit = w >= 1220 ? 'cover' : 'contain';
      console.log(`[Product Detail Page @ ${w}px]:`);
      if (detailStats) {
        console.log(`  - Computed object-fit: "${detailStats.objectFit}" (Expected: "${expectedFit}") -> ${detailStats.objectFit === expectedFit ? 'PASS' : 'FAIL'}`);
        console.log(`  - Rendered: ${detailStats.width}px x ${detailStats.height}px`);
      } else {
        console.log('  - Detail image element not found.');
      }
    }
  }

  await browser.close();
  console.log('\nAll responsive verification checks completed!');
}

runTests().catch(console.error);
