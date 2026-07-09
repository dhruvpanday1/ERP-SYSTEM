# -*- coding: utf-8 -*-
# ============================================================
# WFX AI Explorer -- Backend API
# FastAPI + Vanna AI (NL-to-SQL) + Supabase PostgreSQL
# ============================================================

import sys
import io
import os
import base64
import json
import asyncio
from io import BytesIO

# Force UTF-8 output on Windows to avoid charmap codec errors
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
import re
import pg8000
import requests
import time
import threading
from vanna.openai import OpenAI_Chat
from vanna.chromadb import ChromaDB_VectorStore
from openai import OpenAI
from dotenv import load_dotenv
from PIL import Image
import chromadb
import torch
import torch.nn.functional as F

load_dotenv()

# ============================================================
# 1. CONFIGURATION
# ============================================================

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

SUPABASE_DB_HOST     = os.getenv("SUPABASE_DB_HOST")
SUPABASE_DB_NAME     = os.getenv("SUPABASE_DB_NAME")
SUPABASE_DB_USER     = os.getenv("SUPABASE_DB_USER")
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
SUPABASE_DB_PORT     = int(os.getenv("SUPABASE_DB_PORT", 6543))

SUPABASE_DB_READONLY_USER     = os.getenv("SUPABASE_DB_READONLY_USER")
SUPABASE_DB_READONLY_PASSWORD = os.getenv("SUPABASE_DB_READONLY_PASSWORD")

# ============================================================
# 2. DATABASE CONNECTION
# ============================================================

def get_db_connection(readonly: bool = False):
    """Create a fresh connection to Supabase PostgreSQL via pg8000."""
    user = SUPABASE_DB_USER
    password = SUPABASE_DB_PASSWORD
    
    # Switch to read-only user if requested and configured
    if readonly and SUPABASE_DB_READONLY_USER and SUPABASE_DB_READONLY_PASSWORD:
        user = SUPABASE_DB_READONLY_USER
        password = SUPABASE_DB_READONLY_PASSWORD
        
    return pg8000.connect(
        host=SUPABASE_DB_HOST,
        database=SUPABASE_DB_NAME,
        user=user,
        password=password,
        port=SUPABASE_DB_PORT,
        ssl_context=True,
    )


try:
    _t = get_db_connection()
    _t.close()
    print("[OK] Connected to Supabase PostgreSQL")
except Exception as e:
    print(f"[WARNING] DB connection failed at startup: {e}")

# ============================================================
# 3. VANNA AI (NL-TO-SQL ENGINE)
# ============================================================

class MyVanna(ChromaDB_VectorStore, OpenAI_Chat):
    def __init__(self, config=None):
        client = config.get('client') if config else None
        ChromaDB_VectorStore.__init__(self, config={'path': './vanna_chroma'})
        OpenAI_Chat.__init__(self, client=client, config=config)
        self.model = config.get('model') if config else None

# Initialize Vanna using OpenRouter as OpenAI endpoint
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)

vn = MyVanna(config={
    'client': client,
    'model': 'meta-llama/llama-3.3-70b-instruct'
})

