import { Product, CartItem, SizeChartItem } from '../types';

export const DEFAULT_SIZE_CHART_VALUES: Record<string, { length: number; chest: number }> = {
  'S': { length: 26, chest: 36 },
  'M': { length: 27, chest: 38 },
  'L': { length: 28, chest: 40 },
  'XL': { length: 29, chest: 42 },
  'XXL': { length: 30, chest: 44 },
  '3XL': { length: 31, chest: 46 },
  '4XL': { length: 32, chest: 48 }
};

export const ALL_KIDS_SIZES = [
  '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '9Y', '10Y', '11Y', '12Y', '13Y', '14Y'
];

/**
 * Checks if Kids / Children Sizes option is enabled for a product.
 */
export function isProductKidsSizesEnabled(product: Product | null | undefined): boolean {
  if (!product) return false;
  return Boolean(product.showKidsSizes || product.sizeOptions?.showKidsSizes);
}

/**
 * Retrieves the available Kids / Children Sizes configured for a product (3Y–14Y).
 * Returns empty array if Kids Sizes are disabled for this product.
 */
export function getProductKidsSizes(product: Product | null | undefined): string[] {
  if (!product || !isProductKidsSizesEnabled(product)) return [];
  const sizes = product.kidsSizes || product.sizeOptions?.kidsSizes;
  if (Array.isArray(sizes) && sizes.length > 0) {
    return sizes.filter((s) => ALL_KIDS_SIZES.includes(s));
  }
  return [];
}

/**
 * Retrieves only the configured Adult sizes for a product.
 */
export function getProductAdultSizes(product: Product | null | undefined): string[] {
  if (!product) return [];
  const adultEnabled = product.sizeOptions && typeof product.sizeOptions.enabled === 'boolean'
    ? product.sizeOptions.enabled
    : true;
  if (!adultEnabled) return [];

  if (product.sizeOptions?.sizes && Array.isArray(product.sizeOptions.sizes) && product.sizeOptions.sizes.length > 0) {
    return product.sizeOptions.sizes;
  }
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    return product.sizes;
  }
  return [];
}

/**
 * Checks if size selection (Adult or Kids) is enabled for a product.
 * Returns true if adult sizes or kids sizes are enabled and configured.
 */
export function isProductSizeEnabled(product: Product | null | undefined): boolean {
  if (!product) return false;
  
  const adultEnabled = product.sizeOptions && typeof product.sizeOptions.enabled === 'boolean'
    ? product.sizeOptions.enabled
    : (Array.isArray(product.sizes) && product.sizes.length > 0);

  const kidsEnabled = isProductKidsSizesEnabled(product) && getProductKidsSizes(product).length > 0;

  return adultEnabled || kidsEnabled;
}

/**
 * Retrieves all available sizes (Adult and/or Kids) configured for a product.
 * Does not hardcode sizes; uses product.sizeOptions, product.sizes, and product.kidsSizes.
 */
export function getProductAvailableSizes(product: Product | null | undefined): string[] {
  if (!product) return [];
  
  const adultSizes = getProductAdultSizes(product);
  const kidsSizes = getProductKidsSizes(product);

  return [...adultSizes, ...kidsSizes];
}

/**
 * Checks if size selection (Adult or Kids) is required for a product.
 * - When Kids Sizes is enabled: Size selection is strictly required (just like adult size).
 * - When Adult sizing is enabled: Follows sizeOptions.required (defaults to true).
 * - When neither is enabled: Size is not required.
 */
export function isProductSizeRequired(product: Product | null | undefined): boolean {
  if (!product) return false;
  
  const kidsEnabled = isProductKidsSizesEnabled(product) && getProductKidsSizes(product).length > 0;
  if (kidsEnabled) {
    return true;
  }

  const adultEnabled = product.sizeOptions && typeof product.sizeOptions.enabled === 'boolean'
    ? product.sizeOptions.enabled
    : (Array.isArray(product.sizes) && product.sizes.length > 0);

  if (adultEnabled) {
    return Boolean(product.sizeOptions?.required ?? true);
  }

  return false;
}

/**
 * Validates if a cart item has a valid size according to the product's size settings.
 * - If size is NOT required for the product: size is optional.
 * - If size IS required for the product: selectedSize must be a non-empty string in available sizes.
 */
