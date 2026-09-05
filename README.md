<div align="center">

# ⚽ Jersey Mention BD - Enterprise E-Commerce Platform

<p align="center">
  <strong>The Premier Football & Sports Apparel Destination in Bangladesh</strong>
</p>

[![Live Site](https://img.shields.io/badge/Live_Store-jerseymentionbd.com-00C853?style=for-the-badge&logo=googlechrome&logoColor=white)](https://jerseymentionbd.com/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js_Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI_Assistant-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

<br />

🚀 **Live Production Store:** **[https://jerseymentionbd.com/](https://jerseymentionbd.com/)**

</div>

---

## 📌 About The Project

**Jersey Mention BD** is a high-performance, full-stack e-commerce web platform engineered specifically for sports merchandise, club jerseys, national team kits, and athletic apparel. Designed with conversion optimization, blazing fast load times, and localization for Bangladeshi shoppers, the platform seamlessly integrates national MFS payment channels (bKash, Nagad, Rocket), international card gateways (SSLCommerz, Stripe), and Cash on Delivery (COD).

Built on **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Express.js**, it incorporates an intelligent Gemini-powered shopping concierge, dynamic jersey name & number customization, an editable size chart system, and an enterprise administration panel.

---

## ✨ Key Features

### 🛍️ Customer Experience
- **🌐 Live Storefront**: Responsive, mobile-first design with smooth Framer Motion micro-animations.
- **⚡ Advanced Catalog & Filtering**: Instant faceted search, filtering by Club, National Team, Edition (Player vs Fan), Size (Adult & Kids), Price, and Stock availability.
- **👕 Custom Jersey Name & Number Printing**: Real-time jersey customization with name and squad number printing and dynamic price adjustments.
- **📏 Dynamic & Editable Size Chart**:
  - Interactive Size Chart modal and embedded tables on Product Details and Quick-View popup.
  - Per-size length & chest measurements with highlighted active selection.
  - Full support for both Adult (S, M, L, XL, XXL) and Kids (3Y–14Y) size selection.
- **🤖 Gemini AI Shopping Concierge**: Integrated server-side Google Gemini 2.5 Flash assistant providing personalized kit recommendations, sizing advice, and gift ideas.
- **💳 Multi-Gateway Checkout**:
  - **MFS Payments**: bKash, Nagad, Rocket (Automated & Manual Transaction Verification).
  - **Cards & Digital**: SSLCommerz and Stripe.
  - **Cash on Delivery (COD)** with automatic location-based delivery fee calculations (Inside Dhaka vs. Outside Dhaka) and free delivery thresholds.
- **📦 Real-Time Order Tracking & Digital Invoices**:
  - Live order timeline tracking by Order ID / Tracking Number.
  - One-click downloadable and printable invoice view.
- **❤️ Cart & Wishlist**: Persistent guest cart and wishlist seamlessly synchronized upon user login.
- **📱 WhatsApp Quick Support**: Configurable floating WhatsApp button with pre-filled product inquiries.

---

### 🛡️ Admin Dashboard & Operations
- **📊 Business Analytics**: Real-time sales metrics, revenue analytics, top-selling clubs/categories, customer growth, and conversion rates.
- **📦 Product & Inventory Management**:
  - Full CRUD operations with rich HTML WYSIWYG description editor.
  - Multi-image gallery upload with automatic WebP compression.
  - SKU & Barcode generation, low-stock threshold triggers, and stock movement logs.
  - **Size Chart Manager**: Product-specific chest and length measurement editor with decimal support.
- **🏷️ Category, Brand & Club Hierarchy**: Manage leagues, international teams, clubs, banners, and SEO metadata.
- **🚚 Fulfillment & Order Pipeline**:
  - Order status workflows: `Pending` ➔ `Confirmed` ➔ `Processing` ➔ `Packed` ➔ `Shipped` ➔ `Delivered` ➔ `Cancelled` / `Returned`.
  - PDF shipping label and invoice generation.
- **🎟️ Promotional Coupons**: Percentage and fixed-discount vouchers with expiration dates, minimum spend limits, and usage limits.
- **🎨 CMS & Store Customization**:
  - Hero slider banner management.
  - Announcement bar text & link editor.
  - Customer review moderation & testimonials.
  - Store settings (Delivery charges, free shipping threshold, MFS numbers, WhatsApp number).
- **💾 Dual-Engine Database**: Primary MongoDB Atlas with automatic fallback to high-reliability embedded JSON storage for zero-downtime reliability.
- **🔒 Enterprise Security**:
  - JWT Authentication (Access + Refresh tokens with HTTP-only cookies).
  - Role-Based Access Control (Admin / Staff / Customer).
  - Security headers (CSP, HSTS, X-Frame-Options, CORS sanitization).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/), [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), [Motion (Framer Motion)](https://motion.dev/), [Lucide Icons](https://lucide.dev/) |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [esbuild](https://esbuild.github.io/) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/) via [Mongoose 9](https://mongoosejs.com/) + Dual-Engine Fallback Driver |
| **AI Integration** | [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) (Gemini 2.5 Flash) |
| **Authentication** | JSON Web Tokens (JWT), [bcryptjs](https://www.npmjs.com/package/bcryptjs), HTTP-Only Cookies |
| **Production Server** | Phusion Passenger / cPanel ES Module Bridge (`app.js`), Docker |

---

## 🚀 Quick Start & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/sunnyonweb/jersey-mention-bd-eccomerce.git
cd jersey-mention-bd-eccomerce
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
# Server
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/jersey_mention_bd?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Payment Gateways (Optional)
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
STRIPE_SECRET_KEY=
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
```

### 4. Start Development Server
```bash
npm run dev
```
Open your browser and visit: `http://localhost:3000`

---

## 📦 Production Build & Deployment

### Build the Application
```bash
# Type check the codebase
npm run lint

# Compile React frontend (Vite) and bundle backend (esbuild)
npm run build
```
This generates the optimized production distribution files inside the `dist_prod/` directory:
- `dist_prod/index.html` and minified JS/CSS chunks.
- `dist_prod/server.cjs` (single self-contained Node.js server bundle).

### Run in Production Locally
```bash
npm run start
```

### cPanel / Shared Hosting (Phusion Passenger)
The project includes an optimized entry point `app.js` designed for cPanel Node.js Application Manager:
1. Generate the deployment zip archive:
   ```bash
   python scratch/zip.py
   ```
2. Upload `dist_prod.zip` to your cPanel application root and extract.
3. Ensure `.env` is configured in the application root.
4. Restart the application via cPanel **"Setup Node.js App"**.

### Docker Deployment
```bash
docker-compose up --build -d
```

---

## 📁 Project Architecture

```plaintext
jersey-mention-bd/
├── .github/workflows/        # CI/CD pipelines
├── app.js                    # cPanel Phusion Passenger entry point
├── docker-compose.yml        # Multi-container Docker deployment
├── Dockerfile                # Production container specification
├── package.json              # Project dependencies and scripts
├── public/                   # Static assets, favicon, default uploads
├── scratch/                  # Maintenance, DB migration & test utilities
├── server/                   # Backend Express application
│   ├── db.ts                 # Dual-engine persistent storage driver
│   ├── email.ts              # Order confirmation & transactional emailer
│   ├── middleware.ts         # JWT authentication, error handling, rate limits
│   ├── mongodb.ts            # Mongoose schemas & MongoDB Atlas models
│   ├── polyfill.ts           # Global environment polyfills
│   └── routes.ts             # REST API endpoints (Products, Orders, Auth, etc.)
├── server.ts                 # Express server & Vite middleware bootstrap
├── src/                      # Frontend React 19 Application
│   ├── components/           # Component library
│   │   ├── admin/            # Admin dashboard, Rich Text Editor, Size Chart
│   │   ├── catalog/          # Products, filters, quick view, categories
│   │   ├── checkout/         # Checkout view & gateway integrations
│   │   ├── clubs/            # Club & league navigation
│   │   ├── common/           # SizeChart, modals, notification badges
│   │   ├── home/             # Hero banner, AI concierge modal, testimonials
│   │   ├── layout/           # Navbar, CartDrawer, TopBar, Footer, SEO
│   │   ├── orders/           # Real-time order tracking & invoices
│   │   ├── product/          # Product details page with customizer
│   │   └── profile/          # User authentication & account management
│   ├── store/                # Zustand global state (Cart, Auth, Settings)
│   ├── types.ts              # Core TypeScript interface declarations
│   ├── utils/                # Product helpers, sanitization, WhatsApp links
│   └── main.tsx              # React client bootstrap
└── tsconfig.json             # TypeScript compiler configuration
```

---

## 🌐 Live Deployment
Visit the live store at: **[https://jerseymentionbd.com/](https://jerseymentionbd.com/)**

---

## 👤 Author & Maintainer

**Sunny Talukder**
- GitHub: [@sunnyonweb](https://github.com/sunnyonweb)
- Email: [sunnytalukder222@gmail.com](mailto:sunnytalukder222@gmail.com)
- Project Repository: [jersey-mention-bd-eccomerce](https://github.com/sunnyonweb/jersey-mention-bd-eccomerce)

---

## 📄 License
This project is proprietary software created for **Jersey Mention BD**. All rights reserved.
