import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Trophy,
  Flag,
  ListOrdered,
  Users,
  Flame,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Settings,
  ShieldAlert,
  Loader2,
  Shirt,
  DollarSign,
  CreditCard,
  Truck,
  Percent,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  LogOut,
  Menu,
  X,
  Search,
  ArrowUpDown,
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Tags,
  ShieldCheck,
  Phone,
  MapPin,
  Ruler,
  Download,
  Mail,
  Calendar,
  Hash,
  Printer,
  Receipt
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Product, Order, Category, User, HeroSlide, SleeveBadgeOption, SizeChartItem } from '../../types';
import { RichTextEditor } from './RichTextEditor';
import { stripHtml } from '../../utils/sanitizeHtml';
import { ALL_KIDS_SIZES, DEFAULT_SIZE_CHART_VALUES, syncSizeChartWithSizes } from '../../utils/productUtils';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

function ImageUpload({ label, value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Supported formats: JPG, JPEG, PNG, WebP');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64data,
            filename: file.name
          })
        });
        const data = await res.json();
        if (data.success) {
          onChange(data.url);
        } else {
          setError(data.message || 'Upload failed');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
      <span className="font-bold text-slate-800 block text-xs">{label}</span>
      
      {value && (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-xs mb-1.5 group shrink-0 bg-white">
          <img src={value} alt="Preview" className="w-full h-full object-contain p-1.5" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute inset-0 bg-black/60 text-white font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] cursor-pointer border-none"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer inline-flex items-center gap-1 transition-colors border border-transparent shadow-xs">
          <span>{uploading ? 'Uploading...' : 'Select Local File'}</span>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {value && <span className="text-[9px] text-slate-400 font-mono truncate max-w-[150px]">{value}</span>}
      </div>

      {error && <p className="text-[10px] text-red-650 font-bold">{error}</p>}
    </div>
  );
}

