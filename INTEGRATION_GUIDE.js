/**
 * IntelliStock - Professional Billing & Customer Management System
 * 
 * SETUP & INTEGRATION GUIDE
 * =========================
 * 
 * This guide walks through setting up the new billing, shop configuration,
 * and customer management features.
 */

// ============================================================================
// STEP 1: INSTALL DEPENDENCIES
// ============================================================================
/*
In your client folder, run:
  npm install html2canvas jspdf

These are required for:
  - html2canvas: Converting invoice HTML to canvas for PDF
  - jspdf: Generating PDF files from canvas
*/

// ============================================================================
// STEP 2: DATABASE SETUP
// ============================================================================
/*
Execute the migration file to create new tables:

File: /server/db/add-shop-and-customers.sql

Tables created:
  - shop_details: Store your shop information
  - customers: Customer records with mobile number (unique key)
  - invoices: Invoice master records
  - invoice_items: Line items with individual GST
  - customer_interactions: Track purchases, returns, inquiries
  - loyalty_programs: Loyalty tier definitions
  - low_stock_alerts: Real-time stock monitoring

Run this in your PostgreSQL database.
*/

// ============================================================================
// STEP 3: ROUTING & API SETUP
// ============================================================================
/*
✅ Already done in server.js:
  - shop.routes.js is mounted at /api/shop
  - invoice.routes.js is mounted at /api/invoices

Endpoints available:
  
  SHOP ROUTES:
  - GET    /api/shop/shop-details           - Get shop details
  - POST   /api/shop/shop-details           - Create/update shop details
  - GET    /api/shop/customers              - List customers (paginated)
  - POST   /api/shop/customers/get-or-create - Quick customer lookup
  - GET    /api/shop/customers/frequent     - Get frequent customers
  - GET    /api/shop/customers/:id/details  - Get customer full details
  
  INVOICE ROUTES:
  - POST   /api/invoices                    - Create invoice (with stock update)
  - GET    /api/invoices/:id                - Get invoice details
  - GET    /api/invoices                    - List invoices (paginated)
  - GET    /api/invoices/alerts/low-stock   - Get low stock alerts
  - PATCH  /api/invoices/alerts/:id         - Acknowledge alert
*/

// ============================================================================
// STEP 4: COMPONENT USAGE
// ============================================================================
/*
IMPORT & USE COMPONENTS:

import ProfessionalBilling from '@/components/ProfessionalBilling'
import ShopConfiguration from '@/components/ShopConfiguration'
import CustomerManagement from '@/components/CustomerManagement'
import LowStockAlerts from '@/components/LowStockAlerts'
import BillingDashboard from '@/pages/BillingDashboard'

USAGE:
  <ProfessionalBilling cartItems={items} customerId={id} />
  <ShopConfiguration />
  <CustomerManagement />
  <LowStockAlerts />
*/

// ============================================================================
// STEP 5: USER WORKFLOW
// ============================================================================
/*
1. INITIAL SETUP:
   - Admin goes to Shop Configuration
   - Enters shop name, address, GST number, contact details
   - Saves form (stored in database)

2. CREATING INVOICE:
   - Staff selects products and quantities (cart)
   - Uses ProfessionalBilling component
   - System automatically creates/fetches customer by mobile
   - Generates invoice number (FORMAT: INV-YYYYMMDD-XXXXX)
   - Calculates GST (18% default)
   - Updates inventory (stock decreased)
   - Tracks customer interaction (purchase)

3. MANAGING CUSTOMERS:
   - View all customers
   - Search by name/mobile
   - Filter frequent customers
   - View loyalty points
   - See purchase history

4. REAL-TIME LOW STOCK ALERTS:
   - LowStockAlerts component auto-refreshes every 30 seconds
   - Shows products below reorder level
   - Color-coded status (red=critical, yellow=warning, green=ok)
   - Staff can acknowledge alerts
   - Stock percentage visualization

5. INVOICING & PRINTING:
   - Generate invoice (stored in database)
   - Download as PDF
   - Print directly from browser
   - Professional tabular format with GST details
*/

// ============================================================================
// COMPONENT SPECIFICATIONS
// ============================================================================

