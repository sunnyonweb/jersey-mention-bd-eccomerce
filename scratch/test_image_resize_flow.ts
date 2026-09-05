import { sanitizeHtml } from '../src/utils/sanitizeHtml';

const BASE_URL = 'http://localhost:3000';

async function testImageResizeFlow() {
  console.log('=== 1. TESTING IMAGE RESIZE HTML SANITIZATION & ATTRIBUTES ===\n');

  // Test 1: Custom width and alignment preservation
  const rawHtmlWithCustomImage = `
    <h2>Authentic 2026 Jersey</h2>
    <figure class="my-4 text-center" style="text-align: center;">
      <img 
        src="/images/products/brazil_2002.jpg" 
        alt="Jersey Fabric" 
        data-size-preset="custom"
        data-selected="true"
        style="display: block; margin: 1rem auto; width: 550px; max-width: 100%; height: auto; border-radius: 0.75rem; float: none;" 
      />
      <figcaption>Detailed close up</figcaption>
    </figure>
    <p>Breathable fabric.</p>
  `.trim();

  const sanitized = sanitizeHtml(rawHtmlWithCustomImage);
  console.log('Sanitized output HTML:\n', sanitized);

  // Checks
  if (sanitized.includes('data-selected')) {
    throw new Error('Edit artifact data-selected was not stripped!');
  }
  if (!sanitized.includes('width: 550px') && !sanitized.includes('width:550px')) {
    throw new Error('Custom width was not preserved!');
  }
  if (!sanitized.includes('max-width: 100%') && !sanitized.includes('max-width:100%')) {
    throw new Error('max-width: 100% responsive constraint was not preserved!');
  }
  if (!sanitized.includes('data-size-preset="custom"')) {
    throw new Error('data-size-preset attribute was not preserved!');
  }
  console.log('✓ Sanitizer safely preserved custom width, responsive max-width 100%, and stripped editor selection state.');

  // Test 2: Image with left alignment and small preset
  const rawHtmlLeft = `
    <figure style="text-align: left;">
      <img 
        src="/images/products/brazil_2002.jpg" 
        alt="Patch" 
        data-size-preset="small"
        style="display: inline-block; margin: 0.5rem 1.25rem 0.5rem 0; width: 240px; max-width: 100%; height: auto; float: left;" 
      />
    </figure>
  `.trim();
  const sanitizedLeft = sanitizeHtml(rawHtmlLeft);
  if (!sanitizedLeft.includes('width: 240px') && !sanitizedLeft.includes('width:240px')) {
    throw new Error('Small preset width was not preserved!');
  }
  if (!sanitizedLeft.includes('float: left') && !sanitizedLeft.includes('float:left')) {
    throw new Error('Left float alignment was not preserved!');
  }
  console.log('✓ Small preset (240px) and Left alignment preserved cleanly.');

  console.log('\n=== 2. TESTING BACKEND PERSISTENCE (CREATE, RETRIEVE, UPDATE) ===\n');

  // Admin login
  console.log('1. Admin logging in...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '01571305964', password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!' })
  });
  const loginData: any = await loginRes.json();
  if (!loginData.success) throw new Error('Admin login failed');
  const cookies = loginRes.headers.get('set-cookie');
  console.log('✓ Admin login successful');

  // Get categories
  const catRes = await fetch(`${BASE_URL}/api/categories`);
  const catData: any = await catRes.json();
  const category = catData.categories?.[0] || { id: 'cat-player-edition', name: 'Player Edition' };

  // Create Product with resized image in description
  console.log('\n2. Creating product with resized image (width 550px)...');
  const createRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      name: 'Resized Image Jersey Test',
      slug: 'resized-image-jersey-test',
      sku: 'IMG-RESIZE-01',
      price: 1950,
      stock: 20,
      categoryId: category.id,
      categoryName: category.name,
      shortDescription: 'Jersey with resized specifications image.',
      description: rawHtmlWithCustomImage,
      images: ['/images/products/brazil_2002.jpg'],
      status: 'active'
    })
  });
  const createData: any = await createRes.json();
  if (!createData.success || !createData.product) {
    throw new Error('Create product failed: ' + JSON.stringify(createData));
  }
  const created = createData.product;
  console.log(`✓ Product created! ID: ${created.id}`);

  // Check saved description
  if (!created.description.includes('width: 550px') && !created.description.includes('width:550px')) {
    throw new Error('Saved product description lost custom image width!');
  }

  // Update Product with new width (650px) and right alignment
  console.log('\n3. Updating product with new image size (650px, right align)...');
  const updatedHtml = rawHtmlWithCustomImage
    .replace('width: 550px', 'width: 650px')
    .replace('float: none', 'float: right')
    .replace('margin: 1rem auto', 'margin: 0.5rem 0 0.5rem 1.25rem');

  const updateRes = await fetch(`${BASE_URL}/api/products/${created.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies || ''
    },
    body: JSON.stringify({
      ...created,
      description: updatedHtml
    })
  });
  const updateData: any = await updateRes.json();
  if (!updateData.success || !updateData.product) {
    throw new Error('Update product failed: ' + JSON.stringify(updateData));
  }
  const updated = updateData.product;
  console.log('✓ Product updated!');
  if (!updated.description.includes('width: 650px') && !updated.description.includes('width:650px')) {
    throw new Error('Updated width not saved!');
  }
  if (!updated.description.includes('float: right') && !updated.description.includes('float:right')) {
    throw new Error('Updated alignment not saved!');
  }

  // Clean up
  console.log('\n4. Cleaning up test product...');
  const delRes = await fetch(`${BASE_URL}/api/products/${created.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookies || '' }
  });
  const delData: any = await delRes.json();
  if (!delData.success) throw new Error('Delete failed');
  console.log('✓ Test product deleted successfully.');

  console.log('\n=== ALL IMAGE RESIZE & PERSISTENCE TESTS PASSED ===');
}

testImageResizeFlow().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
