import { useState, useRef, useEffect, FormEvent } from 'react';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Shirt,
  ShieldAlert,
  LogOut,
  Clock,
  Flame,
  Phone,
  Truck,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getWhatsAppLink } from '../../utils/whatsapp';

interface NavbarProps {
  onOpenCart?: () => void;
  onOpenAiConcierge?: () => void;
}

export default function Navbar({ onOpenCart, onOpenAiConcierge }: NavbarProps) {
  const {
    activeTab,
    setActiveTab,
    cart,
    wishlist,
    user,
    logout,
    searchQuery,
    setSearchQuery,
    searchHistory,
    addSearchHistory,
    clearSearchHistory,
    setSelectedCategory,
    setIsCartOpen,
    setIsAiModalOpen,
    categories,
    navigateTo,
    selectedCategory,
    setSelectedProduct,
    siteSettings
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileClubsExpanded, setMobileClubsExpanded] = useState(false);
  const [mobileClubActiveId, setMobileClubActiveId] = useState<string | null>(null);
  const [mobileMoreExpanded, setMobileMoreExpanded] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setLiveSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      setLoadingSuggestions(true);
      fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLiveSuggestions(data.products.filter((p: any) => p.status === 'active'));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingSuggestions(false));
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOpenCart = () => {
    if (onOpenCart) onOpenCart();
    else setIsCartOpen(true);
  };

  const handleOpenAiConcierge = () => {
    if (onOpenAiConcierge) onOpenAiConcierge();
    else setIsAiModalOpen(true);
  };

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addSearchHistory(searchQuery.trim());
      navigateTo(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
    }
  };

  const handleSelectHistory = (term: string) => {
    setSearchQuery(term);
    addSearchHistory(term);
    navigateTo(`/search?q=${encodeURIComponent(term)}`);
    setSearchFocused(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm w-full">
      
      {/* 1. Main Top Header (Logo, Search, stacked Utilities) */}
      <div className="max-w-7xl mx-auto pl-3.5 pr-4.5 sm:px-6 lg:px-8 nav-header-container">
        <div className="flex items-center justify-between h-20 sm:h-24 gap-2 min-[360px]:gap-3 sm:gap-4 nav-header-row">
          
          {/* Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 text-slate-700 hover:text-slate-900 rounded-lg focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              onClick={() => {
                setActiveTab('home');
                setSelectedCategory('');
              }}
              className="flex items-center gap-1 sm:gap-2 group text-left cursor-pointer nav-logo-btn"
            >
              <img
                src="/images/logo.png"
                alt="Jersey Mention BD"
                className="w-[48px] h-[48px] min-[360px]:w-[54px] min-[360px]:h-[54px] sm:w-12 sm:h-12 lg:w-16 lg:h-16 object-contain group-hover:scale-105 transition-transform nav-logo-img"
              />
              <div>
                <span className="text-[14px] min-[360px]:text-[16px] sm:text-lg lg:text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-0.5 nav-logo-text">
                  JERSEY<span className="text-emerald-600">MENTION</span>
                  <span className="text-[8px] min-[360px]:text-[9px] bg-red-600 text-white font-black px-0.5 py-0.2 sm:px-1 sm:py-0.5 rounded-xs tracking-widest ml-0.5 sm:ml-1 self-center nav-logo-tag">
                    BD
                  </span>
                </span>
                <p className="hidden sm:block text-[8px] lg:text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-none mt-0.5 nav-logo-subtext">
                  Authentic Sports & Apparel
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Search Bar (Centered, green border & green button) */}
          <div ref={searchRef} className="hidden lg:block flex-1 max-w-lg xl:max-w-xl relative mx-8 nav-search-container">
            <form onSubmit={handleSearchSubmit} className="flex items-center border-2 border-emerald-650 focus-within:border-emerald-500 rounded-full overflow-hidden bg-white shadow-xs focus-within:shadow-md transition-all">
              <input
                type="text"
                placeholder="Search jerseys, clubs, players, or custom prints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full bg-white text-slate-900 px-5 py-2.5 text-xs sm:text-sm outline-hidden border-none focus:ring-0 focus:outline-hidden"
              />
              <button
                type="submit"
                className="bg-emerald-650 hover:bg-emerald-600 text-white px-6 h-full flex items-center justify-center transition-colors cursor-pointer border-none py-3"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
            </form>

            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in duration-150">
                {searchQuery.trim().length >= 2 ? (
                  loadingSuggestions ? (
                    <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Searching products...</span>
                    </div>
                  ) : liveSuggestions.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No matching products found.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pb-1 border-b border-slate-100">
                        Matching Products Suggestions
                      </div>
                      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {liveSuggestions.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedProduct(p);
                              setActiveTab('product_detail');
                              setSearchFocused(false);
                            }}
                            className="w-full text-left py-2 px-2 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            {p.images && p.images.length > 0 && p.images[0] ? (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-8 h-8 object-contain p-0.5 min-[1220px]:p-0 min-[1220px]:object-cover rounded-lg border border-slate-150 bg-slate-50"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                <Shirt className="w-4 h-4 opacity-45" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                              <div className="text-[10px] text-slate-500 font-semibold">{p.categoryName} {p.subcategoryName ? `• ${p.subcategoryName}` : ''}</div>
                            </div>
                            <div className="text-xs font-black text-slate-900">
                              ৳{p.salePrice || p.price}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    {searchHistory.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Recent Searches
                          </span>
                          <button
                            onClick={clearSearchHistory}
                            className="text-emerald-600 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {searchHistory.map((term, i) => (
                            <button
                              key={i}
                              onClick={() => handleSelectHistory(term)}
                              className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-3 py-1 rounded-full transition-colors cursor-pointer border-none"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> Popular Searches
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {['Bangladesh 2026 Home', 'Real Madrid Player Version', 'Argentina 3-Star', 'Retro 1999 Classic'].map(
                          (item, i) => (
                            <button
                              key={i}
                              onClick={() => handleSelectHistory(item)}
                              className="text-left py-1.5 px-2 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer border-none"
                            >
                              • {item}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Utilities (Stacked Icon + text) */}
          <div className="flex items-center gap-2 min-[360px]:gap-2.5 sm:gap-4 md:gap-6 shrink-0 nav-utilities">
            
            {/* Help Line */}
            <a 
              href={`tel:${(siteSettings.contactPhone || '01640581442').replace(/[^0-9+]/g, '')}`} 
              className="hidden md:flex flex-col items-center gap-1 text-slate-700 hover:text-emerald-600 transition-colors group cursor-pointer nav-utility-item"
              title="Click to call support"
            >
              <Phone className="w-5 h-5 text-slate-700 group-hover:text-emerald-600 transition-colors nav-utility-icon" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition-colors nav-utility-text">Help Line</span>
            </a>

            {/* Track Order */}
            <button 
              onClick={() => setActiveTab('order_tracking')}
              className="hidden md:flex flex-col items-center gap-1 text-slate-700 hover:text-emerald-600 transition-colors group cursor-pointer nav-utility-item"
              title="Order Tracker"
            >
              <Truck className="w-5 h-5 text-slate-700 group-hover:text-emerald-600 transition-colors nav-utility-icon" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition-colors nav-utility-text">Track Order</span>
            </button>

            {/* Wishlist */}
            <button 
              onClick={() => setActiveTab('wishlist')}
              className="flex flex-col items-center gap-0.5 sm:gap-1 text-slate-700 hover:text-red-650 transition-colors relative group cursor-pointer nav-utility-item"
              title="View Wishlist"
            >
              <div className="relative">
                <Heart className="w-[24px] h-[24px] min-[360px]:w-[26px] min-[360px]:h-[26px] sm:w-5 sm:h-5 text-slate-700 group-hover:text-red-600 transition-colors nav-utility-icon" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-red-600 transition-colors nav-utility-text">Wishlist</span>
            </button>

            {/* Account dropdown */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex flex-col items-center gap-0.5 sm:gap-1 text-slate-700 hover:text-emerald-600 transition-colors group cursor-pointer nav-utility-item"
                  >
                    <div className="w-[24px] h-[24px] min-[360px]:w-[26px] min-[360px]:h-[26px] sm:w-5 sm:h-5 rounded-full bg-emerald-700 text-white font-black text-[10px] sm:text-[9px] flex items-center justify-center border border-emerald-500 group-hover:scale-105 transition-transform nav-profile-circle">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition-colors truncate max-w-[65px] nav-utility-text">
                      Profile
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {user.role}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" /> My Account & Orders
                      </button>

                      {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') && (
                        <button
                          onClick={() => {
                            setActiveTab('admin');
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-amber-700 font-semibold hover:bg-amber-55 flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-600" /> Admin Dashboard
                        </button>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-red-650 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex flex-col items-center gap-0.5 sm:gap-1 text-slate-700 hover:text-emerald-600 transition-colors group cursor-pointer nav-utility-item"
                >
                  <UserIcon className="w-[24px] h-[24px] min-[360px]:w-[26px] min-[360px]:h-[26px] sm:w-5 sm:h-5 text-slate-700 group-hover:text-emerald-600 transition-colors nav-utility-icon" />
                  <span className="hidden sm:block text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition-colors nav-utility-text">Login</span>
                </button>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button 
              onClick={handleOpenCart}
              className="flex flex-col items-center gap-0.5 sm:gap-1 text-slate-700 hover:text-emerald-650 transition-colors relative group cursor-pointer nav-utility-item"
              title="Open Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-[24px] h-[24px] min-[360px]:w-[26px] min-[360px]:h-[26px] sm:w-5 sm:h-5 text-slate-700 group-hover:text-emerald-600 transition-colors nav-utility-icon" />
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartItemsCount}
                </span>
              </div>
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition-colors nav-utility-text">Cart</span>
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Search input bar (only visible on mobile layout below logo/icon row) */}
      <div className="lg:hidden px-4 pb-3.5 pt-1 border-t border-slate-100 bg-white">
        <form onSubmit={handleSearchSubmit} className="flex items-center border border-emerald-600 rounded-full overflow-hidden bg-slate-50 w-full shadow-inner">
          <input
            type="text"
            placeholder="Search jerseys, clubs, players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-slate-900 px-4 py-1.5 text-xs outline-hidden border-none focus:ring-0 focus:outline-hidden"
          />
          <button
            type="submit"
            className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-center transition-colors cursor-pointer border-none"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 2. Sub-Header Navigation Segment (Solid Green bar spanning full width on Desktop) */}
      <div className="hidden lg:block bg-emerald-600 text-white border-t border-emerald-700 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between py-3 text-xs font-black uppercase tracking-wider">
            
            {/* Left aligned category menus */}
            <div className="flex items-center gap-7">
              
              {/* Home */}
              <button
                onClick={() => navigateTo('/')}
                className={`hover:text-emerald-200 transition-all cursor-pointer border-none bg-transparent ${
                  activeTab === 'home' ? 'text-amber-300 font-black' : ''
                }`}
              >
                Home
              </button>

              <button
                onClick={() => setActiveTab('catalog')}
                className="hover:text-emerald-200 transition-all cursor-pointer border-none bg-transparent"
              >
                Browse Collection
              </button>

              {/* Dynamic Main Navbar Categories */}
              {categories
                .filter((c) => c.navbarLocation === 'main' && c.isActive)
                .sort((a, b) => (a.navbarPosition || 0) - (b.navbarPosition || 0))
                .map((cat) => {
                  const isActive = activeTab === 'category_detail' && selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => navigateTo(`/category/${cat.slug}`)}
                      className={`hover:text-emerald-200 transition-all cursor-pointer border-none bg-transparent ${
                        isActive ? 'text-amber-300 font-black' : ''
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}

              {/* Dynamic "More" Hover Dropdown */}
              {categories.some((c) => c.navbarLocation === 'more' && c.isActive) && (
                <div className="relative group py-1">
                  <button
                    className={`flex items-center gap-1 hover:text-emerald-200 transition-colors font-black uppercase tracking-wider cursor-pointer border-none bg-transparent ${
                      categories
                        .filter((c) => c.navbarLocation === 'more' && c.isActive)
                        .some((c) => activeTab === 'category_detail' && selectedCategory === c.slug)
                        ? 'text-amber-300'
                        : ''
                    }`}
                  >
                    <span>More ▾</span>
                  </button>
                  
                  <div className="absolute top-full left-0 pt-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 text-slate-800 text-xs font-bold uppercase tracking-wider normal-case">
                      {categories
                        .filter((c) => c.navbarLocation === 'more' && c.isActive)
                        .sort((a, b) => (a.navbarPosition || 0) - (b.navbarPosition || 0))
                        .map((otherCat) => {
                          const isActive = activeTab === 'category_detail' && selectedCategory === otherCat.slug;
                          return (
                            <button
                              key={otherCat.id}
                              onClick={() => navigateTo(`/category/${otherCat.slug}`)}
                              className={`w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer flex items-center justify-between border-none bg-transparent ${
                                isActive ? 'text-emerald-600 font-extrabold' : ''
                              }`}
                            >
                              <span>{otherCat.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right-aligned actions (AI Assist) */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleOpenAiConcierge}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black px-3.5 py-1.5 rounded-full transition-colors cursor-pointer border border-white/20 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                <span>AI ASSISTANT</span>
              </button>
            </div>

          </nav>
        </div>
      </div>

      {/* 3. Mobile Navigation Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-50 border-t border-slate-200 py-4 px-4 space-y-3 max-h-[70vh] overflow-y-auto animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-2 font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">
            {/* Home */}
            <button
              onClick={() => {
                navigateTo('/');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2.5 px-3.5 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl cursor-pointer border-none bg-transparent"
            >
              Home
            </button>

            <button
              onClick={() => {
                setActiveTab('catalog');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2.5 px-3.5 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl cursor-pointer border-none bg-transparent"
            >
              Browse Collection
            </button>

            {/* Dynamic Main Navbar Categories */}
            {categories
              .filter((c) => c.navbarLocation === 'main' && c.isActive)
              .sort((a, b) => (a.navbarPosition || 0) - (b.navbarPosition || 0))
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    navigateTo(`/category/${cat.slug}`);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2.5 px-3.5 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl cursor-pointer border-none bg-transparent"
                >
                  {cat.name}
                </button>
              ))}

            {/* Dynamic "More" Categories Expandable Accordion */}
            {categories.some((c) => c.navbarLocation === 'more' && c.isActive) && (
              <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden">
                <button
                  onClick={() => setMobileMoreExpanded(!mobileMoreExpanded)}
                  className="w-full flex items-center justify-between text-left py-3 px-4 hover:bg-slate-50 font-bold cursor-pointer border-none bg-transparent"
                >
                  <span>More Categories</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileMoreExpanded ? 'rotate-180' : ''}`} />
                </button>

                {mobileMoreExpanded && (
                  <div className="bg-slate-50 border-t border-slate-100 p-3 space-y-2 flex flex-col pl-6">
                    {categories
                      .filter((c) => c.navbarLocation === 'more' && c.isActive)
                      .sort((a, b) => (a.navbarPosition || 0) - (b.navbarPosition || 0))
                      .map((otherCat) => (
                        <button
                          key={otherCat.id}
                          onClick={() => {
                            navigateTo(`/category/${otherCat.slug}`);
                            setMobileMenuOpen(false);
                          }}
                          className="text-left py-2.5 text-xs font-bold text-slate-700 hover:text-emerald-600 border-none bg-transparent cursor-pointer"
                        >
                          {otherCat.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Track Order */}
            <button
              onClick={() => {
                navigateTo('/order_tracking');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2.5 px-3.5 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl cursor-pointer border-none bg-transparent"
            >
              Order Tracking
            </button>

            {user && (
              <button
                onClick={() => {
                  navigateTo('/profile');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2.5 px-3.5 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl cursor-pointer border-none bg-transparent"
              >
                My Profile & Orders
              </button>
            )}

            {user && (user.role === 'super_admin' || user.role === 'admin') && (
              <button
                onClick={() => {
                  navigateTo('/admin');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2.5 px-3.5 bg-amber-50 text-amber-850 font-black rounded-xl cursor-pointer border-none"
              >
                Admin Dashboard
              </button>
            )}

            {/* WhatsApp Direct Contact */}
            <a
              href={getWhatsAppLink(siteSettings.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 py-2.5 px-3.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl font-bold cursor-pointer transition-colors border border-emerald-200/60"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp: {siteSettings.whatsappNumber || '01640581442'}</span>
            </a>
          </div>
        </div>
      )}

    </header>
  );
}
