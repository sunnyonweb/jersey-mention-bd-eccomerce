import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import ProductCard from '../catalog/ProductCard';
import { Product } from '../../types';
import { Loader2, Shirt } from 'lucide-react';

interface ClubCategoryViewProps {
  onQuickView: (p: Product) => void;
}

export default function ClubCategoryView({ onQuickView }: ClubCategoryViewProps) {
  const {
    selectedCategory,
    selectedSubcategory,
    categories,
    navigateTo
  } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Find current team category (could be club or national team)
  const team = categories.find(
    (c) => c.slug === selectedCategory && (c.parentId === 'cat-clubs' || c.parentId === 'cat-national-teams')
  );

  // Find active subcategories under this team
  const subcategories = categories.filter(
    (c) => c.parentId === team?.id && c.isActive
  );

  useEffect(() => {
    if (!selectedCategory) return;
    setLoading(true);

    let url = `/api/products?category=${selectedCategory}`;
    if (selectedSubcategory) {
      // Find matching subcategory slug/ID
      const subObj = categories.find(
        (c) => c.parentId === team?.id && (c.id === selectedSubcategory || c.slug === selectedSubcategory || c.slug === `${selectedCategory}-${selectedSubcategory}`)
      );
      if (subObj) {
        url += `&subcategory=${subObj.slug}`;
      } else {
        // Fallback to simple subcategory string
        url += `&subcategory=${selectedSubcategory}`;
      }
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Double check to only include active products
          setProducts(data.products.filter((p: Product) => p.status === 'active'));
        }
      })
      .catch((err) => console.error('Error loading team products:', err))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedSubcategory, categories, team]);

  if (!team) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-xl font-bold text-slate-800">Team Category Not Found</h2>
        <button
          onClick={() => navigateTo('/')}
          className="mt-4 bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors border-none cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const handleSubcategoryClick = (subId: string | null) => {
    const isNational = team.parentId === 'cat-national-teams';
    const basePath = isNational ? '/national-teams' : '/clubs';

    if (!subId) {
      navigateTo(`${basePath}/${team.slug}`);
    } else {
      const subObj = categories.find((c) => c.id === subId);
      if (subObj) {
        const cleanSlug = subObj.slug.replace(`${team.slug}-`, '');
        navigateTo(`${basePath}/${team.slug}/${cleanSlug}`);
      }
    }
  };

  const badgeText = team.parentId === 'cat-national-teams' ? 'National Team Fan Zone' : 'Club Fan Zone';

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Team Banner Header */}
      <div className="relative bg-slate-950 text-white py-12 md:py-16 overflow-hidden border-b border-slate-900 shadow-md">
        {/* Glow Accents */}
        <div className="absolute top-0 left-1/3 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          {/* Logo container */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl shrink-0">
            {team.image ? (
              <img
                src={team.image}
                alt={team.name}
                className="w-full h-full object-contain p-2"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Shirt className="w-10 h-10 text-emerald-500 animate-pulse" />
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-3 py-1 rounded-full uppercase">
              {badgeText}
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">
              {team.name}
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Premium player jerseys, supporter shirts, and vintage editions. Crafted for style, comfort, and authenticity.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Subcategory Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          <button
            onClick={() => handleSubcategoryClick(null)}
            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer border-none ${
              !selectedSubcategory
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
            }`}
          >
            All Kits
          </button>

          {subcategories.map((sub) => {
            const isSelected = selectedSubcategory === sub.id || selectedSubcategory === sub.slug || selectedSubcategory === sub.slug.replace(`${team.slug}-`, '');
            return (
              <button
                key={sub.id}
                onClick={() => handleSubcategoryClick(sub.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer border-none ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
                }`}
              >
                {sub.name}
              </button>
            );
          })}
        </div>

        {/* Product Grid section */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-bold uppercase tracking-wider">Loading jerseys...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 max-w-md mx-auto shadow-xs mt-4">
              <span className="text-4xl">👕</span>
              <h3 className="font-extrabold text-slate-900 text-sm mt-3 uppercase">No Jerseys Found</h3>
              <p className="text-xs text-slate-500 mt-1">We don't have items in this category right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