/*
PROFESSIONAL BILLING COMPONENT
================================
Props:
  - cartItems: Array of {id, name, selling_price, quantity}
  - customerId: Optional customer ID for pre-filling
  - customerDetails: Optional customer object

State Management:
  - Discount percentage input
  - Payment method selection (cash/card/upi/wallet/cheque)
  - Invoice generation & storage
  - PDF export functionality

Features:
  - Automatic customer creation (if mobile provided)
  - GST calculation (18% on subtotal after discount)
  - Professional invoice layout with shop details
  - Table: Product Name | Qty | Rate | GST | Amount
  - Discount & tax breakdown
  - Print & PDF download
  - Shows invoice number and generation confirmation

Database Integration:
  - Calls POST /api/invoices to create invoice
  - Updates product inventory (stock decreased)
  - Creates customer interaction record
  - Updates customer loyalty points
  - All operations in single transaction
*/

/*
SHOP CONFIGURATION COMPONENT
==============================
Purpose:
  - Allows admin to set up business details
  - Required before generating professional invoices

Form Fields:
  - Shop Name (required)
  - Address (required)
  - City, State, Postal Code
  - Contact Number (required, 10 digits)
  - Email
  - GST Number (required, 15 digits format: 27AABCT1234H1Z0)
  - License Number
  - Owner Name
  - Business Type (retail/wholesale/distributor/manufacturer/service)
  - Shop Description

Validation:
  - All required fields must be filled
  - GST format validation
  - Phone number format

Database Integration:
  - POST /api/shop/shop-details to save
  - GET /api/shop/shop-details to retrieve
  - Updates or creates new record
*/

/*
CUSTOMER MANAGEMENT COMPONENT
===============================
Features:
  - Display all customers (searchable)
  - Show frequent customers separately
  - Customer statistics:
    - Total purchase count
    - Loyalty points accumulated
    - Last purchase date
  - Detailed customer modal with full interaction history

Stats Displayed:
  - Total Customers count
  - Frequent Customers count
  - Loyalty Eligible count (with points > 0)

Search & Filter:
  - Search by name or mobile number (all customers)
  - Quick view of frequent customers list
  - Click any customer card to view full details

Customer Modal Shows:
  - Name, phone, email, address
  - Purchase count
  - Loyalty points
  - Frequent customer status
  - Last purchase date
*/

/*
LOW STOCK ALERTS COMPONENT
===========================
Real-time Inventory Monitoring

Features:
  - Auto-refresh every 30 seconds
  - Status-based filtering:
    - Pending (not yet acknowledged)
    - Acknowledged (staff reviewed)
    - Resolved (stock replenished)
  - Color-coded visualization:
    - Red: Critical (near reorder level)
    - Yellow: Warning (getting low)
    - Green: Optimal (good stock)

For Each Alert Shows:
  - Product name
  - Current stock quantity
  - Reorder level
  - Stock percentage (visual bar)
  - Alert status
  - Acknowledge button (for pending)

Database Integration:
  - Fetches from low_stock_alerts table
  - Triggered when product stock < reorder_level
  - Auto-updated after invoicing
*/

// ============================================================================
// DATABASE SCHEMA SUMMARY
// ============================================================================

/*
SHOP_DETAILS
  - id: Primary Key
  - name, address, city, state, postal_code
  - contact_number, email
  - gst_number (unique)
  - owner_name, license_number
  - business_type, description
  - created_at, updated_at

CUSTOMERS
  - id: Primary Key
  - name, email, address
  - mobile_number (unique - used as customer identifier)
  - is_frequent_customer (boolean)
  - loyalty_points (accumulated)
  - purchase_count
  - last_purchase_date
  - created_at, updated_at

INVOICES
  - id: Primary Key
  - invoice_number (unique, format: INV-YYYYMMDD-XXXXX)
  - customer_id (FK to customers)
  - subtotal, discount_amount, discount_percentage
  - tax (calculated as subtotal × tax_percentage / 100)
  - tax_percentage (default 18 for GST)
  - total_amount
  - payment_method (cash/card/upi/wallet/cheque)
  - invoice_date, created_at

INVOICE_ITEMS
  - id: Primary Key
  - invoice_id (FK)
  - product_id (FK)
  - quantity, rate_per_unit
  - tax_percentage (per-product GST)
  - tax_amount (line_total × tax_percentage / 100)
  - line_total (quantity × rate + tax)
  - created_at

CUSTOMER_INTERACTIONS
  - id: Primary Key
  - customer_id (FK)
  - interaction_type (purchase/return/inquiry/feedback)
  - description, notes
  - reference_id (invoice_id for purchases)
  - created_at

LOYALTY_PROGRAMS
  - id: Primary Key
  - tier_name (silver/gold/platinum)
  - min_purchases, min_points
  - discount_percentage
  - benefits, created_at

LOW_STOCK_ALERTS
  - id: Primary Key
  - product_id (FK)
  - current_stock, reorder_level
  - status (pending/acknowledged/resolved)
  - acknowledged_by (user id), acknowledged_at
  - created_at, updated_at
*/

