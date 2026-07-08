import os
from dotenv import load_dotenv
import pg8000

load_dotenv()

regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-central-1", "eu-west-1", "eu-west-2",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1",
    "sa-east-1", "ca-central-1"
]

found = False
for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    print(f"Testing {host}...")
    try:
        conn = pg8000.connect(
            host=host,
            database=os.environ.get('SUPABASE_DB_NAME', "postgres"),
            user=os.environ.get('SUPABASE_DB_USER', "postgres.vcepakddhqblwepzjufy"),
            password=os.environ.get('SUPABASE_DB_PASSWORD'),
            port=int(os.environ.get('SUPABASE_DB_PORT', 6543)),
            ssl_context=True,
            timeout=5
        )
        print(f"Success in region: {region}")
        conn.close()
        found = True
        break
    except Exception as e:
        if "timeout" in str(e).lower() or "not found" in str(e).lower():
            continue
        print(f"Error {region}:", e)
if not found:
    print("Not found in any region.")
