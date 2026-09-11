# Skilled Worker Hub — Local Job & Skilled Worker Management System

[![Node.js](https://img.shields.io/badge/Node.js-v24+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v5.x-blue.svg)](https://expressjs.com/)
[![EJS](https://img.shields.io/badge/View_Engine-EJS-orange.svg)](https://ejs.co/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-brightgreen.svg)](https://www.mongodb.com/atlas)
[![Package Manager](https://img.shields.io/badge/Package_Manager-pnpm-red.svg)](https://pnpm.io/)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://vercel.com/)

A production-quality full-stack platform built for **PS 7 — Local Job & Skilled Worker Management System** (Gig Economy / Services Marketplace). The system connects local customers with skilled trade professionals (electricians, plumbers, carpenters, painters, AC technicians, appliance repair workers, cleaners, masons) through a controlled job lifecycle with authentic star reviews and administrative oversight.

---

## 📋 Problem Statement & Scope

In the local gig economy, finding trustworthy, skilled trade workers is difficult due to lack of verification, opaque pricing, and nonexistent accountability. Skilled Worker Hub provides:

1. **Customer Marketplace**: Instant search by trade skill and city location directly queried from MongoDB, transparent profile views, booking workflow, and verified 1–5 star reviews.
2. **Worker Portal**: Profile management, customizable trade skill tags, request approval/decline, and a strictly enforced job progression workflow (`Pending` &rarr; `Accepted` &rarr; `In Progress` &rarr; `Completed`).
3. **Administrative Control**: Worker credential verification queue (`Pending`, `Verified`, `Rejected`), customer dispute/complaint monitoring, platform user management, and real-time MongoDB aggregations for **Most-Requested Services** and platform satisfaction.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | **EJS (Server-Side Rendering)**, HTML5, Vanilla CSS, Vanilla JS | Strictly complies with academic assignment constraints (no React/Vue/Angular/SPA). Clean partials-based layout, responsive design, and CSS variables. |
| **Backend** | **Node.js & Express.js (v5)** | Modular MVC architecture with controllers, middleware, and routers. |
| **Database** | **MongoDB Atlas & Mongoose** | Document model with indexed collections, referential integrity, and aggregation pipelines. Out-of-the-box in-memory fallback for local dev. |
| **Authentication** | **JWT & bcryptjs** | Passwords hashed with salt rounds. Signed JSON Web Tokens stored in secure, **HTTP-only cookies** (`SameSite=Lax`). |
| **Package Manager**| **pnpm** | Strict dependency management, zero phantom dependencies. |
| **Deployment** | **Vercel** | Serverless function export with asset bundling configuration in `vercel.json`. |

---

## ✨ Features Breakdown

### 🧑 1. Customer Features
- **MongoDB Search & Filter**: Filter workers by trade skill (Electrician, Plumber, AC Repair, etc.), city location, minimum experience, and verified status.
- **Worker Profile**: View worker experience, hourly rate, coverage areas, trade skills, and authentic reviews.
- **Service Request Booking**: Select date and time window (Morning, Afternoon, Evening) with detailed issue descriptions.
- **Job Status Tracking**: Real-time visual progress bar tracking `Pending` &rarr; `Accepted` &rarr; `In Progress` &rarr; `Completed`. Ability to cancel requests while still `Pending`.
- **Stretch Goal — 1–5 Star Rating System**:
  - Only the customer who owns a `Completed` job can rate it.
  - A job can only ever be rated once (`Rating.job` unique index + `rated: true` flag).
  - Worker's `averageRating` and `totalRatings` are recalculated atomically using MongoDB aggregation.
- **Dispute & Complaint Reporting**: Submit tickets for unfulfilled appointments or quality issues directly to the Admin.

### 👷 2. Worker Features
- **Worker Dashboard**: Telemetry cards for Pending, Accepted, In-Progress, and Completed jobs.
- **Incoming Requests Management**: Accept or decline incoming customer requests.
- **Controlled Job Progression**:
  - `Pending` &rarr; `Accepted` or `Rejected` (with decline rationale).
  - `Accepted` &rarr; `In Progress` &rarr; `Completed` (with completion notes).
  - Server-side guard strictly disallows illegal transitions (e.g. `Rejected` &rarr; `Completed`).
- **Profile & Skill Management**: Edit bio, hourly rates, service areas, and toggle skill tags or add custom trade specializations.
- **Verified Status Badge**: Stand out in customer searches once verified by platform administrators.

### 👑 3. Admin Features
- **Master Dashboard Telemetry**: Total users, total workers, total customers, verified count, active jobs, and open complaints.
- **Most-Requested Services**: Calculated dynamically using MongoDB `$group` aggregation pipeline across all service requests.
- **Platform Rating Breakdown**: Live distribution meter of 1–5 star ratings across all completed jobs.
- **Worker Profile Verification**: Dedicated queue of unverified worker registrations with 1-click **Verify** or **Reject** actions.
- **User Management**: View all platform accounts, filter by role or status, and activate/deactivate accounts (safeguarded against self-deactivation).
- **Complaint Monitoring**: Investigate disputed jobs, record administrative findings, and transition complaints across `Open` &rarr; `Under Review` &rarr; `Resolved` &rarr; `Closed`.

---

## 🔐 Demo Credentials (Seeded)

The application comes pre-configured with realistic demo accounts across all three roles. Quick-fill buttons are provided on the login page for instant hackathon evaluation:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@workerhub.com` | `Admin@123` | Full access to verifications, complaints, and analytics |
| **Worker (Verified)** | `rajesh.electrician@workerhub.com` | `Worker@123` | Electrician & AC Repair, New Delhi (7 yrs exp, 5.0★) |
| **Worker (Verified)** | `mohit.plumber@workerhub.com` | `Worker@123` | Plumber & Cleaner, Noida (5 yrs exp, 4.0★) |
| **Worker (Pending)** | `suresh.painter@workerhub.com` | `Worker@123` | Painter & Mason, Ghaziabad (Pending admin verification) |
| **Customer** | `amit.sharma@gmail.com` | `Customer@123` | Active customer with completed and active jobs |
| **Customer** | `priya.patel@gmail.com` | `Customer@123` | Customer with scheduled AC repair requests |

---

## 📁 Project Directory Structure

```
Class_Hackathon/
├── package.json               # pnpm project scripts and dependencies
├── pnpm-lock.yaml             # Strict deterministic lockfile
├── vercel.json                # Vercel serverless functions & static routing configuration
├── .env.example               # Environment variables template
├── .env                       # Local environment configuration
├── .gitignore                 # Excludes node_modules, .env, .vercel
├── README.md                  # Comprehensive documentation
├── app.js                     # Express app instance, security headers, middleware
├── server.js                  # Local server bootstrap & MongoDB connector
├── api/
│   └── index.js               # Vercel serverless entry point exporting handler
├── config/
│   └── db.js                  # Mongoose connector supporting MongoDB Atlas & zero-config in-memory dev
├── models/
│   ├── User.js                # Customer, Worker, Admin schema with worker subfields
│   ├── ServiceRequest.js      # Job lifecycle model with status enum & ratings flag
│   ├── Rating.js              # 1-5 star review model with static recalculation helper
│   └── Complaint.js           # Dispute reporting model
├── middleware/
│   ├── auth.js                # JWT cookie verification & user hydration
│   ├── role.js                # Role isolation guards (customer, worker, admin)
│   └── errorHandler.js        # Custom 404, 403, and 500 renderers
├── controllers/
│   ├── authController.js      # Register, login, logout with HTTP-only cookies
│   ├── customerController.js  # Worker search, booking, rating, complaint submission
│   ├── workerController.js    # Profile & skills edit, job workflow progression
│   ├── adminController.js     # Analytics, worker verification, user management, complaints
│   └── publicController.js     # Homepage hero, platform metrics, and public directory
├── routes/
│   ├── authRoutes.js          # /auth/*
│   ├── customerRoutes.js      # /customer/*
│   ├── workerRoutes.js        # /worker/*
│   ├── adminRoutes.js         # /admin/*
│   └── publicRoutes.js        # /*
├── views/
│   ├── partials/
│   │   ├── header.ejs         # Typography, CSS, meta tags
│   │   ├── navbar.ejs         # Role-aware responsive navigation
│   │   ├── footer.ejs         # Platform footer & script links
│   │   ├── flash.ejs          # Toast / alert messaging
│   │   ├── statusBadge.ejs    # Color-coded status badge renderer
│   │   └── starRating.ejs     # Dynamic 1-5 star renderer
│   ├── public/
│   │   ├── home.ejs           # Landing page with search hero & categories
│   │   └── workers.ejs        # Public worker directory
│   ├── auth/
│   │   ├── login.ejs          # Login form with 1-click demo evaluator credentials
│   │   └── register.ejs       # Role-aware registration (Customer vs. Worker)
│   ├── customer/
│   │   ├── dashboard.ejs      # Customer KPI cards and recent bookings
│   │   ├── search.ejs         # Live MongoDB worker search by skill/location
│   │   ├── workerProfile.ejs  # Worker public profile with customer reviews
│   │   ├── createRequest.ejs  # Service booking form
│   │   ├── myRequests.ejs     # Tabular job tracking with status filters
│   │   ├── rateJob.ejs        # 1-5 star rating & feedback form
│   │   └── fileComplaint.ejs  # Dispute filing form
│   ├── worker/
│   │   ├── dashboard.ejs      # Job requests summary & rating statistics
│   │   ├── profile.ejs        # Profile details, bio, and hourly rate editor
│   │   ├── skills.ejs         # Trade skills selection & custom skill additions
│   │   └── requests.ejs       # Job lifecycle management & state transitions
│   ├── admin/
│   │   ├── dashboard.ejs      # MongoDB aggregation analytics (most-requested services)
│   │   ├── verification.ejs   # Worker credential verification queue
│   │   ├── users.ejs          # User directory with role filters & status toggles
│   │   ├── complaints.ejs     # Dispute monitoring queue
│   │   └── complaintDetail.ejs# Individual complaint resolution view
│   └── errors/
│       ├── 403.ejs            # Access forbidden page
│       ├── 404.ejs            # Page not found page
│       └── 500.ejs            # Internal server error page
├── public/
│   ├── css/
│   │   └── style.css          # Modern CSS styling with CSS variables & responsive layout
│   └── js/
│       └── main.js            # Client-side validation, star picker, and alert dismissal
└── scripts/
    ├── seed.js                # Database seeder populating users, jobs, ratings, complaints
    └── test-flows.js          # Automated end-to-end test suite (39 assertion checks)
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher; v24 recommended)
- [pnpm](https://pnpm.io/) (v9 or higher)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd Class_Hackathon
pnpm install
```

### 2. Configure Environment Variables
Copy the template configuration:
```bash
cp .env.example .env
```

Your `.env` file should contain:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/skilled_workers
JWT_SECRET=hackathon_super_secret_jwt_key_ps7_skilled_workers_2026
```

> **Note on Zero-Config Local Development**: If you do not have a local MongoDB daemon running, the application will automatically initialize an in-memory MongoDB instance (`mongodb-memory-server`) during local development. If you provide a **MongoDB Atlas** connection string, it connects directly to Atlas.

### 3. Seed Realistic Demo Data
Populate the database with the pre-configured Admin, Workers, Customers, Service Requests, Ratings, and Complaints:
```bash
pnpm seed
```

### 4. Run the Development Server
```bash
pnpm dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### 5. Run the Automated Test Suite
Verify that all authentication guards, worker search, booking lifecycle transitions, rating recalculation, and admin verification flows pass:
```bash
pnpm test
```

---

## ☁️ Deploying to Vercel

The project is structured specifically to deploy cleanly on Vercel as an Express serverless application with EJS view rendering and static file resolution.

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "feat: complete PS 7 Local Job & Skilled Worker Management System"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Set Up MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Network Access**, allow IP `0.0.0.0/0` (standard for Vercel serverless connections).
3. Under **Database Access**, create a database user and password.
4. Obtain the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/skilled_workers?retryWrites=true&w=majority
   ```

### Step 3: Import into Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Select your GitHub repository.
3. In **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random secret string
   - `NODE_ENV`: `production`
4. Click **Deploy**.
5. After deployment, run `pnpm seed` pointing to your Atlas URI once from your local terminal to populate seed data, or register users directly via the web interface.

---

## 🔒 Security Implementations

1. **Password Hashing**: Passwords are encrypted using `bcryptjs` with salt rounds prior to database persistence.
2. **HTTP-Only JWT Cookies**: Authentication tokens are stored in `HttpOnly`, `SameSite=Lax` cookies, preventing XSS-based token theft.
3. **Role-Based Access Control (RBAC)**: `requireRole('customer' | 'worker' | 'admin')` middleware enforces complete isolation. Customers cannot view worker or admin dashboards; workers cannot perform administrative actions.
4. **Self-Deactivation Guard**: Admins are strictly prohibited from deactivating their own administrative account.
5. **State Machine Validation**: Job status updates are verified against a strict transition dictionary preventing skipped or invalid workflow steps.
6. **Unique Rating Constraint**: Customers can only rate completed jobs they own, and database constraints prevent duplicate ratings.
7. **HTTP Security Headers**: `helmet` is integrated to set standard web security headers.

---

## 🔮 Future Improvements

1. **Real-time Push Notifications**: WebSockets or Server-Sent Events (SSE) to notify workers of incoming bookings instantly.
2. **Integrated Digital Invoicing**: Downloadable PDF receipts for completed jobs.
3. **Geolocation Radius Matching**: Native MongoDB `$near` geospatial queries with radius filtering.
4. **Integrated In-App Chat**: Direct messaging between worker and customer for appointment coordination.

---

## 📄 License

This project was built for academic evaluation under Problem Statement 7 (PS 7). Released under the ISC License.
