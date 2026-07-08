import os
from dotenv import load_dotenv
load_dotenv()
import pg8000
conn = pg8000.connect(
    user=os.environ["SUPABASE_DB_USER"],
    password=os.environ["SUPABASE_DB_PASSWORD"],
    host=os.environ["SUPABASE_DB_HOST"],
    port=int(os.environ["SUPABASE_DB_PORT"]),
    database=os.environ["SUPABASE_DB_NAME"]
)
cur = conn.cursor()
cur.execute('SELECT count(*) FROM finished_goods WHERE gsm > 200')
print('Count with GSM > 200:', cur.fetchone()[0])
cur.execute('SELECT gsm FROM finished_goods LIMIT 10')
print('Sample GSMs:', cur.fetchall())
conn.close()
