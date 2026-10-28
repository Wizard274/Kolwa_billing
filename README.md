# Kolwa Embroidery Billing System

A complete, production-ready full-stack MERN web application engineered for embroidery workshops and textile billing operations.

The system is specially designed with an **older-user-friendly, high-contrast, accessible UI** featuring large controls (≥ 48–56px), embroidery-inspired aesthetics, independent multi-company bill numbering, customer profiles, GST tax calculations (CGST/SGST/IGST), A4 invoice browser printing, and instant PDF downloads.

---

## Key Architectural Decisions

1. **Independent Multi-Company Numbering**:
   - `Kolwa Impex` (`KOLWA-001`, `KOLWA-002`, ...)
   - `Kolwa Creation` (`KC-001`, `KC-002`, ...)
   - `Shree Impex` (`SHREE-001`, `SHREE-002`, ...)
   - Atomic database counter (`Counter` collection) ensures sequential numbering is strictly concurrency-safe and non-overlapping.

2. **Indian GST Calculation Precision**:
   - Intrastate mode applies **CGST 2.5% + SGST 2.5%** by default.
   - Interstate mode applies **IGST 5.0%** exclusively.
   - Authoritative backend recalculation using 2-decimal paise rounding (`Math.round((value + Number.EPSILON) * 100) / 100`).

3. **Invoice Preservation & Audit Trail**:
   - Draft invoices can be updated or deleted.
   - Issued invoices retain a permanent snapshot of customer and company details at the moment of issuance; profile changes never mutate historical invoices.
   - Voiding an issued invoice preserves its sequence number in history to prevent gaps in tax audits.

4. **Senior-Friendly Interaction Rules**:
   - High text contrast with dark embroidery brown (`#6F4938`), sage green (`#71835B`), and warm off-white background (`#F8F7F3`).
   - Large buttons (≥ 48–56px) with explicit icon + label text pairs.
   - Direct "+ Add New Customer" modal inside bill creation to prevent loss of entered line items.

---

## Technology Stack

- **Backend**: Node.js (ES Modules), Express.js, MongoDB Atlas with Mongoose ODM, JWT Authentication, bcryptjs, Zod input validation, Helmet, CORS, and Express Rate Limit.
- **Frontend**: React 18, Vite, React Router v7, Lucide React icons, Axios, html2canvas, and jsPDF.
- **Styling**: Accessible CSS Design System with dedicated `@media print` A4 portrait styling.
- **Test Runner**: Node.js native test runner (`node --test`).

---

## Project Structure

```
kolwa-embroidery-billing/
├── client/                      # Frontend React + Vite Application
│   ├── src/
│   │   ├── components/          # Reusable UI Components
│   │   │   ├── Navbar.jsx
│   │   │   ├── ActiveCompanyBanner.jsx
│   │   │   ├── InvoiceSheet.jsx # A4 Tax Invoice Component
│   │   │   ├── AddCustomerModal.jsx
│   │   │   └── ConfirmationModal.jsx
│   │   ├── context/             # React Context State
│   │   │   ├── AuthContext.jsx
│   │   │   └── CompanyContext.jsx
│   │   ├── pages/               # Application Pages
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── CompanyWorkspacePage.jsx
│   │   │   ├── CompaniesListPage.jsx
│   │   │   ├── AddCompanyPage.jsx
│   │   │   ├── EditCompanyPage.jsx
│   │   │   ├── CustomerListPage.jsx
│   │   │   ├── CreateBillPage.jsx
│   │   │   ├── ViewInvoicePage.jsx
│   │   │   ├── EditDraftBillPage.jsx
│   │   │   ├── BillHistoryPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── services/            # Axios API Services
│   │   │   └── api.js
│   │   ├── utils/               # PDF Export Utility
│   │   │   └── pdfExport.js
│   │   ├── index.css            # Accessible Design System
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Backend Express REST API
│   ├── src/
│   │   ├── config/              # Database & Environment
│   │   │   ├── env.js
│   │   │   └── db.js
│   │   ├── models/              # Mongoose Data Models
│   │   │   ├── User.js
│   │   │   ├── Company.js
│   │   │   ├── Customer.js
│   │   │   ├── Invoice.js
│   │   │   └── Counter.js
│   │   ├── services/            # Business & Math Logic
│   │   │   ├── calculationService.js
│   │   │   └── invoiceNumberService.js
│   │   ├── validators/          # Zod Validation Schemas
│   │   │   ├── authValidator.js
│   │   │   ├── companyValidator.js
│   │   │   ├── customerValidator.js
│   │   │   └── invoiceValidator.js
│   │   ├── middleware/          # Security & Auth
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validateMiddleware.js
│   │   ├── controllers/         # Express Request Handlers
│   │   │   ├── authController.js
│   │   │   ├── companyController.js
│   │   │   ├── customerController.js
│   │   │   └── invoiceController.js
│   │   ├── routes/              # Express API Routes
│   │   │   ├── apiRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── companyRoutes.js
│   │   │   ├── customerRoutes.js
│   │   │   └── invoiceRoutes.js
│   │   ├── scripts/             # Idempotent Database Seeds
│   │   │   └── seed.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/                   # Automated Unit & Integration Tests
│   │   ├── calculationService.test.js
│   │   ├── invoiceNumberService.test.js
│   │   ├── validationAndSecurity.test.js
│   │   └── businessLogicIntegration.test.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## Local Development Setup

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### 1. Server Configuration
```bash
cd server
npm install
```

Configure your environment variables in `server/.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/kolwa_billing?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
INITIAL_ADMIN_USERNAME=Kolwa
INITIAL_ADMIN_PASSWORD=1234
DEFAULT_TIMEZONE=Asia/Kolkata
```

### 2. Run Database Seed (Idempotent)
Creates initial administrator account (`Kolwa` / `1234`) and the three default companies (`Kolwa Impex`, `Kolwa Creation`, `Shree Impex`) without duplicates:
```bash
npm run seed
```

### 3. Start Server
```bash
npm run dev
# Server runs at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 4. Client Configuration
Open a second terminal window:
```bash
cd client
npm install
```

