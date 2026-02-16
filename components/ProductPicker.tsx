
import React, { useState } from 'react';
import { Product } from '../types';
import { searchProducts } from '../services/productService';
import { Search, Plus, X, LayoutGrid, Check, Package } from 'lucide-react';
import { CCTextField } from './ui/Inputs';

interface ProductPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  onBrowseLibrary?: () => void;
}

const ProductPicker: React.FC<ProductPickerProps> = ({ isOpen, onClose, onSelect, onBrowseLibrary }) => {
  const [mode, setMode] = useState<'search' | 'custom'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  
  const [customProduct, setCustomProduct] = useState<Partial<Product>>({
      name: '',
      price: undefined,
      sku: '',
      url: '',
      imageUrl: '',
      tags: []
  });

  React.useEffect(() => {
      if (mode === 'search') {
          setSearchResults(searchProducts(searchQuery));
      }
  }, [searchQuery, mode]);

  const handleAddCustom = () => {
      if (customProduct.name) {
          const newProduct: Product = {
              id: `custom_${Date.now()}`,
              name: customProduct.name,
              price: Number(customProduct.price) || 0,
              sku: customProduct.sku || '',
              url: customProduct.url || '',
              imageUrl: customProduct.imageUrl || '',
              tags: ['custom']
          };
          onSelect(newProduct);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900">Link Product</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} className="text-slate-400"/></button>
            </div>
            
            <div className="flex border-b border-slate-100">
                <button 
                    onClick={() => setMode('search')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'search' ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Search Catalog
                </button>
                <button 
                    onClick={() => setMode('custom')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'custom' ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Add Custom
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {mode === 'search' ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                placeholder="Search by name, SKU or tag..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            {searchResults.map(p => (
                                <div 
                                    key={p.id}
                                    onClick={() => onSelect(p)}
                                    className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:border-pink-300 hover:bg-pink-50 cursor-pointer group transition-all"
                                >
                                    <img src={p.imageUrl} className="w-12 h-12 rounded-lg bg-slate-100 object-cover" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                                        <p className="text-xs text-slate-500">{p.sku} • R{p.price}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-pink-600 group-hover:border-pink-300">
                                        <Plus size={16} />
                                    </div>
                                </div>
                            ))}
                            {searchResults.length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    <Package size={32} className="mx-auto mb-2 opacity-20"/>
                                    <p>No products found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <CCTextField 
                            label="Product Name" 
                            placeholder="e.g. Summer Promo Kit"
                            value={customProduct.name}
                            onChange={e => setCustomProduct({...customProduct, name: e.target.value})}
                            micEnabled={false}
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <CCTextField 
                                label="Price (R)" 
                                placeholder="0.00"
                                type="number"
                                value={customProduct.price}
                                onChange={e => setCustomProduct({...customProduct, price: e.target.value})}
                                micEnabled={false}
                            />
                            <CCTextField 
                                label="SKU (Optional)" 
                                placeholder="SKU-123"
                                value={customProduct.sku}
                                onChange={e => setCustomProduct({...customProduct, sku: e.target.value})}
                                micEnabled={false}
                            />
                        </div>

                        <CCTextField 
                            label="Product URL" 
                            placeholder="https://..."
                            value={customProduct.url}
                            onChange={e => setCustomProduct({...customProduct, url: e.target.value})}
                            micEnabled={false}
                        />

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Image</label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <CCTextField 
                                        placeholder="Paste Image URL"
                                        value={customProduct.imageUrl}
                                        onChange={e => setCustomProduct({...customProduct, imageUrl: e.target.value})}
                                        micEnabled={false}
                                    />
                                </div>
                                {onBrowseLibrary && (
                                    <button 
                                        onClick={onBrowseLibrary}
                                        className="px-3 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-colors"
                                        title="Choose from Library"
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                )}
                            </div>
                            {customProduct.imageUrl && (
                                <div className="mt-2 w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                    <img src={customProduct.imageUrl} className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={handleAddCustom}
                                disabled={!customProduct.name}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Custom Product
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ProductPicker;
