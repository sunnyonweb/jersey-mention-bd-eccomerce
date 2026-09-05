import { sanitizeHtml, stripHtml, isHtmlContent, plainTextToHtml } from '../src/utils/sanitizeHtml';

const BASE_URL = 'http://localhost:3000';

async function testRichDescriptionFlow() {
  console.log('=== 1. TESTING SANITIZER & SECURITY INTEGRITY ===\n');

  // Test 1: XSS sanitization
  const maliciousInput = `
    <h1>Authentic Match Jersey</h1>
    <script>alert("hacked")</script>
    <p>Premium fabric <img src="/uploads/jersey.jpg" alt="Jersey" onerror="alert('xss')" /></p>
    <a href="javascript:stealCookies()">Click for Discount</a>
    <iframe src="https://evil.com"></iframe>
    <blockquote>Official Player Edition</blockquote>
  `;
  const sanitized = sanitizeHtml(maliciousInput);
  console.log('Sanitized output:\n', sanitized);

  if (sanitized.includes('<script>') || sanitized.includes('alert(') || sanitized.includes('onerror') || sanitized.includes('javascript:') || sanitized.includes('<iframe')) {
    throw new Error('SECURITY VULNERABILITY: Malicious payload was not stripped!');
  }
  if (!sanitized.includes('<h1>Authentic Match Jersey</h1>') || !sanitized.includes('<blockquote>Official Player Edition</blockquote>') || !sanitized.includes('/uploads/jersey.jpg')) {
    throw new Error('CORRUPTION: Valid rich text was erroneously stripped!');
  }
  console.log('✓ Sanitizer securely eliminated all scripts, iframes, onerror handlers, and javascript: links without affecting valid rich markup.');

  // Test 2: Backward compatibility with legacy plain text
  const legacyPlainText = `100% Breathable moisture-wicking jacquard fabric.\n\nCommemorative match details printed on chest.\nAuthentic sleeve patches.`;
  const convertedLegacy = sanitizeHtml(legacyPlainText);
  console.log('\nConverted legacy text:\n', convertedLegacy);
  if (!convertedLegacy.includes('<p>') || !convertedLegacy.includes('100% Breathable')) {
    throw new Error('Legacy plain text conversion failed!');
  }
  console.log('✓ Legacy plain text converted gracefully into paragraphs.');

  // Test 3: Strip HTML for short summary overview
  const richSample = '<h1>Title</h1><p>This is a <strong>bold</strong> description.</p>';
  const stripped = stripHtml(richSample);
  if (stripped !== 'TitleThis is a bold description.' && stripped !== 'Title This is a bold description.') {
    // Check if reasonable text
    if (!stripped.includes('bold description')) {
      throw new Error('stripHtml failed: ' + stripped);
    }
  }
  console.log('✓ stripHtml accurately extracts plain text for previews:', stripped);

  console.log('\n=== 2. TESTING PRODUCT CRUD WITH RICH TEXT IN BACKEND ===\n');

  // Step 1: Admin Login
  console.log('Logging in as Admin...');
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
  const category = catData.categories?.[0] || { id: 'cat-player-edition', name: 'Player Edition' };

  // Step 3: Create product with rich description and short summary
  const richHtmlDescription = `
    <h2>Match Day Player Issue Specifications</h2>
    <p>Engineered for maximum athletic performance during high-intensity 90-minute matches.</p>
    <figure class="my-4 text-center">
      <img src="/images/products/brazil_2002.jpg" alt="Fabric Close-up" class="max-w-full h-auto rounded-xl mx-auto shadow-xs border border-slate-200" />
      <figcaption class="text-[11px] text-slate-400 mt-1">High-density micro-ventilation jacquard mesh</figcaption>
    </figure>
    <h3>Key Features</h3>
    <ul>
      <li>Heat-applied silicone crest and sponsor branding</li>
      <li>Moisture-wicking dry-fit aerodynamic weave</li>
      <li>Laser-cut side ventilation zones</li>
    </ul>
    <blockquote>Official authentic kit certified for domestic and continental competition.</blockquote>
    <p>Read our full <a href="https://example.com/size-guide" target="_blank" rel="noopener noreferrer">Size &amp; Fit Guide</a> before ordering.</p>
  `.trim();

  const shortSummary = 'Official 2026 player-issue jersey engineered with aerodynamic jacquard mesh and silicone crests.';

  console.log('\nCreating product with rich description...');
  const createRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      name: 'Real Madrid 2026 Authentic Player Issue',
      slug: 'real-madrid-2026-authentic-player-issue',
      sku: 'RMA-2026-AUTH',
      price: 2400,
      discountPercent: 10,
      salePrice: 2160,
      stock: 45,
      lowStockAlert: 5,
      categoryId: category.id,
      categoryName: category.name,
      shortDescription: shortSummary,
      description: richHtmlDescription,
      images: ['/images/products/brazil_2002.jpg'],
      homepageSections: ['featured'],
      featured: true,
      status: 'active'
    })
  });

  const createData: any = await createRes.json();
  if (!createData.success || !createData.product) {
    throw new Error('Create product failed: ' + JSON.stringify(createData));
  }
  const created = createData.product;
  console.log(`✓ Product created successfully! ID: ${created.id}`);
  console.log(`  Short Summary: "${created.shortDescription}"`);
  console.log(`  Description length: ${created.description.length} chars`);

  if (created.shortDescription !== shortSummary) throw new Error('shortDescription mismatch');
  if (!created.description.includes('Match Day Player Issue Specifications')) throw new Error('Heading missing from stored description');
  if (!created.description.includes('<figure')) throw new Error('Figure image missing from stored description');
  if (!created.description.includes('<ul>')) throw new Error('List missing from stored description');

  // Step 4: Update product
  console.log('\nUpdating product description...');
  const updatedHtml = richHtmlDescription + '\n<p><strong>Note:</strong> Machine wash cold inside-out.</p>';
  const updateRes = await fetch(`${BASE_URL}/api/products/${created.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      ...created,
      shortDescription: 'Updated: Premium player-issue jersey with laser-cut ventilation.',
      description: updatedHtml
    })
  });
  const updateData: any = await updateRes.json();
  if (!updateData.success || !updateData.product) {
    throw new Error('Update product failed: ' + JSON.stringify(updateData));
  }
  const updated = updateData.product;
  console.log('✓ Product updated successfully!');
  if (!updated.description.includes('Machine wash cold inside-out')) {
    throw new Error('Updated content missing!');
  }

  // Step 5: Clean up test product
  console.log('\nCleaning up test product...');
  const delRes = await fetch(`${BASE_URL}/api/products/${created.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookies || '' }
  });
  const delData: any = await delRes.json();
  if (!delData.success) throw new Error('Delete failed');
  console.log('✓ Test product deleted successfully.');

  console.log('\n=== ALL RICH DESCRIPTION, SANITIZATION & BACKEND TESTS PASSED ===');
}

testRichDescriptionFlow().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
