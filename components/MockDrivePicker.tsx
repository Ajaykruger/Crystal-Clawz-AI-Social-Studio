
import React, { useState, useEffect } from 'react';
import { X, Check, FileVideo, FolderPlus, Loader2, Search, ArrowLeft, Grid, List as ListIcon } from 'lucide-react';
import { USER_PROVIDED_ASSETS } from '../services/libraryService';

export interface MockFile {
    id: string;
    name: string;
    type: 'image' | 'video' | 'folder';
    thumbnail?: string;
    modifiedTime: string;
    size?: string;
}

interface MockDrivePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (files: MockFile[]) => void;
}

export const MockDrivePicker: React.FC<MockDrivePickerProps> = ({ isOpen, onClose, onImport }) => {
    const [step, setStep] = useState<'auth' | 'loading' | 'picker'>('auth');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    // Reset state when opened
    useEffect(() => {
        if (isOpen && step !== 'picker') {
            setStep('auth');
        }
    }, [isOpen]);

    // Enhanced Mock Drive Content reflecting the User Uploads
    // Using indices 0-5 (Nail Art) for drive files mostly
    const driveFiles: MockFile[] = [
        { id: 'df1', name: 'Riaana_Leaf_Set.jpg', type: 'image', modifiedTime: '2025-01-15', size: '2.4 MB', thumbnail: USER_PROVIDED_ASSETS[0].url },
        { id: 'df2', name: 'Stiletto_Ref_01.jpg', type: 'image', modifiedTime: '2025-01-20', size: '1.8 MB', thumbnail: USER_PROVIDED_ASSETS[1].url },
        { id: 'df3', name: 'Liza_Floral_Red.jpg', type: 'image', modifiedTime: '2025-01-22', size: '3.1 MB', thumbnail: USER_PROVIDED_ASSETS[2].url },
        { id: 'df4', name: 'Brand_Logo_Pack.zip', type: 'folder', modifiedTime: '2024-11-10', size: '-' },
        { id: 'df5', name: 'Product_Shoot_Lime.jpg', type: 'image', modifiedTime: '2024-12-05', size: '3.1 MB', thumbnail: USER_PROVIDED_ASSETS[9].url },
        { id: 'df6', name: 'Johanni_Ombre.jpg', type: 'image', modifiedTime: '2025-01-18', size: '2.9 MB', thumbnail: USER_PROVIDED_ASSETS[4].url },
        { id: 'df7', name: 'Prep_Tutorial_Cover.jpg', type: 'image', modifiedTime: '2025-01-25', size: '1.5 MB', thumbnail: USER_PROVIDED_ASSETS[5].url },
        { id: 'df8', name: 'Nude_Speckle_Detail.jpg', type: 'image', modifiedTime: '2025-01-26', size: '4.2 MB', thumbnail: USER_PROVIDED_ASSETS[3].url },
        { id: 'df9', name: 'Diamond_Gel_Blue_012.jpg', type: 'image', modifiedTime: '2025-01-10', size: '5.0 MB', thumbnail: USER_PROVIDED_ASSETS[8].url },
        { id: 'df10', name: 'Indulgence_Pink_019.jpg', type: 'image', modifiedTime: '2025-01-05', size: '2.1 MB', thumbnail: USER_PROVIDED_ASSETS[11].url },
    ];

    const filteredFiles = driveFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleAuth = () => {
        setStep('loading');
        // Simulate auth delay
        setTimeout(() => {
            setStep('picker');
        }, 1500);
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleImportClick = () => {
        const files = driveFiles.filter(f => selectedIds.has(f.id));
        onImport(files);
        onClose();
        setSelectedIds(new Set());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-6 h-6" alt="Drive" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Google Drive</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    
                    {/* AUTH VIEW */}
                    {step === 'auth' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-8 text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-10 h-10" alt="Drive" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Google Drive</h2>
                            <p className="text-slate-500 max-w-xs mb-8">Access your photos and videos directly from your Google Drive account.</p>
                            
                            <button 
                                onClick={handleAuth}
                                className="flex items-center gap-3 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-full font-medium hover:bg-slate-50 hover:shadow-md transition-all group"
                            >
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                                <span>Sign in with Google</span>
                            </button>
                            <p className="mt-6 text-xs text-slate-400">By connecting, you agree to allow access to your files.</p>
                        </div>
                    )}

                    {/* LOADING VIEW */}
                    {step === 'loading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-8 text-center">
                            <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">Authenticating...</h3>
                            <p className="text-sm text-slate-500">Please wait while we connect to Google.</p>
                        </div>
                    )}

                    {/* PICKER VIEW */}
                    {step === 'picker' && (
                        <div className="flex flex-col h-full animate-in fade-in">
                            {/* Toolbar */}
                            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Search in Drive" 
                                        className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Grid size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <ListIcon size={16}/>
                                    </button>
                                </div>
                            </div>

                            {/* Breadcrumbs */}
                            <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                                <span className="hover:underline cursor-pointer">My Drive</span>
                                <span>/</span>
                                <span className="font-medium text-slate-800">Imports</span>
                            </div>

                            {/* Files */}
                            <div className="flex-1 overflow-y-auto p-6 bg-white">
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {filteredFiles.map(file => {
                                            const isSelected = selectedIds.has(file.id);
                                            return (
                                                <div 
                                                    key={file.id} 
                                                    onClick={() => toggleSelect(file.id)}
                                                    className={`group relative border rounded-xl overflow-hidden cursor-pointer transition-all ${
                                                        isSelected ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="aspect-square bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                                        {file.type === 'image' && file.thumbnail ? (
                                                            <img src={file.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                        ) : file.type === 'video' ? (
                                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                                <FileVideo size={32} />
                                                            </div>
                                                        ) : (
                                                            <FolderPlus size={32} className="text-slate-400" />
                                                        )}
                                                        
                                                        {/* Check Overlay */}
                                                        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                            isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white/80 border-slate-300 opacity-0 group-hover:opacity-100'
                                                        }`}>
                                                            {isSelected && <Check size={14} className="text-white"/>}
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <p className="text-xs font-bold text-slate-900 truncate" title={file.name}>{file.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <img src={file.type === 'folder' ? "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" : file.type === 'video' ? "https://www.svgrepo.com/show/509302/video.svg" : "https://www.svgrepo.com/show/509146/image.svg"} className="w-3 h-3 opacity-50" />
                                                            <p className="text-[10px] text-slate-500">{file.modifiedTime}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                                            <div className="col-span-6">Name</div>
                                            <div className="col-span-3">Modified</div>
                                            <div className="col-span-3">Size</div>
                                        </div>
                                        {filteredFiles.map(file => {
                                            const isSelected = selectedIds.has(file.id);
                                            return (
                                                <div 
                                                    key={file.id}
                                                    onClick={() => toggleSelect(file.id)}
                                                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center rounded-lg cursor-pointer transition-colors ${
                                                        isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                                                    }`}
                                                >
                                                    <div className="col-span-6 flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'}`}>
                                                            {isSelected && <Check size={10} className="text-white"/>}
                                                        </div>
                                                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center shrink-0">
                                                            {file.type === 'image' ? <img src={file.thumbnail} className="w-full h-full object-cover rounded" /> : 
                                                             file.type === 'video' ? <FileVideo size={16} className="text-slate-400"/> : 
                                                             <FolderPlus size={16} className="text-slate-400"/>}
                                                        </div>
                                                        <span className="text-sm font-medium truncate">{file.name}</span>
                                                    </div>
                                                    <div className="col-span-3 text-xs opacity-70">{file.modifiedTime}</div>
                                                    <div className="col-span-3 text-xs opacity-70">{file.size}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'picker' && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                        <div className="text-xs text-slate-500">
                            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button 
                                onClick={handleImportClick}
                                disabled={selectedIds.size === 0}
                                className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Select
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
