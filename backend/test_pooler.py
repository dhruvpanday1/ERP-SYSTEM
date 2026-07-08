import os
from dotenv import load_dotenv
import pg8000

load_dotenv()

try:
    conn = pg8000.connect(
        host=os.environ.get('SUPABASE_DB_HOST', "aws-0-ap-south-1.pooler.supabase.com"),
        database=os.environ.get('SUPABASE_DB_NAME', "postgres"),
        user=os.environ.get('SUPABASE_DB_USER', "postgres.vcepakddhqblwepzjufy"),
        password=os.environ.get('SUPABASE_DB_PASSWORD'),
        port=int(os.environ.get('SUPABASE_DB_PORT', 6543)),
        ssl_context=True
    )
    print("Success: ap-south-1")
    conn.close()
except Exception as e:
    print("Error ap-south-1:", e)
