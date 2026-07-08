import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Filter,
  Tag,
  Loader2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { finishedGoods as mockGoods, filterOptions } from '../data/mockData';

const ITEMS_PER_PAGE = 8;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Map PostgreSQL snake_case columns → camelCase used in the UI
const mapProduct = (p) => ({
  id: p.id,
  styleNumber: p.style_number,
  styleName: p.style_name,
  category: p.category,
  fabric: p.fabric,
  gsm: p.gsm,
  supplier: p.supplier,
  buyer: p.buyer,
  sellingPrice: Number(p.selling_price),
  color: p.color,
  print: p.print,
  season: p.season,
  image: p.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
});

export default function FinishedGoods() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('styleName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [seasonFilter, setSeasonFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Derive filter options dynamically from real data
  const liveCategories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))].filter(Boolean).sort();
    return ['All', ...cats];
  }, [products]);
  const liveSeasons = useMemo(() => {
    const s = [...new Set(products.map((p) => p.season))].filter(Boolean).sort();
    return ['All', ...s];
  }, [products]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const mapped = json.data.map(mapProduct);
        setProducts(mapped);
        setIsLive(true);
      } catch (err) {
        console.warn('Backend unavailable, using mock data:', err.message);
        setProducts(mockGoods);
        setError('Using offline demo data — backend unreachable');
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sortOptions = [
    { value: 'styleName', label: 'Style Name' },
    { value: 'sellingPrice', label: 'Price' },
    { value: 'gsm', label: 'GSM' },
    { value: 'styleNumber', label: 'Style Number' },
    { value: 'supplier', label: 'Supplier' },
  ];

  const filteredAndSorted = useMemo(() => {
    let items = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((p) =>
        p.styleName?.toLowerCase().includes(q) || p.styleNumber?.toLowerCase().includes(q) ||
        p.fabric?.toLowerCase().includes(q) || p.supplier?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'All') items = items.filter((p) => p.category === categoryFilter);
    if (seasonFilter !== 'All') items = items.filter((p) => p.season === seasonFilter);
    items.sort((a, b) => {
      let valA = a[sortBy], valB = b[sortBy];
      if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [products, searchQuery, categoryFilter, seasonFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredAndSorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const handleFilterChange = (setter) => (value) => { setter(value); setCurrentPage(1); };

  const categoryBadgeColors = {
    'Shirts': '#8b5cf6', 'T-Shirts': '#f43f5e', 'Pants': '#0ea5e9',
    'Outerwear': '#f59e0b', 'Dresses': '#ec4899', 'Accessories': '#10b981',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 animate-fade-in">
        <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
        <p className="text-sm font-medium text-surface-500">Loading from Supabase...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Live / offline badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
          isLive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}>
          <Database className="w-3 h-3" />
          {isLive ? `Live — Supabase (${products.length} records)` : 'Offline demo data'}
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertCircle className="w-3 h-3" /> {error}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="premium-card p-4 mb-6" id="fg-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input type="text" value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by style, fabric, supplier..."
              className="input-field !pl-10 !py-2.5 !text-sm !bg-surface-50 !border-surface-200" id="fg-search-input" />
          </div>

          <div className="w-px h-8 bg-surface-100 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-400" />
            <select value={categoryFilter} onChange={(e) => handleFilterChange(setCategoryFilter)(e.target.value)}
              className="select-field" id="fg-category-filter">
              {(isLive ? liveCategories : filterOptions.categories).map((cat) => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>

          <select value={seasonFilter} onChange={(e) => handleFilterChange(setSeasonFilter)(e.target.value)}
            className="select-field" id="fg-season-filter">
            {(isLive ? liveSeasons : filterOptions.seasons).map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Seasons' : s}</option>
            ))}
          </select>

          <div className="w-px h-8 bg-surface-100 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-surface-400" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select-field" id="fg-sort-select">
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
              ))}
            </select>
            <button onClick={() => setSortOrder((p) => p === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
              id="fg-sort-order-btn">
              <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="ml-auto text-xs text-surface-400 font-medium">
            <span className="text-surface-900 font-bold">{filteredAndSorted.length}</span> products
          </div>
        </div>
      </div>

      {/* Product Gallery */}
      {paginatedItems.length === 0 ? (
        <div className="premium-card p-16 text-center">
          <Package className="w-12 h-12 text-surface-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-surface-700 mb-2">No products found</h3>
          <p className="text-sm text-surface-400">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-stagger">
          {paginatedItems.map((product) => {
            const catColor = categoryBadgeColors[product.category] || '#8892a6';
            return (
              <div key={product.id} className="premium-card overflow-hidden group cursor-pointer" id={`fg-product-${product.id}`}>
                <div className="relative h-56 overflow-hidden">
                  <img src={product.image} alt={product.styleName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop'; }} />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="badge backdrop-blur-md bg-white/90 shadow-sm text-[10px]" style={{ color: catColor }}>{product.season}</span>
                    <span className="badge backdrop-blur-md bg-white/90 shadow-sm text-[10px]" style={{ color: catColor }}>{product.category}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Tag className="w-3 h-3 text-primary-400" />
                    <p className="text-[11px] font-mono font-bold tracking-wider" style={{ color: catColor }}>{product.styleNumber}</p>
                  </div>
                  <h4 className="text-[15px] font-bold text-surface-900 mb-4 group-hover:text-primary-600 transition-colors leading-snug" style={{ letterSpacing: '-0.02em' }}>
                    {product.styleName}
                  </h4>
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-surface-400 uppercase tracking-wider font-bold">Fabric</span>
                      <span className="text-xs text-surface-700 font-semibold">{product.fabric}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-surface-400 uppercase tracking-wider font-bold">GSM</span>
                      <span className="text-xs text-surface-700 font-semibold">{product.gsm}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-surface-400 uppercase tracking-wider font-bold">Supplier</span>
                      <span className="text-xs text-surface-700 font-semibold">{product.supplier}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-surface-100 flex items-center justify-between">
                    <span className="text-[10px] text-surface-400 uppercase tracking-wider font-bold">Selling Price</span>
                    <span className="text-xl font-extrabold gradient-text" style={{ letterSpacing: '-0.04em' }}>
                      ₹{product.sellingPrice?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8" id="fg-pagination">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="btn-secondary flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed" id="fg-prev-page">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-xl text-sm font-bold transition-all duration-200 ${
                  currentPage === page ? 'text-white shadow-lg' : 'text-surface-400 hover:text-surface-700 hover:bg-surface-100'
                }`}
                style={currentPage === page ? { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' } : {}}>
                {page}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="btn-secondary flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed" id="fg-next-page">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

