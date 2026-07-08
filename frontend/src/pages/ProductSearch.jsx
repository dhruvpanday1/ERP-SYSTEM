import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  Filter,
  Tag,
  Loader2,
  Database,
  AlertCircle,
} from 'lucide-react';
import { finishedGoods as mockGoods, filterOptions } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const mapProduct = (p) => ({
  id: p.id,
  styleNumber: p.style_number || '',
  styleName: p.style_name || '',
  category: p.category || '',
  fabric: p.fabric || '',
  gsm: p.gsm || 0,
  supplier: p.supplier || '',
  buyer: p.buyer || '',
  sellingPrice: Number(p.selling_price) || 0,
  color: p.color || '',
  print: p.print || '',
  season: p.season || '',
  image: p.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
});

function FilterDropdown({ label, options, value, onChange }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1.5 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="select-field w-full">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export default function ProductSearch() {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    category: 'All', fabric: 'All', gsm: 'All', supplier: 'All',
    buyer: 'All', print: 'All', color: 'All', season: 'All',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setAllProducts(json.data.map(mapProduct));
        setIsLive(true);
      } catch (err) {
        console.warn('Fallback to mock:', err.message);
        setAllProducts(mockGoods);
        setFetchError('Offline demo data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build dynamic filter options from live data
  const liveFilterOptions = useMemo(() => ({
    categories: ['All', ...[...new Set(allProducts.map(p => p.category))].filter(Boolean).sort()],
    fabrics:    ['All', ...[...new Set(allProducts.map(p => p.fabric))].filter(Boolean).sort()],
    gsm:        filterOptions.gsm,
    suppliers:  ['All', ...[...new Set(allProducts.map(p => p.supplier))].filter(Boolean).sort()],
    buyers:     ['All', ...[...new Set(allProducts.map(p => p.buyer))].filter(Boolean).sort()],
    prints:     ['All', ...[...new Set(allProducts.map(p => p.print))].filter(Boolean).sort()],
    colors:     ['All', ...[...new Set(allProducts.map(p => p.color))].filter(Boolean).sort()],
    seasons:    ['All', ...[...new Set(allProducts.map(p => p.season))].filter(Boolean).sort()],
  }), [allProducts]);

  const opts = isLive ? liveFilterOptions : filterOptions;

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ category: 'All', fabric: 'All', gsm: 'All', supplier: 'All', buyer: 'All', print: 'All', color: 'All', season: 'All' });
  const activeFilterCount = Object.values(filters).filter((v) => v !== 'All').length;

  // KEY FIX: allProducts is in the deps array so memo recalculates when data loads
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        product.styleName.toLowerCase().includes(q) ||
        product.styleNumber.toLowerCase().includes(q) ||
        product.fabric.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.supplier.toLowerCase().includes(q) ||
        product.buyer.toLowerCase().includes(q);

      const matchesCategory = filters.category === 'All' || product.category === filters.category;
      const matchesFabric   = filters.fabric   === 'All' || product.fabric   === filters.fabric;
      const matchesSupplier = filters.supplier === 'All' || product.supplier === filters.supplier;
      const matchesBuyer    = filters.buyer    === 'All' || product.buyer    === filters.buyer;
      const matchesPrint    = filters.print    === 'All' || product.print    === filters.print;
      const matchesColor    = filters.color    === 'All' || product.color    === filters.color;
      const matchesSeason   = filters.season   === 'All' || product.season   === filters.season;

      let matchesGsm = true;
      if (filters.gsm !== 'All') {
        const [min, max] = filters.gsm.split('-').map(Number);
        matchesGsm = product.gsm >= min && product.gsm <= max;
      }

      return matchesSearch && matchesCategory && matchesFabric && matchesGsm &&
        matchesSupplier && matchesBuyer && matchesPrint && matchesColor && matchesSeason;
    });
  }, [allProducts, searchQuery, filters]);

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
          {isLive ? `Live - Supabase (${allProducts.length} records)` : 'Offline demo data'}
        </div>
        {fetchError && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertCircle className="w-3 h-3" /> {fetchError}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="premium-card p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
              id="ps-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search products... e.g. "cotton shirts from Orient Textiles"'
              className="input-field !pl-10 !text-sm"
            />
          </div>
          <button
            id="ps-filter-toggle"
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
              showFilters
                ? 'bg-primary-50 text-primary-600 border-primary-200'
                : 'bg-surface-50 text-surface-500 border-surface-200 hover:border-surface-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="premium-card p-5 h-fit w-72 shrink-0" id="ps-filters-panel">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-surface-500" />
                <h3 className="text-sm font-bold text-surface-800">Filters</h3>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-coral-500 hover:text-coral-600 font-semibold" id="ps-clear-filters">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            <div className="space-y-4">
              <FilterDropdown label="Category"  options={opts.categories} value={filters.category}  onChange={(v) => updateFilter('category', v)} />
              <FilterDropdown label="Fabric"    options={opts.fabrics}    value={filters.fabric}    onChange={(v) => updateFilter('fabric', v)} />
              <FilterDropdown label="GSM Range" options={opts.gsm}        value={filters.gsm}       onChange={(v) => updateFilter('gsm', v)} />
              <FilterDropdown label="Supplier"  options={opts.suppliers}  value={filters.supplier}  onChange={(v) => updateFilter('supplier', v)} />
              <FilterDropdown label="Buyer"     options={opts.buyers}     value={filters.buyer}     onChange={(v) => updateFilter('buyer', v)} />
              <FilterDropdown label="Print"     options={opts.prints}     value={filters.print}     onChange={(v) => updateFilter('print', v)} />
              <FilterDropdown label="Color"     options={opts.colors}     value={filters.color}     onChange={(v) => updateFilter('color', v)} />
              <FilterDropdown label="Season"    options={opts.seasons}    value={filters.season}    onChange={(v) => updateFilter('season', v)} />
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-surface-500">
              <span className="text-surface-900 font-bold">{filteredProducts.length}</span> products found
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="premium-card p-16 text-center">
              <Search className="w-12 h-12 text-surface-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-surface-700 mb-2">No products found</h3>
              <p className="text-sm text-surface-400">Try adjusting your search query or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-stagger">
              {filteredProducts.map((product) => {
                const catColor = categoryBadgeColors[product.category] || '#8892a6';
                return (
                  <div key={product.id} className="premium-card overflow-hidden group cursor-pointer" id={`ps-product-${product.id}`}>
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.styleName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop'; }}
                      />
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
                          {String.fromCodePoint(8377)}{product.sellingPrice?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
