# 💰 Finance Dashboard Backend — Loan Management System

A production-ready backend system for managing financial records, loan applications, user roles, and dashboard analytics. Built with Node.js, Express, and PostgreSQL (Neon).

---

## 📌 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [File Responsibilities](#file-responsibilities)
- [Database Schema](#database-schema)
- [Role Based Access Control](#role-based-access-control)
- [Implemented Enhancements](#implemented-enhancements)
- [Environment Setup](#environment-setup)
- [Installation & Running](#installation--running)
- [API Reference](#api-reference)
- [Testing with Postman](#testing-with-postman)
- [Assumptions & Tradeoffs](#assumptions--tradeoffs)

---

## Overview

This backend powers a finance dashboard where users interact with financial records based on their assigned role. The system supports:

- JWT-based user authentication with role encoding
- Role-based access control (user / analyst / admin)
- Financial transaction management (income & expense tracking)
- Loan application system (simple and advanced with document uploads)
- Dashboard analytics APIs (summary, trends, category breakdowns)
- Admin management panel for loan approval/rejection with email notifications

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v22+ |
| Framework | Express.js |
| Database | PostgreSQL (Neon — cloud hosted) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Uploads | Multer |
| Email | Resend API |
| Validation | express-validator |
| Rate Limiting | express-rate-limit |
| Environment | dotenv |
| Deployment | Render (backend) + Neon (DB) |

---

## Architecture

```
Client (Postman / Frontend)
        │
        ▼
   Express Server (server.js)
        │
        ▼
   Rate Limiter (100 req / 15 min per IP)
        │
        ▼
   Routes Layer
   /api/auth  /api/loans  /api/admin  /api/transactions  /api/dashboard
        │
        ▼
   Middleware Layer
   ┌─────────────┬──────────────┬──────────────────┬────────────────────┐
   │  auth.js    │ adminAuth.js │   roleAuth.js    │ express-validator   │
   │ (verifyJWT) │ (adminOnly)  │ (role checker)   │ (input validation) │
   └─────────────┴──────────────┴──────────────────┴────────────────────┘
        │
        ▼
   Controllers Layer
   ┌──────────────────┬───────────────────────┬───────────────────────┐
   │ auth.controller  │ transaction.controller │ dashboard.controller  │
   └──────────────────┴───────────────────────┴───────────────────────┘
        │
        ▼
   PostgreSQL (Neon Cloud)
   ┌───────────┬───────────────────┬──────────────┬──────────────┐
   │  users    │ loan_applications │    loans     │ transactions │
   └───────────┴───────────────────┴──────────────┴──────────────┘
```

---

## Folder Structure

```
loan-App/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                      # PostgreSQL pool connection (Neon)
│   │   │   └── email.js                   # Resend email client setup
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js         # Register / login logic
│   │   │   ├── loanController.js          # Loan apply / fetch logic
│   │   │   ├── transaction.controller.js  # CRUD for financial transactions
│   │   │   └── dashboard.controller.js    # Aggregated analytics queries
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                    # JWT verification middleware
│   │   │   ├── adminAuth.js               # Admin-only access guard
│   │   │   ├── roleAuth.js                # Flexible role-based guard
│   │   │   └── multerConfig.js            # File upload configuration
│   │   │
│   │   ├── models/
│   │   │   └── Transaction.js             # SQL schema for transactions table
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js              # /api/auth/* endpoints
│   │   │   ├── loanRoutes.js              # /api/loans/* endpoints
│   │   │   ├── adminRoutes.js             # /api/admin/* endpoints
│   │   │   ├── transactionRoutes.js       # /api/transactions/* endpoints
│   │   │   └── dashboardRoutes.js         # /api/dashboard/* endpoints
│   │   │
│   │   └── uploads/                       # Uploaded documents stored here
│   │
│   ├── .env                               # Environment variables (NOT committed)
│   ├── .gitignore
│   ├── package.json
│   └── server.js                          # App entry point
│
├── frontend/
├── .gitignore
├── package-lock.json
└── README.md
```

---

## File Responsibilities

### `server.js`
Application entry point. Initializes Express, registers all middleware (CORS, JSON parser, rate limiter, static file serving), mounts route handlers, and starts the HTTP server. Also auto-creates the `/uploads` folder if missing.

---

### `src/config/db.js`
Creates and exports a PostgreSQL connection pool using `pg.Pool`. Reads `DATABASE_URL` from environment variables. SSL is enabled with `rejectUnauthorized: false` for compatibility with Neon.

### `src/config/email.js`
Initializes the Resend email client using `RESEND_API_KEY`. Exports a `sendEmail(to, subject, text)` utility used for loan status notifications.

---

### `src/controllers/auth.controller.js`
Handles user registration and login. Passwords are hashed using bcrypt before storage. On login, generates a signed JWT containing `id`, `email`, and `role`. Role is embedded in the token to avoid extra DB lookups on every request.

### `src/controllers/loanController.js`
Handles two loan flows — simple loan apply (basic fields) and advanced loan apply (with document uploads via Multer). Sends confirmation emails after successful submissions.

### `src/controllers/transaction.controller.js`
Full CRUD for the `transactions` table with:
- Dynamic filtering by `type`, `category`, date range, and `search` (notes keyword)
- Pagination support via `page` and `limit` query params
- Soft delete using `deleted_at` timestamp instead of hard delete
- All operations scoped to authenticated user via `req.user.id`

### `src/controllers/dashboard.controller.js`
Runs aggregated SQL queries against `transactions`. Returns summary totals, category breakdowns, monthly trends, and recent activity. All queries exclude soft-deleted records.

---

### `src/middleware/auth.js`
Extracts Bearer token from `Authorization` header, verifies it with `JWT_SECRET`, attaches decoded payload to `req.user`. Returns 401 if token is missing or invalid.

### `src/middleware/adminAuth.js`
Runs after `auth.js`. Checks if `req.user.role === 'admin'`. Returns 403 if not admin.

### `src/middleware/roleAuth.js`
Flexible middleware factory. Usage: `allowRoles('analyst', 'admin')`. Returns 403 if user role is not in allowed list.

### `src/middleware/multerConfig.js`
Configures Multer disk storage with absolute upload path. Creates `/uploads` directory if missing.

---

### `src/models/Transaction.js`
Contains the `CREATE TABLE IF NOT EXISTS` SQL for the `transactions` table including the `deleted_at` column for soft delete support.

---

### `src/routes/transactionRoutes.js`
Mounts CRUD routes with full `express-validator` validation:
- Body validation for `amount`, `type`, `category`, `date`, `notes`
- Query param validation for `page`, `limit`, `from`, `to`, `type`
- Route param validation for `/:id`

### `src/routes/dashboardRoutes.js`
Mounts analytics endpoints restricted to `analyst` and `admin` roles only.

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  reset_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Simple Loans
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  loan_type VARCHAR(50),
  amount NUMERIC(12,2),
  cibil_score INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  application_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Advanced Loan Applications
CREATE TABLE loan_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  loan_type VARCHAR(50),
  full_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  salary NUMERIC(12,2),
  pan VARCHAR(50),
  aadhaar VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Under Review',
  documents JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Financial Transactions (with soft delete)
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  deleted_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Role Based Access Control

| Action | user | analyst | admin |
|---|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | ✅ |
| Apply for loan | ✅ | ✅ | ✅ |
| View own loans | ✅ | ✅ | ✅ |
| View transactions | ✅ | ✅ | ✅ |
| Create transaction | ❌ | ❌ | ✅ |
| Update transaction | ❌ | ❌ | ✅ |
| Delete transaction | ❌ | ❌ | ✅ |
| View dashboard summary | ❌ | ✅ | ✅ |
| View category totals | ❌ | ✅ | ✅ |
| View monthly trends | ❌ | ✅ | ✅ |
| View recent activity | ❌ | ✅ | ✅ |
| View all loan applications | ❌ | ❌ | ✅ |
| Approve / Reject loans | ❌ | ❌ | ✅ |

---

## ✅ Implemented Enhancements

| Enhancement | Implementation |
|---|---|
| JWT Authentication | Token contains id, email, role. Expiry: 7 days |
| Pagination | `?page=1&limit=10` on GET /api/transactions |
| Search | `?search=keyword` searches transaction notes |
| Soft Delete | `deleted_at` timestamp — records never hard deleted |
| Rate Limiting | 100 requests per 15 minutes per IP |
| Input Validation | `express-validator` on all POST/PUT routes with field-level errors |
| Filtering | Filter by `type`, `category`, `from`, `to` date range |

---

## Environment Setup

Create `.env` inside the `backend/` folder:

```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_secret_key_here
PORT=5000
BASE_URL=http://localhost:5000
RESEND_API_KEY=re_your_resend_key_here
```

> ⚠️ Never commit `.env` to GitHub. It is listed in `.gitignore`.

---

## Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/Ch-saketh/loan-App.git
cd loan-App/backend

# 2. Install dependencies
npm install

# 3. Create .env file (see Environment Setup above)

# 4. Run SQL schema in Neon SQL Editor (copy from Database Schema section)

# 5. Start the server
node server.js
```

### Expected Output
```
DATABASE_URL: Loaded
✅ authRoutes.js loaded
🔥 adminRoutes.js loaded successfully!
✅ transactionRoutes.js loaded
✅ dashboardRoutes.js loaded
📁 uploads folder already exists
🚀 Server running on PORT: 5000
```

### Verify DB Connection
```
GET http://localhost:5000/test-db
→ { "msg": "DB Connected 🟢" }
```

---

## API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/register` | None | `{ name, email, password }` | Register new user |
| POST | `/login` | None | `{ email, password }` | Login, returns JWT token |
| GET | `/me` | Bearer Token | — | Get logged-in user info |
| GET | `/protected` | Bearer Token | — | Test protected route |
| GET | `/test` | None | — | Route health check |
| POST | `/forgot-password` | None | `{ email }` | Generate password reset link |
| POST | `/reset-password` | None | `{ token, newPassword }` | Reset password using token |

---

### Loan Routes — `/api/loans`

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/apply` | Bearer Token | `{ loan_type, amount, cibil_score }` | Submit simple loan |
| GET | `/my` | Bearer Token | — | Get own simple loans |
| POST | `/apply-loan` | Bearer Token | Form-data with files | Submit advanced loan with docs |
| GET | `/my-applications` | Bearer Token | — | Get own advanced applications |
| GET | `/my-all` | Bearer Token | — | Get all loans (simple + advanced) |

---

### Admin Routes — `/api/admin`

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| GET | `/applications` | Admin Token | — | Get all loan applications |
| GET | `/applications/:id` | Admin Token | — | Get single application |
| PUT | `/applications/:id` | Admin Token | `{ status: "approved"/"rejected" }` | Approve or reject loan |
| GET | `/loans` | Admin Token | — | Get all simple loans |
| PUT | `/loans/:id` | Admin Token | `{ status }` | Update simple loan status |

---

### Transaction Routes — `/api/transactions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Admin Token | Create transaction |
| GET | `/` | Bearer Token | Get transactions (filters + pagination) |
| PUT | `/:id` | Admin Token | Update transaction |
| DELETE | `/:id` | Admin Token | Soft delete transaction |

**Query Params for GET `/api/transactions`:**

| Param | Type | Example | Description |
|---|---|---|---|
| `type` | string | `income` | Filter by type |
| `category` | string | `Salary` | Filter by category |
| `from` | date | `2026-01-01` | Filter from date |
| `to` | date | `2026-04-30` | Filter to date |
| `search` | string | `grocery` | Search in notes |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Results per page (max 100) |

**Sample Paginated Response:**
```json
{
  "success": true,
  "transactions": [...],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Sample Validation Error Response:**
```json
{
  "success": false,
  "errors": [
    { "field": "amount", "msg": "amount must be greater than 0" },
    { "field": "type", "msg": "type must be 'income' or 'expense'" }
  ]
}
```

---

### Dashboard Routes — `/api/dashboard`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/summary` | Analyst / Admin | Total income, expense, net balance |
| GET | `/categories` | Analyst / Admin | Totals grouped by category and type |
| GET | `/trends` | Analyst / Admin | Monthly income vs expense breakdown |
| GET | `/recent` | Analyst / Admin | Last 10 transactions |

**Sample — `/api/dashboard/summary`:**
```json
{
  "success": true,
  "summary": {
    "total_income": "5000.00",
    "total_expense": "1500.00",
    "net_balance": "3500.00"
  }
}
```

**Sample — `/api/dashboard/trends`:**
```json
{
  "success": true,
  "trends": [
    { "month": "2026-03", "income": "5000.00", "expense": "0" },
    { "month": "2026-04", "income": "0", "expense": "1500.00" }
  ]
}
```

---

## Testing with Postman

### Step 1: Register a user
```
POST http://localhost:5000/api/auth/register
Body: { "name": "Saketh", "email": "test@gmail.com", "password": "test123" }
```

### Step 2: Make them admin (Neon SQL Editor)
```sql
UPDATE users SET role = 'admin' WHERE email = 'test@gmail.com';
```

### Step 3: Login and copy token
```
POST http://localhost:5000/api/auth/login
Body: { "email": "test@gmail.com", "password": "test123" }
```

### Step 4: Attach token to all requests
Postman → **Authorization tab** → Type: **Bearer Token** → paste token.

### Step 5: Create transactions
```
POST http://localhost:5000/api/transactions
Body: { "amount": 5000, "type": "income", "category": "Salary", "date": "2026-04-01" }

POST http://localhost:5000/api/transactions
Body: { "amount": 1500, "type": "expense", "category": "Food", "date": "2026-04-02" }
```

### Step 6: Test pagination and search
```
GET http://localhost:5000/api/transactions?page=1&limit=5
GET http://localhost:5000/api/transactions?type=income
GET http://localhost:5000/api/transactions?search=salary
```

### Step 7: Check dashboard
```
GET http://localhost:5000/api/dashboard/summary
GET http://localhost:5000/api/dashboard/categories
GET http://localhost:5000/api/dashboard/trends
GET http://localhost:5000/api/dashboard/recent
```

### Step 8: Test validation errors
```
POST http://localhost:5000/api/transactions
Body: { "amount": -100, "type": "wrong", "category": "" }
→ Returns field-level validation errors
```

---

## Assumptions & Tradeoffs

| Decision | Reasoning |
|---|---|
| Role stored in JWT | Avoids DB lookup on every request. Tradeoff: role changes require re-login |
| PostgreSQL on Neon | Free tier, no credit card, SSL-ready, Render compatible |
| Admin creates transactions | Financial records are admin-controlled. Users view only. Analysts get analytics |
| Soft delete on transactions | Data integrity — deleted records preserved with `deleted_at` timestamp |
| Multer local storage | Files stored on `/uploads`. In production, would be replaced with S3 |
| Rate limit 100/15min | Reasonable for dev/demo. Would be tuned per endpoint in production |
| No pagination on loans | Kept simple — can be added with LIMIT/OFFSET same as transactions |
| SSL rejectUnauthorized false | Required for Neon in dev. Should be true in production with proper certs |

---

## Live Demo

- **Backend API:** https://loanapp-lu02.onrender.com
- **GitHub Repo:** https://github.com/Ch-saketh/loan-App

---

## Author

**Saketh Chokkapu**
Email: Chokkapusaketh@gmail.com
GitHub: [@Ch-saketh](https://github.com/Ch-saketh)