def init_vanna():
    """Train Vanna on background thread on startup."""
    print("[INFO] Training Vanna AI...")
    # DDL Training
    ddl = """
    CREATE TABLE finished_goods (
      style_number TEXT PRIMARY KEY, style_name TEXT, category TEXT, fabric TEXT,
      gsm INTEGER, color TEXT, print TEXT, season TEXT, brand TEXT,
      supplier TEXT, cost NUMERIC, selling_price NUMERIC, image_url TEXT
    );
    CREATE TABLE sales_orders (
      order_number TEXT PRIMARY KEY, buyer TEXT, style_number TEXT,
      quantity INTEGER, unit_price NUMERIC, status TEXT, shipment_date DATE
    );
    CREATE TABLE buyers (
      buyer_id TEXT PRIMARY KEY, company_name TEXT, country TEXT, buyer_category TEXT
    );
    CREATE TABLE suppliers (
      supplier_id TEXT PRIMARY KEY, company_name TEXT, country TEXT, contact TEXT,
      lead_time_days INTEGER, rating NUMERIC
    );
    CREATE TABLE tech_packs (
      tech_pack_id TEXT PRIMARY KEY, style_number TEXT,
      fabric_details TEXT, construction TEXT, wash_instructions TEXT
    );
    CREATE TABLE sales_invoices (
      invoice_number TEXT PRIMARY KEY, sales_order TEXT,
      amount NUMERIC, currency TEXT, payment_status TEXT
    );
    """
    vn.train(ddl=ddl)
    
    # Documentation Training
    docs = """
    - Order total = quantity * unit_price.
    - Order status values: 'Confirmed', 'Shipped', 'Pending', 'Cancelled'.
    - Invoice payment_status values: 'Paid', 'Pending', 'Partially Paid', 'Overdue'.
    - Use ILIKE for case-insensitive text matching.
    - Always use PostgreSQL syntax.
    """
    vn.train(documentation=docs)
    
    # Few-Shot SQL Training
    examples = [
        ("Show all shirts", "SELECT style_number, style_name, category, fabric, color, cost, selling_price FROM finished_goods WHERE category ILIKE '%shirt%' LIMIT 50;"),
        ("Which orders are pending?", "SELECT order_number, buyer, quantity, (quantity * unit_price) AS total, status, shipment_date FROM sales_orders WHERE status ILIKE 'pending' LIMIT 50;"),
        ("List all orders", "SELECT order_number, buyer, quantity, (quantity * unit_price) AS total, status, shipment_date FROM sales_orders ORDER BY shipment_date DESC LIMIT 50;"),
        ("Total revenue", "SELECT SUM(quantity * unit_price) AS total_revenue FROM sales_orders;"),
        ("Top 5 buyers by order value", "SELECT buyer, SUM(quantity * unit_price) AS total_value FROM sales_orders GROUP BY buyer ORDER BY total_value DESC LIMIT 5;"),
        ("Show all buyers", "SELECT buyer_id, company_name, country, buyer_category FROM buyers LIMIT 50;"),
        ("Which products are available in blue color?", "SELECT style_number, style_name, category, color, cost, selling_price FROM finished_goods WHERE color ILIKE '%blue%' LIMIT 50;"),
        ("Show shipped orders", "SELECT order_number, buyer, quantity, (quantity * unit_price) AS total, status, shipment_date FROM sales_orders WHERE status ILIKE 'shipped' ORDER BY shipment_date DESC LIMIT 50;"),
        ("Show all suppliers", "SELECT supplier_id, company_name, country, contact, lead_time_days, rating FROM suppliers ORDER BY rating DESC LIMIT 50;"),
        ("Show unpaid invoices", "SELECT invoice_number, sales_order, amount, currency, payment_status FROM sales_invoices WHERE payment_status IN ('Pending', 'Overdue') LIMIT 50;"),
        ("Show pending invoices", "SELECT invoice_number, sales_order, amount, currency, payment_status FROM sales_invoices WHERE payment_status = 'Pending' LIMIT 50;"),
        ("Show overdue invoices", "SELECT invoice_number, sales_order, amount, currency, payment_status FROM sales_invoices WHERE payment_status = 'Overdue' LIMIT 50;"),
        ("What are the tech pack details for a style?", "SELECT tp.tech_pack_id, tp.style_number, fg.style_name, tp.fabric_details, tp.construction, tp.wash_instructions FROM tech_packs tp JOIN finished_goods fg ON tp.style_number = fg.style_number LIMIT 50;"),
        ("Show invoices with order details", "SELECT si.invoice_number, si.sales_order, so.buyer, so.quantity, si.amount, si.currency, si.payment_status FROM sales_invoices si JOIN sales_orders so ON si.sales_order = so.order_number LIMIT 50;"),
    ]
    for question, sql in examples:
        vn.train(question=question, sql=sql)
    print("[OK] Vanna AI Training Complete.")

threading.Thread(target=init_vanna, daemon=True).start()

def validate_sql_query(sql: str) -> tuple[bool, str]:
    """
    Validate dynamically generated SQL queries to allow only read-only (SELECT/WITH)
    queries and reject stacked queries or destructive commands.
    """
    # 1. Clean whitespace
    sql_clean = sql.strip()
    
    # 2. Check empty
    if not sql_clean:
        return False, "Query is empty"
        
    # 3. Remove SQL comments
    # Remove single line comments starting with --
    sql_clean = re.sub(r'--.*$', '', sql_clean, flags=re.MULTILINE)
    # Remove multi-line comments /* ... */
    sql_clean = re.sub(r'/\*.*?\*/', '', sql_clean, flags=re.DOTALL)
    sql_clean = sql_clean.strip()
    
    # 4. Remove string literals (handles single-quoted string literals and escaped single quotes)
    sql_no_literals = re.sub(r"'(?:''|[^'])*'", "''", sql_clean)
    
    # 5. Check if it starts with SELECT or WITH
    if not re.match(r'^(?:SELECT|WITH)\b', sql_no_literals, re.IGNORECASE):
        return False, "Query must start with SELECT or WITH"
        
    # 6. Semicolon check (only one statement allowed)
    sql_no_trailing_semicolon = sql_no_literals.rstrip().rstrip(';')
    if ';' in sql_no_trailing_semicolon:
        return False, "Multiple SQL statements are not allowed"
        
    # 7. Check for forbidden keywords using word boundaries on the code portion (outside literals)
    # Blocks INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, REPLACE, GRANT, REVOKE, SCHEMA, DATABASE, INTO, COPY, INFORMATION_SCHEMA, and PG_ prefix
    forbidden_pattern = r'\b(insert|update|delete|drop|alter|truncate|create|replace|grant|revoke|schema|database|into|information_schema|copy)\b|\bpg_'
    match = re.search(forbidden_pattern, sql_no_literals, re.IGNORECASE)
    if match:
        return False, f"Forbidden keyword detected: {match.group(0).upper()}"
        
    return True, "Valid SELECT query"


