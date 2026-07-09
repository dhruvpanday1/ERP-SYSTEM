import os
import io
import json
import requests
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
import pg8000
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

# Database Connection
def get_db_connection():
    return pg8000.connect(
        host=os.getenv("SUPABASE_DB_HOST"),
        database=os.getenv("SUPABASE_DB_NAME"),
        user=os.getenv("SUPABASE_DB_USER"),
        password=os.getenv("SUPABASE_DB_PASSWORD"),
        port=int(os.getenv("SUPABASE_DB_PORT", 6543)),
        ssl_context=True,
    )

# Download single image
def download_image(style_num, url):
    if not url:
        return style_num, None
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            return style_num, resp.content
    except Exception as e:
        print(f"[{style_num}] Failed to download: {e}")
    return style_num, None

def main():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT style_number, style_name, category, fabric, color, image_url FROM finished_goods")
    items = cursor.fetchall()
    conn.close()

    print(f"Loaded {len(items)} items from finished_goods table.")

    # Step 1: Download images in parallel
    print("Downloading images in parallel...")
    image_data_map = {}
    
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(download_image, item[0], item[5]): item for item in items}
        for i, future in enumerate(as_completed(futures)):
            style_num, img_bytes = future.result()
            if img_bytes:
                image_data_map[style_num] = img_bytes
            if (i + 1) % 100 == 0:
                print(f"Downloaded {i + 1}/{len(items)} images...")

    # Step 2: Load CLIP Model
    print("Loading CLIP model 'openai/clip-vit-base-patch32'...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    print(f"CLIP Model loaded on {device}")

    # Step 3: Compute embeddings sequentially on CPU/GPU
    print("Computing embeddings...")
    embeddings_cache = {}
    
    for idx, item in enumerate(items):
        style_num, style_name, category, fabric, color, image_url = item
        desc = f"{style_name} {color} {category} fabric {fabric}"
        img_bytes = image_data_map.get(style_num)
        
        embedding = None
        if img_bytes:
            try:
                image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                inputs = processor(images=image, return_tensors="pt").to(device)
                with torch.no_grad():
                    out = model.get_image_features(**inputs)
                    feat = out.pooler_output if hasattr(out, 'pooler_output') else out
                    feat = feat / feat.norm(p=2, dim=-1, keepdim=True)
                    embedding = feat[0].cpu().numpy().tolist()
            except Exception as e:
                print(f"[{style_num}] Image embedding failed: {e}")

        # Fallback to Text Embedding if image download or embedding failed
        if embedding is None:
            try:
                inputs = processor(text=[desc], return_tensors="pt", padding=True, truncation=True).to(device)
                with torch.no_grad():
                    out = model.get_text_features(**inputs)
                    feat = out.pooler_output if hasattr(out, 'pooler_output') else out
                    feat = feat / feat.norm(p=2, dim=-1, keepdim=True)
                    embedding = feat[0].cpu().numpy().tolist()
            except Exception as e:
                print(f"[{style_num}] Text fallback embedding failed: {e}")

        if embedding is not None:
            embeddings_cache[style_num] = embedding
            
        if (idx + 1) % 100 == 0:
            print(f"Embedded {idx + 1}/{len(items)} products...")

    # Step 4: Save to file
    out_path = os.path.join(os.path.dirname(__file__), "garment_embeddings.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(embeddings_cache, f)
    
    print(f"Successfully precomputed and saved {len(embeddings_cache)} embeddings to {out_path}")

if __name__ == "__main__":
    main()
