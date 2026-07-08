# -*- coding: utf-8 -*-
"""
seed_invoices.py
~~~~~~~~~~~~~~~~
Seeds the sales_invoices table with realistic invoice data
derived from existing sales_orders in the Supabase database.
"""

import os
from dotenv import load_dotenv
import pg8000
import random

load_dotenv()

SUPABASE_DB_HOST     = os.environ.get('SUPABASE_DB_HOST')
SUPABASE_DB_NAME     = os.environ.get('SUPABASE_DB_NAME')
SUPABASE_DB_USER     = os.environ.get('SUPABASE_DB_USER')
SUPABASE_DB_PASSWORD = os.environ.get('SUPABASE_DB_PASSWORD')
SUPABASE_DB_PORT     = int(os.environ.get('SUPABASE_DB_PORT', 6543))

PAYMENT_STATUSES = ["Paid", "Unpaid", "Partially Paid"]
CURRENCIES       = ["USD", "EUR", "GBP", "AUD"]

def main():
    print("Connecting to Supabase PostgreSQL...")
    conn = pg8000.connect(
        host=SUPABASE_DB_HOST,
        database=SUPABASE_DB_NAME,
        user=SUPABASE_DB_USER,
        password=SUPABASE_DB_PASSWORD,
        port=SUPABASE_DB_PORT,
        ssl_context=True,
    )
    cur = conn.cursor()

    # Check existing invoice count
    cur.execute("SELECT COUNT(*) FROM sales_invoices")
    existing = cur.fetchone()[0]
    print(f"Existing invoices: {existing}")

    if existing > 0:
        print("Invoices already seeded! Showing payment status distribution:")
        cur.execute("SELECT payment_status, COUNT(*) FROM sales_invoices GROUP BY payment_status ORDER BY payment_status")
        for row in cur.fetchall():
            print(f"  [{row[0]}] -> {row[1]} rows")
        conn.close()
        return

    # Fetch all sales orders
    cur.execute("SELECT order_number, quantity, unit_price FROM sales_orders")
    orders = cur.fetchall()
    print(f"Found {len(orders)} sales orders. Generating invoices...")

    invoices = []
    random.seed(42)  # reproducible

    for i, (order_number, quantity, unit_price) in enumerate(orders):
        invoice_number = f"INV-{str(i + 1).zfill(5)}"
        amount = round(float(quantity or 0) * float(unit_price or 0), 2)

        # Weighted distribution: ~40% Paid, ~40% Unpaid, ~20% Partially Paid
        status = random.choices(
            PAYMENT_STATUSES,
            weights=[40, 40, 20],
            k=1
        )[0]

        currency = random.choice(CURRENCIES)
        invoices.append((invoice_number, order_number, amount, currency, status))

    # Insert in batches
    batch_size = 500
    total_inserted = 0
    for start in range(0, len(invoices), batch_size):
        batch = invoices[start:start + batch_size]
        # Build parameterized insert
        values_sql = ", ".join(["(%s, %s, %s, %s, %s)"] * len(batch))
        flat_params = [item for row in batch for item in row]
        cur.execute(
            f"INSERT INTO sales_invoices (invoice_number, sales_order, amount, currency, payment_status) VALUES {values_sql} ON CONFLICT (invoice_number) DO NOTHING",
            flat_params,
        )
        total_inserted += len(batch)
        print(f"  Inserted batch: {start} - {start + len(batch)} ({total_inserted} total)")

    conn.commit()
    print(f"\n✅ Seeded {total_inserted} invoices successfully!")

    # Verify
    cur.execute("SELECT payment_status, COUNT(*) FROM sales_invoices GROUP BY payment_status ORDER BY payment_status")
    print("\nPayment status distribution:")
    for row in cur.fetchall():
        print(f"  [{row[0]}] -> {row[1]} rows")

    conn.close()

if __name__ == "__main__":
    main()
