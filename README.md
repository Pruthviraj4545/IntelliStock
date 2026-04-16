# IntelliStock

IntelliStock is a full-stack inventory, billing, analytics, and forecasting platform for small and medium retail operations.

It combines:
- A React frontend for dashboarding, POS, reporting, and admin workflows
- A Node.js + Express backend API with PostgreSQL persistence
- A Python FastAPI ML service for forecasting and inventory insights

## What This Project Includes

- Inventory and product management
- Sales tracking and transaction history
- Dashboard KPIs and trend analytics
- Invoice generation and customer workflows
- Role-based access control (admin, staff, customer)
- ML-powered forecasting and reorder intelligence
- API documentation via Swagger UI

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Axios
- Recharts

### Backend
- Node.js
- Express 5
- PostgreSQL (pg)
- JWT authentication
- Helmet, CORS, compression
- Swagger (swagger-jsdoc + swagger-ui-express)

### ML Service
- FastAPI
- Pandas, NumPy, scikit-learn
- SQLAlchemy + psycopg2

## Repository Structure

```
intellistock/
  client/                # React + Vite frontend
  server/                # Express API server
  ml-service/            # FastAPI ML service
  INTEGRATION_GUIDE.js   # Billing/shop/customer integration notes
  package.json           # Root scripts for convenience
```

## Architecture Overview

1. Frontend (client) calls backend REST APIs under /api
2. Backend handles auth, business logic, database operations, and validation
3. Backend calls ML service endpoints (with X-API-Key) for forecasts/analytics
4. ML service reads sales/product data and returns forecast payloads

### Default Local Ports
- Frontend: 5173 (Vite default)
- Backend: 5000
- ML service: 8000
- PostgreSQL: 5432

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- PostgreSQL 13+

## Quick Start (End-to-End)

## 1) Install Dependencies

From the project root:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

For ML service:

```bash
cd ml-service
python -m venv venv
# Windows PowerShell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 2) Configure Environment Variables

Create the following files.

### server/.env

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=intellistock
DB_USER=postgres
DB_PASSWORD=your_db_password

CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://localhost:3001

# Must match ML service key
ML_API_KEY=replace_with_secure_key
```

### ml-service/.env

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intellistock
DB_USER=postgres
DB_PASSWORD=your_db_password

# Must match server/.env
ML_API_KEY=replace_with_secure_key
```

### client/.env.local

```env
VITE_API_URL=http://localhost:5000/api
```

## 3) Initialize Database

Run schema scripts in PostgreSQL:

- server/db/schema.sql
- server/db/add-shop-and-customers.sql

Optional utility scripts are also available in server/db and server/scripts for patching/auditing.

## 4) Start Services

Open 3 terminals from project root.

### Terminal A: backend

```bash
npm run dev:server
```

### Terminal B: frontend

```bash
npm run dev:client
```

### Terminal C: ML service

```bash
cd ml-service
# activate your virtual env first
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

## 5) Access the App

- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/
- DB health: http://localhost:5000/health/db
- API docs: http://localhost:5000/api-docs
- ML health: http://127.0.0.1:8000/

## Root Scripts

From root package.json:

- npm run dev
  - starts frontend dev server (same as dev:client)
- npm run dev:client
  - starts client Vite server
- npm run dev:server
  - starts backend with nodemon
- npm run start
  - starts backend in non-watch mode

## Backend API Modules

Main route groups:

- /api/auth
- /api/products
- /api/sales
- /api/dashboard
- /api/analytics
- /api/reports
- /api/admin (ML route alias)
- /api/ml
- /api/notifications
- /api/audit-logs
- /api/shop
- /api/invoices

Interactive API docs:
- /api-docs
- /api-docs.json

## ML Integration Details

The backend ML controller communicates with:

- http://127.0.0.1:8000/train-model
- http://127.0.0.1:8000/forecast
- http://127.0.0.1:8000/product-forecast
- trend-analysis, moving-average, seasonality-analysis, anomaly-detection, forecast-vs-actual, growth-rate

Requests include header:

- X-API-Key: <ML_API_KEY>

If ML_API_KEY is missing or mismatched, ML routes will fail with auth/config errors.

## Demo Users

On backend startup, demo users are seeded/updated if database tables exist:

- admin@example.com
- staff@example.com
- client@example.com

Default password in code path:
- password123

Change these immediately in non-local environments.

## Development Notes

- CORS accepts localhost and 127.0.0.1 origins by default
- Static uploads are served from /uploads
- Security middleware includes Helmet and strict defaults
- Product and sales routes pass through audit middleware

## Production Checklist

- Set strong DB credentials
- Replace ML_API_KEY with a secure random value
- Disable demo user seeding or change startup logic
- Restrict CORS_ORIGIN to trusted frontend domains only
- Use HTTPS and secure reverse proxy
- Configure structured log shipping and rotation
- Run database backups and migration procedures

## Troubleshooting

## Backend cannot connect to PostgreSQL

- Verify DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in server/.env
- Confirm PostgreSQL service is running
- Confirm user permissions and schema exist

## Frontend cannot call API

- Verify VITE_API_URL in client/.env.local
- Confirm backend is running on expected port
- Check browser console for CORS/network errors

## ML endpoints failing

- Ensure ML service is running at 127.0.0.1:8000
- Ensure ML_API_KEY matches in both server/.env and ml-service/.env
- Verify ML service can access the same PostgreSQL database

## Build/Runtime script confusion

- Root npm run dev starts frontend only
- Start backend separately with npm run dev:server
- Start ML service separately with uvicorn command

## Useful Commands

```bash
# root
npm run dev:client
npm run dev:server

# client
npm run build --prefix client
npm run preview --prefix client

# server
npm run start --prefix server

# verify git status
git status -sb
```

## Additional Internal References

- Billing and customer integration notes: INTEGRATION_GUIDE.js
- Frontend-specific details: client/README.md

## Contributing

1. Create a feature branch
2. Keep commits focused and descriptive
3. Run and verify client, server, and ML flows locally
4. Submit PR with testing notes and impacted modules

## License

This repository currently has no explicit top-level license file. Add a LICENSE file if you plan to distribute externally.
