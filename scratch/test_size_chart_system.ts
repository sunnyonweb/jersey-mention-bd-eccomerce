import mongoose from 'mongoose';
import { ProductModel } from '../server/mongodb';
import { getProductSizeChart, isProductSizeChartEnabled, syncSizeChartWithSizes } from '../src/utils/productUtils';
import { Product } from '../src/types';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jersey_mention_bd';

async function testSuite() {
  console.log('--- Starting Size Options & Size Chart Test Suite ---');
  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  const testProdId = `test-sizechart-${Date.now()}`;

  try {
    // TEST 1: Create product with showSizeChart: false
    console.log('\n[Test 1] Create product with showSizeChart: false');
    const prod1Data: any = {
      id: testProdId,
      name: 'Test Jersey Size Chart OFF',
      slug: `test-jersey-${Date.now()}`,
      sku: `TEST-${Date.now().toString().slice(-5)}`,
      price: 1500,
      categoryId: 'cat-football',
      categoryName: 'Football',
      sizes: ['S', 'M', 'L', 'XL'],
      showSizeChart: false,
      sizeChart: [
        { size: 'S', length: 26, chest: 36 },
        { size: 'M', length: 27, chest: 38 },
        { size: 'L', length: 28, chest: 40 },
        { size: 'XL', length: 29, chest: 42 }
      ],
      sizeOptions: {
        enabled: true,
        required: true,
        label: 'Select Size:',
        sizes: ['S', 'M', 'L', 'XL'],
        showSizeChart: false,
        sizeChart: [
          { size: 'S', length: 26, chest: 36 },
          { size: 'M', length: 27, chest: 38 },
          { size: 'L', length: 28, chest: 40 },
          { size: 'XL', length: 29, chest: 42 }
        ]
      },
      createdAt: new Date().toISOString()
    };

    const createdProd = await ProductModel.create(prod1Data);
    console.log('✓ Product created with showSizeChart =', createdProd.showSizeChart);

    // Verify helper on created product
    const isChartEnabled1 = isProductSizeChartEnabled(createdProd.toObject() as any);
    console.log('✓ isProductSizeChartEnabled(prod1):', isChartEnabled1, '(Expected: false)');
    if (isChartEnabled1 !== false) {
      throw new Error('Test 1 Failed: showSizeChart should be false!');
    }
    const chartRows1 = getProductSizeChart(createdProd.toObject() as any);
    console.log('✓ getProductSizeChart when OFF returns:', chartRows1.length, 'rows (Expected: 0 rows)');
    if (chartRows1.length !== 0) {
      throw new Error('Test 1 Failed: chart should be empty/hidden when showSizeChart is false!');
    }

    // TEST 2: Update product with showSizeChart: true and custom decimal values
    console.log('\n[Test 2] Update product with showSizeChart: true & custom Chest/Length values');
    const customChart = [
      { size: 'S', length: 26.5, chest: 36.5 },
      { size: 'M', length: 27.5, chest: 38.5 },
      { size: 'L', length: 28.5, chest: 40.5 },
      { size: 'XL', length: 29.5, chest: 42.5 }
    ];

    await ProductModel.updateOne(
      { id: testProdId },
      {
        $set: {
          showSizeChart: true,
          sizeChart: customChart,
          'sizeOptions.showSizeChart': true,
          'sizeOptions.sizeChart': customChart
        }
      }
    );

    const fetchedProd = await ProductModel.findOne({ id: testProdId }).lean() as any;
    console.log('✓ Fetched updated product from MongoDB:');
    console.log('  showSizeChart:', fetchedProd.showSizeChart);
    console.log('  sizeChart:', fetchedProd.sizeChart);

    if (!fetchedProd.showSizeChart) {
      throw new Error('Test 2 Failed: showSizeChart was not saved as true!');
    }
    if (fetchedProd.sizeChart[1].length !== 27.5 || fetchedProd.sizeChart[1].chest !== 38.5) {
      throw new Error('Test 2 Failed: custom decimal values were not saved accurately!');
    }

    // Verify helper functions
    const isChartEnabled2 = isProductSizeChartEnabled(fetchedProd);
    console.log('✓ isProductSizeChartEnabled(prod2):', isChartEnabled2, '(Expected: true)');
    const chartRows2 = getProductSizeChart(fetchedProd);
    console.log('✓ getProductSizeChart rows count:', chartRows2.length);
    console.log('  M measurements -> Length:', chartRows2.find(r => r.size === 'M')?.length, 'Chest:', chartRows2.find(r => r.size === 'M')?.chest);

    if (chartRows2.length !== 4) {
      throw new Error(`Test 2 Failed: expected 4 rows, got ${chartRows2.length}`);
    }

    // TEST 3: Available Size connection (Only show rows for available sizes)
    console.log('\n[Test 3] Test Available Size connection (Only available sizes should have rows)');
    const restrictedProd: any = {
      ...fetchedProd,
      sizes: ['M', 'XL'],
      sizeOptions: {
        ...fetchedProd.sizeOptions,
        sizes: ['M', 'XL']
      }
    };
    const restrictedChart = getProductSizeChart(restrictedProd);
    console.log('✓ Restricted product sizes:', restrictedProd.sizes);
    console.log('✓ Output chart sizes:', restrictedChart.map(r => r.size));
    if (restrictedChart.length !== 2 || restrictedChart[0].size !== 'M' || restrictedChart[1].size !== 'XL') {
      throw new Error('Test 3 Failed: Chart should strictly match available adult sizes!');
    }

    // TEST 4: Re-edit with different values and confirm persistence
    console.log('\n[Test 4] Re-edit with new Chest/Length values (e.g. M -> Length: 28, Chest: 40)');
    const updatedCustomChart = [
      { size: 'S', length: 26, chest: 37 },
      { size: 'M', length: 28, chest: 40 },
      { size: 'L', length: 29, chest: 41.5 },
      { size: 'XL', length: 30.5, chest: 43.5 }
    ];

    await ProductModel.updateOne(
      { id: testProdId },
      {
        $set: {
          sizeChart: updatedCustomChart,
          'sizeOptions.sizeChart': updatedCustomChart
        }
      }
    );

    const reloadedProd = await ProductModel.findOne({ id: testProdId }).lean() as any;
    const reloadedM = reloadedProd.sizeChart.find((r: any) => r.size === 'M');
    console.log('✓ Reloaded M values from DB -> Length:', reloadedM.length, 'Chest:', reloadedM.chest);
    if (reloadedM.length !== 28 || reloadedM.chest !== 40) {
      throw new Error('Test 4 Failed: Re-edited values not preserved in DB!');
    }

    // TEST 5: syncSizeChartWithSizes helper
    console.log('\n[Test 5] Test syncSizeChartWithSizes when adding new size');
    const newSizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const synced = syncSizeChartWithSizes(newSizes, reloadedProd.sizeChart);
    console.log('✓ Synced chart has', synced.length, 'entries');
    console.log('  M (kept): Length =', synced.find(s => s.size === 'M')?.length, 'Chest =', synced.find(s => s.size === 'M')?.chest);
    console.log('  XXL (new default): Length =', synced.find(s => s.size === 'XXL')?.length, 'Chest =', synced.find(s => s.size === 'XXL')?.chest);
    console.log('  3XL (new default): Length =', synced.find(s => s.size === '3XL')?.length, 'Chest =', synced.find(s => s.size === '3XL')?.chest);

    if (synced.length !== 6) {
      throw new Error('Test 5 Failed: syncSizeChartWithSizes did not produce 6 rows');
    }
    if (synced.find(s => s.size === 'M')?.length !== 28) {
      throw new Error('Test 5 Failed: existing M length was not preserved');
    }

    // Clean up test product
    await ProductModel.deleteOne({ id: testProdId });
    console.log('\n✓ Test product cleaned up from database');

    console.log('\n========================================');
    console.log('ALL SIZE CHART SYSTEM TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');
  } finally {
    await mongoose.disconnect();
  }
}

testSuite().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