export function isCartItemSizeValid(item: CartItem): boolean {
  if (!item || !item.product) return true;
  
  const sizeRequired = isProductSizeRequired(item.product);
  
  if (sizeRequired) {
    if (!item.selectedSize || typeof item.selectedSize !== 'string' || !item.selectedSize.trim()) {
      return false;
    }
  }
  
  const availableSizes = getProductAvailableSizes(item.product);
  if (availableSizes.length > 0 && item.selectedSize) {
    return availableSizes.includes(item.selectedSize.trim());
  }
  
  return true;
}

/**
 * Returns any cart items that require a size but do not have a valid size selected.
 */
export function getIncompleteSizeCartItems(cart: CartItem[]): CartItem[] {
  if (!Array.isArray(cart)) return [];
  return cart.filter((item) => !isCartItemSizeValid(item));
}

/**
 * Checks if Custom Squad Name & Number Heat-Press is enabled for a product.
 */
export function isProductCustomSquadEnabled(product: Product | null | undefined): boolean {
  if (!product) return false;
  return Boolean(product.showCustomNameNumber || product.allowCustomPrint);
}

/**
 * Checks if Sleeve / Patches option is enabled for a product.
 */
export function isProductSleevePatchesEnabled(product: Product | null | undefined): boolean {
  if (!product) return false;
  return Boolean(product.showSleevePatches);
}

/**
 * Checks if any customization option (Size, Squad Name/Number, or Sleeve Patches) is enabled for a product.
 */
export function hasAnyCustomizationEnabled(product: Product | null | undefined): boolean {
  if (!product) return false;
  return isProductSizeEnabled(product) || isProductCustomSquadEnabled(product) || isProductSleevePatchesEnabled(product);
}

/**
 * Checks if Size Chart display is enabled for a product.
 */
export function isProductSizeChartEnabled(product: Product | null | undefined): boolean {
  if (!product) return false;
  return Boolean(product.showSizeChart || product.sizeOptions?.showSizeChart);
}

/**
 * Retrieves the Size Chart rows for a product, mapped to its configured adult sizes.
 * If custom values are saved on the product, those are used; otherwise sensible standard defaults are provided.
 */
export function getProductSizeChart(product: Product | null | undefined): SizeChartItem[] {
  if (!product || !isProductSizeChartEnabled(product)) return [];
  const adultSizes = getProductAdultSizes(product);
  if (adultSizes.length === 0) return [];

  const rawChart: SizeChartItem[] = (Array.isArray(product.sizeChart) && product.sizeChart.length > 0)
    ? product.sizeChart
    : (Array.isArray(product.sizeOptions?.sizeChart) && product.sizeOptions.sizeChart.length > 0
        ? product.sizeOptions.sizeChart
        : []);

  const chartMap = new Map<string, SizeChartItem>();
  for (const item of rawChart) {
    if (item && item.size) {
      chartMap.set(item.size, item);
    }
  }

  return adultSizes.map((size, idx) => {
    const existing = chartMap.get(size);
    if (existing) {
      const len = typeof existing.length === 'number' ? existing.length : Number(existing.length);
      const ch = typeof existing.chest === 'number' ? existing.chest : Number(existing.chest);
      return {
        size,
        length: !isNaN(len) && len >= 0 ? len : 0,
        chest: !isNaN(ch) && ch >= 0 ? ch : 0
      };
    }
    const defaultVal = DEFAULT_SIZE_CHART_VALUES[size] || {
      length: 26 + idx,
      chest: 36 + idx * 2
    };
    return {
      size,
      length: defaultVal.length,
      chest: defaultVal.chest
    };
  });
}

/**
 * Synchronizes a list of sizes with an existing size chart, preserving existing length/chest
 * entries and creating standard default measurements for any newly added sizes.
 */
export function syncSizeChartWithSizes(sizesList: string[], existingChart?: SizeChartItem[]): SizeChartItem[] {
  if (!Array.isArray(sizesList)) return [];
  const chartMap = new Map((existingChart || []).map(item => [item.size, item]));
  return sizesList.map((sz, idx) => {
    const ex = chartMap.get(sz);
    if (ex) {
      const len = typeof ex.length === 'number' ? ex.length : Number(ex.length);
      const ch = typeof ex.chest === 'number' ? ex.chest : Number(ex.chest);
      return {
        size: sz,
        length: !isNaN(len) && len >= 0 ? len : 0,
        chest: !isNaN(ch) && ch >= 0 ? ch : 0
      };
    }
    const def = DEFAULT_SIZE_CHART_VALUES[sz] || { length: 26 + idx, chest: 36 + idx * 2 };
    return { size: sz, length: def.length, chest: def.chest };
  });
}


