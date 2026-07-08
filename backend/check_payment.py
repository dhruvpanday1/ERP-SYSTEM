import os
from dotenv import load_dotenv
import pg8000

load_dotenv()

conn = pg8000.connect(
    host=os.environ.get('SUPABASE_DB_HOST'),
    database=os.environ.get('SUPABASE_DB_NAME'),
    user=os.environ.get('SUPABASE_DB_USER'),
    password=os.environ.get('SUPABASE_DB_PASSWORD'),
    port=int(os.environ.get('SUPABASE_DB_PORT', 6543)),
    ssl_context=True,
)
cur = conn.cursor()
cur.execute("SELECT DISTINCT payment_status, COUNT(*) FROM sales_invoices GROUP BY payment_status")
rows = cur.fetchall()
print("Actual payment_status values in DB:")
for r in rows:
    print(f"  [{r[0]}] -> {r[1]} rows")
conn.close()
