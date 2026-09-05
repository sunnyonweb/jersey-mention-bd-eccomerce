import { useState, useMemo, useEffect } from 'react';
import { Filter, SlidersHorizontal, Grid, List, RotateCcw, Search, Check, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ProductCard from './ProductCard';
import { Product, Category } from '../../types';

interface ProductCatalogViewProps {
  onQuickView: (p: Product) => void;
}

export default function ProductCatalogView({ onQuickView }: ProductCatalogViewProps) {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    searchQuery,
    setSearchQuery
  } = useStore();

  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/products').then((res) => res.json()),
      fetch('/api/categories').then((res) => res.json()),
      fetch('/api/brands').then((res) => res.json())
    ])
      .then(([prodData, catData, brandData]) => {
        if (prodData.success) {
          setProductsList(prodData.products.filter((p: Product) => p.status === 'active'));
        }
        if (catData.success) {
          setCategoriesList(catData.categories);
        }
        if (brandData.success) {
          setBrandsList(brandData.brands);
        }
      })
      .catch((err) => console.error('Error fetching catalog data:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    // Show only main and more dropdown categories in filter list to avoid duplicate subcategories
    const activeNavbarCats = categoriesList.filter(
      (c) => (c.navbarLocation === 'main' || c.navbarLocation === 'more') && c.isActive
    );

    // Filter to unique category names
    const uniqueCats: typeof activeNavbarCats = [];
    const seen = new Set<string>();

    for (const c of activeNavbarCats) {
      if (!seen.has(c.name.toLowerCase())) {
        seen.add(c.name.toLowerCase());
        uniqueCats.push(c);
      }
    }

    return [{ name: 'All Categories', slug: '' }, ...uniqueCats];
  }, [categoriesList]);

  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          (p.brandName && p.brandName.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Category filter
      if (selectedCategory) {
        if (
          p.categoryId !== selectedCategory &&
          p.subcategoryId !== selectedCategory &&
          p.categoryName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') !== selectedCategory &&
          p.subcategoryName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') !== selectedCategory
        ) {
          return false;
        }
      }

      // Brand filter
      if (selectedBrand) {
        if (
          p.brandId !== selectedBrand &&
          p.brandName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') !== selectedBrand
        ) {
          return false;
        }
      }

      // Price filter
      const price = p.salePrice || p.price;
      if (price < minPrice || price > maxPrice) return false;

      // Size filter
      if (selectedSize && !p.sizes.includes(selectedSize)) return false;

      // Stock status filter
      if (onlyInStock && p.stock <= 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortOption === 'price_asc') return (a.salePrice || a.price) - (b.salePrice || b.price);
      if (sortOption === 'price_desc') return (b.salePrice || b.price) - (a.salePrice || a.price);
      if (sortOption === 'rating') return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [productsList, searchQuery, selectedCategory, selectedBrand, minPrice, maxPrice, selectedSize, onlyInStock, sortOption]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSearchQuery('');
    setMinPrice(0);
    setMaxPrice(5000);
    setSelectedSize('');
    setOnlyInStock(false);
    setSortOption('newest');
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumb */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
              PRODUCT CATALOG
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {loading ? 'Retrieving items...' : `Showing ${filteredProducts.length} premium sports kits`}
            </p>
          </div>

          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center justify-center gap-2 bg-slate-900 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer border-none"
          >
            <Filter className="w-4 h-4" /> Filters & Categories
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 w-full">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-605" />
            <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Loading Catalog...</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar Filters */}
            <aside
              className={`w-full lg:w-64 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6 h-fit shrink-0 ${
                mobileFilterOpen ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 uppercase">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-650" /> Filters
                </h3>
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-emerald-600 hover:underline font-bold flex items-center gap-1 cursor-pointer border-none bg-transparent"
                >
                  <RotateCcw className="w-3 h-3" /> Reset All
                </button>
              </div>

              {/* Categories list */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase">Categories</h4>
                <div className="space-y-1">
                  {categories.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-between border-none bg-transparent ${
                        selectedCategory === c.slug
                          ? 'bg-emerald-50 text-emerald-805 font-bold border border-emerald-200'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{c.name}</span>
                      {selectedCategory === c.slug && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase">Price Range (৳)</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-650 font-bold">
                    <span>৳0</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Up to ৳{maxPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {['', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`text-xs px-3 py-1 rounded-lg border font-bold cursor-pointer transition-colors ${
                        selectedSize === sz
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {sz === '' ? 'ALL' : sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </aside>

            {/* Catalog Content Grid */}
            <main className="flex-1 space-y-6">
              
              {/* Top Toolbar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-700">
                <div>
                  <span>Found <strong className="text-slate-900">{filteredProducts.length}</strong> items</span>
                  {searchQuery && <span className="ml-1 text-slate-400">for "{searchQuery}"</span>}
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-505">Sort By:</span>
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-hidden"
                    >
                      <option value="newest">Newest Arrivals</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>

                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-100">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 cursor-pointer border-none bg-transparent ${
                        viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 cursor-pointer border-none bg-transparent ${
                        viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
                  <Search className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-extrabold text-slate-800 text-base">No Matching Products Found</h3>
                  <p className="text-xs text-slate-505 max-w-sm mx-auto">
                    Try broadening your search query or reset category & price range filters.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer border-none shadow-xs"
                  >
                    Reset Catalog Filters
                  </button>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {filteredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onQuickView={onQuickView} />
                  ))}
                </div>
              )}
            </main>

          </div>
        )}
      </div>
    </div>
  );
}