// ============================================================================
// API RESPONSE EXAMPLES
// ============================================================================

/*
CREATE INVOICE - POST /api/invoices
Request:
{
  "customerId": 5,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "rate": 999.99
    }
  ],
  "subtotal": 1999.98,
  "taxPercentage": 18,
  "discountAmount": 100,
  "discountPercentage": 5,
  "paymentMethod": "cash"
}

Response:
{
  "invoice": {
    "id": 42,
    "invoice_number": "INV-20250101-00042",
    "customer_id": 5,
    "subtotal": 1999.98,
    "discount_amount": 100,
    "tax": 342,
    "total_amount": 2241.98,
    "payment_method": "cash",
    "invoice_date": "2025-01-01"
  }
}
*/

/*
GET SHOP DETAILS - GET /api/shop/shop-details
Response:
{
  "shopDetails": {
    "id": 1,
    "name": "IntelliStock Shop",
    "address": "123 Business St",
    "city": "Delhi",
    "state": "Delhi",
    "postal_code": "110001",
    "contact_number": "9876543210",
    "email": "shop@intellistock.com",
    "gst_number": "27AABCT1234H1Z0",
    "owner_name": "John Doe",
    "license_number": "LIC123456",
    "business_type": "retail"
  }
}
*/

/*
GET CUSTOMERS - GET /api/shop/customers?page=1&limit=20
Response:
{
  "customers": [
    {
      "id": 1,
      "name": "Rajesh Kumar",
      "mobile_number": "9876543210",
      "email": "rajesh@email.com",
      "is_frequent_customer": true,
      "loyalty_points": 450,
      "purchase_count": 12,
      "last_purchase_date": "2025-01-15"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
*/

// ============================================================================
// INTEGRATION CHECKLIST
// ============================================================================

/*
BEFORE GOING LIVE:

Setup:
  ☐ Run npm install html2canvas jspdf in client folder
  ☐ Execute add-shop-and-customers.sql migration
  ☐ Verify server.js has shop and invoice routes mounted
  ☐ Verify axios.js has proper authorization headers

Testing:
  ☐ Open BillingDashboard or ShopConfiguration page
  ☐ Test shop configuration form (create/update)
  ☐ Create test invoice with cart items
  ☐ Verify invoice appears in database
  ☐ Test PDF download and printing
  ☐ Test customer search and filtering
  ☐ Verify low stock alerts appear and auto-refresh
  ☐ Test acknowledge alert functionality

Features:
  ☐ Login page displays with new color scheme
  ☐ All $ symbols replaced with ₹
  ☐ Sample data removed from Charts/Reports
  ☐ Real-time low stock alerts working
  ☐ Invoice generation with GST calculation
  ☐ Customer tracking with loyalty points

Performance:
  ☐ PDF generation works smoothly
  ☐ Alert refresh every 30 seconds
  ☐ No N+1 queries in invoice creation
  ☐ Customer search is responsive
  ☐ Database transactions ensure consistency
*/

// ============================================================================
// COMMON ISSUES & TROUBLESHOOTING
// ============================================================================

/*
Issue: "Shop details not configured" error
  - User hasn't saved shop details yet
  - Fix: Go to Shop Configuration and fill the form

Issue: PDF download fails
  - html2canvas or jsPDF not installed
  - Fix: npm install html2canvas jspdf

Issue: Customer not found on invoice creation
  - Mobile number not matching existing customer
  - Fix: System auto-creates new customer with mobile number

Issue: Low stock alerts not appearing
  - Product stock might not be below reorder_level
  - Alerts refresh every 30 seconds
  - Fix: Check product reorder_level in database

Issue: Invoice number format error
  - Database stored procedure might have failed
  - Fix: Verify database has correct trigger/function for invoice_number generation

Issue: Authorization errors on API calls
  - Token might have expired or user role is insufficient
  - Fix: Ensure user is admin or staff role, login again if needed
*/

export {}
