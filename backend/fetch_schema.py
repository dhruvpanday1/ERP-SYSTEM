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
cursor = conn.cursor()
for table in ['finished_goods', 'sales_orders', 'buyers']:
    print(f'\n=== {table} ===')
    cursor.execute(
        "SELECT column_name, data_type FROM information_schema.columns "
        "WHERE table_name = %s ORDER BY ordinal_position;",
        (table,)
    )
    for row in cursor.fetchall():
        print(f'  {row[0]} ({row[1]})')
conn.close()
