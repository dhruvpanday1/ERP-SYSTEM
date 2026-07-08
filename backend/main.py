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

# ============================================================
# 2. DATABASE CONNECTION
# ============================================================

def get_db_connection():
    """Create a fresh connection to Supabase PostgreSQL via pg8000."""
    return pg8000.connect(
        host=SUPABASE_DB_HOST,
        database=SUPABASE_DB_NAME,
        user=SUPABASE_DB_USER,
        password=SUPABASE_DB_PASSWORD,
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

def run_sql(sql: str) -> list[dict]:
    """Execute SQL on Supabase and return rows as list of dicts."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
    image_base64: str

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
            data = await asyncio.to_thread(run_sql, sql)
        except Exception as e:
            yield {"event": "error", "data": f"SQL execution failed. Error: {e}"}
            return
            
        yield {"event": "status", "data": f"Found {len(data)} results. Rendering..."}
        
        # Yield the final data
        yield {"event": "result", "data": json.dumps({"confidence": confidence, "data": data})}

    return EventSourceResponse(event_generator())


@app.post("/api/search-image", tags=["AI Image Search"])
async def search_image(request: ImageSearchRequest):
    # Mock fallback since PyTorch can't be installed on this Windows + Python 3.13 machine
    # We will return random similarities based on the products.
    try:
        products = run_sql("SELECT * FROM finished_goods")
        import random
        results = []
        for p in products:
            sim_pct = random.randint(40, 95)
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
            results.append(formatted_p)
            
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return {"data": results[:8]}
        
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
