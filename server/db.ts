import bcrypt from 'bcryptjs';
import {
  User,
  Product,
  Category,
  Brand,
  Order,
  Coupon,
  Review,
  HeroSlide,
  OfferBanner,
  SiteSettings,
  SystemNotification,
  InventoryLog,
  Address,
  SleeveBadgeOption
} from '../src/types';

export class DataStore {
  private static instance: DataStore;

  public users: User[] = [];
  public products: Product[] = [];
  public categories: Category[] = [];
  public brands: Brand[] = [];
  public orders: Order[] = [];
  public coupons: Coupon[] = [];
  public reviews: Review[] = [];
  public heroSlides: HeroSlide[] = [];
  public offerBanners: OfferBanner[] = [];
  public notifications: SystemNotification[] = [];
  public inventoryLogs: InventoryLog[] = [];
  public addresses: Address[] = [];
  public sleeveBadgeOptions: SleeveBadgeOption[] = [];
  public settings: SiteSettings = {
    siteName: 'Jersey Mention BD',
    tagLine: 'Premium Authentic Sports Jerseys & Apparel in Bangladesh',
    logo: '/images/logo.png',
    favicon: '/images/logo.png',
    contactEmail: 'admin@jerseymentionbd.com',
    contactPhone: '01640581442',
    whatsappNumber: '01640581442',
    address: 'Rampura, Dhaka',
    facebookUrl: 'https://facebook.com/jerseymentionbd',
    instagramUrl: 'https://instagram.com/jerseymentionbd',
    youtubeUrl: 'https://youtube.com/@jerseymentionbd',
    currencySymbol: '৳',
    taxRate: 5,
    insideDhakaShippingFee: 80,
    outsideDhakaShippingFee: 150,
    freeShippingThreshold: 3000,
    freeDeliveryEnabled: true,
    aboutUsText: 'Jersey Mention BD is Bangladesh\'s leading destination for premium player version jerseys, fan merchandise, retro classics, custom squad printing, and authentic athletic wear.',
    privacyPolicy: 'We respect customer data privacy and use secure HttpOnly cookies and encrypted tokens.',
    termsAndConditions: 'All orders subject to delivery confirmation. Custom printed jerseys non-refundable unless damaged.',
    refundPolicy: 'Easy 7-day return policy for standard merchandise. Video unboxing required.',
    shippingPolicy: 'Home delivery inside Dhaka within 24-48 hours. Express courier outside Dhaka within 2-4 days.',
    customNameNumberPrice: 250,
    patchPrice: 100,
    bkashPersonalNumber: '01571305964',
    nagadPersonalNumber: '01571305964',
    sizeRanges: JSON.stringify({
      S: { maxHeight: 165, maxWeight: 60, maxChest: 37 },
      M: { maxHeight: 173, maxWeight: 70, maxChest: 39 },
      L: { maxHeight: 180, maxWeight: 80, maxChest: 41 },
      XL: { maxHeight: 185, maxWeight: 90, maxChest: 43 },
      XXL: { maxHeight: 190, maxWeight: 100, maxChest: 45 },
      "3XL": { maxHeight: 210, maxWeight: 120, maxChest: 48 }
    })
  };

