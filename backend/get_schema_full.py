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
tables = ['suppliers', 'buyers', 'finished_goods', 'tech_packs', 'sales_orders', 'sales_invoices']
for t in tables:
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name=%s ORDER BY ordinal_position", (t,))
    cols = cur.fetchall()
    print(f"\n=== {t} ===")
    for c in cols:
        print(f"  {c[0]}: {c[1]}")

# Also show sample data
print("\n\n=== SAMPLE DATA ===")
for t in tables:
    cur.execute(f"SELECT * FROM {t} LIMIT 2")
    rows = cur.fetchall()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name=%s ORDER BY ordinal_position", (t,))
    colnames = [r[0] for r in cur.fetchall()]
    print(f"\n--- {t} sample ---")
    for row in rows:
        print(dict(zip(colnames, row)))

conn.close()
