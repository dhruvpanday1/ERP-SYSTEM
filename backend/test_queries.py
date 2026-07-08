import os
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

print("Testing recentOrders query:")
cursor.execute("SELECT order_number, buyer, quantity, (quantity * unit_price) as total, status, shipment_date FROM sales_orders ORDER BY shipment_date DESC LIMIT 6")
print(cursor.fetchall())

print("\nTesting orderTrendsData query:")
cursor.execute("SELECT TO_CHAR(shipment_date, 'Mon'), COUNT(order_number), SUM(quantity * unit_price) FROM sales_orders GROUP BY TO_CHAR(shipment_date, 'Mon'), EXTRACT(MONTH FROM shipment_date) ORDER BY EXTRACT(MONTH FROM shipment_date)")
print(cursor.fetchall())

conn.close()
