import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
import pg8000

load_dotenv()

SUPABASE_DB_HOST = os.environ.get('SUPABASE_DB_HOST')
SUPABASE_DB_NAME = os.environ.get('SUPABASE_DB_NAME')
SUPABASE_DB_USER = os.environ.get('SUPABASE_DB_USER')
SUPABASE_DB_PASSWORD = os.environ.get('SUPABASE_DB_PASSWORD')
SUPABASE_DB_PORT = int(os.environ.get('SUPABASE_DB_PORT', 6543))

conn = pg8000.connect(
    host=SUPABASE_DB_HOST,
    database=SUPABASE_DB_NAME,
    user=SUPABASE_DB_USER,
    password=SUPABASE_DB_PASSWORD,
    port=SUPABASE_DB_PORT,
    ssl_context=True,
)
cursor = conn.cursor()

for table in ['sales_orders', 'sales_invoices']:
    print(f"\nSchema for {table}:")
    cursor.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}';")
    cols = cursor.fetchall()
    for col in cols:
        print(f"  {col[0]} ({col[1]})")

    print(f"\nSample data for {table}:")
    cursor.execute(f"SELECT * FROM {table} LIMIT 2;")
    rows = cursor.fetchall()
    for row in rows:
        print(" ", row)

conn.close()
