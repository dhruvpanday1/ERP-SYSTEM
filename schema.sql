-- ============================================================
-- WFX AI Explorer — Database Schema (PostgreSQL)
-- ============================================================

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id VARCHAR(255) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    lead_time_days INTEGER,
    rating NUMERIC(3, 2)
);

-- 2. Buyers Table
CREATE TABLE IF NOT EXISTS buyers (
    buyer_id VARCHAR(255) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    buyer_category VARCHAR(255)
);

-- 3. Finished Goods Table (Garments / Products)
CREATE TABLE IF NOT EXISTS finished_goods (
    style_number VARCHAR(255) PRIMARY KEY,
    style_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    fabric VARCHAR(255),
    gsm INTEGER,
    color VARCHAR(255),
    print VARCHAR(255),
    season VARCHAR(50),
    brand VARCHAR(255),
    supplier VARCHAR(255),
    cost NUMERIC(10, 2),
    selling_price NUMERIC(10, 2),
    image_url TEXT
);

-- 4. Tech Packs Table (Design and Manufacturing Details)
CREATE TABLE IF NOT EXISTS tech_packs (
    tech_pack_id VARCHAR(255) PRIMARY KEY,
    style_number VARCHAR(255) REFERENCES finished_goods(style_number) ON DELETE CASCADE,
    fabric_details TEXT,
    construction TEXT,
    wash_instructions TEXT
);

-- 5. Sales Orders Table
CREATE TABLE IF NOT EXISTS sales_orders (
    order_number VARCHAR(255) PRIMARY KEY,
    buyer VARCHAR(255),
    style_number VARCHAR(255) REFERENCES finished_goods(style_number) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    shipment_date DATE,
    status VARCHAR(50) -- e.g., Confirmed, Shipped, Pending, Cancelled
);

-- 6. Sales Invoices Table
CREATE TABLE IF NOT EXISTS sales_invoices (
    invoice_number VARCHAR(255) PRIMARY KEY,
    sales_order VARCHAR(255) REFERENCES sales_orders(order_number) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_status VARCHAR(50) -- e.g., Paid, Pending, Partially Paid, Overdue
);