function MultiImageUpload({ label, value, onChange }: { label: string; value: string[]; onChange: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Supported formats: JPG, JPEG, PNG, WebP');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64data,
            filename: file.name
          })
        });
        const data = await res.json();
        if (data.success) {
          onChange([...value, data.url]);
        } else {
          setError(data.message || 'Upload failed');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Upload failed');
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  };

  const moveImage = (idx: number, dir: 'up' | 'down') => {
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === value.length - 1) return;
    const next = [...value];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-3.5 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-black text-slate-900 block text-xs">{label}</span>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            Upload clear photographs of the jersey. First image acts as the primary catalog cover.
          </span>
        </div>

        <label className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl text-xs cursor-pointer inline-flex items-center gap-2 transition-all shadow-xs shrink-0 self-start sm:self-auto border-none">
          <Plus className="w-3.5 h-3.5" />
          <span>{uploading ? 'Uploading...' : 'Upload / Add Image'}</span>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
          {value.map((img, idx) => (
            <div
              key={idx}
              className={`relative rounded-2xl overflow-hidden border bg-white shadow-2xs group flex flex-col transition-all ${
                idx === 0 ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Image Preview */}
              <div className="aspect-square w-full bg-slate-50 relative flex items-center justify-center p-2 overflow-hidden">
                <img src={img} alt={`Jersey catalog ${idx + 1}`} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                
                {idx === 0 && (
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                    Cover Image
                  </span>
                )}
                
                <span className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                  #{idx + 1}
                </span>
              </div>

              {/* Action Bar */}
              <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveImage(idx, 'up')}
                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-20 text-slate-700 flex items-center justify-center cursor-pointer border-none text-xs font-bold"
                    title="Move image left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={idx === value.length - 1}
                    onClick={() => moveImage(idx, 'down')}
                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-20 text-slate-700 flex items-center justify-center cursor-pointer border-none text-xs font-bold"
                    title="Move image right"
                  >
                    →
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="w-6 h-6 rounded-md bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center cursor-pointer border-none transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white/70 text-center flex flex-col items-center justify-center">
          <ImageIcon className="w-8 h-8 text-slate-300 mb-1.5" />
          <span className="text-xs text-slate-600 font-bold">No jersey images uploaded yet</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Click &quot;Upload / Add Image&quot; above to select files from your computer (JPG, PNG, WebP)</span>
        </div>
      )}
    </div>
  );
}

type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'clubs'
  | 'national_teams'
  | 'subcategories'
  | 'inventory'
  | 'orders_all'
  | 'orders_pending'
  | 'orders_processing'
  | 'orders_shipped'
  | 'orders_delivered'
  | 'orders_cancelled'
  | 'customers'
  | 'deals'
  | 'trending'
  | 'hero_banners'
  | 'team_visibility'
  | 'content_seo'
  | 'settings_store'
  | 'settings_shipping'
  | 'settings_payment'
  | 'settings_customization_pricing'
  | 'settings_size_calculator'
  | 'sleeve_badges'
  | 'admin_profile'
  | 'role_manager'
  | 'customer_export'
  | 'top_customers';

export default function AdminDashboardView() {
  const { 
    showToast, user, setUser, setActiveTab, siteSettings, updateSiteSettings, isAuthLoading, setCategories,
    sleeveBadgeOptions, fetchAdminSleeveBadgeOptions, addSleeveBadgeOption, updateSleeveBadgeOption, deleteSleeveBadgeOption
  } = useStore();

  // Sidebar Layout States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const [roleAdmins, setRoleAdmins] = useState<User[]>([]);
  const [roleAdminForm, setRoleAdminForm] = useState({ name: '', phone: '', email: '', password: '', permissions: [] as string[] });
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [rolePreset, setRolePreset] = useState('');
  const [adminActivities, setAdminActivities] = useState<any[]>([]);
  const rolePermissions = ['dashboard.view', 'products.view', 'products.add', 'products.edit', 'products.delete', 'categories.view', 'categories.add', 'categories.edit', 'categories.delete', 'orders.view', 'orders.edit', 'customers.view', 'customers.edit', 'customers.export', 'customers.top', 'settings.view', 'settings.edit'];
  const can = (permission: string) => user?.role === 'super_admin' || user?.permissions?.includes(permission);

  const fetchRoleAdmins = async () => {
    const res = await fetch('/api/admin/role-manager');
    const data = await res.json();
    if (data.success) setRoleAdmins(data.users);
  };

  useEffect(() => {
    if (currentSection === 'role_manager' && user?.role === 'super_admin') {
      fetchRoleAdmins();
      fetch('/api/admin/role-manager/activity').then((res) => res.json()).then((data) => { if (data.success) setAdminActivities(data.activities); });
    }
  }, [currentSection, user]);

  const saveRoleAdmin = async () => {
    const url = editingAdminId ? `/api/admin/role-manager/${editingAdminId}` : '/api/admin/role-manager';
    const res = await fetch(url, { method: editingAdminId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...roleAdminForm, preset: rolePreset || undefined }) });
    const data = await res.json();
    if (!data.success) { showToast(data.message || 'Unable to save admin'); return; }
    showToast(editingAdminId ? 'Admin updated successfully' : 'Admin created successfully');
    setEditingAdminId(null);
    setRolePreset('');
    setRoleAdminForm({ name: '', phone: '', email: '', password: '', permissions: [] });
    fetchRoleAdmins();
  };

  // States & Handlers for Customer Data Export
  const [exportRange, setExportRange] = useState<'this_week' | 'this_month' | 'this_year' | 'custom'>('this_week');
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportToDate, setExportToDate] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [previewCount, setPreviewCount] = useState(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (currentSection !== 'customer_export') return;

    if (exportRange === 'custom') {
      if (!exportFromDate || !exportToDate) {
        setPreviewCount(0);
        return;
      }
      const start = new Date(exportFromDate);
      const end = new Date(exportToDate);
      if (start > end) {
        showToast('From date cannot be after To date.');
        setPreviewCount(0);
        return;
      }
    }

    const fetchPreviewCount = async () => {
      setIsPreviewLoading(true);
      try {
        let url = `/api/admin/customer-export/preview?range=${exportRange}`;
        if (exportRange === 'custom') {
          url += `&fromDate=${exportFromDate}&toDate=${exportToDate}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setPreviewCount(data.count || 0);
        } else {
          setPreviewCount(0);
          showToast(data.message || 'Failed to fetch export preview.');
        }
      } catch (err: any) {
        setPreviewCount(0);
        showToast('Error connecting to database api.');
      } finally {
        setIsPreviewLoading(false);
      }
    };

    fetchPreviewCount();
  }, [currentSection, exportRange, exportFromDate, exportToDate]);

  const handleDownloadExport = () => {
    if (exportRange === 'custom') {
      if (!exportFromDate || !exportToDate) {
        showToast('Please select both From and To dates.');
        return;
      }
      const start = new Date(exportFromDate);
      const end = new Date(exportToDate);
      if (start > end) {
        showToast('From date cannot be after To date.');
        return;
      }
    }

    let url = `/api/admin/customer-export/download?range=${exportRange}&format=${exportFormat}`;
    if (exportRange === 'custom') {
      url += `&fromDate=${exportFromDate}&toDate=${exportToDate}`;
    }

    window.location.href = url;
    showToast('Download initiated successfully!');
  };
  // Sidebar Collapsible Accordion States
  const [groupCatalogOpen, setGroupCatalogOpen] = useState(true);
  const [groupOrdersOpen, setGroupOrdersOpen] = useState(true);
  const [groupMarketingOpen, setGroupMarketingOpen] = useState(true);
  const [groupHomepageOpen, setGroupHomepageOpen] = useState(true);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(true);

  // Sleeve Badge States
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [isEditingBadge, setIsEditingBadge] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Partial<SleeveBadgeOption>>({});

  // Raw Database States
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(false);

  // States & Handlers for Top Customers
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [isTopCustomersLoading, setIsTopCustomersLoading] = useState(false);
  const [selectedTopCustomer, setSelectedTopCustomer] = useState<any | null>(null);

  const fetchTopCustomers = async () => {
    setIsTopCustomersLoading(true);
    try {
      const res = await fetch('/api/admin/top-customers');
      const data = await res.json();
      if (data.success) {
        setTopCustomers(data.topCustomers || []);
      } else {
        setTopCustomers([]);
        showToast(data.message || 'Failed to fetch top customers.');
      }
    } catch (err) {
      setTopCustomers([]);
      showToast('Error connecting to top customers API.');
    } finally {
      setIsTopCustomersLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection === 'top_customers') {
      fetchTopCustomers();
    }
  }, [currentSection, ordersList]);

  // Modal / Operations States
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productTeamType, setProductTeamType] = useState<'none' | 'club' | 'national'>('none');
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [selectedL1, setSelectedL1] = useState('');
  const [selectedL2, setSelectedL2] = useState('');
  const [selectedL3, setSelectedL3] = useState('');
  const [productSectionCollapsed, setProductSectionCollapsed] = useState<{ [key: string]: boolean }>({
    description: false,
    images: false,
    homepage: false,
    customization: false,
    sizes: false
  });
  const toggleProductSection = (sec: string) => {
    setProductSectionCollapsed((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({});

  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>({});

  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any>({});

  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide>>({});

  // View States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  // Search & Filters States
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productStockFilter, setProductStockFilter] = useState('');
  const [productSort, setProductSort] = useState('newest');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('');

  const [customerSearch, setCustomerSearch] = useState('');

  // Bulk Selection States
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Shadowed fetch wrapper to handle HTTP 401 response statuses uniformly
  const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const res = await window.fetch(input, init);
      if (res.status === 401) {
        showToast('Your admin session has expired. Please log in again.');
        setUser(null);
        setActiveTab('profile');
        throw new Error('Unauthorized');
      }
      return res;
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') throw err;
      throw err;
    }
  };

  // Fetch all databases from APIs
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes, catRes, userRes, slideRes] = await Promise.all([
        fetch('/api/products?limit=1000'),
        fetch('/api/orders/all'),
        fetch('/api/categories'),
        fetch('/api/admin/users'),
        fetch('/api/admin/hero-slides')
      ]);

      const prodData = await prodRes.json();
      const ordData = await ordRes.json();
      const catData = await catRes.json();
      const userData = await userRes.json();
      const slideData = await slideRes.json();

      if (prodData.success) setProductsList(prodData.products);
      if (ordData.success) setOrdersList(ordData.orders);
      if (catData.success) {
        setCategoriesList(catData.categories);
        setCategories(catData.categories);
      }
      if (userData.success) setUsersList(userData.users);
      if (slideData.success) setHeroSlides(slideData.slides);
      await fetchAdminSleeveBadgeOptions();
    } catch (err) {
      showToast('Error syncing system database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff')) {
      fetchData();
    }
  }, [user]);

  // Set product team type on edit categories changes
  useEffect(() => {
    if (editingProduct.categoryId) {
      const catObj = categoriesList.find((c) => c.id === editingProduct.categoryId);
      if (catObj?.parentId === 'cat-clubs') {
        setProductTeamType('club');
      } else if (catObj?.parentId === 'cat-national-teams') {
        setProductTeamType('national');
      } else {
        setProductTeamType('none');
      }
    } else {
      setProductTeamType('none');
    }
  }, [editingProduct.categoryId, categoriesList, productModalOpen]);

  // Set product three-level categories on edit changes
  useEffect(() => {
    if (productModalOpen && editingProduct) {
      if (editingProduct.categoryId) {
        const catL2 = categoriesList.find((c) => c.id === editingProduct.categoryId);
        if (catL2 && catL2.parentId) {
          // It's a team product where categoryId points to Level 2 (team) and parentId points to Level 1
          setSelectedL1(catL2.parentId);
          setSelectedL2(editingProduct.categoryId);
          setSelectedL3(editingProduct.subcategoryId || '');
        } else {
          // Standard two-level or one-level product
          setSelectedL1(editingProduct.categoryId);
          setSelectedL2(editingProduct.subcategoryId || '');
          setSelectedL3('');
        }
      } else {
        setSelectedL1('');
        setSelectedL2('');
        setSelectedL3('');
      }
    }
  }, [editingProduct, productModalOpen, categoriesList]);

  // Operations: Product CRUD
  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingProduct.id;
      const url = isEdit ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      const data = await res.json();

      if (data.success) {
        showToast(isEdit ? 'Product catalog updated' : 'Product successfully created');
        setProductModalOpen(false);
        fetchData();
      } else {
        showToast(data.message || 'Operation failed');
      }
    } catch (err) {
      showToast('Error processing product request');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Product deleted successfully.');
        fetchData();
      } else {
        showToast(data.message || 'Deletion failed');
      }
    } catch (err) {
      showToast('Error deleting product');
    }
  };

  const handleDuplicateProduct = (p: Product) => {
    const sizesList = p.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
    const nameLower = (p.name || '').toLowerCase();
    const isJersey = nameLower.includes('jersey') || nameLower.includes('kit') || (p.categoryName || '').toLowerCase().includes('player') || (p.categoryName || '').toLowerCase().includes('retro');
    const showSizeChart = Boolean(p.showSizeChart ?? p.sizeOptions?.showSizeChart);
    const sizeChart = Array.isArray(p.sizeChart) && p.sizeChart.length > 0
      ? p.sizeChart
      : (Array.isArray(p.sizeOptions?.sizeChart) && p.sizeOptions.sizeChart.length > 0
          ? p.sizeOptions.sizeChart
          : []);

    const sizeOptions = p.sizeOptions ? {
      ...p.sizeOptions,
      enabled: isJersey,
      required: isJersey,
      label: isJersey ? 'Select Jersey Size:' : 'Select Size:',
      sizes: sizesList,
      showKidsSizes: Boolean(p.showKidsSizes ?? p.sizeOptions.showKidsSizes),
      kidsSizes: p.kidsSizes || p.sizeOptions.kidsSizes || ALL_KIDS_SIZES,
      showSizeChart,
      sizeChart
    } : {
      enabled: isJersey,
      required: isJersey,
      label: isJersey ? 'Select Jersey Size:' : 'Select Size:',
      sizes: sizesList,
      showKidsSizes: Boolean(p.showKidsSizes),
      kidsSizes: p.kidsSizes || ALL_KIDS_SIZES,
      showSizeChart,
      sizeChart
    };

    const copy: Partial<Product> = {
      ...p,
      id: undefined,
      name: `${p.name} (Copy)`,
      sku: `COPY-${Math.floor(1000 + Math.random() * 9000)}`,
      slug: `${p.slug}-copy-${Math.floor(100 + Math.random() * 900)}`,
      showKidsSizes: Boolean(p.showKidsSizes ?? p.sizeOptions?.showKidsSizes),
      kidsSizes: p.kidsSizes || p.sizeOptions?.kidsSizes || ALL_KIDS_SIZES,
      showSizeChart,
      sizeChart,
      sizeOptions,
      createdAt: undefined,
      reviewCount: 0,
      rating: 5
    };
    setEditingProduct(copy);
    setProductModalOpen(true);
  };

  // Operations: Category / Team / Subcategory
  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingCategory.id;
      const url = isEdit ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory)
      });
      const data = await res.json();

      if (data.success) {
        showToast('Navbar Category updated successfully');
        setCategoryModalOpen(false);
        fetchData();
      } else {
        showToast(data.message || 'Operation failed');
      }
    } catch (err) {
      showToast('Error saving category');
    }
  };

  const handleSaveTeam = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingTeam.id;
      const url = isEdit ? `/api/categories/${editingTeam.id}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const body = {
        name: editingTeam.name,
        slug: editingTeam.slug,
        image: editingTeam.logo,
        banner: editingTeam.banner,
        parentId: editingTeam.type === 'club' ? 'cat-clubs' : 'cat-national-teams',
        displayOrder: Number(editingTeam.displayOrder),
        isActive: editingTeam.isActive
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        showToast(isEdit ? 'Team configurations saved' : 'New Fan zone team created');
        setTeamModalOpen(false);
        fetchData();
      } else {
        showToast(data.message || 'Operation failed');
      }
    } catch (err) {
      showToast('Error saving team settings');
    }
  };

  const handleSaveSubcategory = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingSub.id;
      const url = isEdit ? `/api/categories/${editingSub.id}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const body = {
        name: editingSub.name,
        slug: editingSub.slug,
        parentId: editingSub.teamId,
        displayOrder: Number(editingSub.displayOrder),
        isActive: editingSub.isActive
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        showToast('Subcategory settings saved');
        setSubModalOpen(false);
        fetchData();
      } else {
        showToast(data.message || 'Operation failed');
      }
    } catch (err) {
      showToast('Error saving subcategory');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Deleting this category will remove all subcategories. Continue?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Category successfully deleted');
        fetchData();
      } else {
        showToast(data.message || 'Deletion failed');
      }
    } catch (err) {
      showToast('Error deleting category');
    }
  };

  // Operations: Order Processing
  const handleUpdateOrderStatus = async (id: string, status: string, note?: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order status updated to: ${status.toUpperCase()}`);
        if (selectedOrder?.id === id) {
          setSelectedOrder(data.order);
        }
        fetchData();
      }
    } catch (err) {
      showToast('Failed to update order status');
    }
  };

  const handleUpdateOrderPaymentStatus = async (order: Order, paymentStatus: any) => {
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: order.orderStatus, paymentStatus, note: 'Payment status modified by Administrator' })
      });
      const data = await res.json();
      if (data.success) {
        order.paymentStatus = paymentStatus;
        showToast(`Payment status updated to: ${paymentStatus.toUpperCase()}`);
        setSelectedOrder({ ...order, paymentStatus });
        fetchData();
      }
    } catch (err) {
      showToast('Failed to update payment status');
    }
  };

  const handleUpdatePaymentVerificationStatus = async (order: Order, verificationStatus: 'pending' | 'verified' | 'rejected') => {
    try {
      const res = await fetch(`/api/orders/${order.id}/payment-verification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentVerificationStatus: verificationStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Payment verification marked as: ${verificationStatus.toUpperCase()}`);
        const updatedOrder = {
          ...order,
          paymentVerificationStatus: verificationStatus,
          paymentStatus: (verificationStatus === 'verified' ? 'paid' : order.paymentStatus) as 'pending' | 'paid' | 'failed' | 'refunded'
        };
        setSelectedOrder(updatedOrder);
        setOrdersList((prev) => prev.map((o) => o.id === order.id ? updatedOrder : o));
        fetchData();
      } else {
        showToast(data.message || 'Failed to update payment verification');
      }
    } catch (err) {
      showToast('Error connecting to server for payment verification');
    }
  };

  const handleSaveOrderNotes = (order: Order, notes: string) => {
    order.notes = notes;
    showToast('Internal order notes updated');
    setSelectedOrder({ ...order, notes });
    fetchData();
  };

  // Operations: Inventory
  const handleRestock = async (productId: string, quantity: number, notes?: string) => {
    try {
      const res = await fetch('/api/inventory/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, notes })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Stock levels successfully updated');
        fetchData();
      }
    } catch (err) {
      showToast('Failed updating inventory');
    }
  };

  // Operations: Customers
  const handleToggleCustomerStatus = async (c: User) => {
    const nextStatus = c.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${c.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`User status toggled to: ${nextStatus}`);
        if (selectedCustomer?.id === c.id) {
          setSelectedCustomer({ ...c, status: nextStatus });
        }
        fetchData();
      }
    } catch (err) {
      showToast('Failed to toggle customer account status');
    }
  };

  // Operations: Marketing Promotions
  const handleTogglePromotion = async (p: Product, promoType: 'featured' | 'isTrending' | 'isFlashSale') => {
    const updatedVal = !p[promoType];
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [promoType]: updatedVal })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Product promotion tag updated`);
        fetchData();
      }
    } catch (err) {
      showToast('Failed to update promotion');
    }
  };

  // Operations: Slides Banner
  const handleSaveSlide = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingSlide.id;
      const url = isEdit ? `/api/admin/hero-slides/${editingSlide.id}` : '/api/admin/hero-slides';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSlide)
      });
      const data = await res.json();
      if (data.success) {
        showToast(isEdit ? 'Hero slide updated' : 'Hero slide created');
        setSlideModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast('Error updating hero slides');
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!window.confirm('Delete this banner slide?')) return;
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Banner slide deleted successfully');
        fetchData();
      }
    } catch (err) {
      showToast('Error deleting slide');
    }
  };

  // Operations: Store Settings saving
  const handleSaveSettings = async (body: Partial<typeof siteSettings>) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        updateSiteSettings(data.settings);
        showToast('Store settings saved successfully');
      }
    } catch (err) {
      showToast('Failed saving store configurations');
    }
  };

  // Bulk Actions Handlers
  const handleBulkProductAction = async (action: 'activate' | 'deactivate' | 'delete' | 'assign_flash' | 'assign_trending') => {
    if (selectedProductIds.length === 0) {
      showToast('No products selected');
      return;
    }
    if (action === 'delete' && !window.confirm(`Delete ${selectedProductIds.length} selected products?`)) return;

    try {
      setLoading(true);
      for (const id of selectedProductIds) {
        if (action === 'delete') {
          await fetch(`/api/products/${id}`, { method: 'DELETE' });
        } else if (action === 'activate') {
          await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'active' }) });
        } else if (action === 'deactivate') {
          await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'draft' }) });
        } else if (action === 'assign_flash') {
          await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFlashSale: true }) });
        } else if (action === 'assign_trending') {
          await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isTrending: true }) });
        }
      }
      showToast(`Bulk action successfully executed`);
      setSelectedProductIds([]);
      fetchData();
    } catch (err) {
      showToast('Bulk operations failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOrderAction = async (status: string) => {
    if (selectedOrderIds.length === 0) {
      showToast('No orders selected');
      return;
    }
    try {
      setLoading(true);
      for (const id of selectedOrderIds) {
        await fetch(`/api/orders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, note: 'Bulk status update by Admin' })
        });
      }
      showToast(`Bulk orders updated successfully`);
      setSelectedOrderIds([]);
      fetchData();
    } catch (err) {
      showToast('Bulk orders operations failed');
    } finally {
      setLoading(false);
    }
  };

  // Analytics helper functions
  const totalProducts = productsList.length;
  const activeProducts = productsList.filter((p) => p.status === 'active').length;
  const totalOrders = ordersList.length;
  const pendingOrders = ordersList.filter((o) => o.orderStatus === 'pending').length;
  const processingOrders = ordersList.filter((o) => o.orderStatus === 'processing' || o.orderStatus === 'custom_printing').length;
  const completedOrders = ordersList.filter((o) => o.orderStatus === 'completed' || o.orderStatus === 'delivered').length;
  const cancelledOrders = ordersList.filter((o) => o.orderStatus === 'cancelled').length;

  const totalCustomers = usersList.filter((u) => u.role === 'customer').length;
  const totalCategories = categoriesList.filter((c) => !c.parentId).length;
  const totalClubs = categoriesList.filter((c) => c.parentId === 'cat-clubs').length;
  const totalNationalTeams = categoriesList.filter((c) => c.parentId === 'cat-national-teams').length;

  // Real Best Sellers calculation
  const calculatedBestSellers = () => {
    const record: Record<string, { product: Product; quantity: number; revenue: number }> = {};
    ordersList.forEach((order) => {
      order.items.forEach((item) => {
        const prod = productsList.find((p) => p.id === item.productId);
        if (prod) {
          if (!record[prod.id]) {
            record[prod.id] = { product: prod, quantity: 0, revenue: 0 };
          }
          record[prod.id].quantity += item.quantity;
          record[prod.id].revenue += item.price * item.quantity;
        }
      });
    });
    return Object.values(record)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // Revenue Math
  const getTodaySales = () => {
    const today = new Date().toDateString();
    return ordersList
      .filter((o) => new Date(o.createdAt).toDateString() === today)
      .reduce((sum, o) => sum + o.totalAmount, 0);
  };

  const getWeekSales = () => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return ordersList
      .filter((o) => now - new Date(o.createdAt).getTime() < oneWeek)
      .reduce((sum, o) => sum + o.totalAmount, 0);
  };

  const getMonthSales = () => {
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    return ordersList
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d.getMonth() === curMonth && d.getFullYear() === curYear;
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);
  };

  // Lists filtering & sorting helpers
  const filteredProducts = productsList
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = productCategoryFilter ? p.categoryId === productCategoryFilter || p.subcategoryId === productCategoryFilter : true;
      let matchStock = true;
      if (productStockFilter === 'instock') matchStock = p.stock > p.lowStockAlert;
      else if (productStockFilter === 'lowstock') matchStock = p.stock <= p.lowStockAlert && p.stock > 0;
      else if (productStockFilter === 'out') matchStock = p.stock <= 0;
      return matchSearch && matchCat && matchStock;
    })
    .sort((a, b) => {
      if (productSort === 'price_asc') return a.price - b.price;
      if (productSort === 'price_desc') return b.price - a.price;
      if (productSort === 'stock_asc') return a.stock - b.stock;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getFilteredOrders = (status?: string) => {
    return ordersList.filter((o) => {
      const matchStatus = status ? o.orderStatus === status : true;
      const matchSearch =
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customerPhone.includes(orderSearch) ||
        (o.paymentMobileNumber && o.paymentMobileNumber.includes(orderSearch)) ||
        (o.transactionId && o.transactionId.toLowerCase().includes(orderSearch.toLowerCase())) ||
        (o.paymentDetails?.transactionId && o.paymentDetails.transactionId.toLowerCase().includes(orderSearch.toLowerCase()));
      const matchPay = orderPaymentFilter
        ? (o.paymentVerificationStatus === orderPaymentFilter || o.paymentStatus === orderPaymentFilter)
        : true;
      return matchStatus && matchSearch && matchPay;
    });
  };

  const filteredCustomers = usersList
    .filter((u) => u.role === 'customer')
    .filter((u) => {
      const q = customerSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    });

  // Authentication Loading State
  if (isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-16 h-16 text-emerald-600 mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-black text-slate-900 uppercase">Checking session...</h2>
        <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
          Please wait while we restore your administrative session.
        </p>
      </div>
    );
  }

  // Authentication Lock
  if (!user || (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'staff')) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-900 uppercase">Access Denied</h2>
        <p className="text-slate-550 mt-2 text-sm max-w-md mx-auto">
          You do not have permission to access the administration dashboard interface. Please log in with an authorized staff credential.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col md:flex-row antialiased">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0 md:w-16'
        } bg-slate-950 text-slate-400 border-r border-slate-900 shadow-xl transition-all duration-300 flex flex-col shrink-0 overflow-hidden relative z-30`}
      >
        <div className="p-5 flex items-center justify-between border-b border-slate-900 bg-slate-950">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <span className="font-black text-white text-xs uppercase tracking-widest truncate">
                JMB-BD Admin
              </span>
            </div>
          ) : (
            <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-slate-400 hover:text-white cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>

          {user.role === 'super_admin' && (
            <button
              onClick={() => setCurrentSection('role_manager')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all border-none text-left cursor-pointer ${currentSection === 'role_manager' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-900 hover:text-slate-100'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              {sidebarOpen && <span>Role Manager</span>}
            </button>
          )}
        </div>

        {/* Navigation Sidebar List */}
        <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-1.5 scrollbar-thin">
          {/* Dashboard Item */}
          <button
            onClick={() => setCurrentSection('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all border-none text-left cursor-pointer ${
              currentSection === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            {sidebarOpen && <span>Dashboard Overview</span>}
          </button>

          {/* Catalog Collapsible group */}
          <div className="space-y-1">
            <button
              onClick={() => setGroupCatalogOpen(!groupCatalogOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-slate-900 text-slate-500 hover:text-slate-300 border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                {sidebarOpen && <span>Catalog</span>}
              </div>
              {sidebarOpen && (groupCatalogOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
            </button>
            {groupCatalogOpen && sidebarOpen && (
              <div className="pl-4 space-y-0.5 border-l border-slate-900 ml-5">
                {[
                  { section: 'products', name: 'Products', icon: Package, permission: 'products.view' },
                  { section: 'categories', name: 'Categories', icon: FolderTree, permission: 'categories.view' },
                  { section: 'clubs', name: 'Clubs', icon: Trophy },
                  { section: 'national_teams', name: 'National Teams', icon: Flag },
                  { section: 'subcategories', name: 'Subcategories', icon: Tags },
                  { section: 'sleeve_badges', name: 'Sleeve / Badges', icon: Shirt },
                  { section: 'inventory', name: 'Inventory Logs', icon: Package, permission: 'products.view' }
                ].filter((item) => !item.permission || can(item.permission)).map((item) => (
                  <button
                    key={item.section}
                    onClick={() => setCurrentSection(item.section as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none text-left cursor-pointer ${
                      currentSection === item.section
                        ? 'bg-slate-800 text-white font-extrabold'
                        : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Orders Collapsible group */}
          <div className="space-y-1">
            <button
              onClick={() => setGroupOrdersOpen(!groupOrdersOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-slate-900 text-slate-500 hover:text-slate-300 border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ListOrdered className="w-4 h-4" />
                {sidebarOpen && <span>Orders</span>}
              </div>
              {sidebarOpen && (groupOrdersOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
            </button>
            {groupOrdersOpen && sidebarOpen && (
              <div className="pl-4 space-y-0.5 border-l border-slate-900 ml-5">
                {[
                  { section: 'orders_all', name: 'All Orders', count: ordersList.length },
                  { section: 'orders_pending', name: 'Pending', count: ordersList.filter((o) => o.orderStatus === 'pending').length },
                  { section: 'orders_processing', name: 'Processing', count: ordersList.filter((o) => o.orderStatus === 'processing' || o.orderStatus === 'custom_printing').length },
                  { section: 'orders_shipped', name: 'Shipped', count: ordersList.filter((o) => o.orderStatus === 'shipped').length },
                  { section: 'orders_delivered', name: 'Delivered', count: ordersList.filter((o) => o.orderStatus === 'delivered' || o.orderStatus === 'completed').length },
                  { section: 'orders_cancelled', name: 'Cancelled', count: ordersList.filter((o) => o.orderStatus === 'cancelled').length }
                ].filter(() => can('orders.view')).map((item) => (
                  <button
                    key={item.section}
                    onClick={() => setCurrentSection(item.section as any)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none text-left cursor-pointer ${
                      currentSection === item.section
                        ? 'bg-slate-800 text-white font-extrabold'
                        : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded font-black text-slate-500">
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customers Item */}
          {can('customers.view') && <button
            onClick={() => setCurrentSection('customers')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all border-none text-left cursor-pointer ${
              currentSection === 'customers'
                ? 'bg-slate-850 text-white shadow-md'
                : 'hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            {sidebarOpen && <span>Customers</span>}
          </button>}

          {/* Customer Export Item */}
          {can('customers.export') && <button
            onClick={() => setCurrentSection('customer_export')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all border-none text-left cursor-pointer ${
              currentSection === 'customer_export'
                ? 'bg-slate-850 text-white shadow-md'
                : 'hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <Download className="w-4 h-4" />
            {sidebarOpen && <span>Customer Export</span>}
          </button>}

          {/* Top Customers Item */}
          {can('customers.top') && <button
            onClick={() => setCurrentSection('top_customers')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all border-none text-left cursor-pointer ${
              currentSection === 'top_customers'
                ? 'bg-slate-850 text-white shadow-md'
                : 'hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            {sidebarOpen && <span>Top Customers</span>}
          </button>}

          {/* Marketing Collapsible group */}
          <div className="space-y-1">
            <button
              onClick={() => setGroupMarketingOpen(!groupMarketingOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-slate-900 text-slate-500 hover:text-slate-300 border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Percent className="w-4 h-4" />
                {sidebarOpen && <span>Marketing</span>}
              </div>
              {sidebarOpen && (groupMarketingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
            </button>
            {groupMarketingOpen && sidebarOpen && (
              <div className="pl-4 space-y-0.5 border-l border-slate-900 ml-5">
                {[
                  { section: 'deals', name: 'Limited Deals', icon: Flame },
                  { section: 'trending', name: 'Trending Gear', icon: Sparkles }
                ].map((item) => (
                  <button
                    key={item.section}
                    onClick={() => setCurrentSection(item.section as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none text-left cursor-pointer ${
                      currentSection === item.section
                        ? 'bg-slate-800 text-white font-extrabold'
                        : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Homepage settings collapsible group */}
          <div className="space-y-1">
            <button
              onClick={() => setGroupHomepageOpen(!groupHomepageOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-slate-900 text-slate-500 hover:text-slate-300 border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="w-4 h-4" />
                {sidebarOpen && <span>Homepage</span>}
              </div>
              {sidebarOpen && (groupHomepageOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
            </button>
            {groupHomepageOpen && sidebarOpen && (
              <div className="pl-4 space-y-0.5 border-l border-slate-900 ml-5">
                {[
                  { section: 'hero_banners', name: 'Hero/Banners', icon: ImageIcon },
                  { section: 'team_visibility', name: 'Team Section', icon: Trophy }
                ].map((item) => (
                  <button
                    key={item.section}
                    onClick={() => setCurrentSection(item.section as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none text-left cursor-pointer ${
                      currentSection === item.section
                        ? 'bg-slate-800 text-white font-extrabold'
                        : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SEO Content */}
          <button
            onClick={() => setCurrentSection('content_seo')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all border-none text-left cursor-pointer ${
              currentSection === 'content_seo'
                ? 'bg-slate-850 text-white shadow-md'
                : 'hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            {sidebarOpen && <span>SEO Content</span>}
          </button>

          {/* Store Settings Collapsible Group */}
          <div className="space-y-1">
            <button
              onClick={() => setGroupSettingsOpen(!groupSettingsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] uppercase font-bold tracking-wider hover:bg-slate-900 text-slate-500 hover:text-slate-300 border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                {sidebarOpen && <span>Store Settings</span>}
              </div>
              {sidebarOpen && (groupSettingsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
            </button>
            {groupSettingsOpen && sidebarOpen && (
              <div className="pl-4 space-y-0.5 border-l border-slate-900 ml-5">
                {[
                  { section: 'settings_store', name: 'Store Details', icon: Settings },
                  { section: 'settings_customization_pricing', name: 'Customization Pricing', icon: DollarSign },
                  { section: 'settings_size_calculator', name: 'Size Calculator', icon: Ruler },
                  { section: 'settings_shipping', name: 'Shipping Rates', icon: Truck },
                  { section: 'settings_payment', name: 'Payment Gateways', icon: CreditCard },
                  { section: 'admin_profile', name: 'Admin Profile', icon: ShieldCheck }
                ].map((item) => (
                  <button
                    key={item.section}
                    onClick={() => setCurrentSection(item.section as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none text-left cursor-pointer ${
                      currentSection === item.section
                        ? 'bg-slate-800 text-white font-extrabold'
                        : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 relative z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-650 hover:text-slate-900 cursor-pointer border-none bg-transparent"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-extrabold text-sm uppercase text-slate-900 tracking-wider">
              {currentSection.replace('_', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold block text-slate-900">{user.name}</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 font-black px-2 py-0.5 rounded-full uppercase">
                {user.role}
              </span>
            </div>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl cursor-pointer border-none bg-transparent"
              title="Refresh store"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* DYNAMIC MIDDLE CONTAINER */}
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto space-y-6">
          {loading && (
            <div className="bg-emerald-600 text-white px-4 py-2 text-xs rounded-xl flex items-center gap-2 font-bold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synchronizing databases in real time...
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: DASHBOARD OVERVIEW */}
          {/* ========================================================================= */}
          {currentSection === 'role_manager' && user.role === 'super_admin' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
                <h2 className="text-base font-black text-slate-900 uppercase border-b border-slate-100 pb-3">Role Manager</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                  <input placeholder="Your name" value={roleAdminForm.name} onChange={(e) => setRoleAdminForm({ ...roleAdminForm, name: e.target.value })} className="bg-slate-50 text-xs px-3 py-2.5 rounded-xl border border-slate-300" />
                  <input placeholder="Your phone number" value={roleAdminForm.phone} onChange={(e) => setRoleAdminForm({ ...roleAdminForm, phone: e.target.value })} className="bg-slate-50 text-xs px-3 py-2.5 rounded-xl border border-slate-300" />
                  <input placeholder="Optional email" value={roleAdminForm.email} onChange={(e) => setRoleAdminForm({ ...roleAdminForm, email: e.target.value })} className="bg-slate-50 text-xs px-3 py-2.5 rounded-xl border border-slate-300" />
                  {!editingAdminId && <input type="password" placeholder="Enter password" value={roleAdminForm.password} onChange={(e) => setRoleAdminForm({ ...roleAdminForm, password: e.target.value })} className="bg-slate-50 text-xs px-3 py-2.5 rounded-xl border border-slate-300" />}
                  <select value={rolePreset} onChange={(e) => setRolePreset(e.target.value)} className="bg-slate-50 text-xs px-3 py-2.5 rounded-xl border border-slate-300"><option value="">Custom Permissions</option><option value="order_manager">Order Manager</option><option value="product_manager">Product Manager</option><option value="customer_manager">Customer Manager</option></select>
                </div>
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {rolePermissions.map((permission) => <label key={permission} className="text-[10px] font-bold text-slate-600 flex items-center gap-2"><input type="checkbox" checked={roleAdminForm.permissions.includes(permission)} onChange={(e) => setRoleAdminForm({ ...roleAdminForm, permissions: e.target.checked ? [...roleAdminForm.permissions, permission] : roleAdminForm.permissions.filter((item) => item !== permission) })} />{permission}</label>)}
                </div>
                <button onClick={saveRoleAdmin} className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer">{editingAdminId ? 'Save Admin' : 'Create Admin'}</button>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr><th className="p-4">Name</th><th className="p-4">Mobile</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody>{roleAdmins.map((admin) => <tr key={admin.id} className="border-t border-slate-100"><td className="p-4 font-bold">{admin.name}</td><td className="p-4">{admin.phone || 'N/A'}</td><td className="p-4 uppercase">{admin.role}</td><td className="p-4">{admin.status}</td><td className="p-4 flex gap-2"><button disabled={admin.role === 'super_admin'} onClick={() => { setEditingAdminId(admin.id); setRoleAdminForm({ name: admin.name, phone: admin.phone || '', email: admin.email || '', password: '', permissions: admin.permissions || [] }); }} className="text-emerald-700 font-bold cursor-pointer disabled:opacity-40">Edit</button><button disabled={admin.role === 'super_admin'} onClick={async () => { await fetch(`/api/admin/role-manager/${admin.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: admin.status === 'active' ? 'disabled' : 'active' }) }); fetchRoleAdmins(); }} className="text-amber-700 font-bold cursor-pointer disabled:opacity-40">{admin.status === 'active' ? 'Disable' : 'Enable'}</button><button disabled={admin.role === 'super_admin'} onClick={async () => { if (window.confirm('Are you sure you want to delete this Admin?')) { await fetch(`/api/admin/role-manager/${admin.id}`, { method: 'DELETE' }); fetchRoleAdmins(); } }} className="text-red-700 font-bold cursor-pointer disabled:opacity-40">Delete</button></td></tr>)}</tbody></table>
              </div>
              <div className="mt-6 border-t border-slate-100 pt-4"><h3 className="text-xs font-black uppercase text-slate-700 mb-3">Recent Admin Activity</h3><div className="space-y-2 max-h-48 overflow-y-auto">{adminActivities.map((activity, index) => <div key={activity._id || index} className="text-[10px] text-slate-600 flex justify-between gap-3"><span><strong>{activity.action}</strong> - {activity.targetAdminName}</span><span>{new Date(activity.createdAt).toLocaleString()}</span></div>)}</div></div>
            </div>
          )}
          {currentSection === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Business Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Total Revenue', value: `৳${ordersList.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}`, desc: 'Total sales generated', icon: DollarSign, color: 'bg-emerald-55 text-emerald-800 border-emerald-100' },
                  { title: 'Completed Orders', value: completedOrders, desc: 'Shipped or Delivered packages', icon: Check, color: 'bg-slate-100 text-slate-800 border-slate-200' },
                  { title: 'Pending Orders', value: pendingOrders, desc: 'Voucher validation awaiting', icon: AlertCircle, color: 'bg-amber-50 text-amber-800 border-amber-200' },
                  { title: 'Total Customers', value: totalCustomers, desc: 'Registered shopper profiles', icon: Users, color: 'bg-indigo-50 text-indigo-850 border-indigo-200' }
                ].map((card, idx) => (
                  <div key={idx} className={`p-4 rounded-3xl border shadow-xs flex items-center justify-between bg-white ${card.color}`}>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{card.title}</span>
                      <h3 className="text-lg font-black mt-1 leading-none">{card.value}</h3>
                      <span className="text-[9px] text-slate-400 block mt-1">{card.desc}</span>
                    </div>
                    <card.icon className="w-8 h-8 opacity-40" />
                  </div>
                ))}
              </div>

              {/* Status details card stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Products', val: totalProducts },
                  { label: 'Active items', val: activeProducts },
                  { label: 'Total Orders', val: totalOrders },
                  { label: 'Processing', val: processingOrders },
                  { label: 'Cancelled', val: cancelledOrders },
                  { label: 'Teams', val: totalClubs + totalNationalTeams }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">{item.label}</span>
                    <span className="text-base font-black text-slate-900 block mt-1">{item.val}</span>
                  </div>
                ))}
              </div>

              {/* Sales analytics section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs uppercase font-black text-slate-900 tracking-wider">Revenue & Sales Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border-r border-slate-100 p-2">
                    <span className="text-[10px] text-slate-400 font-bold block">Today's Sales</span>
                    <span className="text-base font-black text-slate-900 block mt-1">৳{getTodaySales().toLocaleString()}</span>
                  </div>
                  <div className="border-r border-slate-100 p-2">
                    <span className="text-[10px] text-slate-400 font-bold block">This Week</span>
                    <span className="text-base font-black text-slate-900 block mt-1">৳{getWeekSales().toLocaleString()}</span>
                  </div>
                  <div className="border-r border-slate-100 p-2">
                    <span className="text-[10px] text-slate-400 font-bold block">This Month</span>
                    <span className="text-base font-black text-slate-900 block mt-1">৳{getMonthSales().toLocaleString()}</span>
                  </div>
                  <div className="p-2">
                    <span className="text-[10px] text-slate-400 font-bold block">Total Profit Revenue</span>
                    <span className="text-base font-black text-emerald-800 block mt-1">৳{ordersList.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Tables: Recent orders & Best sellers grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent orders */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-150 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase">Recent Orders</h3>
                    <button
                      onClick={() => setCurrentSection('orders_all')}
                      className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full cursor-pointer hover:bg-emerald-100 border-none"
                    >
                      View All Orders
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[9px] uppercase font-bold text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {ordersList.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50">
                            <td className="p-3 font-extrabold text-slate-900">{ord.orderNumber}</td>
                            <td className="p-3 font-bold truncate max-w-[120px]">{ord.customerName}</td>
                            <td className="p-3 font-bold">৳{ord.totalAmount.toLocaleString()}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                ord.orderStatus === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ord.orderStatus === 'delivered' || ord.orderStatus === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ord.orderStatus === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {ord.orderStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Best Sellers */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
                  <div className="border-b pb-2 mb-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase">Best-Selling Jerseys</h3>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {calculatedBestSellers().length > 0 ? (
                      calculatedBestSellers().map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 border-b border-slate-50 pb-2">
                           {item.product.images && item.product.images.length > 0 && item.product.images[0] ? (
                             <img
                               src={item.product.images[0]}
                               alt={item.product.name}
                               className="w-10 h-10 object-contain p-1 rounded-lg bg-slate-100 shrink-0"
                             />
                           ) : (
                             <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                               <Shirt className="w-4 h-4 opacity-45" />
                             </div>
                           )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{item.product.name}</h4>
                            <span className="text-[10px] text-slate-400 block font-mono">{item.product.sku}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 block">{item.quantity} units</span>
                            <span className="text-[9px] text-slate-400 block">৳{item.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-6 text-center">No sales recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: PRODUCT CATALOG MANAGEMENT */}
          {/* ========================================================================= */}
          {currentSection === 'products' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Product header search inputs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md bg-white border border-slate-200 rounded-2xl px-3.5 py-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by jersey name, SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-slate-800 outline-none border-none focus:ring-0"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Category Filter */}
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="bg-white border rounded-xl p-2 cursor-pointer outline-none"
                  >
                    <option value="">All Categories</option>
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parentName ? `${c.parentName} > ` : ''}
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Stock filter */}
                  <select
                    value={productStockFilter}
                    onChange={(e) => setProductStockFilter(e.target.value)}
                    className="bg-white border rounded-xl p-2 cursor-pointer outline-none"
                  >
                    <option value="">All Stock levels</option>
                    <option value="instock">In Stock Only</option>
                    <option value="lowstock">Low Stock Alerts</option>
                    <option value="out">Out of Stock Only</option>
                  </select>

                  {/* Sort */}
                  <select
                    value={productSort}
                    onChange={(e) => setProductSort(e.target.value)}
                    className="bg-white border rounded-xl p-2 cursor-pointer outline-none"
                  >
                    <option value="newest">Sort by Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="stock_asc">Stock: Low to High</option>
                  </select>

                  <button
                    onClick={() => {
                      setEditingProduct({
                        name: '',
                        sku: `JM-BD-${Math.floor(1000 + Math.random() * 9000)}`,
                        price: 1850,
                        discountPercent: 20,
                        salePrice: 1480,
                        categoryId: '',
                        categoryName: '',
                        subcategoryId: '',
                        subcategoryName: '',
                        stock: 30,
                        sizes: ['S', 'M', 'L', 'XL'],
                        showKidsSizes: false,
                        kidsSizes: ALL_KIDS_SIZES,
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
                          showKidsSizes: false,
                          kidsSizes: ALL_KIDS_SIZES,
                          showSizeChart: false,
                          sizeChart: [
                            { size: 'S', length: 26, chest: 36 },
                            { size: 'M', length: 27, chest: 38 },
                            { size: 'L', length: 28, chest: 40 },
                            { size: 'XL', length: 29, chest: 42 }
                          ]
                        },
                        images: [],
                        allowCustomPrint: true,
                        isFlashSale: false,
                        featured: false,
                        isTrending: false,
                        specifications: [],
                        colors: [{ name: 'Standard', hex: '#006a4e' }],
                        tags: ['Jersey', 'Sports'],
                        status: 'active',
                        sleeveBadges: sleeveBadgeOptions.filter(b => b.isActive).map(b => b.id)
                      });
                      setProductModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-3 rounded-xl transition-all cursor-pointer shadow-md border-none flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
              </div>

              {/* Bulk actions block */}
              {selectedProductIds.length > 0 && (
                <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between text-xs font-bold gap-3 shadow-md">
                  <span>Selected {selectedProductIds.length} products</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkProductAction('activate')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded cursor-pointer border-none text-[10px]"
                    >
                      Bulk Activate
                    </button>
                    <button
                      onClick={() => handleBulkProductAction('deactivate')}
                      className="bg-slate-700 hover:bg-slate-650 text-white px-2.5 py-1 rounded cursor-pointer border-none text-[10px]"
                    >
                      Bulk Draft
                    </button>
                    <button
                      onClick={() => handleBulkProductAction('assign_flash')}
                      className="bg-indigo-650 hover:bg-indigo-750 text-white px-2.5 py-1 rounded cursor-pointer border-none text-[10px]"
                    >
                      Assign Deal
                    </button>
                    <button
                      onClick={() => handleBulkProductAction('assign_trending')}
                      className="bg-teal-650 hover:bg-teal-750 text-white px-2.5 py-1 rounded cursor-pointer border-none text-[10px]"
                    >
                      Assign Trending
                    </button>
                    <button
                      onClick={() => handleBulkProductAction('delete')}
                      className="bg-red-650 hover:bg-red-750 text-white px-2.5 py-1 rounded cursor-pointer border-none text-[10px]"
                    >
                      Delete Selection
                    </button>
                  </div>
                </div>
              )}

              {/* Table list */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-750">
                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedProductIds(filteredProducts.map((p) => p.id));
                              else setSelectedProductIds([]);
                            }}
                            className="cursor-pointer"
                          />
                        </th>
                        <th className="p-4">Jersey Product</th>
                        <th className="p-4">SKU / Category</th>
                        <th className="p-4">Pricing</th>
                        <th className="p-4">Stock Levels</th>
                        <th className="p-4">Flags</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredProducts.map((p) => {
                        const isSelected = selectedProductIds.includes(p.id);
                        return (
                          <tr key={p.id} className={`hover:bg-slate-50 ${isSelected ? 'bg-slate-50/50' : ''}`}>
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedProductIds([...selectedProductIds, p.id]);
                                  else setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                                }}
                                className="cursor-pointer"
                              />
                            </td>

                            <td className="p-4 flex items-center gap-3">
                               {p.images && p.images.length > 0 && p.images[0] ? (
                                 <img
                                   src={p.images[0]}
                                   alt={p.name}
                                   className="w-12 h-12 object-contain p-1 rounded-xl bg-slate-100 shrink-0"
                                 />
                               ) : (
                                 <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                   <Shirt className="w-5 h-5 opacity-45 animate-pulse" />
                                 </div>
                               )}
                              <div>
                                <h4 className="font-bold text-slate-900 leading-tight">{p.name}</h4>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Rating: {p.rating}★ ({p.reviewCount} reviews)
                                </span>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="font-mono text-slate-900 font-bold block">{p.sku}</span>
                              <span className="text-slate-400 text-[10px]">
                                {p.categoryName} {p.subcategoryName ? `> ${p.subcategoryName}` : ''}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className="font-bold text-slate-900 block">৳{(p.salePrice || p.price).toLocaleString()}</span>
                              {p.salePrice && (
                                <div className="text-[10px] text-slate-400 space-x-1">
                                  <span className="line-through">৳{p.price.toLocaleString()}</span>
                                  {p.discountPercent && p.discountPercent > 0 ? (
                                    <span className="text-red-650 font-extrabold">({p.discountPercent}% OFF)</span>
                                  ) : null}
                                </div>
                              )}
                            </td>

                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                p.stock <= 0
                                  ? 'bg-red-100 text-red-800'
                                  : p.stock <= p.lowStockAlert
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {p.stock} Units
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {p.featured && <span className="text-[8px] bg-emerald-100 text-emerald-850 px-1 rounded uppercase font-bold">Featured</span>}
                                {p.isTrending && <span className="text-[8px] bg-teal-100 text-teal-850 px-1 rounded uppercase font-bold">Trending</span>}
                                {p.isFlashSale && <span className="text-[8px] bg-rose-100 text-rose-850 px-1 rounded uppercase font-bold">Deal</span>}
                                {p.status === 'draft' && <span className="text-[8px] bg-slate-100 text-slate-800 px-1 rounded uppercase font-bold">Draft</span>}
                              </div>
                            </td>

                            <td className="p-4 text-right space-x-1.5">
                              <button
                                onClick={() => handleDuplicateProduct(p)}
                                className="p-1.5 text-slate-400 hover:text-indigo-650 cursor-pointer border-none bg-transparent"
                                title="Duplicate product"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const sizesList = p.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
                                  const nameLower = (p.name || '').toLowerCase();
                                  const isJersey = nameLower.includes('jersey') || nameLower.includes('kit') || (p.categoryName || '').toLowerCase().includes('player') || (p.categoryName || '').toLowerCase().includes('retro');
                                  const showSizeChart = Boolean(p.showSizeChart ?? p.sizeOptions?.showSizeChart);
                                  const sizeChart = Array.isArray(p.sizeChart) && p.sizeChart.length > 0
                                    ? p.sizeChart
                                    : (Array.isArray(p.sizeOptions?.sizeChart) && p.sizeOptions.sizeChart.length > 0
                                        ? p.sizeOptions.sizeChart
                                        : []);

                                  const sizeOptions = p.sizeOptions ? {
                                    ...p.sizeOptions,
                                    enabled: isJersey,
                                    required: isJersey,
                                    label: isJersey ? 'Select Jersey Size:' : 'Select Size:',
                                    sizes: sizesList,
                                    showKidsSizes: Boolean(p.showKidsSizes ?? p.sizeOptions.showKidsSizes),
                                    kidsSizes: p.kidsSizes || p.sizeOptions.kidsSizes || ALL_KIDS_SIZES,
                                    showSizeChart,
                                    sizeChart
                                  } : {
                                    enabled: isJersey,
                                    required: isJersey,
                                    label: isJersey ? 'Select Jersey Size:' : 'Select Size:',
                                    sizes: sizesList,
                                    showKidsSizes: Boolean(p.showKidsSizes),
                                    kidsSizes: p.kidsSizes || ALL_KIDS_SIZES,
                                    showSizeChart,
                                    sizeChart
                                  };

                                  setEditingProduct({
                                    ...p,
                                    showSizeChart,
                                    sizeChart,
                                    showKidsSizes: Boolean(p.showKidsSizes ?? p.sizeOptions?.showKidsSizes),
                                    kidsSizes: p.kidsSizes || p.sizeOptions?.kidsSizes || ALL_KIDS_SIZES,
                                    sizeOptions
                                  });
                                  setProductModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 cursor-pointer border-none bg-transparent"
                                title="Edit Product details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {(user.role === 'super_admin' || user.permissions?.includes('products.delete')) && (
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-650 cursor-pointer border-none bg-transparent"
                                  title="Delete permanently"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: CATEGORIES MANAGEMENT */}
          {/* ========================================================================= */}
          {currentSection === 'categories' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Navbar & Catalog Categories</h2>
                <button
                  onClick={() => {
                    setEditingCategory({
                      name: '',
                      slug: '',
                      image: '',
                      banner: '',
                      parentId: '',
                      isActive: true,
                      navbarLocation: 'main',
                      navbarPosition: categoriesList.length + 1
                    });
                    setIsEditingCategory(false);
                    setCategoryModalOpen(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold p-2 px-3 rounded-xl border-none shadow-xs text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Navbar Category
                </button>
              </div>

              {/* Categories list */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-4">Category Image</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Slug</th>
                        <th className="p-4">Navbar Location</th>
                        <th className="p-4">Display Position</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {categoriesList
                        .filter((c) => !c.parentId) // Only parent level
                        .map((cat) => (
                          <tr key={cat.id} className="hover:bg-slate-50">
                            <td className="p-4">
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-12 h-10 object-contain p-1 rounded-lg bg-slate-100"
                              />
                            </td>
                            <td className="p-4 font-bold text-slate-900">{cat.name}</td>
                            <td className="p-4 font-mono font-bold text-slate-500">{cat.slug}</td>
                            <td className="p-4 uppercase text-[10px] font-black">{cat.navbarLocation || 'hidden'}</td>
                            <td className="p-4">{cat.navbarPosition || 99}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                cat.isActive ? 'bg-emerald-100 text-emerald-850' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {cat.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setIsEditingCategory(true);
                                  setCategoryModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-650 cursor-pointer border-none bg-transparent"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 text-slate-400 hover:text-red-650 cursor-pointer border-none bg-transparent"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: CLUBS MANAGEMENT */}
          {/* ========================================================================= */}
          {currentSection === 'clubs' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Clubs Management</h2>
                <button
                  onClick={() => {
                    setEditingTeam({
                      name: '',
                      slug: '',
                      type: 'club',
                      logo: '',
                      banner: '',
                      displayOrder: categoriesList.filter((c) => c.parentId === 'cat-clubs').length + 1,
                      isActive: true
                    });
                    setIsEditingTeam(false);
                    setTeamModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-3 rounded-xl border-none shadow-xs text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Club Team
                </button>
              </div>

              {/* Grid lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesList
                  .filter((c) => c.parentId === 'cat-clubs')
                  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                  .map((club) => {
                    const subcats = categoriesList.filter((c) => c.parentId === club.id);
                    return (
                      <div key={club.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={club.image}
                            alt={club.name}
                            className="w-12 h-12 rounded-full border border-slate-100 object-contain p-1 shrink-0"
                          />
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{club.name}</h3>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Slug: {club.slug}</span>
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase mt-1 ${
                              club.isActive ? 'bg-emerald-100 text-emerald-850' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {club.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        {/* Subcategories list section */}
                        <div className="border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <span>Subcategories</span>
                            <button
                              onClick={() => {
                                setEditingSub({
                                  teamId: club.id,
                                  teamName: club.name,
                                  name: '',
                                  slug: '',
                                  displayOrder: subcats.length + 1,
                                  isActive: true
                                });
                                setSubModalOpen(true);
                              }}
                              className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded cursor-pointer border-none font-black text-[9px]"
                            >
                              + Add Sub
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {subcats.map((sub) => (
                              <div
                                key={sub.id}
                                className="bg-slate-50 border px-2 py-0.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold"
                              >
                                <span>{sub.name}</span>
                                <button
                                  onClick={() => handleDeleteCategory(sub.id)}
                                  className="text-red-500 hover:text-red-750 font-black cursor-pointer border-none bg-transparent"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setEditingTeam({
                                id: club.id,
                                name: club.name,
                                slug: club.slug,
                                type: 'club',
                                logo: club.image,
                                banner: club.banner,
                                displayOrder: club.displayOrder || 1,
                                isActive: club.isActive
                              });
                              setIsEditingTeam(true);
                              setTeamModalOpen(true);
                            }}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black py-1.5 rounded-xl transition-all cursor-pointer border-none"
                          >
                            Edit Details
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(club.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-650 p-2 rounded-xl transition-all cursor-pointer border-none"
                            title="Delete club"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: NATIONAL TEAMS MANAGEMENT */}
          {/* ========================================================================= */}
          {currentSection === 'national_teams' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">National Teams</h2>
                <button
                  onClick={() => {
                    setEditingTeam({
                      name: '',
                      slug: '',
                      type: 'national',
                      logo: '',
                      banner: '',
                      displayOrder: categoriesList.filter((c) => c.parentId === 'cat-national-teams').length + 1,
                      isActive: true
                    });
                    setIsEditingTeam(false);
                    setTeamModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-3 rounded-xl border-none shadow-xs text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add National Team
                </button>
              </div>

              {/* Grid lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesList
                  .filter((c) => c.parentId === 'cat-national-teams')
                  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                  .map((team) => {
                    const subcats = categoriesList.filter((c) => c.parentId === team.id);
                    return (
                      <div key={team.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={team.image}
                            alt={team.name}
                            className="w-12 h-12 rounded-full border border-slate-100 object-contain p-1 shrink-0"
                          />
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{team.name}</h3>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Slug: {team.slug}</span>
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-black uppercase mt-1 ${
                              team.isActive ? 'bg-emerald-100 text-emerald-850' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {team.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        {/* Subcategories list section */}
                        <div className="border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <span>Subcategories</span>
                            <button
                              onClick={() => {
                                setEditingSub({
                                  teamId: team.id,
                                  teamName: team.name,
                                  name: '',
                                  slug: '',
                                  displayOrder: subcats.length + 1,
                                  isActive: true
                                });
                                setSubModalOpen(true);
                              }}
                              className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded cursor-pointer border-none font-black text-[9px]"
                            >
                              + Add Sub
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {subcats.map((sub) => (
                              <div
                                key={sub.id}
                                className="bg-slate-50 border px-2 py-0.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold"
                              >
                                <span>{sub.name}</span>
                                <button
                                  onClick={() => handleDeleteCategory(sub.id)}
                                  className="text-red-500 hover:text-red-750 font-black cursor-pointer border-none bg-transparent"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setEditingTeam({
                                id: team.id,
                                name: team.name,
                                slug: team.slug,
                                type: 'national',
                                logo: team.image,
                                banner: team.banner,
                                displayOrder: team.displayOrder || 1,
                                isActive: team.isActive
                              });
                              setIsEditingTeam(true);
                              setTeamModalOpen(true);
                            }}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black py-1.5 rounded-xl transition-all cursor-pointer border-none"
                          >
                            Edit Details
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(team.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-650 p-2 rounded-xl transition-all cursor-pointer border-none"
                            title="Delete team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: SUBCATEGORY MANAGEMENT */}
          {/* ========================================================================= */}
          {currentSection === 'subcategories' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Subcategory Management</h2>
                  <p className="text-xs text-slate-500">Manage edition subcategories for specific clubs and national teams</p>
                </div>
                <button
                  onClick={() => {
                    setEditingSub({
                      teamId: '',
                      teamName: '',
                      name: '',
                      slug: '',
                      displayOrder: 1,
                      isActive: true
                    });
                    setSubModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer border-none shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Subcategory
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-4">Subcategory Name</th>
                        <th className="p-4">Parent Team / Club</th>
                        <th className="p-4 text-center">Display Order</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {categoriesList
                        .filter((cat) => {
                          if (!cat.parentId) return false;
                          const parentCat = categoriesList.find((p) => p.id === cat.parentId);
                          return parentCat && (parentCat.parentId === 'cat-clubs' || parentCat.parentId === 'cat-national-teams');
                        })
                        .map((sub) => {
                          const parentTeam = categoriesList.find((p) => p.id === sub.parentId);
                          return (
                            <tr key={sub.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-900">{sub.name}</td>
                              <td className="p-4">
                                {parentTeam ? (
                                  <span className="bg-slate-100 text-slate-750 px-2 py-1 rounded-md text-[10px] font-bold">
                                    {parentTeam.name} ({parentTeam.parentName})
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Orphaned</span>
                                )}
                              </td>
                              <td className="p-4 text-center">{sub.displayOrder || 1}</td>
                              <td className="p-4">
                                {sub.isActive ? (
                                  <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-extrabold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200">
                                    Hidden
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingSub({
                                      id: sub.id,
                                      teamId: sub.parentId,
                                      teamName: parentTeam ? parentTeam.name : '',
                                      name: sub.name,
                                      slug: sub.slug,
                                      displayOrder: sub.displayOrder || 1,
                                      isActive: sub.isActive
                                    });
                                    setSubModalOpen(true);
                                  }}
                                  className="text-slate-500 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 p-2 rounded-xl transition-all cursor-pointer border-none"
                                  title="Edit subcategory"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(sub.id)}
                                  className="text-red-655 hover:text-red-750 bg-red-50 hover:bg-red-100 p-2 rounded-xl transition-all cursor-pointer border-none"
                                  title="Delete subcategory"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {categoriesList.filter((cat) => {
                        if (!cat.parentId) return false;
                        const parentCat = categoriesList.find((p) => p.id === cat.parentId);
                        return parentCat && (parentCat.parentId === 'cat-clubs' || parentCat.parentId === 'cat-national-teams');
                      }).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            No subcategories registered yet. Add subcategories under teams or create them here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: SLEEVE BADGES LIBRARY */}
          {/* ========================================================================= */}
          {currentSection === 'sleeve_badges' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">Sleeve / Badges Library</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Manage global sleeve badges with custom uploaded images, names, and individual pricing
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingBadge({
                      name: '',
                      image: '',
                      price: 100,
                      isActive: true
                    });
                    setIsEditingBadge(false);
                    setBadgeModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer border-none shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add New Badge
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-4 w-16">Badge Image</th>
                        <th className="p-4">Badge Name</th>
                        <th className="p-4">Badge Price</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Created Date</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {sleeveBadgeOptions && sleeveBadgeOptions.map((badge) => (
                        <tr key={badge.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                              {badge.image ? (
                                <img
                                  src={badge.image}
                                  alt={badge.name}
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <Shirt className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-900 text-xs">
                            {badge.name}
                          </td>
                          <td className="p-4 font-extrabold text-emerald-700">
                            ৳{(badge.price ?? 0).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={async () => {
                                await updateSleeveBadgeOption(badge.id, { isActive: !badge.isActive });
                                await fetchAdminSleeveBadgeOptions();
                              }}
                              className="cursor-pointer border-none bg-transparent inline-flex items-center"
                              title="Click to toggle status"
                            >
                              {badge.isActive ? (
                                <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 transition-colors">
                                  Active
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold bg-slate-100 text-slate-500 hover:bg-slate-200 px-2.5 py-1 rounded-full border border-slate-200 transition-colors">
                                  Disabled
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="p-4 text-slate-400 font-mono text-[10px]">
                            {new Date(badge.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingBadge({
                                  id: badge.id,
                                  name: badge.name,
                                  image: badge.image || '',
                                  price: badge.price ?? 0,
                                  isActive: badge.isActive
                                });
                                setIsEditingBadge(true);
                                setBadgeModalOpen(true);
                              }}
                              className="text-slate-500 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 p-2 rounded-xl transition-all cursor-pointer border-none"
                              title="Edit badge"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete the badge "${badge.name}"?`)) {
                                  const result = await deleteSleeveBadgeOption(badge.id);
                                  if (result.success) {
                                    await fetchAdminSleeveBadgeOptions();
                                  }
                                }
                              }}
                              className="text-red-655 hover:text-red-750 bg-red-50 hover:bg-red-100 p-2 rounded-xl transition-all cursor-pointer border-none"
                              title="Delete badge"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!sleeveBadgeOptions || sleeveBadgeOptions.length === 0) && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No sleeve badges registered in library. Click "Add New Badge" to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: INVENTORY LOGS & STOCK MANAGEMENT */}
          {/* ========================================================================= */}
          {currentSection === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Inventory Levels & Fast Stock updates</h2>
                <p className="text-xs text-slate-400 font-medium">Add/subtract quantities directly to update the active warehouse stock level in real-time.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Jersey Product</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Active Stock</th>
                        <th className="p-3">Indicators</th>
                        <th className="p-3 w-44">Fast Add Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                      {productsList.map((p) => {
                        const lowStock = p.stock <= p.lowStockAlert;
                        const out = p.stock <= 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{p.name}</td>
                            <td className="p-3 font-mono font-bold text-slate-500">{p.sku}</td>
                            <td className="p-3">
                              <span className="font-bold">৳{(p.salePrice || p.price).toLocaleString()}</span>
                              {p.salePrice && (
                                <div className="text-[9px] text-slate-400">
                                  <span className="line-through">৳{p.price.toLocaleString()}</span>
                                  {p.discountPercent && p.discountPercent > 0 ? (
                                    <span className="text-red-650 font-extrabold ml-1">({p.discountPercent}% OFF)</span>
                                  ) : null}
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-extrabold">{p.stock} Units</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                out
                                  ? 'bg-red-100 text-red-800'
                                  : lowStock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {out ? 'Out of Stock' : lowStock ? 'Low Stock alert' : 'In Stock'}
                              </span>
                            </td>
                            <td className="p-3 flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder="+10"
                                id={`stock-inc-${p.id}`}
                                className="w-16 border rounded-lg p-1 text-center outline-none bg-white text-slate-900 font-bold"
                              />
                              <button
                                onClick={() => {
                                  const inputEl = document.getElementById(`stock-inc-${p.id}`) as HTMLInputElement;
                                  const qtyVal = Number(inputEl?.value || 0);
                                  if (qtyVal === 0) return;
                                  handleRestock(p.id, qtyVal);
                                  if (inputEl) inputEl.value = '';
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold p-1 px-2.5 rounded-lg cursor-pointer border-none text-[10px]"
                              >
                                Update
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTIONS: ORDERS LISTS */}
          {/* ========================================================================= */}
          {currentSection.startsWith('orders_') && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Filters search */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="flex items-center gap-2 max-w-sm bg-white border rounded-2xl p-2 px-3.5 flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search order #, customer name, mobile..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-slate-800 outline-none border-none"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={orderPaymentFilter}
                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                    className="bg-white border rounded-xl p-2 outline-none cursor-pointer font-bold text-xs"
                  >
                    <option value="">All Payments</option>
                    <option value="pending">Payment: PENDING</option>
                    <option value="verified">Payment: VERIFIED</option>
                    <option value="rejected">Payment: REJECTED</option>
                    <option value="paid">Paid Status</option>
                  </select>

                  {selectedOrderIds.length > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleBulkOrderAction('processing')}
                        className="bg-slate-850 text-white px-2 py-1 rounded cursor-pointer border-none text-[10px] font-bold"
                      >
                        Bulk Process
                      </button>
                      <button
                        onClick={() => handleBulkOrderAction('shipped')}
                        className="bg-indigo-600 text-white px-2 py-1 rounded cursor-pointer border-none text-[10px] font-bold"
                      >
                        Bulk Ship
                      </button>
                      <button
                        onClick={() => handleBulkOrderAction('delivered')}
                        className="bg-emerald-600 text-white px-2 py-1 rounded cursor-pointer border-none text-[10px] font-bold"
                      >
                        Bulk Deliver
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Orders table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.length === getFilteredOrders(currentSection === 'orders_all' ? undefined : currentSection.replace('orders_', '')).length && getFilteredOrders().length > 0}
                            onChange={(e) => {
                              const list = getFilteredOrders(currentSection === 'orders_all' ? undefined : currentSection.replace('orders_', ''));
                              if (e.target.checked) setSelectedOrderIds(list.map((o) => o.id));
                              else setSelectedOrderIds([]);
                            }}
                            className="cursor-pointer"
                          />
                        </th>
                        <th className="p-4">Order ID & Date</th>
                        <th className="p-4">Customer Details</th>
                        <th className="p-4">Items Count</th>
                        <th className="p-4">Total Amount</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Order Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {getFilteredOrders(currentSection === 'orders_all' ? undefined : currentSection.replace('orders_', '')).map((ord) => {
                        const isSelected = selectedOrderIds.includes(ord.id);
                        return (
                          <tr key={ord.id} className={`hover:bg-slate-50 ${isSelected ? 'bg-slate-50/50' : ''}`}>
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedOrderIds([...selectedOrderIds, ord.id]);
                                  else setSelectedOrderIds(selectedOrderIds.filter((id) => id !== ord.id));
                                }}
                                className="cursor-pointer"
                              />
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold text-slate-900 block">{ord.orderNumber}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {new Date(ord.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                              <span className="text-[11px] text-slate-500 block">{ord.customerPhone}</span>
                            </td>
                            <td className="p-4">{ord.items.length} Items</td>
                            <td className="p-4 font-black text-slate-900">৳{ord.totalAmount.toLocaleString()}</td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1 items-start">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-800 uppercase block">
                                    {ord.paymentMethod}
                                  </span>
                                  {ord.advancePaymentPercentage && (
                                    <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600">
                                      {ord.advancePaymentPercentage}%
                                    </span>
                                  )}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                  ord.paymentVerificationStatus === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : ord.paymentVerificationStatus === 'rejected'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  Payment: {(ord.paymentVerificationStatus || 'pending').toUpperCase()}
                                </span>
                                {ord.transactionId || ord.paymentDetails?.transactionId ? (
                                  <span className="text-[9px] font-mono text-slate-400 select-all truncate max-w-[120px]">
                                    {ord.transactionId || ord.paymentDetails?.transactionId}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="p-4">
                              <select
                                value={ord.orderStatus}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                className="bg-white border rounded-lg p-1 text-xs font-bold text-slate-800 cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="custom_printing">Custom Printing</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                className="text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-emerald-100 border-none font-bold text-[10px]"
                              >
                                View details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: CUSTOMER MANAGEMENT */}
          {/* ========================================================================= */}
          {currentSection === 'customers' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Registered Customers</h2>
                <div className="flex items-center gap-2 max-w-xs bg-white border rounded-2xl px-3 py-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="bg-transparent text-xs outline-none border-none"
                  />
                </div>
              </div>

              {/* Customer table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-4">Customer Details</th>
                        <th className="p-4">Mobile</th>
                        <th className="p-4">Date Registered</th>
                        <th className="p-4">Completed Orders</th>
                        <th className="p-4">Total Purchases</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredCustomers.map((cust) => {
                        const userOrdersList = ordersList.filter((o) => o.userId === cust.id || o.customerEmail.toLowerCase() === cust.email.toLowerCase());
                        const totalSpent = userOrdersList.reduce((sum, o) => sum + o.totalAmount, 0);
                        return (
                          <tr key={cust.id} className="hover:bg-slate-50">
                            <td className="p-4">
                              <span className="font-extrabold text-slate-900 block">{cust.name}</span>
                              <span className="text-[10px] text-slate-400 block">{cust.email}</span>
                            </td>
                            <td className="p-4 font-mono">{cust.phone || 'N/A'}</td>
                            <td className="p-4 text-slate-400">{new Date(cust.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 font-extrabold">{userOrdersList.length} Orders</td>
                            <td className="p-4 font-black text-slate-900">৳{totalSpent.toLocaleString()}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                cust.status === 'active' ? 'bg-emerald-100 text-emerald-850' : 'bg-red-100 text-red-850'
                              }`}>
                                {cust.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => handleToggleCustomerStatus(cust)}
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl cursor-pointer transition-all border-none ${
                                  cust.status === 'active'
                                    ? 'bg-red-50 text-red-650 hover:bg-red-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {cust.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: PROMOTION & OFFERS */}
          {/* ========================================================================= */}
          {(currentSection === 'deals' || currentSection === 'trending') && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  {currentSection === 'deals' ? 'Limited Time Deals Product Lineup' : 'Trending Sports & Match Gear'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Toggle promotional badges directly to add or remove products from the active landing page sections.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Jersey Product</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Active Status</th>
                        <th className="p-3 text-right">Homepage Visibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {productsList.map((p) => {
                        const targetField = currentSection === 'deals' ? 'isFlashSale' : 'isTrending';
                        const isAssigned = p[targetField];
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-900">{p.name}</td>
                            <td className="p-3 font-mono font-bold text-slate-500">{p.sku}</td>
                            <td className="p-3">{p.categoryName}</td>
                            <td className="p-3 uppercase text-[9px] font-black">{p.status}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleTogglePromotion(p, targetField)}
                                className={`text-[10px] font-black px-3 py-1.5 rounded-xl cursor-pointer border-none transition-all ${
                                  isAssigned
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {isAssigned ? 'Assigned' : 'Not Displayed'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: HOMEPAGE HERO BANNERS */}
          {/* ========================================================================= */}
          {currentSection === 'hero_banners' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Homepage Slider Banners</h2>
                <button
                  onClick={() => {
                    setEditingSlide({
                      title: '',
                      subtitle: '',
                      badge: 'HOT SALE',
                      image: '',
                      link: '/catalog',
                      buttonText: 'SHOP NOW',
                      order: heroSlides.length + 1,
                      isActive: true
                    });
                    setSlideModalOpen(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold p-2 px-3 rounded-xl border-none shadow-xs text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Slider Banner
                </button>
              </div>

              {/* Grid lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {heroSlides.map((slide) => (
                  <div key={slide.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-44 object-cover bg-slate-100"
                    />
                    <div className="p-5 space-y-3">
                      <span className="text-[8px] bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded font-black uppercase">
                        {slide.badge || 'PROMO'}
                      </span>
                      <h3 className="text-sm font-black text-slate-900">{slide.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{slide.subtitle}</p>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t pt-3">
                        <span>Link: {slide.link}</span>
                        <span>Order: {slide.order}</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setEditingSlide(slide);
                            setSlideModalOpen(true);
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-850 font-black py-2 rounded-xl border-none cursor-pointer text-xs"
                        >
                          Edit Slider
                        </button>
                        <button
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-650 p-2 rounded-xl cursor-pointer border-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: HOMEPAGE TEAMS VISIBILITY */}
          {/* ========================================================================= */}
          {currentSection === 'team_visibility' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider font-extrabold">Homepage Team Section slider visibility</h2>
                <p className="text-xs text-slate-400 font-medium">Control which Clubs & National Teams display in the home page circular logo slider.</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Team Logo</th>
                        <th className="p-3">Team Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Featured Status (Homepage Slider)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                      {categoriesList
                        .filter((c) => c.parentId === 'cat-clubs' || c.parentId === 'cat-national-teams')
                        .map((team) => (
                          <tr key={team.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <img
                                src={team.image}
                                alt={team.name}
                                className="w-8 h-8 rounded-full object-contain p-1 bg-slate-100"
                              />
                            </td>
                            <td className="p-3 font-bold text-slate-900">{team.name}</td>
                            <td className="p-3 uppercase text-[9px] font-black text-slate-400">
                              {team.parentId === 'cat-clubs' ? 'Club' : 'National Team'}
                            </td>
                            <td className="p-3 font-bold text-slate-500">{team.isActive ? 'Active' : 'Inactive'}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={async () => {
                                  const updatedVal = !team.featured;
                                  const res = await fetch(`/api/categories/${team.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ featured: updatedVal })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    showToast('Team visibility slider updated');
                                    fetchData();
                                  }
                                }}
                                className={`text-[10px] font-black px-3 py-1 rounded-xl cursor-pointer border-none ${
                                  team.featured
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {team.featured ? 'Featured' : 'Not Featured'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: CONTENT SEO MANAGEMENT */}
          {/* ========================================================================= */}
          {currentSection === 'content_seo' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Homepage SEO content blocks</h2>
                <p className="text-xs text-slate-400 font-medium">Manage text content displayed at the bottom of the landing page for Google search engine crawler discovery.</p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    handleSaveSettings({
                      seoSection1Title: f.get('seoSection1Title') as string,
                      seoSection1Text: f.get('seoSection1Text') as string,
                      seoSection2Title: f.get('seoSection2Title') as string,
                      seoSection2Text: f.get('seoSection2Text') as string
                    });
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-2 border-b pb-4">
                    <h3 className="font-extrabold text-slate-800 uppercase text-[10px]">SEO Section 1</h3>
                    <div>
                      <label className="font-bold block mb-1">Section 1 Header Title</label>
                      <input
                        type="text"
                        name="seoSection1Title"
                        defaultValue={siteSettings.seoSection1Title || "Jersey Mention BD — Your Trusted Football Jersey Store in Bangladesh"}
                        required
                        className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Section 1 Body Text</label>
                      <textarea
                        name="seoSection1Text"
                        rows={5}
                        defaultValue={siteSettings.seoSection1Text || "Welcome to Jersey Mention BD, the premier online destination..."}
                        required
                        className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-medium leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pb-4">
                    <h3 className="font-extrabold text-slate-800 uppercase text-[10px]">SEO Section 2</h3>
                    <div>
                      <label className="font-bold block mb-1">Section 2 Header Title</label>
                      <input
                        type="text"
                        name="seoSection2Title"
                        defaultValue={siteSettings.seoSection2Title || "Buy Football Jerseys & Sportswear Online in Bangladesh"}
                        required
                        className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Section 2 Body Text</label>
                      <textarea
                        name="seoSection2Text"
                        rows={5}
                        defaultValue={siteSettings.seoSection2Text || "Ready to gear up for the match?..."}
                        required
                        className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-medium leading-relaxed"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 px-5 rounded-xl cursor-pointer border-none shadow-md"
                  >
                    Save SEO content
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: STORE SETTINGS DETAILS */}
          {/* ========================================================================= */}
          {currentSection === 'settings_store' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider font-extrabold">Store Configurations</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    handleSaveSettings({
                      siteName: f.get('siteName') as string,
                      tagLine: f.get('tagLine') as string,
                      contactEmail: f.get('contactEmail') as string,
                      contactPhone: f.get('contactPhone') as string,
                      whatsappNumber: f.get('whatsappNumber') as string,
                      address: f.get('address') as string,
                      currencySymbol: f.get('currencySymbol') as string,
                      customNameNumberPrice: Number(f.get('customNameNumberPrice') || 250),
                      patchPrice: Number(f.get('patchPrice') || 100)
                    });
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"
                >
                  <div>
                    <label className="font-bold block mb-1">Store Name</label>
                    <input
                      type="text"
                      name="siteName"
                      defaultValue={siteSettings.siteName}
                      required
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Tag Line Title</label>
                    <input
                      type="text"
                      name="tagLine"
                      defaultValue={siteSettings.tagLine}
                      required
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Contact Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      defaultValue={siteSettings.contactEmail}
                      required
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Hotline phone number</label>
                    <input
                      type="text"
                      name="contactPhone"
                      defaultValue={siteSettings.contactPhone}
                      required
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">WhatsApp line number</label>
                    <input
                      type="text"
                      name="whatsappNumber"
                      defaultValue={siteSettings.whatsappNumber || '01640581442'}
                      placeholder="e.g. 01640581442 or +8801640581442"
                      required
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Automatic link format: https://wa.me/+8801640581442</p>
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      name="currencySymbol"
                      defaultValue={siteSettings.currencySymbol}
                      required
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Custom Name & Number Price (৳)</label>
                    <input
                      type="number"
                      name="customNameNumberPrice"
                      defaultValue={siteSettings.customNameNumberPrice ?? 250}
                      required
                      min={0}
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Sleeve Patch Price (৳)</label>
                    <input
                      type="number"
                      name="patchPrice"
                      defaultValue={siteSettings.patchPrice ?? 100}
                      required
                      min={0}
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-bold block mb-1">Office Address info</label>
                    <textarea
                      name="address"
                      defaultValue={siteSettings.address}
                      rows={2}
                      required
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <ImageUpload
                      label="Store Logo Image (Direct Upload)"
                      value={siteSettings.logo}
                      onChange={(url) => handleSaveSettings({ logo: url })}
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 px-5 rounded-xl cursor-pointer border-none shadow-md"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: PRODUCT CUSTOMIZATION PRICING */}
          {/* ========================================================================= */}
          {currentSection === 'settings_customization_pricing' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider font-extrabold border-b border-slate-100 pb-3">
                  PRODUCT CUSTOMIZATION PRICING
                </h2>

                <div className="space-y-6 max-w-md">
                  {/* SLEEVE / BADGE PRICE FORM */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      handleSaveSettings({
                        patchPrice: Number(f.get('patchPrice') || 0)
                      });
                    }}
                    className="space-y-2"
                  >
                    <label className="font-bold block text-slate-800 text-xs uppercase tracking-wider">
                      SLEEVE / BADGE
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="patchPrice"
                        defaultValue={siteSettings.patchPrice ?? 100}
                        required
                        min={0}
                        className="w-32 border p-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs"
                      />
                      <span className="text-xs font-bold text-slate-500">BDT</span>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 px-4 rounded-xl cursor-pointer border-none shadow-xs text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </form>

                  {/* CUSTOM SQUAD NAME & NUMBER HEAT-PRESS PRICE FORM */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      handleSaveSettings({
                        customNameNumberPrice: Number(f.get('customNameNumberPrice') || 0)
                      });
                    }}
                    className="space-y-2"
                  >
                    <label className="font-bold block text-slate-800 text-xs uppercase tracking-wider">
                      CUSTOM SQUAD NAME & NUMBER HEAT-PRESS
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="customNameNumberPrice"
                        defaultValue={siteSettings.customNameNumberPrice ?? 250}
                        required
                        min={0}
                        className="w-32 border p-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs"
                      />
                      <span className="text-xs font-bold text-slate-500">BDT</span>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 px-4 rounded-xl cursor-pointer border-none shadow-xs text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: JERSEY SIZE CALCULATOR THRESHOLDS */}
          {/* ========================================================================= */}
          {currentSection === 'settings_size_calculator' && (() => {
            let ranges = {
              S: { maxHeight: 165, maxWeight: 60, maxChest: 37 },
              M: { maxHeight: 173, maxWeight: 70, maxChest: 39 },
              L: { maxHeight: 180, maxWeight: 80, maxChest: 41 },
              XL: { maxHeight: 185, maxWeight: 90, maxChest: 43 },
              XXL: { maxHeight: 190, maxWeight: 100, maxChest: 45 },
              "3XL": { maxHeight: 210, maxWeight: 120, maxChest: 48 }
            };
            try {
              if (siteSettings.sizeRanges) {
                ranges = JSON.parse(siteSettings.sizeRanges);
              }
            } catch (err) {}

            const handleSaveRanges = (e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
              const newRanges: any = {};
              for (const s of sizes) {
                newRanges[s] = {
                  maxHeight: Number(f.get(`${s}_maxHeight`)),
                  maxWeight: Number(f.get(`${s}_maxWeight`)),
                  maxChest: Number(f.get(`${s}_maxChest`))
                };
              }
              handleSaveSettings({
                sizeRanges: JSON.stringify(newRanges)
              });
            };

            return (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Size Calculator Ranges</h2>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Configure the upper bound thresholds for height, weight, and chest measurements. The calculator recommends the smallest size that accommodates all body metrics.</p>
                  </div>

                  <form onSubmit={handleSaveRanges} className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold">
                            <th className="pb-2 w-20">Size</th>
                            <th className="pb-2">Max Height (cm)</th>
                            <th className="pb-2">Max Weight (kg)</th>
                            <th className="pb-2 font-sans">Max Chest (inches)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map((s) => {
                            const val = (ranges as any)[s] || { maxHeight: 0, maxWeight: 0, maxChest: 0 };
                            return (
                              <tr key={s}>
                                <td className="py-3 font-black text-slate-900">{s}</td>
                                <td className="py-2">
                                  <input
                                    type="number"
                                    name={`${s}_maxHeight`}
                                    defaultValue={val.maxHeight}
                                    required
                                    min={0}
                                    className="w-28 border p-2 rounded-xl bg-white text-slate-900 font-bold"
                                  />
                                </td>
                                <td className="py-2">
                                  <input
                                    type="number"
                                    name={`${s}_maxWeight`}
                                    defaultValue={val.maxWeight}
                                    required
                                    min={0}
                                    className="w-28 border p-2 rounded-xl bg-white text-slate-900 font-bold"
                                  />
                                </td>
                                <td className="py-2">
                                  <input
                                    type="number"
                                    name={`${s}_maxChest`}
                                    defaultValue={val.maxChest}
                                    required
                                    min={0}
                                    className="w-28 border p-2 rounded-xl bg-white text-slate-900 font-bold"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 px-5 rounded-xl cursor-pointer border-none shadow-md text-xs"
                      >
                        Save Calculator Thresholds
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* SECTION: SHIPPING CONFIGURATION */}
          {/* ========================================================================= */}
          {currentSection === 'settings_shipping' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Shipping Rates Configuration</h2>
                <p className="text-xs text-slate-400 font-medium">Control standard delivery pricing systems for inside and outside metropolitan regions.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Inside Dhaka Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      handleSaveSettings({
                        insideDhakaShippingFee: Number(f.get('insideDhakaShippingFee'))
                      });
                    }}
                    className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3"
                  >
                    <div>
                      <label className="font-bold block mb-1">Inside Dhaka Delivery Charge</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="insideDhakaShippingFee"
                          defaultValue={siteSettings.insideDhakaShippingFee}
                          required
                          className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                        />
                        <span className="font-bold text-slate-500">BDT</span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-4 rounded-xl cursor-pointer border-none shadow-xs text-xs"
                    >
                      Save
                    </button>
                  </form>

                  {/* Outside Dhaka Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      handleSaveSettings({
                        outsideDhakaShippingFee: Number(f.get('outsideDhakaShippingFee'))
                      });
                    }}
                    className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3"
                  >
                    <div>
                      <label className="font-bold block mb-1">Outside Dhaka Delivery Charge</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="outsideDhakaShippingFee"
                          defaultValue={siteSettings.outsideDhakaShippingFee}
                          required
                          className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                        />
                        <span className="font-bold text-slate-500">BDT</span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-4 rounded-xl cursor-pointer border-none shadow-xs text-xs"
                    >
                      Save
                    </button>
                  </form>
                </div>

                {/* Free shipping threshold limit form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    handleSaveSettings({
                      freeDeliveryEnabled: f.get('freeDeliveryEnabled') === 'true',
                      freeShippingThreshold: Number(f.get('freeShippingThreshold'))
                    });
                  }}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs font-medium"
                >
                  <h3 className="font-extrabold uppercase text-slate-900 tracking-wider text-[11px] border-b pb-2">FREE DELIVERY THRESHOLD</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="font-bold block mb-1.5 text-slate-700">Enable Free Delivery</label>
                      <select
                        name="freeDeliveryEnabled"
                        defaultValue={siteSettings.freeDeliveryEnabled !== false ? 'true' : 'false'}
                        className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-bold"
                      >
                        <option value="true">ON (Enabled)</option>
                        <option value="false">OFF (Disabled)</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="font-bold block mb-1.5 text-slate-700">Free Delivery Threshold Order Limit</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="freeShippingThreshold"
                          defaultValue={siteSettings.freeShippingThreshold}
                          required
                          className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-bold"
                        />
                        <span className="font-bold text-slate-500">BDT</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-5 rounded-xl cursor-pointer border-none shadow-xs text-xs"
                    >
                      Save
                    </button>
                    <div className="text-[10px] text-slate-500 font-bold">
                      Current Status: <span className={siteSettings.freeDeliveryEnabled !== false ? 'text-emerald-600' : 'text-red-500'}>
                        {siteSettings.freeDeliveryEnabled !== false ? 'ON (Active)' : 'OFF (Inactive)'}
                      </span>
                      {siteSettings.freeDeliveryEnabled !== false && ` | Threshold: ৳${siteSettings.freeShippingThreshold.toLocaleString()}`}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}          {/* ========================================================================= */}
          {/* SECTION: PAYMENT METHOD TOGGLES */}
          {/* ========================================================================= */}
          {currentSection === 'settings_payment' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Checkout Payment Gateways Toggles</h2>
                <p className="text-xs text-slate-400 font-medium">Activate/Deactivate payment methods displayed on the customer checkout views.</p>

                <div className="divide-y text-xs font-bold">
                  {[
                    { label: 'bKash Merchant Payment (BD Personal/Merchant Wallet)', field: 'paymentGatewayBkash' },
                    { label: 'Nagad Checkout Service', field: 'paymentGatewayNagad' },
                    { label: 'Rocket Wallet Option', field: 'paymentGatewayRocket' },
                    { label: 'SSLCommerz Gateway aggregations (Debit/Credit Cards)', field: 'paymentGatewaySsl' },
                    { label: 'Stripe International Processing (Visa/Mastercard)', field: 'paymentGatewayStripe' }
                  ].map((item, idx) => {
                    const isChecked = siteSettings[item.field as keyof typeof siteSettings] ?? false;
                    return (
                      <div key={idx} className="flex items-center justify-between py-3">
                        <span className="text-slate-800">{item.label}</span>
                        <button
                          onClick={() => {
                            handleSaveSettings({ [item.field]: !isChecked });
                          }}
                          className={`text-[10px] font-black px-4 py-1.5 rounded-xl cursor-pointer border-none transition-all ${
                            isChecked
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-450'
                          }`}
                        >
                          {isChecked ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Personal Wallet Payment Numbers Form */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">Personal Payment Numbers</h2>
                <p className="text-xs text-slate-400 font-medium">Configure the personal wallet numbers where customers should send payments.</p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    handleSaveSettings({
                      bkashPersonalNumber: f.get('bkashPersonalNumber') as string,
                      nagadPersonalNumber: f.get('nagadPersonalNumber') as string
                    });
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold"
                >
                  <div>
                    <label className="font-bold block mb-1 text-slate-700">bKash Personal Number</label>
                    <input
                      type="text"
                      name="bkashPersonalNumber"
                      defaultValue={siteSettings.bkashPersonalNumber || '01571305964'}
                      required
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-semibold focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1 text-slate-700">Nagad Personal Number</label>
                    <input
                      type="text"
                      name="nagadPersonalNumber"
                      defaultValue={siteSettings.nagadPersonalNumber || '01571305964'}
                      required
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-semibold focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-xl cursor-pointer transition-all border-none"
                    >
                      Save Payment Numbers
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: ADMIN PROFILE INFO */}
          {/* ========================================================================= */}
          {currentSection === 'admin_profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-md">
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider font-extrabold border-b pb-2">Active Admin Profile Details</h2>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Full Name</span>
                    <span className="text-slate-900 font-extrabold">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Email address</span>
                    <span className="text-slate-900 font-extrabold font-mono">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Assigned User Role</span>
                    <span className="text-emerald-750 font-black uppercase bg-emerald-50 px-2 py-0.2 rounded">{user.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Account Registry ID</span>
                    <span className="text-slate-500 font-mono text-[10px]">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Registry Date</span>
                    <span className="text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: CUSTOMER DATA EXPORT */}
          {/* ========================================================================= */}
          {currentSection === 'customer_export' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-xl space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-600 animate-bounce" />
                    Customer Data Export
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Filter and download aggregated customer purchase records, order summaries, and contact details without password credentials.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Range selection */}
                  <div>
                    <label className="font-bold block mb-1 text-slate-700">Date Range Filter</label>
                    <select
                      value={exportRange}
                      onChange={(e) => setExportRange(e.target.value as any)}
                      className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-semibold focus:border-emerald-500 focus:outline-hidden"
                    >
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                      <option value="this_year">This Year</option>
                      <option value="custom">Custom Date Range</option>
                    </select>
                  </div>

                  {/* Custom dates */}
                  {exportRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-1 duration-150">
                      <div>
                        <label className="font-bold block mb-1 text-slate-700">From Date *</label>
                        <input
                          type="date"
                          value={exportFromDate}
                          onChange={(e) => setExportFromDate(e.target.value)}
                          required
                          className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-semibold focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold block mb-1 text-slate-700">To Date *</label>
                        <input
                          type="date"
                          value={exportToDate}
                          onChange={(e) => setExportToDate(e.target.value)}
                          required
                          className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-semibold focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Format selection */}
                  <div>
                    <label className="font-bold block mb-1 text-slate-700">Export Format</label>
                    <div className="flex gap-6 mt-1">
                      <label className="flex items-center gap-2 font-bold text-slate-850 cursor-pointer">
                        <input
                          type="radio"
                          name="exportFormat"
                          checked={exportFormat === 'csv'}
                          onChange={() => setExportFormat('csv')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        CSV Format
                      </label>
                      <label className="flex items-center gap-2 font-bold text-slate-850 cursor-pointer">
                        <input
                          type="radio"
                          name="exportFormat"
                          checked={exportFormat === 'xlsx'}
                          onChange={() => setExportFormat('xlsx')}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        Excel (.xlsx) Format
                      </label>
                    </div>
                  </div>

                  {/* Count display & Download action */}
                  <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-slate-600 font-bold">
                      {isPreviewLoading ? (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Calculating preview count...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-800 font-black text-sm bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 w-max">
                            {previewCount} customer{previewCount !== 1 ? 's' : ''} found
                          </span>
                          {previewCount === 0 && (
                            <span className="text-amber-600 font-bold text-[10px] block mt-1">
                              No customers found for the selected date range.
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleDownloadExport}
                      disabled={isPreviewLoading || previewCount === 0 || (exportRange === 'custom' && (!exportFromDate || !exportToDate))}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3 rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all border-none flex items-center gap-2 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Customer Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: TOP CUSTOMERS */}
          {/* ========================================================================= */}
          {currentSection === 'top_customers' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
                    Top Customers
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Identify and manage high-value customers who have successfully placed 4 or more valid orders.
                  </p>
                </div>
                <button
                  onClick={fetchTopCustomers}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] px-3 py-1.5 rounded-xl border border-slate-250 cursor-pointer flex items-center gap-1 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTopCustomersLoading ? 'animate-spin' : ''}`} />
                  Refresh List
                </button>
              </div>

              {isTopCustomersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              ) : topCustomers.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                  <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-extrabold text-slate-900 text-sm">No Top Customers Yet</h3>
                  <p className="text-xs text-slate-400 mt-1">Customers automatically appear here after placing 4 or more successful orders.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topCustomers.map((cust, idx) => (
                    <div
                      key={cust._id}
                      onClick={() => setSelectedTopCustomer(cust)}
                      className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-slate-350 hover:shadow-md cursor-pointer transition-all space-y-4 relative overflow-hidden group"
                    >
                      {/* Ranking Badge */}
                      <div className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center bg-slate-50 border-l border-b border-slate-150 rounded-bl-3xl font-black text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100 transition-all text-sm">
                        #{idx + 1}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded font-black uppercase">Top Customer</span>
                        <h3 className="font-black text-slate-900 text-sm truncate pr-10">{cust.customerName || 'N/A'}</h3>
                        <p className="text-slate-550 font-bold text-xs">{cust._id}</p>
                        <p className="text-slate-400 text-xs truncate">{cust.customerEmail || 'N/A'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t pt-3 text-xs">
                        <div>
                          <span className="text-slate-400 block font-bold text-[10px] uppercase">Orders</span>
                          <span className="text-slate-900 font-extrabold block text-sm mt-0.5">{cust.totalOrders} Successful</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[10px] uppercase">Total Spent</span>
                          <span className="text-emerald-700 font-black block text-sm mt-0.5">৳{cust.totalPurchaseAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] font-bold text-slate-500 border border-slate-150 flex items-center justify-between">
                        <span>Last Order:</span>
                        <span className="text-slate-800">{new Date(cust.lastOrderDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* GLOBAL MODALS CONTAINER */}
      {/* ========================================================================= */}

      {/* MODAL: NEW / EDIT PRODUCT */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-50/95 rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl lg:max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200/80 my-auto">
            {/* STICKY TOP HEADER */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    editingProduct.id ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-white'
                  }`}>
                    {editingProduct.id ? 'Edit Product' : 'Add Product'}
                  </span>
                  {editingProduct.id && (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      SKU: {editingProduct.sku || 'N/A'}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate">
                  {editingProduct.id ? (editingProduct.name || 'Edit Product') : 'Catalog New Football Jersey'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 hidden sm:block">
                  Create and manage your product information, pricing, categories, images and customization options.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer border-none"
                  title="Close modal"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-7 space-y-6 scrollbar-thin">
              
              {/* SECTION 01: BASIC PRODUCT INFORMATION */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
                <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase">
                      01
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                        Basic Product Information
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Primary identification, name, search slug, and inventory SKU
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                      <span>Product Name</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      required
                      placeholder="e.g. Real Madrid 2026/27 Home Kit"
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 p-3 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-semibold transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">
                      Slug (URL endpoint)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editingProduct.slug || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                        placeholder="e.g. real-madrid-2026-home-kit"
                        className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 p-2.5 rounded-xl bg-white text-slate-900 font-mono text-xs transition-all outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Unique URL endpoint used for product routing.</p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                      <span>SKU Code</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingProduct.sku || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                      required
                      placeholder="e.g. RM-2026-H"
                      className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 p-2.5 rounded-xl bg-white text-slate-900 font-mono font-bold text-xs uppercase transition-all outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Stock Keeping Unit for inventory identification.</p>
                  </div>
                </div>
              </div>

              {/* SECTION 02: PRICING & INVENTORY */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
                <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase">
                      02
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                        Pricing & Inventory
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Standard price, percentage promotional discount, and inventory control
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-5 text-xs">
                  {/* PRICING SUB-GROUP */}
                  <div>
                    <label className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider block mb-2.5">
                      Pricing Configuration
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {/* Standard Price */}
                      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70">
                        <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                          <span>Standard Price (৳)</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">৳</span>
                          <input
                            type="number"
                            min={0}
                            value={editingProduct.price !== undefined ? editingProduct.price : ''}
                            onChange={(e) => {
                              const price = Number(e.target.value || 0);
                              const discountPercent = editingProduct.discountPercent || 0;
                              const salePrice = discountPercent > 0 ? Math.round(price - (price * discountPercent / 100)) : undefined;
                              setEditingProduct({ ...editingProduct, price, salePrice });
                            }}
                            required
                            placeholder="1200"
                            className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 pl-7 pr-3 py-2 rounded-xl bg-white text-slate-900 font-bold text-sm outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Original regular selling price</p>
                      </div>

                      {/* Discount Percentage */}
                      <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70">
                        <label className="font-bold text-slate-800 block mb-1.5">
                          Discount Percentage (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editingProduct.discountPercent !== undefined && editingProduct.discountPercent !== null ? editingProduct.discountPercent : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const discountPercent = val === '' ? 0 : Number(val);
                              const price = editingProduct.price || 0;
                              const salePrice = discountPercent > 0 ? Math.round(price - (price * discountPercent / 100)) : undefined;
                              setEditingProduct({ ...editingProduct, discountPercent, salePrice });
                            }}
                            className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 pr-7 pl-3 py-2 rounded-xl bg-white text-slate-900 font-bold text-sm outline-none"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Enter 0 for no discount</p>
                      </div>

                      {/* Calculated Discount Price */}
                      <div className={`p-3 rounded-2xl border transition-all ${
                        editingProduct.discountPercent && editingProduct.discountPercent > 0
                          ? 'bg-emerald-50/70 border-emerald-300/80 text-emerald-950'
                          : 'bg-slate-50/80 border-slate-200/70 text-slate-600'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-bold block">
                            Calculated Discount Price
                          </label>
                          {editingProduct.discountPercent && editingProduct.discountPercent > 0 ? (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-600 text-white rounded">
                              Active Sale
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400">
                              Read-Only
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400 font-bold">৳</span>
                          <input
                            type="text"
                            value={
                              editingProduct.discountPercent && editingProduct.discountPercent > 0 && editingProduct.salePrice
                                ? `${editingProduct.salePrice.toLocaleString()} (${editingProduct.discountPercent}% OFF)`
                                : (editingProduct.price ? `${editingProduct.price.toLocaleString()} (Regular)` : '—')
                            }
                            readOnly
                            disabled
                            className="w-full border border-slate-200/80 pl-7 pr-3 py-2 rounded-xl bg-white/70 text-slate-800 font-black text-sm cursor-not-allowed select-none"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">
                          {editingProduct.discountPercent && editingProduct.discountPercent > 0
                            ? `Customers save ৳${((editingProduct.price || 0) - (editingProduct.salePrice || 0)).toLocaleString()}`
                            : 'Auto-calculates when discount % is set'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* INVENTORY SUB-GROUP */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider block mb-2.5">
                      Inventory Control
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                          <span>Warehouse Stock quantity</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={editingProduct.stock !== undefined ? editingProduct.stock : 25}
                          onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                          required
                          className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 p-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Current units available in warehouse.</p>
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                          <span>Low Stock Warning Limit</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={editingProduct.lowStockAlert !== undefined ? editingProduct.lowStockAlert : 5}
                          onChange={(e) => setEditingProduct({ ...editingProduct, lowStockAlert: Number(e.target.value) })}
                          required
                          className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 p-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Triggers low stock alert in admin panel when stock reaches this limit.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 03: CATEGORY SYSTEM */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
                <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase">
                      03
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                        Category System
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Visual 3-step category hierarchy mapping (Level 1 → Level 2 → Level 3)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 text-xs">
                  {/* Step indicators */}
                  <div className="hidden sm:flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">1</span>
                      <span>Level 1: Main Category</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">2</span>
                      <span>Level 2: Team / Subcategory</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">3</span>
                      <span>Level 3: Edition (Subcategory)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* LEVEL 1 */}
                    <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5">
                      <label className="font-extrabold text-slate-800 block text-xs flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[9px]">1</span>
                        <span>Level 1 - Main Category</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedL1}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedL1(val);
                          setSelectedL2('');
                          setSelectedL3('');
                          const catObj = categoriesList.find(c => c.id === val);
                          setEditingProduct({
                            ...editingProduct,
                            categoryId: val,
                            categoryName: catObj ? catObj.name : '',
                            subcategoryId: '',
                            subcategoryName: ''
                          });
                        }}
                        required
                        className="w-full border border-slate-200 focus:border-emerald-500 p-2.5 rounded-xl bg-white text-slate-800 font-semibold cursor-pointer outline-none transition-all"
                      >
                        <option value="">Select Main Category</option>
                        {categoriesList.filter((cat) => !cat.parentId).map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400">Main store catalog section</p>
                    </div>

                    {/* LEVEL 2 */}
                    <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5">
                      <label className="font-extrabold text-slate-800 block text-xs flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[9px]">2</span>
                        <span>Level 2 - Team / Subcategory</span>
                      </label>
                      <select
                        value={selectedL2}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedL2(val);
                          setSelectedL3('');
                          const catObj = categoriesList.find(c => c.id === val);
                          if (selectedL1 === 'cat-clubs' || selectedL1 === 'cat-national-teams') {
                            setEditingProduct({
                              ...editingProduct,
                              categoryId: val,
                              categoryName: catObj ? catObj.name : '',
                              subcategoryId: '',
                              subcategoryName: ''
                            });
                          } else {
                            setEditingProduct({
                              ...editingProduct,
                              categoryId: selectedL1,
                              categoryName: categoriesList.find(c => c.id === selectedL1)?.name || '',
                              subcategoryId: val,
                              subcategoryName: catObj ? catObj.name : ''
                            });
                          }
                        }}
                        className="w-full border border-slate-200 focus:border-emerald-500 p-2.5 rounded-xl bg-white text-slate-800 font-semibold cursor-pointer outline-none transition-all"
                      >
                        <option value="">Select Level 2 (optional)</option>
                        {categoriesList
                          .filter((cat) => cat.parentId === selectedL1)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                      </select>
                      <p className="text-[10px] text-slate-400">Team or product subsection</p>
                    </div>

                    {/* LEVEL 3 */}
                    <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5">
                      <label className="font-extrabold text-slate-800 block text-xs flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[9px]">3</span>
                        <span>Level 3 - Edition (Subcategory)</span>
                      </label>
                      <select
                        value={selectedL3}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedL3(val);
                          const catObj = categoriesList.find(c => c.id === val);
                          setEditingProduct({
                            ...editingProduct,
                            categoryId: selectedL2,
                            categoryName: categoriesList.find(c => c.id === selectedL2)?.name || '',
                            subcategoryId: val,
                            subcategoryName: catObj ? catObj.name : ''
                          });
                        }}
                        className="w-full border border-slate-200 focus:border-emerald-500 p-2.5 rounded-xl bg-white text-slate-800 font-semibold cursor-pointer outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        disabled={!(selectedL1 === 'cat-clubs' || selectedL1 === 'cat-national-teams') || !selectedL2}
                      >
                        <option value="">Select Level 3 Edition (optional)</option>
                        {categoriesList
                          .filter((cat) => cat.parentId === selectedL2)
                          .map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                      </select>
                      <p className="text-[10px] text-slate-400">Jersey release edition (Home, Away, etc.)</p>
                    </div>
                  </div>

                  {/* Active Hierarchy Path Preview */}
                  <div className="p-3 bg-slate-100/70 rounded-xl flex items-center gap-2 text-[11px] font-bold text-slate-700 flex-wrap">
                    <span className="text-slate-400 font-medium">Assigned Category Path:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-black">
                        {categoriesList.find(c => c.id === selectedL1)?.name || 'None'}
                      </span>
                      {selectedL2 && (
                        <>
                          <span className="text-slate-400">&gt;</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-black">
                            {categoriesList.find(c => c.id === selectedL2)?.name || selectedL2}
                          </span>
                        </>
                      )}
                      {selectedL3 && (
                        <>
                          <span className="text-slate-400">&gt;</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-emerald-800 font-black">
                            {categoriesList.find(c => c.id === selectedL3)?.name || selectedL3}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 04: PRODUCT DESCRIPTION */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
                <div 
                  onClick={() => toggleProductSection('description')}
                  className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50 select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase">
                      04
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                        Product Description
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Short summary for card previews and full technical specifications
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {productSectionCollapsed.description && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                        {editingProduct.shortDescription ? 'Configured' : 'Empty'}
                      </span>
                    )}
                    <button type="button" className="text-slate-400 hover:text-slate-600 bg-transparent border-none p-1">
                      {productSectionCollapsed.description ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!productSectionCollapsed.description && (
                  <div className="p-4 sm:p-6 space-y-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-slate-800 block">
                          Short Summary Description
                        </label>
                        <span className={`text-[10px] font-mono font-bold ${
                          (editingProduct.shortDescription || '').length > 200
                            ? 'text-red-500 font-black'
                            : (editingProduct.shortDescription || '').length > 160
                            ? 'text-amber-500'
                            : 'text-slate-400'
                        }`}>
                          {(editingProduct.shortDescription || '').length} / 200 chars
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={editingProduct.shortDescription || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                        placeholder="e.g. Official player-issue dry-fit jersey with breathable mesh ventilation and authentic tournament badges."
                        className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 p-2.5 rounded-xl bg-white text-slate-900 outline-none transition-all resize-none text-xs leading-relaxed"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Concise 1-2 sentence overview shown on catalog cards and quick views.</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-slate-800 block flex items-center gap-1">
                          <span>Full Detailed Specifications</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                          Rich text formatting, lists, links, & inline image uploads supported
                        </span>
                      </div>
                      <RichTextEditor
                        value={editingProduct.description || ''}
                        onChange={(html) => setEditingProduct({ ...editingProduct, description: html })}
                        placeholder="Detail fabric blend, authentic club badges, washing instructions, and fit specifications..."
                        minHeight="260px"
                      />
                      <p className="text-[10px] text-slate-400 mt-1.5">Displayed with full formatting and embedded images on the customer product page.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 05: PRODUCT IMAGES */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
                <div 
                  onClick={() => toggleProductSection('images')}
                  className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50 select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase">
                      05
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                        Product Images
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Upload catalog photographs with cover ordering and thumbnail preview
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {productSectionCollapsed.images && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                        {(editingProduct.images || []).length} image(s)
                      </span>
                    )}
                    <button type="button" className="text-slate-400 hover:text-slate-600 bg-transparent border-none p-1">
                      {productSectionCollapsed.images ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!productSectionCollapsed.images && (
                  <div className="p-4 sm:p-6 text-xs">
                    <MultiImageUpload
                      label="Jersey Catalog Images (Upload files locally)"
                      value={editingProduct.images || []}
                      onChange={(urls) => setEditingProduct({ ...editingProduct, images: urls })}
                    />
                  </div>
                )}
              </div>

              {/* SECTION 06: HOMEPAGE SECTIONS */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
                <div 
                  onClick={() => toggleProductSection('homepage')}
                  className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50 select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase">
                      06
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                        Homepage Sections
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Choose where this product should appear on the homepage.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {productSectionCollapsed.homepage && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                        {(editingProduct.homepageSections || []).length} section(s)
                      </span>
                    )}
                    <button type="button" className="text-slate-400 hover:text-slate-600 bg-transparent border-none p-1">
                      {productSectionCollapsed.homepage ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!productSectionCollapsed.homepage && (
                  <div className="p-4 sm:p-6 space-y-2 text-xs font-semibold">
                    <p className="text-[11px] text-slate-500 font-medium mb-3">
                      Choose where this product should appear on the homepage.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { key: 'flash_sale', label: 'Limited Time Deals FLASH SALE 2026', icon: Flame },
                        { key: 'featured', label: 'Featured', icon: Sparkles },
                        { key: 'best_sellers', label: 'Best Sellers', icon: Trophy },
                        { key: 'trending', label: 'Trending', icon: TrendingUp },
                        { key: 'new_arrivals', label: 'New Arrivals', icon: Package }
                      ].map((sec) => {
                        const currentSections = editingProduct.homepageSections || [];
                        const isChecked = currentSections.includes(sec.key);
                        const Icon = sec.icon;
                        return (
                          <div
                            key={sec.key}
                            onClick={() => {
                              let newSecs = [...currentSections];
                              const willCheck = !isChecked;
                              if (willCheck) {
                                if (!newSecs.includes(sec.key)) newSecs.push(sec.key);
                              } else {
                                newSecs = newSecs.filter(s => s !== sec.key);
                              }
                              const update: any = { ...editingProduct, homepageSections: newSecs };
                              if (sec.key === 'featured') update.featured = willCheck;
                              if (sec.key === 'flash_sale') update.isFlashSale = willCheck;
                              if (sec.key === 'trending') update.isTrending = willCheck;
                              if (sec.key === 'best_sellers') update.isBestSeller = willCheck;
                              if (sec.key === 'new_arrivals') update.isNewArrival = willCheck;
                              setEditingProduct(update);
                            }}
                            className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                              isChecked
                                ? 'bg-emerald-50/80 border-emerald-500/70 text-emerald-950 shadow-xs'
                                : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="text-emerald-600 rounded focus:ring-emerald-500 pointer-events-none w-4 h-4"
                            />
                            <Icon className={`w-4 h-4 shrink-0 ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="font-bold text-xs flex-1 truncate">{sec.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 07: CUSTOMIZATION OPTIONS */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
                <div 
                  onClick={() => toggleProductSection('customization')}
                  className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50 select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase">
                      07
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                        Customization Options
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Custom player name & number heat-press and official sleeve badge patches
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {productSectionCollapsed.customization && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                        {editingProduct.showCustomNameNumber || editingProduct.showSleevePatches ? 'Active' : 'Disabled'}
                      </span>
                    )}
                    <button type="button" className="text-slate-400 hover:text-slate-600 bg-transparent border-none p-1">
                      {productSectionCollapsed.customization ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!productSectionCollapsed.customization && (
                  <div className="p-4 sm:p-6 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Toggle 1: Custom Squad Name & Number */}
                      <label className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                        editingProduct.showCustomNameNumber
                          ? 'bg-emerald-50/60 border-emerald-400/70 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}>
                        <div className="pr-3">
                          <span className="font-black text-xs text-slate-900 block">
                            Show CUSTOM SQUAD NAME & NUMBER HEAT-PRESS
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block leading-relaxed">
                            Allows customers to enter custom squad name & squad number (+৳250).
                          </span>
                        </div>
                        <div className="relative shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={editingProduct.showCustomNameNumber ?? false}
                            onChange={(e) => setEditingProduct({ 
                              ...editingProduct, 
                              showCustomNameNumber: e.target.checked,
                              allowCustomPrint: e.target.checked
                            })}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            editingProduct.showCustomNameNumber ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ml-0.5 ${
                              editingProduct.showCustomNameNumber ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                      </label>

                      {/* Toggle 2: Show Sleeve / Patches */}
                      <label className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                        editingProduct.showSleevePatches
                          ? 'bg-emerald-50/60 border-emerald-400/70 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}>
                        <div className="pr-3">
                          <span className="font-black text-xs text-slate-900 block">
                            Show SLEEVE / PATCHES OPTION
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block leading-relaxed">
                            Enables sleeve tournament badge selection for this jersey.
                          </span>
                        </div>
                        <div className="relative shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={editingProduct.showSleevePatches ?? false}
                            onChange={(e) => setEditingProduct({ ...editingProduct, showSleevePatches: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            editingProduct.showSleevePatches ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ml-0.5 ${
                              editingProduct.showSleevePatches ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Available Badges Selector */}
                    {editingProduct.showSleevePatches && (
                      <div className="p-4 sm:p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3.5 mt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <label className="font-black block text-slate-900 text-xs">
                              Available Badges for this Product (from Sleeve / Badges Library)
                            </label>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              Select which active badges from the centralized library can be chosen by customers for this jersey.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const activeIds = sleeveBadgeOptions.filter((b) => b.isActive).map((b) => b.id);
                                setEditingProduct({ ...editingProduct, sleeveBadges: activeIds });
                              }}
                              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer bg-transparent border-none"
                            >
                              Select All Active
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct({ ...editingProduct, sleeveBadges: [] });
                              }}
                              className="text-[11px] text-slate-500 hover:text-slate-700 font-bold underline cursor-pointer bg-transparent border-none"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>

                        {sleeveBadgeOptions.filter((b) => b.isActive).length === 0 ? (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                            No active badges found in the global Sleeve / Badges Library. Please create or enable badges in Admin → Sleeve / Badges first.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {sleeveBadgeOptions
                              .filter((b) => b.isActive)
                              .map((badge) => {
                                const isChecked = (editingProduct.sleeveBadges || []).includes(badge.id);
                                return (
                                  <div
                                    key={badge.id}
                                    onClick={() => {
                                      const currentBadges = editingProduct.sleeveBadges || [];
                                      const updated = isChecked
                                        ? currentBadges.filter((id) => id !== badge.id)
                                        : [...currentBadges, badge.id];
                                      setEditingProduct({ ...editingProduct, sleeveBadges: updated });
                                    }}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                                      isChecked
                                        ? 'bg-emerald-50 border-emerald-500/70 shadow-2xs'
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="text-emerald-600 rounded focus:ring-emerald-500 pointer-events-none w-4 h-4"
                                    />
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                      {badge.image ? (
                                        <img
                                          src={badge.image}
                                          alt={badge.name}
                                          className="w-full h-full object-contain p-0.5"
                                        />
                                      ) : (
                                        <Shirt className="w-4 h-4 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-slate-900 text-xs truncate">
                                        {badge.name}
                                      </div>
                                      <div className="text-[10px] text-emerald-600 font-extrabold">
                                        +৳{badge.price || 0}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 08: PRODUCT SIZE OPTIONS */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
                <div 
                  onClick={() => toggleProductSection('sizes')}
                  className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50 select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] tracking-wider uppercase">
                      08
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                        Product Size Options
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Enable sizing, set mandatory selection, and configure available sizes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {productSectionCollapsed.sizes && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                        {editingProduct.sizeOptions?.enabled ? `${(editingProduct.sizeOptions?.sizes || []).length} sizes` : 'Disabled'}
                      </span>
                    )}
                    <button type="button" className="text-slate-400 hover:text-slate-600 bg-transparent border-none p-1">
                      {productSectionCollapsed.sizes ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!productSectionCollapsed.sizes && (
                  <div className="p-4 sm:p-6 space-y-4 text-xs">
                    {/* Size Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {/* Enable Size Selection */}
                      <label className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                        (editingProduct.sizeOptions?.enabled ?? true)
                          ? 'bg-emerald-50/60 border-emerald-400/70 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}>
                        <div className="pr-3">
                          <span className="font-black text-xs text-slate-900 block">
                            Enable Size Selection
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block leading-relaxed">
                            Allows customers to select jersey sizes for this product.
                          </span>
                        </div>
                        <div className="relative shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={editingProduct.sizeOptions?.enabled ?? true}
                            onChange={(e) => {
                              const currentOptions = editingProduct.sizeOptions || {
                                enabled: true,
                                required: true,
                                label: 'Select Size:',
                                sizes: editingProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL']
                              };
                              setEditingProduct({
                                ...editingProduct,
                                sizeOptions: {
                                  ...currentOptions,
                                  enabled: e.target.checked
                                }
                              });
                            }}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            (editingProduct.sizeOptions?.enabled ?? true) ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ml-0.5 ${
                              (editingProduct.sizeOptions?.enabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                      </label>

                      {/* Require Size Selection */}
                      <label className={`flex items-start justify-between p-4 rounded-2xl border transition-all ${
                        !(editingProduct.sizeOptions?.enabled ?? true)
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200'
                          : (editingProduct.sizeOptions?.required ?? true)
                          ? 'bg-emerald-50/60 border-emerald-400/70 shadow-xs cursor-pointer'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 cursor-pointer'
                      }`}>
                        <div className="pr-3">
                          <span className="font-black text-xs text-slate-900 block">
                            Require Size Selection
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block leading-relaxed">
                            Mandatory requirement: customer cannot add to cart without picking a size.
                          </span>
                        </div>
                        <div className="relative shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={editingProduct.sizeOptions?.required ?? true}
                            disabled={!(editingProduct.sizeOptions?.enabled ?? true)}
                            onChange={(e) => {
                              const currentOptions = editingProduct.sizeOptions || {
                                enabled: true,
                                required: true,
                                label: 'Select Size:',
                                sizes: editingProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL']
                              };
                              setEditingProduct({
                                ...editingProduct,
                                sizeOptions: {
                                  ...currentOptions,
                                  required: e.target.checked
                                }
                              });
                            }}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            (editingProduct.sizeOptions?.required ?? true) ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ml-0.5 ${
                              (editingProduct.sizeOptions?.required ?? true) ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                      </label>

                      {/* Show Size Chart Toggle */}
                      <label className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                        Boolean(editingProduct.showSizeChart ?? editingProduct.sizeOptions?.showSizeChart)
                          ? 'bg-emerald-50/60 border-emerald-400/70 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}>
                        <div className="pr-3">
                          <span className="font-black text-xs text-slate-900 block">
                            Show Size Chart
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block leading-relaxed">
                            Display editable Chest & Length measurements chart on product & BUY popup.
                          </span>
                        </div>
                        <div className="relative shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.showSizeChart ?? editingProduct.sizeOptions?.showSizeChart)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              const currentSizes = editingProduct.sizeOptions?.sizes || editingProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
                              const updatedChart = syncSizeChartWithSizes(currentSizes, editingProduct.sizeChart || editingProduct.sizeOptions?.sizeChart);

                              const currentOptions = editingProduct.sizeOptions || {
                                enabled: true,
                                required: true,
                                label: 'Select Size:',
                                sizes: currentSizes
                              };

                              setEditingProduct({
                                ...editingProduct,
                                showSizeChart: isChecked,
                                sizeChart: updatedChart,
                                sizeOptions: {
                                  ...currentOptions,
                                  showSizeChart: isChecked,
                                  sizeChart: updatedChart
                                }
                              });
                            }}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            Boolean(editingProduct.showSizeChart ?? editingProduct.sizeOptions?.showSizeChart) ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ml-0.5 ${
                              Boolean(editingProduct.showSizeChart ?? editingProduct.sizeOptions?.showSizeChart) ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Size Label Input */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                        <span>Size Label *</span>
                      </label>
                      <input
                        type="text"
                        disabled={!(editingProduct.sizeOptions?.enabled ?? true)}
                        value={editingProduct.sizeOptions?.label ?? 'Select Size:'}
                        onChange={(e) => {
                          const currentOptions = editingProduct.sizeOptions || {
                            enabled: true,
                            required: true,
                            label: 'Select Size:',
                            sizes: editingProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL']
                          };
                          setEditingProduct({
                            ...editingProduct,
                            sizeOptions: {
                              ...currentOptions,
                              label: e.target.value
                            }
                          });
                        }}
                        placeholder="e.g. Select Jersey Size:"
                        className="w-full border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 p-2.5 rounded-xl bg-white text-slate-900 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Available Sizes List & Custom Manager */}
                    {(editingProduct.sizeOptions?.enabled ?? true) && (
                      <div className="space-y-4 pt-3 border-t border-slate-100">
                        <div>
                          <label className="font-bold block text-slate-800 text-[11px] uppercase tracking-wider mb-2">
                            Quick Toggle Standard Sizes
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map((stdSize) => {
                              const sizesList = editingProduct.sizeOptions?.sizes || editingProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
                              const isChecked = sizesList.includes(stdSize);
                              return (
                                <button
                                  type="button"
                                  key={stdSize}
                                  onClick={() => {
                                    const currentSizes = editingProduct.sizeOptions?.sizes || editingProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
                                    let updated = [];
                                    if (!isChecked) {
                                      updated = [...currentSizes, stdSize];
                                    } else {
                                      updated = currentSizes.filter(s => s !== stdSize);
                                    }
                                    const order = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
                                    updated.sort((a, b) => {
                                      const idxA = order.indexOf(a);
                                      const idxB = order.indexOf(b);
                                      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                      if (idxA !== -1) return -1;
                                      if (idxB !== -1) return 1;
                                      return a.localeCompare(b);
                                    });

                                    const currentOptions = editingProduct.sizeOptions || {
                                      enabled: true,
                                      required: true,
                                      label: 'Select Size:',
                                      sizes: []
                                    };

                                    const updatedChart = syncSizeChartWithSizes(updated, editingProduct.sizeChart || editingProduct.sizeOptions?.sizeChart);

                                    setEditingProduct({
                                      ...editingProduct,
                                      sizes: updated,
                                      sizeChart: updatedChart,
                                      sizeOptions: {
                                        ...currentOptions,
                                        sizes: updated,
                                        sizeChart: updatedChart
                                      }
                                    });
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl cursor-pointer text-xs font-black transition-all select-none ${
                                    isChecked
                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5" />}
                                  <span>{stdSize}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Size Manager */}
                        <div className="space-y-2.5 bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <label className="font-black block text-xs text-slate-800">
                              Custom Size Manager
                            </label>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {(editingProduct.sizeOptions?.sizes || []).length} active sizes
                            </span>
                          </div>

                          <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200/80 p-2 rounded-xl bg-white scrollbar-thin">
                            {(editingProduct.sizeOptions?.sizes || []).map((sz, index) => (
                              <div key={index} className="flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/60 p-2 rounded-lg gap-2 text-xs font-black text-slate-800 transition-colors">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-slate-200">{sz}</span>
                                
                                <div className="flex items-center gap-1.5">
                                  {/* Reorder Up */}
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => {
                                      const sizes = [...(editingProduct.sizeOptions?.sizes || [])];
                                      const temp = sizes[index];
                                      sizes[index] = sizes[index - 1];
                                      sizes[index - 1] = temp;
                                      const updatedChart = syncSizeChartWithSizes(sizes, editingProduct.sizeChart || editingProduct.sizeOptions?.sizeChart);
                                      
                                      setEditingProduct({
                                        ...editingProduct,
                                        sizes,
                                        sizeChart: updatedChart,
                                        sizeOptions: {
                                          ...(editingProduct.sizeOptions || { enabled: true, required: true, label: 'Select Size:', sizes: [] }),
                                          sizes,
                                          sizeChart: updatedChart
                                        }
                                      });
                                    }}
                                    className="px-2 py-1 border border-slate-200 rounded-lg hover:bg-white cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed bg-white text-[10px] font-bold text-slate-700"
                                    title="Move size up"
                                  >
                                    ↑ Up
                                  </button>
                                  {/* Reorder Down */}
                                  <button
                                    type="button"
                                    disabled={index === (editingProduct.sizeOptions?.sizes || []).length - 1}
                                    onClick={() => {
                                      const sizes = [...(editingProduct.sizeOptions?.sizes || [])];
                                      const temp = sizes[index];
                                      sizes[index] = sizes[index + 1];
                                      sizes[index + 1] = temp;
                                      const updatedChart = syncSizeChartWithSizes(sizes, editingProduct.sizeChart || editingProduct.sizeOptions?.sizeChart);
                                      
                                      setEditingProduct({
                                        ...editingProduct,
                                        sizes,
                                        sizeChart: updatedChart,
                                        sizeOptions: {
                                          ...(editingProduct.sizeOptions || { enabled: true, required: true, label: 'Select Size:', sizes: [] }),
                                          sizes,
                                          sizeChart: updatedChart
                                        }
                                      });
                                    }}
                                    className="px-2 py-1 border border-slate-200 rounded-lg hover:bg-white cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed bg-white text-[10px] font-bold text-slate-700"
                                    title="Move size down"
                                  >
                                    ↓ Down
                                  </button>
                                  {/* Edit Size */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSz = prompt(`Edit size name for "${sz}":`, sz);
                                      if (newSz && newSz.trim()) {
                                        const trimmed = newSz.trim();
                                        const sizes = [...(editingProduct.sizeOptions?.sizes || [])];
                                        sizes[index] = trimmed;
                                        const oldChart = editingProduct.sizeChart || editingProduct.sizeOptions?.sizeChart || [];
                                        const updatedChart = oldChart.map(c => c.size === sz ? { ...c, size: trimmed } : c);
                                        setEditingProduct({
                                          ...editingProduct,
                                          sizes,
                                          sizeChart: updatedChart,
                                          sizeOptions: {
                                            ...(editingProduct.sizeOptions || { enabled: true, required: true, label: 'Select Size:', sizes: [] }),
                                            sizes,
                                            sizeChart: updatedChart
                                          }
                                        });
                                      }
                                    }}
                                    className="px-2 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer bg-white text-[10px] font-bold"
                                    title="Rename size"
                                  >
                                    Edit
                                  </button>
                                  {/* Remove Size */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const sizes = (editingProduct.sizeOptions?.sizes || []).filter((_, i) => i !== index);
                                      const updatedChart = syncSizeChartWithSizes(sizes, editingProduct.sizeChart || editingProduct.sizeOptions?.sizeChart);
                                      setEditingProduct({
                                        ...editingProduct,
                                        sizes,
                                        sizeChart: updatedChart,
                                        sizeOptions: {
                                          ...(editingProduct.sizeOptions || { enabled: true, required: true, label: 'Select Size:', sizes: [] }),
                                          sizes,
                                          sizeChart: updatedChart
                                        }
                                      });
                                    }}
                                    className="px-2 py-1 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer bg-white text-[10px] font-bold"
                                    title="Delete size"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}

                            {(!editingProduct.sizeOptions?.sizes || editingProduct.sizeOptions.sizes.length === 0) && (
                              <p className="text-[11px] text-slate-400 italic text-center py-3">No sizes configured for this product.</p>
                            )}
                          </div>

                          {/* Add Custom Size Form */}
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              id="custom-size-input"
                              placeholder="Type custom size (e.g. 4XL or 18) and press Enter"
                              className="flex-1 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 p-2 rounded-xl bg-white text-slate-900 text-xs font-semibold outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const input = e.currentTarget;
                                  const val = input.value.trim();
                                  if (val) {
                                    const currentSizes = editingProduct.sizeOptions?.sizes || editingProduct.sizes || [];
                                    if (currentSizes.includes(val)) {
                                      alert('Size already exists.');
                                      return;
                                    }
                                    const sizes = [...currentSizes, val];
                                    const updatedChart = syncSizeChartWithSizes(sizes, editingProduct.sizeChart || editingProduct.sizeOptions?.sizeChart);
                                    const currentOptions = editingProduct.sizeOptions || {
                                      enabled: true,
                                      required: true,
                                      label: 'Select Size:',
                                      sizes: []
                                    };
                                    setEditingProduct({
                                      ...editingProduct,
                                      sizes,
                                      sizeChart: updatedChart,
                                      sizeOptions: {
                                        ...currentOptions,
                                        sizes,
                                        sizeChart: updatedChart
                                      }
                                    });
                                    input.value = '';
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('custom-size-input') as HTMLInputElement;
                                const val = input ? input.value.trim() : '';
                                if (val) {
                                  const currentSizes = editingProduct.sizeOptions?.sizes || editingProduct.sizes || [];
                                  if (currentSizes.includes(val)) {
                                    alert('Size already exists.');
                                    return;
                                  }
                                  const sizes = [...currentSizes, val];
                                  const updatedChart = syncSizeChartWithSizes(sizes, editingProduct.sizeChart || editingProduct.sizeOptions?.sizeChart);
                                  const currentOptions = editingProduct.sizeOptions || {
                                    enabled: true,
                                    required: true,
                                    label: 'Select Size:',
                                    sizes: []
                                  };
                                  setEditingProduct({
                                    ...editingProduct,
                                    sizes,
                                    sizeChart: updatedChart,
                                    sizeOptions: {
                                      ...currentOptions,
                                      sizes,
                                      sizeChart: updatedChart
                                    }
                                  });
                                  if (input) input.value = '';
                                }
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl cursor-pointer text-xs transition-colors shrink-0 border-none"
                            >
                              Add Size
                            </button>
                          </div>
                        </div>

                        {/* SIZE CHART MANAGER (WHEN SHOW SIZE CHART IS ON) */}
                        {Boolean(editingProduct.showSizeChart ?? editingProduct.sizeOptions?.showSizeChart) && (
                          <div className="space-y-3 bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 animate-in fade-in duration-150">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-emerald-100 pb-2.5">
                              <div>
                                <h5 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                                  <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Size Chart Manager</span>
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                                    {(editingProduct.sizeOptions?.sizes || editingProduct.sizes || []).length} sizes
                                  </span>
                                </h5>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  Set custom Length & Chest measurements in inches for each available size. Supports decimal values (e.g. 27.5, 38.5).
                                </p>
                              </div>
                              <div className="text-[10px] font-bold text-slate-400">
                                Values saved per-product
                              </div>
                            </div>

                            {/* Table */}
                            {(() => {
                              const activeSizes = editingProduct.sizeOptions?.sizes || editingProduct.sizes || [];
                              if (activeSizes.length === 0) {
                                return (
                                  <p className="text-[11px] text-slate-400 italic text-center py-3">
                                    No available sizes selected. Please select sizes above to configure the size chart.
                                  </p>
                                );
                              }

                              const currentChart = (editingProduct.sizeChart || editingProduct.sizeOptions?.sizeChart || []) as SizeChartItem[];
                              const chartMap = new Map<string, SizeChartItem>(currentChart.map(item => [item.size, item]));

                              return (
                                <div className="w-full max-w-full overflow-x-auto rounded-xl border border-emerald-200/90 bg-white shadow-2xs">
                                  <table className="w-full text-center text-xs border-collapse min-w-[320px]">
                                    <thead>
                                      <tr className="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200 text-[11px] uppercase tracking-wider">
                                        <th className="py-2.5 px-4 text-left w-24">Size</th>
                                        <th className="py-2.5 px-4">Length (inches)</th>
                                        <th className="py-2.5 px-4">Chest (inches)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {activeSizes.map((sz, idx) => {
                                        const row = chartMap.get(sz);
                                        const defaultVal = DEFAULT_SIZE_CHART_VALUES[sz] || { length: 26 + idx, chest: 36 + idx * 2 };
                                        const lengthVal = row && row.length !== undefined ? row.length : defaultVal.length;
                                        const chestVal = row && row.chest !== undefined ? row.chest : defaultVal.chest;

                                        const updateDimension = (field: 'length' | 'chest', rawVal: string) => {
                                          const num = rawVal === '' ? 0 : parseFloat(rawVal);
                                          const validNum = !isNaN(num) && num >= 0 ? num : 0;
                                          
                                          const updated = activeSizes.map((s, i) => {
                                            const existing = chartMap.get(s);
                                            const d = DEFAULT_SIZE_CHART_VALUES[s] || { length: 26 + i, chest: 36 + i * 2 };
                                            const currentLen = existing && existing.length !== undefined ? existing.length : d.length;
                                            const currentCh = existing && existing.chest !== undefined ? existing.chest : d.chest;

                                            if (s === sz) {
                                              return {
                                                size: s,
                                                length: field === 'length' ? validNum : currentLen,
                                                chest: field === 'chest' ? validNum : currentCh
                                              };
                                            }
                                            return {
                                              size: s,
                                              length: currentLen,
                                              chest: currentCh
                                            };
                                          });

                                          const currentOptions = editingProduct.sizeOptions || {
                                            enabled: true,
                                            required: true,
                                            label: 'Select Size:',
                                            sizes: activeSizes
                                          };

                                          setEditingProduct({
                                            ...editingProduct,
                                            sizeChart: updated,
                                            sizeOptions: {
                                              ...currentOptions,
                                              showSizeChart: true,
                                              sizeChart: updated
                                            }
                                          });
                                        };

                                        return (
                                          <tr key={sz} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-2.5 px-4 text-left">
                                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-900 border border-slate-200">
                                                {sz}
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-4">
                                              <div className="flex items-center justify-center">
                                                <input
                                                  type="number"
                                                  step="any"
                                                  min="0"
                                                  value={lengthVal}
                                                  onChange={(e) => updateDimension('length', e.target.value)}
                                                  placeholder="e.g. 27.5"
                                                  className="w-28 text-center border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 p-1.5 rounded-xl bg-white text-slate-900 text-xs font-black outline-none transition-all"
                                                />
                                              </div>
                                            </td>
                                            <td className="py-2.5 px-4">
                                              <div className="flex items-center justify-center">
                                                <input
                                                  type="number"
                                                  step="any"
                                                  min="0"
                                                  value={chestVal}
                                                  onChange={(e) => updateDimension('chest', e.target.value)}
                                                  placeholder="e.g. 38.5"
                                                  className="w-28 text-center border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 p-1.5 rounded-xl bg-white text-slate-900 text-xs font-black outline-none transition-all"
                                                />
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* KIDS / CHILDREN SIZES SUB-SECTION */}
                    <div className="pt-4 border-t border-slate-200/80 space-y-3">
                      {/* Show Kids / Children Sizes Toggle */}
                      <label className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer select-none transition-all ${
                        Boolean(editingProduct.showKidsSizes || editingProduct.sizeOptions?.showKidsSizes)
                          ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                      }`}>
                        <div className="pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900 block">
                              Show Kids / Children Sizes
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                              3Y – 14Y
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block leading-relaxed">
                            Enable dedicated kids / children size selection (3Y to 14Y) for this product.
                          </span>
                        </div>
                        <div className="relative shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.showKidsSizes || editingProduct.sizeOptions?.showKidsSizes)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              const currentKids = editingProduct.kidsSizes || editingProduct.sizeOptions?.kidsSizes || ALL_KIDS_SIZES;
                              setEditingProduct({
                                ...editingProduct,
                                showKidsSizes: isChecked,
                                kidsSizes: isChecked ? (currentKids.length > 0 ? currentKids : ALL_KIDS_SIZES) : currentKids,
                                sizeOptions: {
                                  ...(editingProduct.sizeOptions || { enabled: true, required: true, label: 'Select Size:', sizes: [] }),
                                  showKidsSizes: isChecked,
                                  kidsSizes: isChecked ? (currentKids.length > 0 ? currentKids : ALL_KIDS_SIZES) : currentKids
                                }
                              });
                            }}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            Boolean(editingProduct.showKidsSizes || editingProduct.sizeOptions?.showKidsSizes) ? 'bg-amber-500' : 'bg-slate-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ml-0.5 ${
                              Boolean(editingProduct.showKidsSizes || editingProduct.sizeOptions?.showKidsSizes) ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>
                      </label>

                      {/* Available Kids Sizes (3Y through 14Y) */}
                      {Boolean(editingProduct.showKidsSizes || editingProduct.sizeOptions?.showKidsSizes) && (
                        <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-2xs space-y-3 animate-in fade-in duration-150">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div>
                              <h5 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                                <span>Available Kids Sizes</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                                  {(editingProduct.kidsSizes || editingProduct.sizeOptions?.kidsSizes || []).length} / {ALL_KIDS_SIZES.length} selected
                                </span>
                              </h5>
                              <p className="text-[11px] text-slate-500">Choose which age sizes (3Y to 14Y) customers can choose from.</p>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct({
                                    ...editingProduct,
                                    kidsSizes: [...ALL_KIDS_SIZES],
                                    sizeOptions: {
                                      ...(editingProduct.sizeOptions || { enabled: true, required: true, label: 'Select Size:', sizes: [] }),
                                      showKidsSizes: true,
                                      kidsSizes: [...ALL_KIDS_SIZES]
                                    }
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold cursor-pointer border-none transition-colors"
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct({
                                    ...editingProduct,
                                    kidsSizes: [],
                                    sizeOptions: {
                                      ...(editingProduct.sizeOptions || { enabled: true, required: true, label: 'Select Size:', sizes: [] }),
                                      showKidsSizes: true,
                                      kidsSizes: []
                                    }
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-extrabold cursor-pointer border-none transition-colors"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>

                          {/* 12 Kids Sizes Checkbox / Pill Grid */}
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {ALL_KIDS_SIZES.map((kidsSize) => {
                              const activeKidsSizes = editingProduct.kidsSizes || editingProduct.sizeOptions?.kidsSizes || [];
                              const isChecked = activeKidsSizes.includes(kidsSize);
                              return (
                                <button
                                  type="button"
                                  key={kidsSize}
                                  onClick={() => {
                                    const currentList = editingProduct.kidsSizes || editingProduct.sizeOptions?.kidsSizes || [];
                                    const updated = isChecked
                                      ? currentList.filter(s => s !== kidsSize)
                                      : [...currentList, kidsSize];
                                    
                                    // Keep sorted in natural 3Y to 14Y order
                                    updated.sort((a, b) => ALL_KIDS_SIZES.indexOf(a) - ALL_KIDS_SIZES.indexOf(b));

                                    setEditingProduct({
                                      ...editingProduct,
                                      kidsSizes: updated,
                                      sizeOptions: {
                                        ...(editingProduct.sizeOptions || { enabled: true, required: true, label: 'Select Size:', sizes: [] }),
                                        showKidsSizes: true,
                                        kidsSizes: updated
                                      }
                                    });
                                  }}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all select-none ${
                                    isChecked
                                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <span>{kidsSize}</span>
                                  {isChecked ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded border border-slate-300 bg-white" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* STICKY BOTTOM SAVE ACTION BAR */}
              <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-4 -mx-3.5 sm:-mx-6 md:-mx-7 -mb-3.5 sm:-mb-6 md:-mb-7 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div className="text-xs text-slate-500 font-medium hidden sm:block">
                  {editingProduct.id ? (
                    <span>Editing product <strong className="text-slate-800">{editingProduct.name || editingProduct.id}</strong></span>
                  ) : (
                    <span>Ready to create new product catalog entry</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer bg-white"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 border-none"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingProduct.id ? 'Save Changes' : 'Save Product'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATEGORY MANAGER */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {isEditingCategory ? 'Modify Navbar Category' : 'Register Navbar Category'}
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Category Name</label>
                <input
                  type="text"
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  required
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Slug URL Endpoint (auto-generated if blank)</label>
                <input
                  type="text"
                  value={editingCategory.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  placeholder="Enter slug"
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Navbar Menu Location</label>
                <select
                  value={editingCategory.navbarLocation || 'hidden'}
                  onChange={(e) => setEditingCategory({ ...editingCategory, navbarLocation: e.target.value as any })}
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-800 cursor-pointer"
                >
                  <option value="main">Main Header Navigation Menu</option>
                  <option value="more">More Dropdown Menu</option>
                  <option value="hidden">Hidden Category</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Sort/Display Order</label>
                  <input
                    type="number"
                    value={editingCategory.navbarPosition || 1}
                    onChange={(e) => setEditingCategory({ ...editingCategory, navbarPosition: Number(e.target.value) })}
                    required
                    className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Status</label>
                  <select
                    value={editingCategory.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.value === 'active' })}
                    className="w-full border p-2.5 rounded-xl bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="active">Active Mode</option>
                    <option value="inactive">Inactive Mode</option>
                  </select>
                </div>
              </div>

              <ImageUpload
                label="Header banner image"
                value={editingCategory.image || ''}
                onChange={(url) => setEditingCategory({ ...editingCategory, image: url })}
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="flex-1 bg-slate-200 text-slate-850 font-bold py-2.5 rounded-xl cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl cursor-pointer border-none shadow-md"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TEAM MANAGER (CLUBS / NATIONAL TEAMS) */}
      {teamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {isEditingTeam ? 'Modify Team Configuration' : 'Register Fan Zone Team'}
              </h3>
              <button
                onClick={() => setTeamModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Team Name</label>
                <input
                  type="text"
                  value={editingTeam.name || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  placeholder="Enter team name"
                  required
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Team Category Type</label>
                <select
                  value={editingTeam.type || 'club'}
                  onChange={(e) => setEditingTeam({ ...editingTeam, type: e.target.value as any })}
                  disabled={isEditingTeam}
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-800 cursor-pointer disabled:bg-slate-100"
                >
                  <option value="club">Club</option>
                  <option value="national">National Team</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Slug Endpoint</label>
                <input
                  type="text"
                  value={editingTeam.slug || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, slug: e.target.value })}
                  placeholder="Enter slug"
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Display Order Position</label>
                  <input
                    type="number"
                    value={editingTeam.displayOrder || 1}
                    onChange={(e) => setEditingTeam({ ...editingTeam, displayOrder: Number(e.target.value) })}
                    required
                    className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Status Mode</label>
                  <select
                    value={editingTeam.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingTeam({ ...editingTeam, isActive: e.target.value === 'active' })}
                    className="w-full border p-2.5 rounded-xl bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="active">Active Visibility</option>
                    <option value="inactive">Hidden</option>
                  </select>
                </div>
              </div>

              <ImageUpload
                label="Team Crest Logo (Direct local upload)"
                value={editingTeam.logo || ''}
                onChange={(url) => setEditingTeam({ ...editingTeam, logo: url })}
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTeamModalOpen(false)}
                  className="flex-1 bg-slate-200 text-slate-855 font-bold py-2.5 rounded-xl cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl cursor-pointer border-none shadow-md"
                >
                  Save Team Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUB-CATEGORY MANAGER */}
      {subModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {editingSub.id ? 'Modify Subcategory' : 'Add New Subcategory'}
              </h3>
              <button
                onClick={() => setSubModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Parent Team / Club</label>
                <select
                  value={editingSub.teamId || ''}
                  onChange={(e) => {
                    const selectedTeam = categoriesList.find((cat) => cat.id === e.target.value);
                    setEditingSub({
                      ...editingSub,
                      teamId: e.target.value,
                      teamName: selectedTeam ? selectedTeam.name : ''
                    });
                  }}
                  required
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-800 cursor-pointer"
                >
                  <option value="">Select Team / Club</option>
                  {categoriesList
                    .filter((cat) => cat.parentId === 'cat-clubs' || cat.parentId === 'cat-national-teams')
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parentName === 'Clubs' ? 'Club: ' : 'National: '}{cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Subcategory Name</label>
                <input
                  type="text"
                  value={editingSub.name || ''}
                  onChange={(e) => setEditingSub({ ...editingSub, name: e.target.value })}
                  placeholder="Enter subcategory name"
                  required
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Slug Endpoint</label>
                <input
                  type="text"
                  value={editingSub.slug || ''}
                  onChange={(e) => setEditingSub({ ...editingSub, slug: e.target.value })}
                  placeholder="Enter slug"
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Sort position</label>
                  <input
                    type="number"
                    value={editingSub.displayOrder || 1}
                    onChange={(e) => setEditingSub({ ...editingSub, displayOrder: Number(e.target.value) })}
                    required
                    className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Status Mode</label>
                  <select
                    value={editingSub.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingSub({ ...editingSub, isActive: e.target.value === 'active' })}
                    className="w-full border p-2.5 rounded-xl bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="active">Active Visibility</option>
                    <option value="inactive">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="flex-1 bg-slate-200 text-slate-855 font-bold py-2.5 rounded-xl cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl cursor-pointer border-none shadow-md"
                >
                  Save Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HERO SLIDE BANNER */}
      {slideModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {editingSlide.id ? 'Modify Banner details' : 'Publish Landing Slider Banner'}
              </h3>
              <button
                onClick={() => setSlideModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Banner Title Header</label>
                <input
                  type="text"
                  value={editingSlide.title || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  required
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Subtitle / Promo description</label>
                <input
                  type="text"
                  value={editingSlide.subtitle || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Promo Badge</label>
                  <input
                    type="text"
                    value={editingSlide.badge || 'PROMO'}
                    onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                    className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Button CTA text</label>
                  <input
                    type="text"
                    value={editingSlide.buttonText || 'SHOP NOW'}
                    onChange={(e) => setEditingSlide({ ...editingSlide, buttonText: e.target.value })}
                    className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Link URL Redirect Path</label>
                <input
                  type="text"
                  value={editingSlide.link || '/catalog'}
                  onChange={(e) => setEditingSlide({ ...editingSlide, link: e.target.value })}
                  required
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Slider sequence order</label>
                <input
                  type="number"
                  value={editingSlide.order || 1}
                  onChange={(e) => setEditingSlide({ ...editingSlide, order: Number(e.target.value) })}
                  required
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900"
                />
              </div>

              <ImageUpload
                label="Banner slider image"
                value={editingSlide.image || ''}
                onChange={(url) => setEditingSlide({ ...editingSlide, image: url })}
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSlideModalOpen(false)}
                  className="flex-1 bg-slate-200 text-slate-855 font-bold py-2.5 rounded-xl cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl cursor-pointer border-none shadow-md"
                >
                  Save Banner slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ORDER DETAILS (COMPREHENSIVE UPGRADE) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl lg:max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 my-auto">
            
            {/* STICKY TOP HEADER */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200">
                    <Hash className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedOrder.orderNumber}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.orderNumber);
                        showToast('Order Number copied to clipboard!');
                      }}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-none p-0 ml-0.5"
                      title="Copy Order Number"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </span>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedOrder.orderStatus === 'delivered' || selectedOrder.orderStatus === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedOrder.orderStatus === 'cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : selectedOrder.orderStatus === 'shipped'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedOrder.orderStatus.replace('_', ' ')}
                  </span>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedOrder.paymentVerificationStatus === 'verified'
                      ? 'bg-emerald-600 text-white'
                      : selectedOrder.paymentVerificationStatus === 'rejected'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    Payment: {(selectedOrder.paymentVerificationStatus || 'pending').toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()} at {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer bg-white"
                  title="Print Order Details"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer border-none"
                  title="Close modal"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE MODAL CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">

              {/* SECTION: ORDER STATUS & FULFILLMENT CONFIGURATION */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-black text-slate-800 uppercase tracking-wider text-[10px] block mb-1.5">
                    Order Fulfillment Status
                  </label>
                  <select
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 p-2.5 rounded-xl font-bold text-xs text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="custom_printing">Custom Printing</option>
                    <option value="processing">Processing</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="font-black text-slate-800 uppercase tracking-wider text-[10px] block mb-1.5">
                    Payment Gateway Status
                  </label>
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) => handleUpdateOrderPaymentStatus(selectedOrder, e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 p-2.5 rounded-xl font-bold text-xs text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              {/* SECTION: PAYMENT INFORMATION (PROMINENT & UNCOLLAPSED) */}
              <div className="border-2 border-emerald-300 p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50/70 via-slate-50/50 to-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-black text-xs uppercase text-slate-900 tracking-wider">
                      PAYMENT INFORMATION
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Verification:</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedOrder.paymentVerificationStatus === 'verified'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : selectedOrder.paymentVerificationStatus === 'rejected'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-amber-500 text-white shadow-xs'
                    }`}>
                      {selectedOrder.paymentVerificationStatus === 'verified'
                        ? 'VERIFIED'
                        : selectedOrder.paymentVerificationStatus === 'rejected'
                        ? 'REJECTED'
                        : 'PENDING'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                  {/* Payment Mobile Number */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Payment Mobile Number</span>
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-sm text-slate-900 font-black block select-all">
                        {selectedOrder.paymentMobileNumber || selectedOrder.paymentDetails?.senderNumber || selectedOrder.customerPhone || 'N/A'}
                      </strong>
                      {(selectedOrder.paymentMobileNumber || selectedOrder.paymentDetails?.senderNumber || selectedOrder.customerPhone) && (
                        <button
                          type="button"
                          onClick={() => {
                            const num = selectedOrder.paymentMobileNumber || selectedOrder.paymentDetails?.senderNumber || selectedOrder.customerPhone || '';
                            navigator.clipboard.writeText(num);
                            showToast('Payment mobile number copied!');
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer border-none"
                          title="Copy Mobile Number"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Transaction ID / TrxID */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Transaction ID / TrxID</span>
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-sm font-mono text-emerald-700 font-black tracking-wider block select-all truncate">
                        {selectedOrder.transactionId || selectedOrder.paymentDetails?.transactionId || 'N/A'}
                      </strong>
                      {(selectedOrder.transactionId || selectedOrder.paymentDetails?.transactionId) && (
                        <button
                          type="button"
                          onClick={() => {
                            const trx = selectedOrder.transactionId || selectedOrder.paymentDetails?.transactionId || '';
                            navigator.clipboard.writeText(trx);
                            showToast('Transaction ID copied to clipboard!');
                          }}
                          className="p-1 hover:bg-emerald-50 text-emerald-700 rounded-lg cursor-pointer border-none"
                          title="Copy Transaction ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Payment Method & Type */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Payment Method & Type</span>
                    <strong className="text-sm text-slate-900 font-black block uppercase">
                      {selectedOrder.paymentMethod} • {selectedOrder.advancePaymentPercentage === 100 || selectedOrder.payment?.type === '100_percent_advance' ? '100% Full' : '25% Advance'}
                    </strong>
                  </div>

                  {/* Total Order Amount */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Order Amount</span>
                    <strong className="text-sm text-slate-900 font-black block">
                      ৳{selectedOrder.totalAmount.toLocaleString()}
                    </strong>
                  </div>

                  {/* Amount Paid */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Advance Amount Paid</span>
                    <strong className="text-sm text-emerald-700 font-black block">
                      ৳{(selectedOrder.amountPaid ?? selectedOrder.payment?.advanceAmount ?? 0).toLocaleString()}
                    </strong>
                  </div>

                  {/* Remaining Amount */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Remaining Balance (Due on Delivery)</span>
                    <strong className="text-sm text-rose-600 font-black block">
                      ৳{(selectedOrder.remainingAmount ?? selectedOrder.payment?.remainingAmount ?? 0).toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-black text-slate-800 block">Payment Verification Controls</span>
                    <span className="text-[10px] text-slate-400 font-medium">Verify the payment after checking wallet statement or mark as rejected.</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdatePaymentVerificationStatus(selectedOrder, 'verified')}
                      className={`px-4 py-2 rounded-xl font-black text-xs cursor-pointer border-none flex items-center gap-1.5 transition-all shadow-xs ${
                        selectedOrder.paymentVerificationStatus === 'verified'
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>VERIFY PAYMENT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdatePaymentVerificationStatus(selectedOrder, 'rejected')}
                      className={`px-4 py-2 rounded-xl font-black text-xs cursor-pointer border-none flex items-center gap-1.5 transition-all shadow-xs ${
                        selectedOrder.paymentVerificationStatus === 'rejected'
                          ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>REJECT PAYMENT</span>
                    </button>

                    {selectedOrder.paymentVerificationStatus !== 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdatePaymentVerificationStatus(selectedOrder, 'pending')}
                        className="px-3 py-2 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer border-none transition-colors"
                      >
                        Reset to Pending
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION: CUSTOMER INFORMATION & DELIVERY INFORMATION (2-COLUMN GRID) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs">
                
                {/* CUSTOMER INFORMATION CARD */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="font-black text-xs uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-600" />
                      <span>Customer Profile Information</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {selectedOrder.userId ? 'Registered Customer' : 'Guest Checkout'}
                    </span>
                  </div>

                  <div className="space-y-2 text-slate-700">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-bold">Full Name:</span>
                      <strong className="text-slate-900 text-right">{selectedOrder.customerName}</strong>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-bold">Mobile Phone:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                        <a href={`tel:${selectedOrder.customerPhone}`} className="hover:underline text-slate-900">
                          {selectedOrder.customerPhone}
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedOrder.customerPhone);
                            showToast('Phone number copied!');
                          }}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent p-0"
                          title="Copy phone number"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-bold">Email Address:</span>
                      <span className="text-slate-800 text-right">
                        {selectedOrder.customerEmail || <span className="text-slate-400 italic">No email provided (Guest)</span>}
                      </span>
                    </div>

                    {/* Customer Notes / Order Notes */}
                    {(selectedOrder.customerNotes || selectedOrder.notes) && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-1">
                        <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                          <FileText className="w-3 h-3 text-amber-700" /> Customer / Order Notes:
                        </span>
                        <p className="text-xs text-amber-950 font-medium leading-relaxed italic">
                          "{selectedOrder.customerNotes || selectedOrder.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* DELIVERY & SHIPPING INFORMATION CARD */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="font-black text-xs uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-slate-600" />
                      <span>Delivery & Shipping Details</span>
                    </h4>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Charge: ৳{selectedOrder.shippingFee.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2 text-slate-700">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-bold">Delivery Zone:</span>
                      <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-extrabold text-[11px]">
                        {selectedOrder.deliveryLocation || (selectedOrder.shippingAddress.zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka')}
                      </strong>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-bold">Shipping Address:</span>
                      <span className="text-slate-900 font-medium text-right max-w-[220px] leading-relaxed">
                        {selectedOrder.shippingAddress.address}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-400 font-bold">Area / District / City:</span>
                      <span className="text-slate-800 font-medium text-right">
                        {[
                          selectedOrder.shippingAddress.area,
                          selectedOrder.shippingAddress.city,
                          selectedOrder.shippingAddress.district,
                          selectedOrder.shippingAddress.division
                        ].filter(Boolean).join(', ') || 'N/A'}
                      </span>
                    </div>

                    {selectedOrder.shippingAddress.postalCode && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-400 font-bold">Postal Code:</span>
                        <span className="text-slate-800 font-mono">{selectedOrder.shippingAddress.postalCode}</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                      <span className="text-slate-400 font-bold">Courier Tracking:</span>
                      <span className="font-mono text-slate-700 font-bold">
                        {selectedOrder.trackingNumber || 'Pending Courier Assignment'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION: ORDERED PRODUCTS & CUSTOMIZATIONS (DEDICATED CARDS PER ITEM) */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                    <Shirt className="w-4 h-4 text-emerald-600" />
                    <span>Ordered Products & Customizations ({selectedOrder.items.length} Item{selectedOrder.items.length > 1 ? 's' : ''})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Each item preserves its own size and customization</span>
                </div>

                <div className="space-y-4">
                  {selectedOrder.items.map((item, idx) => {
                    const isKids = item.isKidsSize || (item.size && ALL_KIDS_SIZES.includes(item.size));
                    const squadPrice = item.customization?.nameNumber?.enabled ? (item.customization.nameNumber.price || 0) : 0;
                    const badgesPrice = item.customization?.sleeveBadges?.enabled
                      ? (item.customization.sleeveBadges.totalPrice || 0)
                      : (item.customization?.patches?.enabled ? (item.customization.patches.totalPrice || 0) : 0);
                    const unitFinalPrice = item.finalItemPrice || item.price || 0;
                    const itemBasePrice = item.basePrice || item.priceBreakdown?.baseProductPrice || (unitFinalPrice - squadPrice - badgesPrice);
                    const itemLineTotal = item.lineTotal || (unitFinalPrice * item.quantity);

                    return (
                      <div key={idx} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
                        
                        {/* PRODUCT HEADER & BASE DETAILS */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {item.image || item.productImage ? (
                              <img
                                src={item.image || item.productImage}
                                alt={item.name || item.productName}
                                className="w-14 h-14 object-contain p-1.5 rounded-2xl bg-slate-50 border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                                <Shirt className="w-6 h-6 opacity-40" />
                              </div>
                            )}

                            <div className="min-w-0 space-y-1">
                              <h5 className="font-black text-sm text-slate-900 truncate">
                                {item.name || item.productName}
                              </h5>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {item.sku && (
                                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                    SKU: {item.sku}
                                  </span>
                                )}
                                <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                  Qty: {item.quantity}
                                </span>
                                <span className="text-slate-500 font-semibold text-[11px]">
                                  Base Price: ৳{itemBasePrice.toLocaleString()}
                                </span>
                                {item.salePrice && item.salePrice < (item.basePrice || item.price) && (
                                  <span className="text-red-650 font-black text-[10px]">
                                    (Sale: ৳{item.salePrice.toLocaleString()})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Line Total */}
                          <div className="text-right sm:self-center shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Line Total</span>
                            <strong className="text-base font-black text-slate-900 block">
                              ৳{itemLineTotal.toLocaleString()}
                            </strong>
                          </div>
                        </div>

                        {/* SIZE & COLOR SELECTION SECTION */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-slate-500 mr-1">Selected Size:</span>
                          {item.size ? (
                            isKids ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                <span>Kids Size: {item.size}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                                <span>Size: {item.size}</span>
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-slate-400 italic">No size specified</span>
                          )}

                          {item.color && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
                              Color: {item.color}
                            </span>
                          )}
                        </div>

                        {/* CUSTOM SQUAD NAME & NUMBER HEAT-PRESS BOX (ONLY IF SELECTED) */}
                        {item.customization?.nameNumber?.enabled && (item.customization.nameNumber.name || item.customization.nameNumber.number) && (
                          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Shirt className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Custom Squad Name & Number Heat-Press</span>
                              </span>
                              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                                +৳{item.customization.nameNumber.price.toLocaleString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                              <div className="bg-white p-2.5 rounded-xl border border-emerald-150">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Squad Name</span>
                                <strong className="text-sm font-black text-slate-900 tracking-wide block">
                                  {item.customization.nameNumber.name}
                                </strong>
                              </div>
                              <div className="bg-white p-2.5 rounded-xl border border-emerald-150">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Squad Number</span>
                                <strong className="text-sm font-black text-emerald-750 font-mono tracking-wider block">
                                  #{item.customization.nameNumber.number}
                                </strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SLEEVE BADGES / PATCHES BOX (ONLY IF SELECTED) */}
                        {item.customization?.sleeveBadges?.enabled && item.customization.sleeveBadges.selectedBadges && item.customization.sleeveBadges.selectedBadges.length > 0 && (
                          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                                <span>Selected Sleeve Badges ({item.customization.sleeveBadges.quantity}):</span>
                              </span>
                              <span className="text-xs font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                                +৳{item.customization.sleeveBadges.totalPrice.toLocaleString()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {item.customization.sleeveBadges.selectedBadges.map((badge: any, bIdx: number) => {
                                const bImg = badge.badgeImage || badge.image;
                                const bName = badge.badgeName || badge.name;
                                const bPrice = badge.badgePrice ?? badge.price;
                                return (
                                  <div key={bIdx} className="bg-white p-2.5 rounded-xl border border-blue-150 flex items-center justify-between gap-2 shadow-2xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-blue-200 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                                        {bImg ? (
                                          <img src={bImg} alt={bName} className="w-full h-full object-contain" />
                                        ) : (
                                          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                        )}
                                      </div>
                                      <span className="text-xs font-bold text-slate-800 truncate">{bName}</span>
                                    </div>
                                    {bPrice !== undefined && (
                                      <span className="text-xs font-black text-blue-700 shrink-0">+৳{bPrice}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* LEGACY SLEEVE PATCHES FALLBACK (IF APPLICABLE) */}
                        {!item.customization?.sleeveBadges?.enabled && item.customization?.patches?.enabled && (
                          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                            <span className="font-bold text-blue-900 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                              <span>Sleeve Patches: {item.customization.patches.quantity} Patch(es) (৳{item.customization.patches.pricePerPatch} each)</span>
                            </span>
                            <span className="font-black text-blue-800">+৳{item.customization.patches.totalPrice.toLocaleString()}</span>
                          </div>
                        )}

                        {/* ITEM PRICE CALCULATION BREAKDOWN */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1.5 text-[11px] font-medium text-slate-600">
                          <span className="font-black text-[10px] uppercase text-slate-500 tracking-wider block">
                            Item Price Calculation Breakdown
                          </span>
                          <div className="flex justify-between items-center text-slate-700">
                            <span>Base Product Price</span>
                            <span className="font-bold">৳{itemBasePrice.toLocaleString()}</span>
                          </div>
                          {squadPrice > 0 && (
                            <div className="flex justify-between items-center text-emerald-800">
                              <span>Custom Squad Name & Number Heat-Press</span>
                              <span className="font-bold">+৳{squadPrice.toLocaleString()}</span>
                            </div>
                          )}
                          {badgesPrice > 0 && (
                            <div className="flex justify-between items-center text-blue-800">
                              <span>Sleeve Badges / Patches</span>
                              <span className="font-bold">+৳{badgesPrice.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center border-t border-slate-200/80 pt-1 text-slate-900 font-extrabold text-xs">
                            <span>Final Item Unit Price × Quantity ({item.quantity})</span>
                            <span className="text-emerald-700 font-black">৳{itemLineTotal.toLocaleString()}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: FULL ORDER FINANCIAL BREAKDOWN */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h4 className="font-black text-xs uppercase text-slate-900 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Order Financial Summary Breakdown</span>
                </h4>

                <div className="space-y-2 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Products Subtotal</span>
                    <span className="font-bold text-slate-900">
                      ৳{(selectedOrder.itemsSubtotal || selectedOrder.subtotal).toLocaleString()}
                    </span>
                  </div>

                  {selectedOrder.customizationTotal !== undefined && selectedOrder.customizationTotal > 0 && (
                    <div className="flex justify-between items-center text-emerald-800">
                      <span>Total Customization Charges (Squad + Badges)</span>
                      <span className="font-bold">+৳{selectedOrder.customizationTotal.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Delivery Charge ({selectedOrder.deliveryLocation || (selectedOrder.shippingAddress.zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka')})</span>
                    <span className="font-bold text-slate-900">৳{selectedOrder.shippingFee.toLocaleString()}</span>
                  </div>

                  {selectedOrder.tax > 0 && (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Tax / VAT</span>
                      <span className="font-bold text-slate-900">৳{selectedOrder.tax.toLocaleString()}</span>
                    </div>
                  )}

                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between items-center text-rose-600">
                      <span>Voucher Discount {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                      <span className="font-bold">-৳{selectedOrder.discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center text-sm font-black text-slate-900">
                    <span>Grand Total Order Amount</span>
                    <span className="text-base text-slate-950 font-black">৳{selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 font-bold">
                    <span>Advance Amount Paid ({selectedOrder.advancePaymentPercentage === 100 ? '100% Full' : '25% Advance'})</span>
                    <span className="font-black text-sm">৳{(selectedOrder.amountPaid ?? selectedOrder.payment?.advanceAmount ?? 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-rose-700 bg-rose-50/70 p-2 rounded-xl border border-rose-100 font-bold">
                    <span>Remaining Balance Due on Delivery</span>
                    <span className="font-black text-sm">৳{(selectedOrder.remainingAmount ?? selectedOrder.payment?.remainingAmount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* SECTION: INTERNAL NOTES & TIMELINE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs">
                
                {/* STAFF INTERNAL NOTES */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
                  <label className="font-black text-slate-800 uppercase tracking-wider text-[10px] block">
                    Internal Staff Processing Notes
                  </label>
                  <textarea
                    id="internal-order-notes"
                    defaultValue={selectedOrder.notes || ''}
                    rows={3}
                    placeholder="Courier booking details, sizing confirmation notes, printing batch info..."
                    className="w-full border border-slate-200 focus:border-emerald-500 p-2.5 rounded-xl bg-slate-50 text-slate-900 text-xs font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const txtEl = document.getElementById('internal-order-notes') as HTMLTextAreaElement;
                      handleSaveOrderNotes(selectedOrder, txtEl?.value || '');
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl border-none cursor-pointer text-xs transition-colors shadow-xs"
                  >
                    Save Internal Notes
                  </button>
                </div>

                {/* TIMELINE AUDIT LOG */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
                  <span className="font-black text-slate-800 uppercase tracking-wider text-[10px] block">
                    Order Timeline & Audit History
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
                    {selectedOrder.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 font-mono">
                        <span className="font-black text-slate-900 uppercase">{item.status.replace('_', ' ')}</span>
                        <span className="text-slate-400">{new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* STICKY BOTTOM CLOSE BAR */}
            <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md px-5 sm:px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0 shadow-lg">
              <span className="text-xs text-slate-500 font-medium hidden sm:block">
                Order ID: <strong className="text-slate-800 font-mono">{selectedOrder.id}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors cursor-pointer border-none shadow-xs ml-auto"
              >
                Close Order Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SLEEVE BADGE OPTION ADD/EDIT */}
      {/* ========================================================================= */}
      {badgeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-extrabold text-sm uppercase tracking-wider">
                {isEditingBadge ? 'Edit Sleeve Badge' : 'Add New Sleeve Badge'}
              </h3>
              <button
                onClick={() => setBadgeModalOpen(false)}
                className="text-white hover:text-slate-300 bg-transparent border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (isEditingBadge && editingBadge.id) {
                  const success = await updateSleeveBadgeOption(editingBadge.id, {
                    name: editingBadge.name,
                    image: editingBadge.image || '',
                    price: editingBadge.price ?? 0,
                    isActive: editingBadge.isActive
                  });
                  if (success) {
                    setBadgeModalOpen(false);
                    await fetchAdminSleeveBadgeOptions();
                  }
                } else {
                  const success = await addSleeveBadgeOption({
                    name: editingBadge.name,
                    image: editingBadge.image || '',
                    price: editingBadge.price ?? 0,
                    isActive: editingBadge.isActive !== false
                  });
                  if (success) {
                    setBadgeModalOpen(false);
                    await fetchAdminSleeveBadgeOptions();
                  }
                }
              }}
              className="p-6 space-y-4 text-xs font-semibold"
            >
              <div>
                <label className="font-bold block mb-1">Badge Name</label>
                <input
                  type="text"
                  value={editingBadge.name || ''}
                  onChange={(e) => setEditingBadge({ ...editingBadge, name: e.target.value })}
                  required
                  placeholder="e.g. Champions League Badge"
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <ImageUpload
                  label="Badge Image"
                  value={editingBadge.image || ''}
                  onChange={(url) => setEditingBadge({ ...editingBadge, image: url })}
                />
                <p className="text-[10px] text-slate-400 font-normal mt-1">
                  Upload an official patch icon or logo (PNG/WebP recommended with transparent background).
                </p>
              </div>

              <div>
                <label className="font-bold block mb-1">Badge Additional Price (৳ BDT)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editingBadge.price ?? 100}
                  onChange={(e) => setEditingBadge({ ...editingBadge, price: Math.max(0, Number(e.target.value) || 0) })}
                  required
                  placeholder="e.g. 100"
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Status</label>
                <select
                  value={editingBadge.isActive ? 'active' : 'disabled'}
                  onChange={(e) => setEditingBadge({ ...editingBadge, isActive: e.target.value === 'active' })}
                  className="w-full border p-2.5 rounded-xl bg-white text-slate-800 cursor-pointer font-medium"
                >
                  <option value="active">Active (Available for product assignment)</option>
                  <option value="disabled">Disabled (Hidden from product assignment)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBadgeModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold p-3 rounded-xl transition-all cursor-pointer border-none text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl transition-all cursor-pointer border-none shadow-md text-xs"
                >
                  {isEditingBadge ? 'Save Changes' : 'Create Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOP CUSTOMER DETAILS */}
      {selectedTopCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
                  Top Customer Profile: {selectedTopCustomer.customerName}
                </h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Customer Since: {new Date(selectedTopCustomer.firstOrderDate).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedTopCustomer(null)}
                className="text-slate-400 hover:text-slate-900 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
              <div className="border border-slate-150 p-4 rounded-2xl bg-slate-50 space-y-2">
                <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Contact Details</span>
                <p><span className="text-slate-500 font-bold block">Mobile:</span> <span className="text-slate-955 font-extrabold">{selectedTopCustomer._id}</span></p>
                <p><span className="text-slate-500 font-bold block">Email:</span> <span className="text-slate-955 font-extrabold truncate block">{selectedTopCustomer.customerEmail || 'N/A'}</span></p>
              </div>

              <div className="border border-slate-150 p-4 rounded-2xl bg-slate-50 space-y-2">
                <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Purchase Stats</span>
                <p><span className="text-slate-500 font-bold block">Successful Orders:</span> <span className="text-slate-955 font-extrabold block text-sm">{selectedTopCustomer.totalOrders} Orders</span></p>
                <p><span className="text-slate-500 font-bold block">Total Spent:</span> <span className="text-emerald-700 font-black block text-sm">৳{selectedTopCustomer.totalPurchaseAmount.toLocaleString()}</span></p>
              </div>

              <div className="border border-slate-150 p-4 rounded-2xl bg-slate-50 space-y-2">
                <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Last Activity</span>
                <p><span className="text-slate-500 font-bold block">First Purchase:</span> <span className="text-slate-955 font-extrabold">{new Date(selectedTopCustomer.firstOrderDate).toLocaleDateString()}</span></p>
                <p><span className="text-slate-500 font-bold block">Last Purchase:</span> <span className="text-slate-955 font-extrabold">{new Date(selectedTopCustomer.lastOrderDate).toLocaleDateString()}</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-[10px] uppercase text-slate-900 tracking-wider">Purchase Order History</h4>
              <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] uppercase font-black text-slate-500 border-b border-slate-150">
                    <tr>
                      <th className="p-3">Order ID & Date</th>
                      <th className="p-3">Items Count</th>
                      <th className="p-3">Fulfillment Status</th>
                      <th className="p-3">Payment Status</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Delivery Location</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                    {selectedTopCustomer.orders.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <span className="font-extrabold text-slate-900 block">{ord.orderNumber}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3">{ord.items.length} Items</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            ord.orderStatus === 'delivered' || ord.orderStatus === 'completed'
                              ? 'bg-emerald-100 text-emerald-850'
                              : ord.orderStatus === 'cancelled'
                              ? 'bg-red-100 text-red-850'
                              : 'bg-amber-100 text-amber-850'
                          }`}>
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            ord.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-850'
                              : ord.paymentStatus === 'failed'
                              ? 'bg-red-100 text-red-850'
                              : 'bg-amber-100 text-amber-850'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 font-black text-slate-900">৳{ord.totalAmount.toLocaleString()}</td>
                        <td className="p-3 truncate max-w-[120px]" title={`${ord.shippingAddress.street || ''}, ${ord.shippingAddress.city || ''}`}>
                          {ord.shippingAddress.city || 'N/A'} ({ord.shippingAddress.state || 'N/A'})
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setSelectedTopCustomer(null);
                            }}
                            className="text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-emerald-100 border-none font-bold text-[9px]"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
