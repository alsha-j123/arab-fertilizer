# 🌿 Arab Fertilizer — Full-Stack E-Commerce Platform

A production-grade MERN stack agricultural e-commerce platform built for **Arab Fertilizers & Agro Chemicals**.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install

```bash
# Install all dependencies at once
npm run install:all
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your credentials
```

**Required `.env` values:**
```env
MONGODB_URI=mongodb://localhost:27017/arab-fertilizer
JWT_SECRET=your_super_secret_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_INTEGRITY_SALT=your_salt
```

### 3. Run Development Server

```bash
# Run both frontend and backend concurrently
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

---

## 📁 Project Structure

```
arab-fertilizer/
├── client/                    # React CRA Frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── assets/            # Logo & images
│       ├── components/
│       │   ├── Navbar.js          ✅ Sticky, responsive, with search
│       │   ├── Footer.js          ✅ Full footer with logo
│       │   ├── HeroCarousel.js    ✅ Auto-playing, 3 slides
│       │   ├── ProductCard.js     ✅ With wishlist, add-to-cart
│       │   ├── CartDrawer.js      ✅ Framer Motion slide-out
│       │   ├── AuthModal.js       ✅ 3D card flip, Google OAuth
│       │   └── AdminSidebar.js    ✅ Full admin navigation
│       ├── context/
│       │   ├── AuthContext.js     ✅ JWT + Google auth
│       │   ├── CartContext.js     ✅ localStorage persistence
│       │   └── WishlistContext.js ✅ localStorage persistence
│       ├── pages/
│       │   ├── Home.js            ✅ Full homepage sections
│       │   ├── Categories.js      ✅ All 5 category pages
│       │   ├── CategoryPage.js    ✅ Reusable with filter/sort
│       │   ├── ProductDetail.js   ✅ Gallery, tabs, reviews
│       │   ├── Cart.js            ✅ Full cart page
│       │   ├── Wishlist.js        ✅ Wishlist management
│       │   ├── Checkout.js        ✅ COD + JazzCash
│       │   ├── OrderSuccess.js    ✅ Animated confirmation
│       │   ├── SearchResults.js   ✅ Live filtering
│       │   ├── MyOrders.js        ✅ Order history
│       │   ├── AboutUs.js         ✅ Full about page
│       │   ├── ContactUs.js       ✅ Contact form
│       │   └── admin/
│       │       ├── AdminLayout.js     ✅ Protected layout
│       │       ├── Dashboard.js       ✅ KPIs + charts
│       │       ├── ProductManager.js  ✅ Full CRUD
│       │       └── AdminPages.js      ✅ Orders, Stock, Vendors, Ledger
│       ├── styles/
│       │   └── global.css         ✅ Complete design system
│       ├── data.js                ✅ 30 sample products (5 categories)
│       ├── App.js                 ✅ All routes configured
│       └── index.js
│
└── server/                    # Node.js / Express Backend
    ├── models/
    │   ├── Product.js         ✅
    │   ├── User.js            ✅ bcrypt password hashing
    │   ├── Order.js           ✅ Full order lifecycle
    │   ├── Vendor.js          ✅
    │   └── StockLedger.js     ✅
    ├── routes/
    │   ├── auth.js            ✅ Register, Login, Google OAuth, Me
    │   ├── products.js        ✅ Full CRUD + reviews + upload
    │   ├── orders.js          ✅ Place, track, admin manage
    │   ├── payment.js         ✅ JazzCash integration
    │   ├── vendor.js          ✅ Vendor CRUD
    │   └── admin.js           ✅ Dashboard, stock, ledger
    ├── middleware/
    │   ├── authMiddleware.js  ✅ JWT validation
    │   └── adminMiddleware.js ✅ Role check
    ├── utils/
    │   ├── jazzCashHelper.js  ✅ SHA-256 HMAC hash
    │   └── mailer.js          ✅ HTML email template
    ├── .env.example
    └── server.js              ✅
```

---

## 🔑 Features

### Customer
- 🛒 **Cart** — localStorage persistence, qty controls
- ❤️ **Wishlist** — save/remove products
- 🔍 **Search** — live filtering across all 30+ products
- 📦 **5 Categories** — Pesticides, Weedicides, Fungicides, PGR, Granules
- 🛍️ **Product Detail** — gallery, tabs, reviews, related products
- 💳 **Checkout** — JazzCash + Cash on Delivery
- 📧 **Email Confirmation** — HTML branded template
- 📱 **Responsive** — mobile-first CSS Grid + Flexbox

### Admin (`/admin/*` — JWT protected, admin role only)
- 📊 **Dashboard** — KPIs, revenue chart, recent orders
- 📦 **Product Manager** — full CRUD with image upload
- 🧾 **Order Manager** — inline status updates
- 🤝 **Vendor Module** — supplier management
- 📈 **Stock Inventory** — visual stock bars, low stock alerts
- 💰 **Ledger** — financial transactions, CSV export

### Authentication
- JWT stored in localStorage
- Google OAuth integration (configure Client ID in .env)
- Auto auth modal after 4 seconds for guests
- 3D card-flip login/register modal

---

## 💳 JazzCash Setup

1. Register at [JazzCash Merchant Portal](https://payments.jazzcash.com.pk)
2. Get your `MerchantID`, `Password`, and `IntegritySalt`
3. Add to `.env` file
4. Set sandbox to `true` for testing

---

## 📧 Email Setup (Gmail)

1. Enable 2FA on Gmail
2. Generate an App Password (Google Account → Security → App Passwords)
3. Use the app password in `EMAIL_PASS`

---

## 🌱 Seed Database (Optional)

To populate MongoDB with the 30 sample products from `data.js`:

```bash
# Run from server directory
node scripts/seed.js
```

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client && npm run build
# Deploy /build folder
```

### Backend (Railway/Heroku/VPS)
```bash
cd server
# Set environment variables in your hosting platform
npm start
```

---

## 🎨 Brand Colors

| Color | Hex | Usage |
|---|---|---|
| Primary Green | `#2D5A27` | Primary buttons, nav, headers |
| Primary Brown | `#5D4037` | Secondary elements, slide 2 |
| Accent Gold | `#C8A951` | Highlights, prices, CTA |
| Background | `#F5F5F5` | Page background |

---

## ✅ Zero-Error Checklist

- [x] No 404 routes — all nav links have page components
- [x] No white-square logo — transparent PNG used correctly
- [x] No "Demo User" — real displayName from Google/register
- [x] No breadcrumb on category pages
- [x] No blur on Kharif section
- [x] Carousel transition ≤ 600ms
- [x] Slide 2 has brown `#5D4037` background
- [x] COD option in checkout
- [x] Cart persists in localStorage
- [x] All 5 categories have Product Detail pages
- [x] Admin routes protected by JWT + role check
- [x] JazzCash SHA-256 HMAC computed correctly
- [x] Nodemailer fires on order placement

---

*Built with ❤️ for Pakistan's farming communities*
