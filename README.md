# 🏪 ShopFlow: Small Shop Digitalization Kit

ShopFlow is a premium MERN stack application designed to help small shop owners digitize their operations. It manages billing, inventory, and customer credit (Udhaar) with a sleek, intuitive interface.

## 🚀 Features

- **🔐 Secure Auth**: Shop-specific data isolation using JWT.
- **📊 Smart Dashboard**: Real-time sales, revenue stats, and low stock alerts.
- **🛒 POS Billing**: Add products to cart, select customers, and generate bills.
- **📦 Inventory Control**: CRUD operations for products with low-stock tracking.
- **👥 Customer Ledger**: Manage customer profiles and track pending "Udhaar" dues.
- **🖨️ Printable Invoices**: Professional invoices generated instantly for every sale.
- **📱 Responsive Design**: Fully optimized for mobile and desktop use.

## 🛠️ Local Setup

### 1. Clone & Install
```bash
# Setup Backend
cd server
npm install

# Setup Frontend
cd ../client
npm install
```

### 2. Configure Environment
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 3. Run the App
**Start Backend:**
```bash
cd server
npm run dev
```

**Start Frontend:**
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`.

## 🌐 Deployment

For instructions on how to deploy this project to **Vercel** (Frontend) and **Render** (Backend), please refer to the [Deployment Guide](.gemini/antigravity/brain/275dd952-312e-42d2-b1b7-115265584394/deployment_guide.md).
