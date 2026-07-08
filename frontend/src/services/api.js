// ============================================================
// WFX AI Explorer — API Service Layer
// Connects frontend to FastAPI backend (which connects to Supabase)
// Falls back to mock data when backend is unavailable
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Check if the backend is running
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function askQuestion(question, onStatus = null) {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let sql = '';
  let finalData = null;

  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      buffer += decoder.decode(value, { stream: true });
    }
    
    buffer = buffer.replace(/\r\n/g, '\n');
    const parts = buffer.split('\n\n');
    
    if (done) {
      // Process the last part if there's no trailing newlines
      if (parts.length > 0 && parts[parts.length - 1].trim() !== '') {
        // Leave it in parts to be processed
      } else {
        parts.pop();
      }
      buffer = '';
    } else {
      buffer = parts.pop(); // keep the last incomplete part in the buffer
    }

    for (const part of parts) {
      let eventType = 'message';
      let data = '';
      const lines = part.split('\n');
      for (const line of lines) {
        if (line.startsWith('event: ')) eventType = line.substring(7);
        else if (line.startsWith('event:')) eventType = line.substring(6);
        else if (line.startsWith('data: ')) data += line.substring(6) + '\n';
        else if (line.startsWith('data:')) data += line.substring(5) + '\n';
      }
      data = data.trimEnd();

      if (eventType === 'status' && onStatus) {
        onStatus(data);
      } else if (eventType === 'sql') {
        sql = data;
      } else if (eventType === 'result') {
        try {
          finalData = JSON.parse(data);
        } catch(e) {
          console.error("Failed to parse result JSON", data);
        }
      } else if (eventType === 'error') {
        throw new Error(data);
      }
    }
    
    if (done) break;
  }

  return { sql, data: finalData?.data || [], confidence: finalData?.confidence || 0 };
}

/**
 * Fetch all finished goods from Supabase via backend
 */
export async function fetchFinishedGoods() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null; // Will use mock data as fallback
  }
}

/**
 * Fetch dashboard stats from Supabase via backend
 */
export async function fetchDashboardStats() {
  try {
    const res = await askQuestion('How many finished goods are there in total?');
    return res.data;
  } catch {
    return null;
  }
}
