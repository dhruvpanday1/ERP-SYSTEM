import os
from dotenv import load_dotenv
import pg8000

load_dotenv()

try:
    conn = pg8000.connect(
        host=os.environ.get('SUPABASE_DB_HOST', "db.vcepakddhqblwepzjufy.supabase.co"),
        database=os.environ.get('SUPABASE_DB_NAME', "postgres"),
        user=os.environ.get('SUPABASE_DB_USER', "postgres"),
        password=os.environ.get('SUPABASE_DB_PASSWORD'),
        port=int(os.environ.get('SUPABASE_DB_PORT', 5432)),
        ssl_context=True,
    )
    print("Success")
    conn.close()
except Exception as e:
    print("Error:", e)
