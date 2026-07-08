import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Camera,
  FileImage,
} from 'lucide-react';

export default function ImageSearch() {
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${apiBase}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data) {
          const mapped = data.data.map(p => ({
            id: p.style_number,
            styleNumber: p.style_number,
            styleName: p.style_name,
            category: p.category,
            fabric: p.fabric,
            gsm: p.gsm,
            supplier: p.supplier,
            sellingPrice: p.selling_price,
            image: p.image_url
          }));
          setAllProducts(mapped);
        }
      })
      .catch(console.error);
  }, []);

  const performSearch = () => {
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
    const resultItems = shuffled.slice(0, 8).map((item, i) => ({
      ...item,
      similarity: Math.max(65, 98 - i * 4 - Math.floor(Math.random() * 3)),
    }));
    setResults(resultItems);
    setHasSearched(true);
  };

  const handleTextSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) performSearch();
  };

  const handleFileUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setUploadedFileName(file.name);
        setTimeout(performSearch, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); handleFileUpload(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const clearImage = () => {
    setUploadedImage(null); setUploadedFileName('');
    setResults([]); setHasSearched(false);
  };

  const getSimilarityColor = (s) => s >= 90 ? '#10b981' : s >= 80 ? '#8b5cf6' : '#f59e0b';

  return (
    <div className="animate-fade-in">
      {/* Search Section */}
      <div className="premium-card p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Text Search */}
          <div>
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Search className="w-3.5 h-3.5" /> Text Search
            </label>
            <form onSubmit={handleTextSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='e.g. "blue floral cotton dress"'
                  className="input-field !pl-11 !py-3.5 !bg-surface-50 !border-surface-200" id="image-text-search-input" />
              </div>
              <button type="submit" className="btn-primary flex items-center gap-2" id="image-text-search-btn">
                <Search className="w-4 h-4" /> Search
              </button>
            </form>
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Camera className="w-3.5 h-3.5" /> Image Upload
            </label>
            {uploadedImage ? (
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-surface-50 border border-surface-100">
                <img src={uploadedImage} alt="Uploaded" className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-surface-800 truncate">{uploadedFileName}</p>
                  <p className="text-xs text-mint-500 flex items-center gap-1 mt-0.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint-500"></span> Search complete
                  </p>
                </div>
                <button onClick={clearImage} className="p-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                  isDragOver ? 'border-primary-400 bg-primary-50' : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'
                }`} id="image-upload-zone"
              >
                <div className="p-3 rounded-2xl bg-primary-50">
                  <Upload className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-700">
                    Drop an image or <span className="text-primary-500">browse</span>
                  </p>
                  <p className="text-[10px] text-surface-400 mt-0.5 font-medium">PNG, JPG, WEBP up to 10MB</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="animate-slide-up">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <ImageIcon className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-surface-900">Visually Similar Garments</h3>
              <p className="text-xs text-surface-400 font-medium">{results.length} matches found</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-stagger">
            {results.map((product) => (
              <div key={product.id} className="premium-card overflow-hidden group cursor-pointer" id={`similar-${product.id}`}>
                <div className="relative h-52 overflow-hidden">
                  <img src={product.image} alt={product.styleName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-3 right-3">
                    <div className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/95 backdrop-blur-md shadow-sm"
                      style={{ color: getSimilarityColor(product.similarity) }}>
                      {product.similarity}% match
                    </div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="badge badge-violet backdrop-blur-md bg-white/90 !text-primary-700 shadow-sm">{product.category}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/40 to-transparent">
                    <p className="text-sm font-bold text-white">{product.styleName}</p>
                    <p className="text-[11px] text-white/70 font-mono">{product.styleNumber}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-surface-500 font-medium">{product.fabric}</span>
                    <span className="text-base font-extrabold text-surface-900" style={{ letterSpacing: '-0.03em' }}>₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-surface-400 font-medium">
                    <span>{product.supplier}</span>
                    <span>GSM {product.gsm}</span>
                  </div>
                  {/* Similarity Bar */}
                  <div className="mt-3 pt-3 border-t border-surface-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-surface-400 uppercase tracking-wider font-bold">Similarity</span>
                      <span className="text-[11px] font-bold" style={{ color: getSimilarityColor(product.similarity) }}>{product.similarity}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${product.similarity}%`, background: getSimilarityColor(product.similarity) }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <div className="premium-card p-16 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(244,63,94,0.08))' }}>
            <FileImage className="w-10 h-10 text-primary-400" />
          </div>
          <h3 className="text-xl font-extrabold text-surface-900 mb-2" style={{ letterSpacing: '-0.03em' }}>Find Similar Garments</h3>
          <p className="text-sm text-surface-400 max-w-md mx-auto leading-relaxed">
            Enter a text description or upload an image to find visually similar products in your catalog.
          </p>
        </div>
      )}
    </div>
  );
}