Configure `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
# Frontend runs at http://localhost:5173
```

### 5. Log In
Open `http://localhost:5173` in your browser:
- **Username**: `Kolwa`
- **Password**: `1234`

---

## Automated Test Suites

Run the complete test suite:
```bash
cd server
npm test
```

Verified test suites:
- **`calculationService.test.js`**: Line totals, gross calculation, discount percentages, fixed manual discounts, CGST/SGST intrastate vs IGST interstate exclusivity, and 2-decimal paise rounding.
- **`invoiceNumberService.test.js`**: Format checks, zero-padded sequences, multi-prefix handling.
- **`validationAndSecurity.test.js`**: Password hashing with bcrypt, Zod schemas, negative values rejection.
- **`businessLogicIntegration.test.js`**: Per-company sequence isolation, draft vs issued protection, voiding preservation, and invoice snapshot immutability.

---

---

## Deployment Options

This application is 100% deployment-ready and supports three popular production architectures:

### Option 1: Unified Single-Service Deployment on Render / Railway (Recommended & Easiest)
Deploy both the frontend and backend together as a single unified web service. The Node server automatically serves the built React frontend (`client/dist`) and handles all API routes at `/api`, completely eliminating CORS overhead.

1. **Deploy with `render.yaml`**:
   - Push this repository to GitHub: `https://github.com/Wizard274/Kolwa_billing.git`
   - Log into [Render Dashboard](https://dashboard.render.com).
   - Click **New +** -> **Blueprint**.
   - Select the `Kolwa_billing` repository. Render automatically reads `render.yaml`.
   - Provide your `MONGODB_URI` environment variable when prompted.
   - Click **Apply**. Render will automatically run `npm run build` and start the server at `https://your-app.onrender.com`.

2. **Or Manual Web Service Setup**:
   - **Root Directory**: Leave blank (root).
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
   - **Environment Variables**:
     - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
     - `JWT_SECRET`: `<A long random 64-character secret>`
     - `NODE_ENV`: `production`

---

### Option 2: Split Deployment (Vercel for Frontend + Render for Backend)

#### A. Backend Deployment (Render / Railway)
1. Sign in to [Render](https://render.com) and create a **Web Service**.
2. Select your repository:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
3. Set Environment Variables:
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET`: `<A long random 64-character secret>`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-kolwa-billing.vercel.app`
4. Click **Deploy Web Service** and copy your backend URL (e.g., `https://kolwa-api.onrender.com`).

#### B. Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository `Wizard274/Kolwa_billing`.
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set Environment Variable in Vercel:
   - `VITE_API_BASE_URL`: `https://kolwa-api.onrender.com/api`
4. Click **Deploy**. Vercel uses `client/vercel.json` for seamless client-side SPA routing.

---

### Option 3: Docker Container Deployment
A multi-stage `Dockerfile` is included for self-hosted VPS, AWS ECS, Google Cloud Run, or Railway:

```bash
# Build the container image
docker build -t kolwa-billing .

# Run the container
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URI="your-mongodb-atlas-uri" \
  -e JWT_SECRET="your-jwt-secret" \
  -e NODE_ENV="production" \
  --name kolwa-billing-app \
  kolwa-billing
```

Access the application at `http://localhost:5000` or via your reverse proxy (Nginx / Caddy / Cloudflare).

---

## Database Backup and Restore

To back up invoices from MongoDB Atlas:
```bash
mongodump --uri="mongodb+srv://<username>:<password>@cluster0.mongodb.net/kolwa_billing" --out=./backups/$(date +%F)
```

To restore from a backup:
```bash
mongorestore --uri="mongodb+srv://<username>:<password>@cluster0.mongodb.net/kolwa_billing" ./backups/2026-10-23/kolwa_billing
```

---

## Production Security Checklist
- [ ] Change the initial administrator password (`1234`) immediately via the `/settings` screen.
- [ ] Ensure `JWT_SECRET` is set to a cryptographically secure random string.
- [ ] Ensure `MONGODB_URI` credentials are kept private in hosting platform environment variables and never committed to git.
- [ ] Confirm MongoDB Atlas user uses SCRAM-SHA-256 and has least privilege access.

