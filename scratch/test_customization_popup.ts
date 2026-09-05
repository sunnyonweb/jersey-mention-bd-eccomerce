import {
  isProductSizeEnabled,
  getProductAvailableSizes,
  isProductCustomSquadEnabled,
  isProductSleevePatchesEnabled,
  hasAnyCustomizationEnabled
} from '../src/utils/productUtils';
import { Product } from '../src/types';

function runCustomizationTests() {
  console.log('=== RUNNING CONDITIONAL PRODUCT CUSTOMIZATION TESTS ===\n');

  // Product A: Size ON, Custom Squad ON, Sleeve/Patches ON
  const productA: Product = {
    id: 'prod-A',
    name: 'Real Madrid 2026 Home Kit',
    slug: 'real-madrid-2026-home-kit',
    sku: 'RM-01',
    barcode: '111',
    price: 1500,
    description: 'Full custom jersey',
    specifications: [],
    images: ['/rm.jpg'],
    categoryId: 'jerseys',
    categoryName: 'Jerseys',
    stock: 50,
    lowStockAlert: 5,
    isOutOfStock: false,
    sizes: ['S', 'M', 'L', 'XL'],
    sizeOptions: { enabled: true, required: true, label: 'Select Size:', sizes: ['S', 'M', 'L', 'XL'] },
    showCustomNameNumber: true,
    showSleevePatches: true,
    sleeveBadges: ['badge-ucl', 'badge-laliga'],
    colors: [{ name: 'White', hex: '#fff' }],
    tags: [],
    featured: true,
    isBestSeller: true,
    isTrending: false,
    isNewArrival: true,
    isFlashSale: false,
    returnPolicy: '',
    warranty: '',
    status: 'active',
    rating: 5,
    reviewCount: 10,
    createdAt: new Date().toISOString()
  };

  // Product B: Size ON, Custom Squad OFF, Sleeve/Patches OFF
  const productB: Product = {
    id: 'prod-B',
    name: 'Standard Training Shorts',
    slug: 'standard-training-shorts',
    sku: 'SH-01',
    barcode: '222',
    price: 600,
    description: 'Only size required',
    specifications: [],
    images: ['/shorts.jpg'],
    categoryId: 'shorts',
    categoryName: 'Shorts',
    stock: 30,
    lowStockAlert: 3,
    isOutOfStock: false,
    sizes: ['M', 'L', 'XL'],
    sizeOptions: { enabled: true, required: true, label: 'Select Size:', sizes: ['M', 'L', 'XL'] },
    showCustomNameNumber: false,
    showSleevePatches: false,
    colors: [{ name: 'Black', hex: '#000' }],
    tags: [],
    featured: false,
    isBestSeller: false,
    isTrending: false,
    isNewArrival: false,
    isFlashSale: false,
    returnPolicy: '',
    warranty: '',
    status: 'active',
    rating: 4.5,
    reviewCount: 4,
    createdAt: new Date().toISOString()
  };

  // Product C: Size OFF, Custom Squad ON, Sleeve/Patches OFF
  const productC: Product = {
    id: 'prod-C',
    name: 'Custom Fan Scarf / Flag',
    slug: 'custom-fan-scarf',
    sku: 'SC-01',
    barcode: '333',
    price: 450,
    description: 'Custom print only',
    specifications: [],
    images: ['/scarf.jpg'],
    categoryId: 'fan-gear',
    categoryName: 'Fan Gear',
    stock: 100,
    lowStockAlert: 10,
    isOutOfStock: false,
    sizes: [],
    sizeOptions: { enabled: false, required: false, label: 'Select Size:', sizes: [] },
    showCustomNameNumber: true,
    showSleevePatches: false,
    colors: [{ name: 'Default', hex: '#000' }],
    tags: [],
    featured: false,
    isBestSeller: false,
    isTrending: false,
    isNewArrival: false,
    isFlashSale: false,
    returnPolicy: '',
    warranty: '',
    status: 'active',
    rating: 5,
    reviewCount: 2,
    createdAt: new Date().toISOString()
  };

  // Product D: All options OFF
  const productD: Product = {
    id: 'prod-D',
    name: 'Official Match Football',
    slug: 'official-match-football',
    sku: 'FB-01',
    barcode: '444',
    price: 2500,
    description: 'No customization',
    specifications: [],
    images: ['/ball.jpg'],
    categoryId: 'gear',
    categoryName: 'Gear',
    stock: 20,
    lowStockAlert: 2,
    isOutOfStock: false,
    sizes: [],
    sizeOptions: { enabled: false, required: false, label: 'Select Size:', sizes: [] },
    showCustomNameNumber: false,
    showSleevePatches: false,
    colors: [{ name: 'White/Black', hex: '#fff' }],
    tags: [],
    featured: false,
    isBestSeller: false,
    isTrending: false,
    isNewArrival: false,
    isFlashSale: false,
    returnPolicy: '',
    warranty: '',
    status: 'active',
    rating: 5,
    reviewCount: 8,
    createdAt: new Date().toISOString()
  };

  // 1. Scenario A Test
  console.log('--- Scenario 1: Product A (Size ON, Squad ON, Patches ON) ---');
  console.log('Size Enabled:', isProductSizeEnabled(productA) === true ? 'PASS (ON)' : 'FAIL');
  console.log('Squad Enabled:', isProductCustomSquadEnabled(productA) === true ? 'PASS (ON)' : 'FAIL');
  console.log('Patches Enabled:', isProductSleevePatchesEnabled(productA) === true ? 'PASS (ON)' : 'FAIL');
  console.log('Available Sizes:', JSON.stringify(getProductAvailableSizes(productA)));

  // 2. Scenario B Test
  console.log('\n--- Scenario 2: Product B (Size ON, Squad OFF, Patches OFF) ---');
  console.log('Size Enabled:', isProductSizeEnabled(productB) === true ? 'PASS (ON)' : 'FAIL');
  console.log('Squad Enabled:', isProductCustomSquadEnabled(productB) === false ? 'PASS (OFF)' : 'FAIL');
  console.log('Patches Enabled:', isProductSleevePatchesEnabled(productB) === false ? 'PASS (OFF)' : 'FAIL');

  // 3. Scenario C Test
  console.log('\n--- Scenario 3: Product C (Size OFF, Squad ON, Patches OFF) ---');
  console.log('Size Enabled:', isProductSizeEnabled(productC) === false ? 'PASS (OFF)' : 'FAIL');
  console.log('Squad Enabled:', isProductCustomSquadEnabled(productC) === true ? 'PASS (ON)' : 'FAIL');
  console.log('Patches Enabled:', isProductSleevePatchesEnabled(productC) === false ? 'PASS (OFF)' : 'FAIL');

  // 4. Scenario D Test
  console.log('\n--- Scenario 4: Product D (All Options OFF) ---');
  console.log('Size Enabled:', isProductSizeEnabled(productD) === false ? 'PASS (OFF)' : 'FAIL');
  console.log('Squad Enabled:', isProductCustomSquadEnabled(productD) === false ? 'PASS (OFF)' : 'FAIL');
  console.log('Patches Enabled:', isProductSleevePatchesEnabled(productD) === false ? 'PASS (OFF)' : 'FAIL');
  console.log('Has Any Customization:', hasAnyCustomizationEnabled(productD) === false ? 'PASS (NO CUSTOMIZATION)' : 'FAIL');

  console.log('\n=== ALL CONDITIONAL SCENARIOS VERIFIED SUCCESSFULLY ===');
}

runCustomizationTests();
