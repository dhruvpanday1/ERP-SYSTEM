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
    ssl_context=True
)
cursor = conn.cursor()
cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'finished_goods';")
print(cursor.fetchall())
conn.close()
