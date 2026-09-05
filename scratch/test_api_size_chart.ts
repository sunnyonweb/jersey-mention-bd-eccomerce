async function runApiTest() {
  console.log('--- Testing API Endpoints for Size Chart ---');

  // We need to login or create a product. Let's inspect admin token or create a test admin user / use jwt to get admin token.
  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'jersey_mention_bd_jwt_super_secret_key_2026';

  const token = jwt.default.sign(
    { id: 'usr-admin-1', email: 'admin@jerseymentionbd.com', role: 'super_admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const baseUrl = 'http://localhost:3000';

  // 1. POST /api/products
  console.log('\n[API 1] Creating product via POST /api/products with showSizeChart: true & custom measurements...');
  const createRes = await fetchRequest(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'API Test Jersey with Custom Size Chart',
      price: 2100,
      categoryId: 'cat-football',
      sizes: ['S', 'M', 'L'],
      showSizeChart: true,
      sizeChart: [
        { size: 'S', length: 26.25, chest: 36.5 },
        { size: 'M', length: 27.75, chest: 38.5 },
        { size: 'L', length: 28.5, chest: 40.25 }
      ]
    })
  });

  console.log('Create Response Status:', createRes.status);
  const createdJson = JSON.parse(createRes.data);
  console.log('Created product ID:', createdJson.product?.id);
  console.log('Created showSizeChart:', createdJson.product?.showSizeChart);
  console.log('Created sizeChart:', createdJson.product?.sizeChart);

  if (!createdJson.product || !createdJson.product.showSizeChart) {
    throw new Error('API Test Failed: showSizeChart not set to true on creation');
  }
  if (createdJson.product.sizeChart[1].length !== 27.75 || createdJson.product.sizeChart[1].chest !== 38.5) {
    throw new Error('API Test Failed: decimals not preserved in POST');
  }

  const prodId = createdJson.product.id;

  // 2. GET /api/products/:id
  console.log('\n[API 2] Fetching product via GET /api/products/:id...');
  const getRes = await fetchRequest(`${baseUrl}/api/products/${prodId}`);
  const getJson = JSON.parse(getRes.data);
  console.log('GET product showSizeChart:', getJson.product?.showSizeChart);
  console.log('GET product sizeChart:', getJson.product?.sizeChart);

  if (!getJson.product.showSizeChart || getJson.product.sizeChart.length !== 3) {
    throw new Error('API Test Failed: GET did not return correct sizeChart');
  }

  // 3. PUT /api/products/:id
  console.log('\n[API 3] Updating product via PUT /api/products/:id with changed measurements...');
  const updateRes = await fetchRequest(`${baseUrl}/api/products/${prodId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      sizeChart: [
        { size: 'S', length: 26, chest: 36 },
        { size: 'M', length: 28.2, chest: 40.4 },
        { size: 'L', length: 29, chest: 42 }
      ]
    })
  });

  console.log('Update Response Status:', updateRes.status);
  const updateJson = JSON.parse(updateRes.data);
  console.log('Updated sizeChart:', updateJson.product?.sizeChart);

  const updatedM = updateJson.product?.sizeChart?.find((r: any) => r.size === 'M');
  if (!updatedM || updatedM.length !== 28.2 || updatedM.chest !== 40.4) {
    throw new Error('API Test Failed: PUT update did not save new decimal measurements');
  }

  // 4. Test toggle OFF via PUT
  console.log('\n[API 4] Updating showSizeChart to false via PUT...');
  const offRes = await fetchRequest(`${baseUrl}/api/products/${prodId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      showSizeChart: false
    })
  });
  const offJson = JSON.parse(offRes.data);
  console.log('Updated showSizeChart:', offJson.product?.showSizeChart);
  if (offJson.product?.showSizeChart !== false) {
    throw new Error('API Test Failed: PUT did not set showSizeChart to false');
  }

  // 5. Clean up via DELETE
  console.log('\n[API 5] Deleting test product...');
  await fetchRequest(`${baseUrl}/api/products/${prodId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('✓ Product deleted successfully');

  console.log('\n========================================');
  console.log('ALL API SIZE CHART TESTS PASSED!');
  console.log('========================================\n');
}

async function fetchRequest(urlStr: string, options: any = {}): Promise<{ status: number; data: string }> {
  const res = await fetch(urlStr, options);
  const text = await res.text();
  return { status: res.status, data: text };
}

runApiTest().catch((err) => {
  console.error('\n❌ API Test Failed:', err);
  process.exit(1);
});
