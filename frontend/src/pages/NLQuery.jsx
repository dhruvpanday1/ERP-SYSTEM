import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Code2,
  Table2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from 'lucide-react';
import { sampleConversations, suggestedQueries } from '../data/mockData';
import { askQuestion } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// Override with queries that work against the REAL database tables
const REAL_SUGGESTED_QUERIES = [
  "Show top 5 buyers by total order value",
  "List all shipped orders",
  "Show all suppliers with their ratings",
  "Which products have GSM above 200?",
  "Show pending and overdue invoices with order details",
  "What is the total revenue from all orders?",
];


function SQLBlock({ sql, isOpen, onToggle }) {
  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-surface-100 bg-white shadow-soft">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-4 py-2.5 bg-surface-50 hover:bg-surface-100 transition-colors text-left"
      >
        <Code2 className="w-4 h-4 text-primary-500" />
        <span className="text-xs font-semibold text-primary-600">Generated SQL Query</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-surface-400 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 text-surface-400 ml-auto" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-surface-900 animate-fade-in">
          <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">{sql}</pre>
        </div>
      )}
    </div>
  );
}

function ResultsTable({ results }) {
  if (!results || results.length === 0) return null;
  const columns = Object.keys(results[0]);

  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-surface-100 bg-white shadow-soft">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-50">
        <Table2 className="w-4 h-4 text-coral-500" />
        <span className="text-xs font-semibold text-coral-600">Query Results</span>
        <span className="text-[10px] text-surface-400 ml-auto font-medium">{results.length} row{results.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50/50">
              {columns.map((col) => (
                <th key={col} className="text-left text-[10px] font-bold text-surface-400 uppercase tracking-wider px-4 py-2.5">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => (
              <tr key={i} className="border-b border-surface-50 hover:bg-primary-50/30 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2.5 text-xs text-surface-700 font-medium whitespace-nowrap">{row[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DynamicChart({ results }) {
  if (!results || results.length === 0) return null;
  const columns = Object.keys(results[0]);
  if (columns.length < 2) return null; // Need at least two columns

  // Find one string column (X) and one numeric column (Y)
  let xCol = null;
  let yCol = null;
  
  // basic heuristic: check first row
  for (const col of columns) {
    const val = results[0][col];
    if (typeof val === 'number' && !col.endsWith('_id') && col !== 'id') {
      if (!yCol) yCol = col;
    } else if (typeof val === 'string') {
      if (!xCol && col !== 'id' && !col.endsWith('_id') && !col.includes('url')) xCol = col;
    }
  }
  
  // If we couldn't find a clear X and Y, or if too many rows, don't render a chart
  if (!xCol || !yCol || results.length > 50) return null;
  
  // Format data for chart
  const data = results.map(row => ({
    name: row[xCol] ? row[xCol].toString().substring(0, 15) : 'Unknown',
    value: Number(row[yCol]) || 0
  }));
  
  const colors = ["#8b5cf6", "#f43f5e", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899"];

  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-surface-100 bg-white shadow-soft p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
          Chart: {yCol.replace(/_/g, ' ')} by {xCol.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(1)+'k' : val} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function NLQuery() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [openSqlBlocks, setOpenSqlBlocks] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const chatEndRef = useRef(null);
  const queryIndex = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleSql = (msgId) => {
    setOpenSqlBlocks((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async (queryText) => {
    const text = queryText || input.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), type: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Try calling the FastAPI backend via centralized service
      const data = await askQuestion(text, (statusMsg) => {
        setLoadingStatus(statusMsg);
      });

      const aiMsg = {
        id: Date.now() + 1,
        type: 'ai',
        text: `Found ${data.data.length} result${data.data.length !== 1 ? 's' : ''} for your query:`,
        sql: data.sql,
        results: data.data,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setOpenSqlBlocks((prev) => ({ ...prev, [aiMsg.id]: true }));

    } catch (err) {
      console.error('Failed to fetch from backend:', err);
      const aiMsg = {
        id: Date.now() + 1,
        type: 'ai',
        text: `Error: Could not get a response from the backend. Please make sure the server is running. (${err.message})`,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] animate-fade-in">
      {/* Chat Area */}
      <div className="flex-1 premium-card flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #f43f5e)' }}>
                <Sparkles className="w-9 h-9 text-white relative z-10" />
              </div>
              <h3 className="text-xl font-extrabold text-surface-900 tracking-tight mb-2" style={{ letterSpacing: '-0.03em' }}>
                Ask anything about your data
              </h3>
              <p className="text-sm text-surface-400 max-w-md mb-8 leading-relaxed">
                I'll translate your business questions into SQL queries, fetch the results, and present them in a clean format.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                {REAL_SUGGESTED_QUERIES.slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="flex items-start gap-2.5 px-4 py-3.5 rounded-2xl bg-surface-50 border border-surface-100 hover:border-primary-200 hover:bg-primary-50/30 text-left transition-all duration-300 group hover:shadow-soft"
                    id={`suggested-query-${i}`}
                  >
                    <Zap className="w-4 h-4 text-primary-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-surface-600 leading-relaxed font-medium">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              {msg.type === 'ai' && (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`max-w-[75%] ${msg.type === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`rounded-2xl px-5 py-3.5 ${
                    msg.type === 'user'
                      ? 'text-white shadow-lg ml-auto'
                      : 'bg-surface-50 border border-surface-100 text-surface-700'
                  }`}
                  style={msg.type === 'user' ? { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' } : {}}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                {msg.type === 'ai' && msg.sql && (
                  <SQLBlock sql={msg.sql} isOpen={openSqlBlocks[msg.id]} onToggle={() => toggleSql(msg.id)} />
                )}
                {msg.type === 'ai' && msg.results && (
                  <>
                    <ResultsTable results={msg.results} />
                    <DynamicChart results={msg.results} />
                  </>
                )}
              </div>
              {msg.type === 'user' && (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 bg-surface-100">
                  <User className="w-4 h-4 text-surface-500" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-start animate-fade-in">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-surface-50 border border-surface-100 rounded-2xl px-5 py-3 text-sm text-surface-600 flex items-center gap-3 shadow-sm">
                <div className="flex gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="font-medium animate-pulse">{loadingStatus || 'Thinking...'}</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-surface-100 bg-white">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your data..."
                rows={1}
                className="input-field resize-none !rounded-2xl !pr-4 min-h-[48px] max-h-[120px] !border-surface-200 !bg-surface-50"
                id="nl-query-input"
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="btn-primary !p-3.5 !rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed disabled:!shadow-none disabled:!transform-none"
              id="nl-query-send"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-surface-300 mt-2 text-center font-medium">
            AI translates your questions to SQL and returns structured results
          </p>
        </div>
      </div>
    </div>
  );
}