  private constructor() {
    this.seed();
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  public seed() {
    // Initial Admin Users
    this.users = [
      {
        id: 'usr-admin-1',
        name: 'Super Admin',
        email: 'admin@jerseymentionbd.com',
        role: 'super_admin',
        phone: process.env.INITIAL_ADMIN_PHONE || '01711000111',
        status: 'active',
        password: bcrypt.hashSync(process.env.INITIAL_ADMIN_PASSWORD || 'Admin@ChangeMe123!', 10),
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'usr-staff-1',
        name: 'Order Fulfillment Manager',
        email: 'staff@jerseymentionbd.com',
        role: 'staff',
        phone: process.env.INITIAL_STAFF_PHONE || '01711000222',
        status: 'active',
        password: bcrypt.hashSync(process.env.INITIAL_STAFF_PASSWORD || 'Staff@ChangeMe123!', 10),
        createdAt: '2026-01-05T00:00:00.000Z'
      }
    ];

    // Addresses
    this.addresses = [
      {
        id: 'addr-1',
        userId: 'usr-cust-1',
        name: 'Tanvir Ahmed',
        phone: '01812345678',
        division: 'Dhaka',
        district: 'Dhaka',
        address: 'House 12, Road 4, Sector 7, Uttara',
        area: 'Uttara',
        zipCode: '1230',
        isDefaultShipping: true,
        isDefaultBilling: true,
        label: 'Home'
      }
    ];

    // Categories
    const initialCategories: Category[] = [
      // Main Navbar Categories
      {
        id: 'cat-player-edition',
        name: 'Player Edition',
        slug: 'player-edition',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'main',
        navbarPosition: 1,
        featured: true,
        productCount: 0
      },
      {
        id: 'cat-retro-classic',
        name: 'Retro Classic',
        slug: 'retro-classic',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'main',
        navbarPosition: 2,
        featured: true,
        productCount: 0
      },
      {
        id: 'cat-fan-edition',
        name: 'Fan Edition',
        slug: 'fan-edition',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'main',
        navbarPosition: 3,
        featured: true,
        productCount: 0
      },
      {
        id: 'cat-wc-26',
        name: 'WC-26',
        slug: 'wc-26',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'main',
        navbarPosition: 4,
        featured: true,
        productCount: 0
      },
      {
        id: 'cat-kids-corner',
        name: 'Kids Corner',
        slug: 'kids-corner',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'main',
        navbarPosition: 5,
        featured: true,
        productCount: 0
      },
      {
        id: 'cat-pre-order',
        name: 'Pre-Order',
        slug: 'pre-order',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'main',
        navbarPosition: 6,
        featured: true,
        productCount: 0
      },
      {
        id: 'cat-cap',
        name: 'Cap',
        slug: 'cap',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'main',
        navbarPosition: 7,
        featured: true,
        productCount: 0
      },

      // Clubs & National Teams Parent Categories (Level 1, but hidden from horizontal navbar)
      {
        id: 'cat-clubs',
        name: 'Clubs',
        slug: 'clubs',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'hidden',
        navbarPosition: 13,
        featured: false,
        productCount: 0
      },
      {
        id: 'cat-national-teams',
        name: 'National Teams',
        slug: 'national-teams',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'hidden',
        navbarPosition: 14,
        featured: false,
        productCount: 0
      },

      // More Dropdown Categories
      {
        id: 'cat-football',
        name: 'Football',
        slug: 'football',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'more',
        navbarPosition: 7,
        featured: true,
        productCount: 0
      },
      {
        id: 'cat-tank-tops',
        name: 'Tank Tops',
        slug: 'tank-tops',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'more',
        navbarPosition: 8,
        featured: true,
        productCount: 0
      },
      {
        id: 'cat-polo',
        name: 'Polo',
        slug: 'polo',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'more',
        navbarPosition: 9,
        featured: true,
        productCount: 0
      },
      {
        id: 'cat-t-shirts',
        name: 'T-Shirts',
        slug: 't-shirts',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'more',
        navbarPosition: 10,
        featured: true,
        productCount: 0
      },
      {
        id: 'cat-trousers',
        name: 'Trousers',
        slug: 'trousers',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
        isActive: true,
        navbarLocation: 'more',
        navbarPosition: 11,
        featured: true,
        productCount: 0
      }
    ];

    const clubsData = [
      { name: 'Real Madrid', slug: 'real-madrid' },
      { name: 'FC Barcelona', slug: 'barcelona' },
      { name: 'Manchester United', slug: 'manchester-united' },
      { name: 'Liverpool', slug: 'liverpool' },
      { name: 'Arsenal', slug: 'arsenal' },
      { name: 'Chelsea', slug: 'chelsea' },
      { name: 'Paris Saint-Germain', slug: 'psg' },
      { name: 'Bayern Munich', slug: 'bayern-munich' },
      { name: 'Inter Miami', slug: 'inter-miami' },
      { name: 'Juventus', slug: 'juventus' }
    ];

    const nationalTeamsData = [
      { name: 'Brazil', slug: 'brazil' },
      { name: 'Argentina', slug: 'argentina' },
      { name: 'France', slug: 'france' },
      { name: 'Germany', slug: 'germany' },
      { name: 'Spain', slug: 'spain' },
      { name: 'Portugal', slug: 'portugal' },
      { name: 'England', slug: 'england' },
      { name: 'Bangladesh', slug: 'bangladesh' }
    ];

    // Helper to add a team and its default subcategories
    const addTeamWithSubcategories = (team: { name: string; slug: string }, parentId: string, parentName: string, index: number) => {
      const teamId = `${parentId === 'cat-clubs' ? 'club' : 'nat'}-${team.slug}`;
      
      // 1. Add Team Category
      initialCategories.push({
        id: teamId,
        name: team.name,
        slug: team.slug,
        parentId,
        parentName,
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80',
        isActive: true,
        navbarLocation: 'hidden',
        navbarPosition: index,
        featured: true,
        productCount: 0
      });

      // 2. Add Default Subcategories
      const defaultSubcategories = ['Player Edition', 'Retro Classic', 'Fan Edition'];
      defaultSubcategories.forEach((sub, subIdx) => {
        initialCategories.push({
          id: `subcat-${team.slug}-${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: sub,
          slug: `${team.slug}-${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          parentId: teamId,
          parentName: team.name,
          image: '',
          isActive: true,
          displayOrder: subIdx + 1,
          productCount: 0
        });
      });
    };

    clubsData.forEach((club, index) => {
      addTeamWithSubcategories(club, 'cat-clubs', 'Clubs', 15 + index);
    });

    nationalTeamsData.forEach((nat, index) => {
      addTeamWithSubcategories(nat, 'cat-national-teams', 'National Teams', 100 + index);
    });

    this.categories = initialCategories;

    // Brands
    this.brands = [
      {
        id: 'brd-1',
        name: 'Jersey Mention Signature',
        slug: 'jersey-mention-signature',
        logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80',
        description: 'In-house high-grade moisture-wicking jersey manufacturing.',
        isActive: true
      },
      {
        id: 'brd-2',
        name: 'Nike Performance',
        slug: 'nike-performance',
        logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80',
        description: 'Official kit supplier for top European football giants.',
        isActive: true
      },
      {
        id: 'brd-3',
        name: 'Adidas Authentic',
        slug: 'adidas-authentic',
        logo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=150&q=80',
        description: 'World leading sports kit innovator.',
        isActive: true
      },
      {
        id: 'brd-4',
        name: 'Puma Football',
        slug: 'puma-football',
        logo: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=150&q=80',
        description: 'Ultraweave lightweight match gear.',
        isActive: true
      }
    ];

    this.products = [
      {
        id: 'prod-1',
        name: 'Bangladesh National Football Team Official Home Jersey 2026',
        slug: 'bangladesh-national-football-team-official-home-jersey-2026',
        sku: 'BD-NT-2026-HM',
        barcode: '8801234567890',
        price: 1490,
        salePrice: 1290,
        discountPercent: 13,
        description: 'Official Player Edition Home Match jersey with moisture-wicking technology.',
        shortDescription: 'Official Player Edition Home Match jersey with moisture-wicking technology.',
        specifications: [{ key: 'Fabric', value: '100% Recycled Polyester' }, { key: 'Fit', value: 'Athletic/Slim Fit' }],
        images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80'],
        categoryId: 'nat-bangladesh',
        categoryName: 'Bangladesh',
        subcategoryId: 'subcat-bangladesh-player-edition',
        subcategoryName: 'Player Edition',
        brandId: 'brd-1',
        brandName: 'Jersey Mention Signature',
        stock: 50,
        lowStockAlert: 5,
        isOutOfStock: false,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'Emerald Green', hex: '#006a4e' }],
        tags: ['bangladesh', 'national', 'home', '2026'],
        featured: true,
        isBestSeller: true,
        isTrending: true,
        isNewArrival: true,
        isFlashSale: true,
        allowCustomPrint: true,
        showCustomNameNumber: true,
        showSleevePatches: true,
        returnPolicy: 'Easy 7-day returns',
        warranty: 'No warranty',
        status: 'active',
        rating: 5,
        reviewCount: 1,
        homepageSections: ['limited_time_deals', 'trending_sports_match_gear'],
        sleeveBadges: ['badge-none', 'badge-ucl', 'badge-laliga', 'badge-epl', 'badge-cwc', 'badge-custom'],
        createdAt: '2026-02-01T00:00:00.000Z'
      },
      {
        id: 'prod-2',
        name: 'Real Madrid Player Fit Home Jersey 2025/26',
        slug: 'real-madrid-player-fit-home-jersey-2025-26',
        sku: 'RM-HM-2025-PF',
        barcode: '8801234567891',
        price: 1890,
        salePrice: 1590,
        discountPercent: 15,
        description: 'Premium player version Real Madrid home kit.',
        shortDescription: 'Premium player version Real Madrid home kit.',
        specifications: [{ key: 'Fabric', value: '100% Recycled Polyester' }, { key: 'Fit', value: 'Slim Fit' }],
        images: ['https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80'],
        categoryId: 'club-real-madrid',
        categoryName: 'Real Madrid',
        subcategoryId: 'subcat-real-madrid-player-edition',
        subcategoryName: 'Player Edition',
        brandId: 'brd-3',
        brandName: 'Adidas Authentic',
        stock: 35,
        lowStockAlert: 5,
        isOutOfStock: false,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: [{ name: 'White', hex: '#ffffff' }],
        tags: ['real madrid', 'club', 'home', '2025', '2026'],
        featured: true,
        isBestSeller: true,
        isTrending: true,
        isNewArrival: true,
        isFlashSale: true,
        allowCustomPrint: true,
        showCustomNameNumber: true,
        showSleevePatches: true,
        returnPolicy: 'Easy 7-day returns',
        warranty: 'No warranty',
        status: 'active',
        rating: 5,
        reviewCount: 1,
        homepageSections: ['limited_time_deals', 'trending_sports_match_gear'],
        sleeveBadges: ['badge-none', 'badge-ucl', 'badge-laliga', 'badge-epl', 'badge-cwc', 'badge-custom'],
        createdAt: '2026-02-01T00:00:00.000Z'
      }
    ];

    // Hero Slides
    this.heroSlides = [
      {
        id: 'slide-1',
        title: 'BANGLADESH NATIONAL TEAM 2026',
        subtitle: 'Official Player Version Match Kit with AeroReady Ventilation & Custom Name Printing',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80',
        badge: 'NEW ARRIVAL 2026',
        link: '/catalog?category=national-teams',
        buttonText: 'SHOP NATIONAL GEAR',
        order: 1,
        isActive: true
      },
      {
        id: 'slide-2',
        title: 'EUROPEAN CLUB EDITION 2025/26',
        subtitle: 'Real Madrid, Barcelona, Man City, Arsenal & Inter Miami Authentic Kits',
        image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1600&q=80',
        badge: 'FLASHSALE 20% OFF',
        link: '/catalog?category=club-football',
        buttonText: 'EXPLORE CLUB KITS',
        order: 2,
        isActive: true
      },
      {
        id: 'slide-3',
        title: 'CUSTOM SQUAD PRINTING',
        subtitle: 'Personalize Your Jersey with Official Fonts, Squad Numbers & Sleeve Badges',
        image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1600&q=80',
        badge: 'EXPRESS PRINTING BD',
        link: '/catalog?category=custom-printed',
        buttonText: 'CUSTOMIZE NOW',
        order: 3,
        isActive: true
      }
    ];

    // Offer Banners
    this.offerBanners = [
      {
        id: 'ban-1',
        title: 'Cricket Tigers Fan Zone',
        subtitle: 'Get 15% off official BPL & BD Cricket Supporter Shirts',
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
        link: '/catalog?category=cricket-fan-wear',
        section: 'home_top',
        isActive: true
      },
      {
        id: 'ban-2',
        title: '1990s Vintage Retro Classics',
        subtitle: 'Authentic retro collar jerseys for true football purists',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        link: '/catalog?category=retro-classics',
        section: 'home_top',
        isActive: true
      }
    ];

    // Coupons
    this.coupons = [
      {
        id: 'coup-1',
        code: 'JERSEYBD100',
        discountType: 'fixed',
        discountValue: 100,
        minPurchase: 1000,
        expireDate: '2026-12-31',
        usageLimit: 500,
        usedCount: 42,
        isActive: true
      },
      {
        id: 'coup-2',
        code: 'EID2026',
        discountType: 'percentage',
        discountValue: 15,
        minPurchase: 2000,
        maxDiscount: 500,
        expireDate: '2026-06-30',
        usageLimit: 1000,
        usedCount: 189,
        isActive: true
      }
    ];

    // Reviews
    this.reviews = [
      {
        id: 'rev-1',
        productId: 'prod-1',
        userId: 'usr-cust-1',
        userName: 'Tanvir Ahmed',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        rating: 5,
        comment: 'Extremely impressed with the Player Version BD Jersey quality! The silicone crest is top notch and the custom print "TANVIR #10" looks 100% official.',
        images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80'],
        isApproved: true,
        likesCount: 14,
        reported: false,
        createdAt: '2026-02-03T14:30:00.000Z'
      },
      {
        id: 'rev-2',
        productId: 'prod-2',
        userId: 'usr-cust-2',
        userName: 'Rafiqul Islam',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
        rating: 5,
        comment: 'Fast delivery inside Dhaka within 24 hours. The Real Madrid player fit is snug so order one size up if you prefer loose style.',
        images: [],
        isApproved: true,
        likesCount: 8,
        reported: false,
        createdAt: '2026-02-04T09:15:00.000Z'
      }
    ];

    // Orders
    this.orders = [
      {
        id: 'ord-1001',
        orderNumber: 'JMB-2026-1001',
        userId: 'usr-cust-1',
        customerName: 'Tanvir Ahmed',
        customerEmail: 'customer@jerseymention.bd',
        customerPhone: '01812345678',
        shippingAddress: {
          id: 'addr-1',
          name: 'Tanvir Ahmed',
          phone: '01812345678',
          division: 'Dhaka',
          district: 'Dhaka',
          address: 'House 12, Road 4, Sector 7, Uttara',
          area: 'Uttara',
          zipCode: '1230'
        },
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            name: 'Bangladesh National Football Team Official Home Jersey 2026',
            price: 1490,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
            size: 'L',
            color: 'Emerald Green',
            customPrint: {
              playerName: 'TANVIR',
              playerNumber: '10'
            }
          }
        ],
        subtotal: 1490,
        tax: 74,
        shippingFee: 80,
        discount: 100,
        couponCode: 'JERSEYBD100',
        grandTotal: 1544,
        totalAmount: 1544,
        paymentMethod: 'bkash',
        paymentStatus: 'paid',
        paymentDetails: {
          transactionId: 'TRX9A8B7C6D',
          senderNumber: '01812345678',
          paidAt: '2026-02-03T11:00:00.000Z'
        },
        orderStatus: 'delivered',
        notes: 'Please call before delivery.',
        trackingNumber: 'STEADFAST-998123',
        timeline: [
          { status: 'pending', title: 'Order Placed', description: 'Order submitted via bKash payment', timestamp: '2026-02-03T11:00:00.000Z' },
          { status: 'confirmed', title: 'Payment Confirmed', description: 'bKash transaction TRX9A8B7C6D verified', timestamp: '2026-02-03T11:05:00.000Z' },
          { status: 'processing', title: 'Custom Printing', description: 'Name TANVIR #10 heat pressed', timestamp: '2026-02-03T14:00:00.000Z' },
          { status: 'shipped', title: 'Handed to Courier', description: 'Handed to Steadfast Express (Consignment STEADFAST-998123)', timestamp: '2026-02-04T09:00:00.000Z' },
          { status: 'delivered', title: 'Delivered', description: 'Package signed and delivered to Uttara customer', timestamp: '2026-02-04T16:30:00.000Z' }
        ],
        createdAt: '2026-02-03T11:00:00.000Z'
      }
    ];

    // Inventory Logs
    this.inventoryLogs = [
      {
        id: 'inv-1',
        productId: 'prod-1',
        productName: 'Bangladesh National Football Team Official Home Jersey 2026',
        sku: 'BD-NT-2026-HM',
        type: 'in',
        quantity: 50,
        previousStock: 0,
        newStock: 50,
        notes: 'Initial production shipment from manufacturing factory',
        createdByName: 'Super Admin',
        createdAt: '2026-02-01T09:00:00.000Z'
      }
    ];

    // Notifications
    this.notifications = [
      {
        id: 'notif-1',
        userId: 'usr-admin-1',
        title: 'New Order Received',
        message: 'Order #JMB-2026-1001 placed by Tanvir Ahmed (৳1,544 via bKash)',
        type: 'order',
        read: false,
        createdAt: '2026-02-03T11:00:00.000Z'
      }
    ];

    // Default Sleeve Badge Options
    this.sleeveBadgeOptions = [
      { id: 'badge-ucl', name: 'Champions League Badge', image: '', price: 100, isActive: true, createdAt: new Date().toISOString() },
      { id: 'badge-laliga', name: 'La Liga Patch', image: '', price: 100, isActive: true, createdAt: new Date().toISOString() },
      { id: 'badge-epl', name: 'Premier League Badge', image: '', price: 100, isActive: true, createdAt: new Date().toISOString() },
      { id: 'badge-cwc', name: 'FIFA Club World Cup Badge', image: '', price: 100, isActive: true, createdAt: new Date().toISOString() },
      { id: 'badge-custom', name: 'Custom Badge', image: '', price: 100, isActive: true, createdAt: new Date().toISOString() }
    ];
  }
}

export const db = DataStore.getInstance();
