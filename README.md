# 🌿 Fertilizer Management System
**Mini Project — Annasaheb Dange College of Engineering & Technology, Ashta**
Department of Artificial Intelligence and Data Science

**Team:** Reshma Navnath Gavali · Megha Satish Kamble · Niharika Mahadev Patil  
**Guide:** Prof. Akshay Mane | **Sponsor:** Shriram Krushi Kendra, Solapur

---

## 🏗️ Tech Stack (MERN)
| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Recharts, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Dev Tools | VS Code, Postman, Git, Nodemon |

---

## 📁 Project Structure
```
fertilizer-management/
├── backend/
│   ├── models/
│   │   ├── User.js          ← Auth model
│   │   ├── Product.js       ← Product with virtual flags
│   │   ├── Customer.js      ← Borrower with reliability score
│   │   └── Invoice.js       ← Billing with auto invoice numbers
│   ├── routes/
│   │   ├── auth.js          ← Login / Register
│   │   ├── products.js      ← Product CRUD + alerts
│   │   ├── inventory.js     ← Restock + inventory stats
│   │   ├── billing.js       ← Invoice creation + payments
│   │   ├── credit.js        ← Customer management
│   │   └── dashboard.js     ← Analytics & charts
│   ├── middleware/auth.js   ← JWT middleware
│   ├── server.js            ← Express app entry
│   ├── seed.js              ← Sample data seeder
│   └── .env                 ← Environment config
│
└── frontend/
    └── src/
        ├── context/AuthContext.js  ← Global auth state
        ├── utils/api.js            ← Axios with auth
        ├── pages/
        │   ├── Login.js           ← Login page
        │   ├── Dashboard.js       ← Charts + overview
        │   ├── Products.js        ← Product CRUD
        │   ├── Inventory.js       ← Alerts & stock
        │   ├── Billing.js         ← Invoice management
        │   └── Credit.js          ← Borrower tracking
        ├── components/
        │   └── Layout.js          ← Sidebar + topbar
        ├── App.js                 ← Routes
        └── index.css              ← Global styles
```

---

## 🚀 Setup & Run

### Prerequisites
- **Node.js** v18+ (https://nodejs.org)
- **MongoDB** v6+ running locally (https://www.mongodb.com/try/download/community)
- **Git** (https://git-scm.com)

### Step 1 — Start MongoDB
```bash
# Windows (run as Administrator)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod --dbpath /data/db
```

### Step 2 — Backend Setup
```bash
cd fertilizer-management/backend
npm install
npm run seed        # Load sample data (8 products, 3 customers)
npm run dev         # Start backend on http://localhost:5000
```

### Step 3 — Frontend Setup (new terminal)
```bash
cd fertilizer-management/frontend
npm install
npm start           # Start frontend on http://localhost:3000
```

### Step 4 — Login
Open `http://localhost:3000` and login with:
- **Email:** `admin@shriramkrushi.com`
- **Password:** `admin123`

---

## ✅ Features Implemented

### 1. Product Management
- Add, edit, deactivate products
- Track brand, category, unit, purchase price, selling price
- Supplier information
- Profit margin calculation (live preview)
- Quick restock from product table

### 2. Inventory & Alerts
- **Low Stock Alert** — quantity ≤ minimumStock threshold
- **Near Expiry Alert** — expiry date within 30 days
- **Expired Products** — expiry date has passed
- **Dead Stock Detection** — no sales for 90+ days
- Total stock value vs selling value analytics

### 3. Billing System
- Supports **Cash**, **Credit**, and **Partial** payment modes
- Auto-generated invoice numbers (`INV-2026-00001`)
- Auto stock deduction on billing
- Discount and tax support
- Printable invoice with shop header
- Record payments for pending invoices

### 4. Credit & Borrower Management
- Customer registry with credit limits
- Outstanding balance tracking
- **Reliability Score** formula: `(On-Time Payments / Total Payments) × 100`
- Full payment history timeline
- Top defaulters dashboard
- Invoice history per customer

### 5. Dashboard Analytics
- Today, monthly, and yearly sales
- Profit tracking
- 6-month bar chart (Sales + Profit)
- Inventory alert summary panel
- Recent invoices
- Top selling products

---

## 🔑 Core Algorithms (as per Synopsis)

```javascript
// Dead Stock Detection
if (daysSinceLastSale > 90) → Mark as Dead Stock

// Expiry Alert  
if ((expiryDate - today) <= 30 days) → Generate Alert

// Borrower Reliability Score
Score = (On-Time Payments / Total Payments) × 100
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/products` | List products |
| POST | `/api/products` | Add product |
| PUT | `/api/products/:id` | Update product |
| GET | `/api/products/alerts/summary` | Alert counts |
| POST | `/api/inventory/restock` | Add stock |
| GET | `/api/inventory/stats` | Stock statistics |
| GET | `/api/billing` | List invoices |
| POST | `/api/billing` | Create invoice |
| PUT | `/api/billing/:id/payment` | Record payment |
| GET | `/api/credit/customers` | List customers |
| POST | `/api/credit/customers` | Add customer |
| GET | `/api/credit/summary` | Credit analytics |
| GET | `/api/dashboard/overview` | Dashboard stats |
| GET | `/api/dashboard/sales-chart` | 6-month chart |
| GET | `/api/dashboard/top-products` | Best sellers |

---

## 📋 Hardware Requirements
- RAM: Minimum 4GB (8GB recommended)
- Storage: 500GB+
- OS: Windows / Linux / macOS
- Printer (optional, for invoice printing)

---

## 📚 References
1. MERN Stack Documentation — expressjs.com, reactjs.org, mongodb.com
2. Mongoose ODM — mongoosejs.com
3. JWT Authentication — jwt.io
4. Recharts — recharts.org

---
*Academic Year 2025-26 | Shivaji University, Kolhapur*