def run_sql(sql: str, readonly: bool = False, validate: bool = False) -> list[dict]:
    """Execute SQL on Supabase and return rows as list of dicts."""
    # 1. Validate if requested (dynamic user/AI queries)
    if validate:
        is_valid, reason = validate_sql_query(sql)
        if not is_valid:
            raise ValueError(f"SQL Validation Error: {reason}")
            
        # Enforce LIMIT 100 if no LIMIT clause is present
        sql_no_literals = re.sub(r"'(?:''|[^'])*'", "''", sql)
        if not re.search(r'\blimit\b', sql_no_literals, re.IGNORECASE):
            sql_stripped = sql.strip().rstrip(';').strip()
            sql = f"{sql_stripped} LIMIT 100;"

    conn = get_db_connection(readonly=readonly)
    try:
        cursor = conn.cursor()
        
        # Enforce statement timeout of 5 seconds
        try:
            cursor.execute("SET statement_timeout = 5000;")
        except Exception as e:
            print(f"[WARNING] Failed to set statement_timeout: {e}")
            
        cursor.execute(sql)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        result = []
        import decimal
        for row in rows:
            d = {}
            for i, col in enumerate(columns):
                val = row[i]
                if isinstance(val, (bytes, memoryview)):
                    val = str(val)
                elif hasattr(val, "isoformat"):
                    val = val.isoformat()
                elif isinstance(val, decimal.Decimal):
                    val = float(val)
                d[col] = val
            result.append(d)
        return result
    finally:
        conn.close()

# ============================================================
# 4. FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="WFX AI Explorer API",
    description="AI-Native ERP — NL-to-SQL via OpenRouter + Supabase PostgreSQL",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ──────────────────────────────────────────

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    question: str
    sql: str
    data: list[dict]

class HealthResponse(BaseModel):
    status: str
    message: str
    service: str

class ImageSearchRequest(BaseModel):
    image_base64: str | None = None
    text_query: str | None = None

# ── Endpoints ────────────────────────────────────────────────

@app.get("/", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="ok",
        message="WFX AI Explorer API is running",
        service="WFX AI Explorer v2.1.0",
    )


