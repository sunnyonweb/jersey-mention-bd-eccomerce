import { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import SEO from './components/layout/SEO';
import Footer from './components/layout/Footer';
import CartDrawer from './components/layout/CartDrawer';
import HeroSection from './components/home/HeroSection';
import PopularCategories from './components/home/PopularCategories';
import FlashSale from './components/home/FlashSale';
import FeaturedProducts from './components/home/FeaturedProducts';
import Testimonials from './components/home/Testimonials';
import SeoContent from './components/home/SeoContent';
import AiConciergeModal from './components/home/AiConciergeModal';
import ProductCatalogView from './components/catalog/ProductCatalogView';
import QuickViewModal from './components/catalog/QuickViewModal';
import AddedToCartModal from './components/catalog/AddedToCartModal';
import ProductDetailPage from './components/product/ProductDetailPage';
import CheckoutView from './components/checkout/CheckoutView';
import OrderTrackingView from './components/orders/OrderTrackingView';
import WishlistView from './components/wishlist/WishlistView';
import UserProfileView from './components/profile/UserProfileView';
import AdminDashboardView from './components/admin/AdminDashboardView';
import ResetPasswordView from './components/profile/ResetPasswordView';
import AllClubsView from './components/clubs/AllClubsView';
import ClubCategoryView from './components/clubs/ClubCategoryView';
import CategoryProductsView from './components/catalog/CategoryProductsView';
import SearchResultsView from './components/catalog/SearchResultsView';
import { useStore, getInitialGuestCart, getInitialGuestWishlist } from './store/useStore';
import { Product } from './types';
import { CheckCircle2 } from 'lucide-react';
import { getWhatsAppLink } from './utils/whatsapp';

export default function App() {
  const {
    activeTab,
    isCartOpen,
    setIsCartOpen,
    isAiModalOpen,
    setIsAiModalOpen,
    toastMessage,
    selectedProduct,
    setCategories,
    syncPath,
    selectedCategory,
    selectedSubcategory,
    categories,
    siteSettings,
    updateSiteSettings,
    setUser,
    setIsAuthLoading,
    loadUserCartAndWishlist,
    user,
    isAuthLoading,
    authPrompt,
    authPromptMode,
    setAuthPromptMode,
    closeAuthPrompt,
    setActiveTab,
    quickViewProduct,
    openQuickView,
    closeQuickView
  } = useStore();

  // Fetch Categories & Settings on Mount
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories);
          // Sync path initially after categories load
          syncPath(window.location.pathname);
        }
      })
      .catch((err) => console.error('Error fetching categories:', err));

    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          updateSiteSettings(data.settings);
        }
      })
      .catch((err) => console.error('Error fetching site settings:', err));

    // Restore authenticated user session
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then(async (data) => {
        if (data.success && data.user) {
          setUser(data.user);
          await loadUserCartAndWishlist();
        } else {
          setUser(null);
          const guestCart = getInitialGuestCart();
          const guestWishlist = getInitialGuestWishlist();
          useStore.setState({ cart: guestCart, wishlist: guestWishlist });
        }
      })
      .catch(() => {
        setUser(null);
        const guestCart = getInitialGuestCart();
        const guestWishlist = getInitialGuestWishlist();
        useStore.setState({ cart: guestCart, wishlist: guestWishlist });
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  // Listen to popstate event (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      syncPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // URL State Bar Synchronization
  useEffect(() => {
    let targetPath = '/';
    if (activeTab === 'home') {
      targetPath = '/';
    } else if (activeTab === 'catalog') {
      if (selectedCategory) {
        targetPath = `/category/${selectedCategory}`;
      } else {
        targetPath = '/shop';
      }
    } else if (activeTab === 'category_detail') {
      targetPath = `/category/${selectedCategory}`;
    } else if (activeTab === 'clubs') {
      targetPath = '/clubs';
    } else if (activeTab === 'club_category') {
      const isNational = categories.find((c) => c.slug === selectedCategory)?.parentId === 'cat-national-teams';
      const basePath = isNational ? '/national-teams' : '/clubs';
      if (selectedSubcategory) {
        const subCatObj = categories.find((c) => c.id === selectedSubcategory || c.slug === selectedSubcategory);
        const cleanSubSlug = subCatObj ? subCatObj.slug.replace(`${selectedCategory}-`, '') : selectedSubcategory;
        targetPath = `${basePath}/${selectedCategory}/${cleanSubSlug}`;
      } else {
        targetPath = `${basePath}/${selectedCategory}`;
      }
    } else if (activeTab === 'checkout') {
      targetPath = '/checkout';
    } else if (activeTab === 'order_tracking') {
      targetPath = '/track-order';
    } else if (activeTab === 'wishlist') {
      targetPath = '/wishlist';
    } else if (activeTab === 'profile') {
      targetPath = '/profile';
    } else if (activeTab === 'admin') {
      targetPath = '/admin';
    } else if (activeTab === 'reset_password') {
      targetPath = `/reset-password${window.location.search}`;
    } else if (activeTab === 'search') {
      targetPath = `/search?q=${encodeURIComponent(selectedCategory || '')}`;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, [activeTab, selectedCategory, selectedSubcategory, categories]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, selectedProduct]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      
      {/* Toast Notification Floating Pill */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-2.5 text-xs font-extrabold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      <SEO />
      <Navbar />

      {authPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-slate-200 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Login required</h2>
            <p className="mt-2 text-sm text-slate-600">{authPrompt.message}</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setAuthPromptMode('login');
                  closeAuthPrompt();
                  setActiveTab('profile');
                }}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-xs font-extrabold text-white hover:bg-emerald-600 cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setAuthPromptMode('signup');
                  closeAuthPrompt();
                  setActiveTab('profile');
                }}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-extrabold text-slate-800 hover:border-emerald-500 hover:text-emerald-700 cursor-pointer"
              >
                Sign Up
              </button>
            </div>
            <button onClick={closeAuthPrompt} className="mt-4 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer">
              Continue browsing
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div>
            <HeroSection />
            <PopularCategories />
            <FlashSale />
            <FeaturedProducts />
            <Testimonials />
            <SeoContent />
          </div>
        )}

        {activeTab === 'catalog' && (
          <ProductCatalogView onQuickView={(p) => openQuickView(p)} />
        )}

        {activeTab === 'clubs' && (
          <AllClubsView />
        )}

        {activeTab === 'club_category' && (
          <ClubCategoryView onQuickView={(p) => openQuickView(p)} />
        )}

        {activeTab === 'category_detail' && (
          <CategoryProductsView onQuickView={(p) => openQuickView(p)} />
        )}

        {activeTab === 'search' && (
          <SearchResultsView onQuickView={(p) => openQuickView(p)} />
        )}

        {activeTab === 'product_detail' && <ProductDetailPage />}

        {activeTab === 'checkout' && <CheckoutView />}

        {activeTab === 'order_tracking' && <OrderTrackingView />}

        {activeTab === 'wishlist' && <WishlistView />}

        {activeTab === 'profile' && <UserProfileView />}

        {activeTab === 'admin' && <AdminDashboardView />}

        {activeTab === 'reset_password' && <ResetPasswordView />}
      </main>

      {/* Slide-out Shopping Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* AI Assistant Modal */}
      <AiConciergeModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />

      {/* Quick View Product Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={closeQuickView}
      />

      {/* Added To Cart Confirmation Modal */}
      <AddedToCartModal />

      {/* Floating WhatsApp Button */}
      <a
        href={getWhatsAppLink(siteSettings?.whatsappNumber)}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-40 bg-[#25D366] hover:bg-[#20ba5c] text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
        aria-label="Chat on WhatsApp"
      >
        <svg
          className="w-6 h-6 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      {/* Footer */}
      <Footer />
    </div>
  );
}