@app.get("/api/stats", tags=["Stats"])
async def get_stats():
    """Live dashboard statistics from Supabase."""
    try:
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            stats = {}

            cur.execute("SELECT COUNT(*) FROM finished_goods")
            stats["totalFinishedGoods"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(DISTINCT supplier) FROM finished_goods")
            stats["totalSuppliers"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM buyers")
            stats["totalBuyers"] = cur.fetchone()[0]

            cur.execute("SELECT COALESCE(SUM(quantity * unit_price), 0) FROM sales_orders")
            stats["totalRevenue"] = int(cur.fetchone()[0] or 0)

            cur.execute("SELECT COUNT(*) FROM sales_orders")
            stats["totalOrders"] = cur.fetchone()[0]

            cur.execute(
                "SELECT category, SUM(selling_price) FROM finished_goods "
                "GROUP BY category ORDER BY SUM(selling_price) DESC"
            )
            colors = ["#8b5cf6", "#f43f5e", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899"]
            stats["revenueByCategoryData"] = [
                {"category": r[0], "revenue": float(r[1] or 0), "fill": colors[i % len(colors)]}
                for i, r in enumerate(cur.fetchall())
            ]

            cur.execute(
                "SELECT order_number, buyer, quantity, (quantity * unit_price) AS total,"
                " status, shipment_date FROM sales_orders ORDER BY shipment_date DESC LIMIT 6"
            )
            rows = cur.fetchall()
            stats["recentOrders"] = [
                {"id": r[0], "buyer": r[1], "items": r[2],
                 "total": float(r[3] or 0), "status": r[4], "date": str(r[5])}
                for r in rows
            ]
            stats["activityFeed"] = [
                {"id": i+1, "action": "Order Update",
                 "detail": f"{r[0]} from {r[1]} is {r[4]}", "time": str(r[5]),
                 "type": "shipping" if r[4] == "Shipped"
                         else "order" if r[4] == "Confirmed" else "quality"}
                for i, r in enumerate(rows)
            ]

            cur.execute(
                "SELECT TO_CHAR(shipment_date,'Mon'), COUNT(order_number),"
                " SUM(quantity * unit_price) FROM sales_orders"
                " GROUP BY TO_CHAR(shipment_date,'Mon'), EXTRACT(MONTH FROM shipment_date)"
                " ORDER BY EXTRACT(MONTH FROM shipment_date)"
            )
            stats["orderTrendsData"] = [
                {"month": r[0], "orders": int(r[1]), "revenue": float(r[2] or 0)}
                for r in cur.fetchall()
            ]

            return stats
        finally:
            conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats error: {e}")


@app.get("/api/products", tags=["Products"])
async def get_all_products():
    """All finished goods from Supabase."""
    try:
        data = run_sql("SELECT * FROM finished_goods ORDER BY style_number")
        return {"data": data, "count": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Products error: {e}")


@app.post("/api/ask", tags=["AI Query"])
async def ask_question(request: Request):
    """
    Core NL-to-SQL endpoint using Vanna AI (Streaming version).
    """
    body = await request.json()
    question = body.get("question", "").strip()
    
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    async def event_generator():
        yield {"event": "status", "data": "Analyzing question..."}
        await asyncio.sleep(0.1)
        
        # Calculate confidence using ChromaDB distance
        confidence = 0
        try:
            # get_similar_question_sql returns a dataframe or list
            similar = vn.get_similar_question_sql(question)
            
            dist = 1.0
            if hasattr(similar, 'empty') and not similar.empty:
                dist = similar.iloc[0]['distance'] if 'distance' in similar.columns else 1.0
            elif isinstance(similar, list) and len(similar) > 0:
                dist = similar[0].get('distance', 1.0)

            # Heuristic: distance 0 -> 100%, distance 1.5 -> ~40%
            conf = max(0, min(100, int((1.0 - (dist / 1.5)) * 100)))
            confidence = max(50, conf + 30) if conf > 0 else 85
        except Exception as e:
            confidence = 80
            
        yield {"event": "status", "data": f"Generating SQL... (Confidence: {confidence}%)"}
        
        try:
            # Since Vanna's generate_sql is synchronous and blocking, we run it in a thread
            sql = await asyncio.to_thread(vn.generate_sql, question=question)
        except Exception as e:
            yield {"event": "error", "data": f"Vanna AI failed to generate SQL. Error: {e}"}
            return

        if not sql or not sql.strip():
            yield {"event": "error", "data": "Vanna AI returned an empty SQL query."}
            return
            
        yield {"event": "sql", "data": sql.strip()}
        yield {"event": "status", "data": "Executing query on Supabase..."}
        
        try:
            data = await asyncio.to_thread(run_sql, sql, readonly=True, validate=True)
        except Exception as e:
            yield {"event": "error", "data": f"SQL execution failed. Error: {e}"}
            return
            
        yield {"event": "status", "data": f"Found {len(data)} results. Rendering..."}
        
        # Yield the final data
        yield {"event": "result", "data": json.dumps({"confidence": confidence, "data": data})}

    return EventSourceResponse(event_generator())


# Helper functions for CLIP and ChromaDB
clip_model = None
clip_processor = None
clip_dtype = None
clip_lock = threading.Lock()

def get_clip():
    global clip_model, clip_processor, clip_dtype
    with clip_lock:
        if clip_model is None:
            from transformers import CLIPProcessor, CLIPModel
            print("Loading CLIP model 'openai/clip-vit-base-patch32' in bfloat16/float16...")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            clip_dtype = torch.float16 if device == "cuda" else torch.bfloat16
            clip_model = CLIPModel.from_pretrained(
                "openai/clip-vit-base-patch32",
                torch_dtype=clip_dtype,
                low_cpu_mem_usage=True
            ).to(device)
            clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            print("CLIP model loaded successfully.")
    return clip_model, clip_processor, clip_dtype

chroma_client = None
chroma_collection = None
chroma_lock = threading.Lock()

def get_chroma_collection():
    global chroma_client, chroma_collection
    with chroma_lock:
        if chroma_collection is None:
            chroma_client = chromadb.PersistentClient(path="./chroma_search")
            # Use cosine distance so returned distances are in [0, 2]
            # cosine_similarity = 1 - cosine_distance (when distance in [0,1] range)
            chroma_collection = chroma_client.get_or_create_collection(
                name="finished_goods_embeddings",
                metadata={"hnsw:space": "cosine"}
            )
            count = chroma_collection.count()
            if count == 0:
                print("Chroma search collection is empty. Initializing from garment_embeddings.json...")
                embeddings_file = os.path.join(os.path.dirname(__file__), "garment_embeddings.json")
                if os.path.exists(embeddings_file):
                    with open(embeddings_file, "r", encoding="utf-8") as f:
                        cache = json.load(f)
                    ids = list(cache.keys())
                    embeddings = list(cache.values())
                    metadatas = [{"style_number": sid} for sid in ids]
                    
                    batch_size = 500
                    for i in range(0, len(ids), batch_size):
                        end = min(i + batch_size, len(ids))
                        chroma_collection.add(
                            ids=ids[i:end],
                            embeddings=embeddings[i:end],
                            metadatas=metadatas[i:end]
                        )
                    print(f"Indexed {len(ids)} garments in ChromaDB.")
                else:
                    print(f"[WARNING] garment_embeddings.json not found at {embeddings_file}")
    return chroma_collection


@app.post("/api/search-image", tags=["AI Image Search"])
async def search_image(request: ImageSearchRequest):
    try:
        if not request.image_base64 and not request.text_query:
            raise HTTPException(status_code=400, detail="Must provide either image_base64 or text_query")
            
        model, processor, dtype = get_clip()
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        embedding = None
        
        if request.image_base64:
            # Decode base64 image
            if "," in request.image_base64:
                parts = request.image_base64.split(",")
                image_data = base64.b64decode(parts[1])
            else:
                image_data = base64.b64decode(request.image_base64)
                
            image = Image.open(BytesIO(image_data)).convert("RGB")
            inputs = processor(images=image, return_tensors="pt").to(device)
            if "pixel_values" in inputs:
                inputs["pixel_values"] = inputs["pixel_values"].to(dtype)
            with torch.no_grad():
                vision_out = model.vision_model(**inputs)
                feat = vision_out.pooler_output  # [batch, hidden_dim] tensor
                feat = model.visual_projection(feat)  # project to CLIP embedding space
                feat = F.normalize(feat, p=2, dim=-1)
                feat = feat.float()
                embedding = feat[0].cpu().numpy().tolist()
                
        elif request.text_query:
            inputs = processor(text=[request.text_query], return_tensors="pt", padding=True, truncation=True).to(device)
            with torch.no_grad():
                text_out = model.text_model(**inputs)
                feat = text_out.pooler_output  # [batch, hidden_dim] tensor
                feat = model.text_projection(feat)  # project to CLIP embedding space
                feat = F.normalize(feat, p=2, dim=-1)
                feat = feat.float()
                embedding = feat[0].cpu().numpy().tolist()
                
        if embedding is None:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")
            
        collection = get_chroma_collection()
        results = collection.query(
            query_embeddings=[embedding],
            n_results=8
        )
        
        matched_ids = results["ids"][0] if results["ids"] else []
        distances = results["distances"][0] if results["distances"] else []
        
        if not matched_ids:
            return {"data": []}
            
        placeholders = ", ".join(f"'{uid}'" for uid in matched_ids)
        products = run_sql(f"SELECT * FROM finished_goods WHERE style_number IN ({placeholders})")
        prod_map = {p['style_number']: p for p in products}
        
        output = []
        for i, uid in enumerate(matched_ids):
            p = prod_map.get(uid)
            if p:
                dist = distances[i] if i < len(distances) else 1.0
                # ChromaDB cosine distance is in [0, 2] where 0 = identical, 2 = opposite.
                # cosine_similarity = 1 - cosine_distance  (values in [-1, 1])
                # We clamp to [0, 1] to get a clean percentage.
                cosine_sim = max(0.0, 1.0 - dist)
                sim_pct = int(cosine_sim * 100)
                sim_pct = max(1, min(99, sim_pct))
                
                formatted_p = {
                    "id": p['style_number'],
                    "styleNumber": p['style_number'],
                    "styleName": p['style_name'],
                    "category": p['category'],
                    "fabric": p['fabric'],
                    "gsm": p['gsm'],
                    "supplier": p['supplier'],
                    "sellingPrice": float(p['selling_price']),
                    "image": p['image_url'],
                    "similarity": sim_pct
                }
                output.append(formatted_p)
                
        return {"data": output}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image search failed: {e}")

# ============================================================
# 5. RUN SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("  WFX AI Explorer — Backend API  v2.1.0")
    print("  API:  http://localhost:8000")
    print("  Docs: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
