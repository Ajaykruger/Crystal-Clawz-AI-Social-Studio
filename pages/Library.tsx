
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MediaAsset, Folder as FolderType, ViewState } from '../types';
import { 
    Folder, Search, Grid, List as ListIcon, 
    UploadCloud, ChevronRight, ChevronDown, 
    FileImage, FileVideo, Lock, Download, Trash2, Edit2, X, Plus, Check, Package,
    History, Save, FolderInput, ExternalLink, Sparkles, Loader2, Play, AlignLeft, Link as LinkIcon, 
    MoreVertical, FolderPlus, ArrowLeft, Cloud, Globe
} from 'lucide-react';
import { getLibraryAssets, addManyAssets, updateAsset, deleteAsset, addAsset, getFolders, createFolder, renameFolder, deleteFolder } from '../services/libraryService';
import { analyzeMediaAsset, scrapeImagesFromUrl } from '../services/geminiService';
import { CCTextField, CCTextArea, CCSearchField } from '../components/ui/Inputs';
import { VersionHistoryPanel } from '../components/VersionHistoryPanel';
import { GoogleDrivePicker } from '../components/GoogleDrivePicker'; 
import { MockFile } from '../components/MockDrivePicker'; 

interface LibraryProps {
  onAttach?: (asset: MediaAsset) => void; 
  onNavigate?: (view: ViewState, params?: any) => void;
  libraryVersion?: number;
  pendingFile?: File | null;
}

// --- Types for Upload Queue ---
interface QueueItem {
    tempId: string;
    file: File;
    previewUrl: string;
    status: 'pending' | 'analyzing' | 'ready' | 'error';
    assetData?: Partial<MediaAsset>;
}

// Helper for YouTube Thumbnails
const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
};

// Helper to flatten folders for dropdowns
const getAllFolderPaths = (folders: FolderType[]): string[] => {
    let paths: string[] = [];
    folders.forEach(f => {
        paths.push(f.path);
        if (f.subfolders && f.subfolders.length > 0) {
            paths = [...paths, ...getAllFolderPaths(f.subfolders)];
        }
    });
    return paths;
};

// --- Sub-Components ---

const AssetCard: React.FC<{ 
    asset: MediaAsset; 
    selectedAssetId?: string; 
    onSelect: (a: MediaAsset) => void; 
    onDelete: (id: string) => void; 
    onDownload: (a: MediaAsset) => void; 
}> = ({ asset, selectedAssetId, onSelect, onDelete, onDownload }) => {
    
    const renderThumbnail = () => {
        if (asset.fileType === 'image') {
            return <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />;
        }
        
        if (asset.fileType === 'video') {
            const ytThumb = getYouTubeThumbnail(asset.url);
            if (ytThumb) {
                return <img src={ytThumb} alt={asset.filename} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />;
            }
            // Video Preview Fix
            if (asset.url) {
                return (
                    <video 
                        src={asset.url} 
                        className="w-full h-full object-cover" 
                        muted 
                        playsInline 
                        loop
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => e.currentTarget.pause()}
                    />
                );
            }
            return <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-900"><FileVideo size={48} /></div>;
        }
        
        return <div className="w-full h-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-400"><Package size={40} /></div>;
    };

    return (
        <div onClick={() => onSelect(asset)} className={`group relative bg-white dark:bg-gray-800 border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${selectedAssetId === asset.id ? 'ring-2 ring-pink-500 border-transparent' : 'border-slate-200 dark:border-gray-700'}`}>
            <div className="aspect-square bg-slate-100 dark:bg-gray-700 relative overflow-hidden">
                {renderThumbnail()}
                {asset.stage && <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm z-10">{asset.stage}</div>}
                {/* Play Icon Overlay for Videos */}
                {asset.fileType === 'video' && !getYouTubeThumbnail(asset.url) && (
                    <div className="absolute top-2 right-2 bg-black/30 p-1 rounded-full backdrop-blur-sm pointer-events-none">
                        <Play size={12} className="text-white fill-white"/>
                    </div>
                )}
                
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20" onClick={(e) => e.stopPropagation()}>
                    <button 
                        disabled={!asset.url}
                        onClick={(e) => { e.stopPropagation(); onDownload(asset); }}
                        className={`w-10 h-10 bg-white rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${asset.url ? "text-slate-700 hover:text-pink-600 hover:shadow-lg" : "opacity-40 cursor-not-allowed"}`}
                        title="Download"
                    >
                        <Download size={18} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-700 hover:text-red-600 hover:shadow-lg transition-all transform hover:scale-110"
                        title="Delete"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
            <div className="p-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={asset.filename}>{asset.filename}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {asset.fileType === 'image' ? <FileImage size={12}/> : <FileVideo size={12}/>}
                    <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

const FolderTreeItem: React.FC<{ 
    folder: FolderType; 
    level?: number; 
    currentPath: string; 
    expanded: Set<string>; 
    onToggle: (path: string) => void; 
    onSelect: (path: string) => void;
}> = ({ folder, level = 0, currentPath, expanded, onToggle, onSelect }) => {
    const isExpanded = expanded.has(folder.path);
    const isActive = currentPath === folder.path;
    const hasChildren = folder.subfolders.length > 0;

    return (
        <div>
            <div 
                className={`group flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer transition-colors text-sm ${isActive ? 'bg-pink-50 text-pink-700 font-medium dark:bg-pink-900/30 dark:text-pink-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700'}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onSelect(folder.path)}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggle(folder.path); }}
                        className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-gray-600 ${hasChildren ? 'visible' : 'invisible'}`}
                    >
                        {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                    </button>
                    {folder.locked ? <Lock size={16} className="opacity-50 shrink-0" /> : <Folder size={16} className={`shrink-0 ${isActive ? 'fill-pink-200 dark:fill-pink-900' : ''}`} />}
                    <span className="truncate">{folder.name}</span>
                </div>
            </div>
            {isExpanded && hasChildren && (
                <div>
                    {folder.subfolders.map(sub => (
                        <FolderTreeItem 
                            key={sub.id} 
                            folder={sub} 
                            level={level + 1} 
                            currentPath={currentPath}
                            expanded={expanded}
                            onToggle={onToggle}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const AssetDrawer: React.FC<{ 
    asset: MediaAsset | null; 
    onClose: () => void; 
    onUpdate: (id: string, data: Partial<MediaAsset>) => void;
    onDelete: (id: string) => void;
    onDownload: (a: MediaAsset) => void;
    onAttach?: (a: MediaAsset) => void;
    folders: FolderType[];
}> = ({ asset, onClose, onUpdate, onDelete, onDownload, onAttach, folders }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<MediaAsset>>({});

    useEffect(() => {
        if (asset) {
            setEditData({
                filename: asset.filename,
                folderPath: asset.folderPath,
                description: asset.description || "",
                tags: asset.tags
            });
            setIsEditing(false);
        }
    }, [asset]);

    if (!asset) return null;

    const handleSave = () => {
        onUpdate(asset.id, editData);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-slate-200 dark:border-gray-700 z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-900">
                <h3 className="font-bold text-slate-800 dark:text-white">Asset Details</h3>
                <div className="flex gap-2">
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-full"><Edit2 size={18}/></button>}
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-full"><X size={20}/></button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="aspect-square bg-slate-100 dark:bg-gray-700 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-600 flex items-center justify-center">
                    {asset.fileType === 'video' && asset.url ? (
                        <video src={asset.url} controls className="w-full h-full object-contain" />
                    ) : (
                        <img src={asset.url} className="w-full h-full object-contain" />
                    )}
                </div>

                <div className="space-y-4">
                    {isEditing ? (
                        <>
                            <CCTextField label="Filename" value={editData.filename} onChange={e => setEditData({...editData, filename: e.target.value})} />
                            <CCTextArea label="Description" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Folder</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                                    value={editData.folderPath}
                                    onChange={e => setEditData({...editData, folderPath: e.target.value})}
                                >
                                    {getAllFolderPaths(folders).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <button onClick={handleSave} className="w-full bg-pink-600 text-white py-2 rounded-lg font-bold">Save Changes</button>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Filename</label>
                                <p className="font-medium text-slate-900 dark:text-white break-all">{asset.filename}</p>
                            </div>
                            {asset.description && (
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">AI Description</label>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-gray-700 p-3 rounded-lg mt-1">{asset.description}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Location</label>
                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mt-1">
                                    <Folder size={14} className="text-pink-500"/> {asset.folderPath}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Tags</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {asset.tags.map(t => <span key={t} className="text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">{t}</span>)}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {!isEditing && (
                <div className="p-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 space-y-3">
                    {onAttach ? (
                        <button onClick={() => onAttach(asset)} className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 flex items-center justify-center gap-2">
                            <Plus size={18} /> Attach Asset
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => onDownload(asset)} className="flex-1 py-2.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg font-medium flex justify-center gap-2 hover:bg-slate-50 dark:hover:bg-gray-700">
                                <Download size={16} /> Download
                            </button>
                            <button onClick={() => onDelete(asset.id)} className="flex-1 py-2.5 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 text-red-600 rounded-lg font-medium flex justify-center gap-2 hover:bg-red-50">
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Library: React.FC<LibraryProps> = ({ onNavigate, onAttach, pendingFile, libraryVersion }) => {
    // State
    const [folders, setFolders] = useState<FolderType[]>(getFolders());
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('Inbox (Unsorted)');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['Products', 'Brand Assets', 'Community (UGC)']));
    const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modals
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadQueue, setUploadQueue] = useState<QueueItem[]>([]);
    const [editQueueId, setEditQueueId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New State for Restore
    const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);

    // Initial Load
    useEffect(() => {
        setAssets(getLibraryAssets());
        setFolders(getFolders());
    }, [libraryVersion]);

    // Handle incoming pending file
    useEffect(() => {
        if (pendingFile) {
            handleProcessFiles([pendingFile]);
        }
    }, [pendingFile]);

    // Filtering
    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const pathMatch = currentPath === 'All' ? true : asset.folderPath === currentPath;
            const searchMatch = searchQuery 
                ? asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) || asset.tags.some(t => t.includes(searchQuery.toLowerCase()))
                : true;
            return pathMatch && searchMatch;
        });
    }, [assets, currentPath, searchQuery]);

    // Handlers
    const toggleFolder = (path: string) => {
        const next = new Set(expandedFolders);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        setExpandedFolders(next);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            handleProcessFiles(Array.from(e.target.files));
        }
    };

    const handleProcessFiles = (files: File[]) => {
        const newItems: QueueItem[] = files.map(f => ({
            tempId: Math.random().toString(36).substr(2, 9),
            file: f,
            previewUrl: URL.createObjectURL(f),
            status: 'pending' // Start as pending to allow choice
        }));
        setUploadQueue(prev => [...prev, ...newItems]);
        setIsUploadModalOpen(true);
    };

    const startAnalysis = () => {
        const pendingItems = uploadQueue.filter(q => q.status === 'pending');
        
        setUploadQueue(prev => prev.map(q => 
            q.status === 'pending' ? { ...q, status: 'analyzing' } : q
        ));

        pendingItems.forEach(analyzeItem);
    };

    const skipAnalysis = () => {
        setUploadQueue(prev => prev.map(q => {
            if (q.status === 'pending') {
                return {
                    ...q,
                    status: 'ready',
                    assetData: {
                        filename: q.file.name,
                        fileType: q.file.type.startsWith('video') ? 'video' : 'image',
                        folderPath: 'Inbox (Unsorted)',
                        description: '',
                        tags: [],
                        permissions: { status: 'not_needed' },
                        stage: 'Raw'
                    }
                };
            }
            return q;
        }));
    };

    const analyzeItem = async (item: QueueItem) => {
        try {
            const reader = new FileReader();
            reader.readAsDataURL(item.file);
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                const analysis = await analyzeMediaAsset(base64, item.file.type, getAllFolderPaths(folders));
                
                setUploadQueue(prev => prev.map(q => q.tempId === item.tempId ? {
                    ...q,
                    status: 'ready',
                    assetData: {
                        filename: analysis.filename + (item.file.type.includes('video') ? '.mp4' : '.jpg'),
                        fileType: item.file.type.startsWith('video') ? 'video' : 'image',
                        folderPath: analysis.suggestedFolder,
                        description: analysis.description,
                        tags: analysis.tags,
                        permissions: { status: 'not_needed' },
                        stage: 'Raw'
                    }
                } : q));
            };
        } catch (e) {
            setUploadQueue(prev => prev.map(q => q.tempId === item.tempId ? { ...q, status: 'error' } : q));
        }
    };

    const handleSaveUploads = () => {
        const ready = uploadQueue.filter(q => q.status === 'ready' && q.assetData);
        const newAssets = ready.map(q => ({
            ...q.assetData as MediaAsset,
            id: `new_${Date.now()}_${q.tempId}`,
            url: q.previewUrl, // In real app, this would be cloud URL
            createdAt: new Date().toISOString(),
            status: 'draft' as const
        }));
        addManyAssets(newAssets);
        setAssets(getLibraryAssets());
        setUploadQueue([]);
        setIsUploadModalOpen(false);
        if (newAssets.length > 0) setCurrentPath(newAssets[0].folderPath);
    };

    const handleDownload = (asset: MediaAsset) => {
        const a = document.createElement('a');
        a.href = asset.url;
        a.download = asset.filename;
        a.click();
    };

    const handleDriveImport = (files: MockFile[]) => {
        const newAssets: MediaAsset[] = files.map(f => ({
            id: `gd_${Date.now()}_${f.id}`,
            filename: f.name,
            fileType: f.type === 'video' ? 'video' : 'image',
            folderPath: 'Google Drive Imports',
            stage: 'Raw',
            url: f.thumbnail || '', 
            createdAt: new Date().toISOString(),
            tags: ['drive-import'],
            permissions: { status: 'not_needed' },
            status: 'draft'
        }));
        addManyAssets(newAssets);
        setAssets(getLibraryAssets());
        setCurrentPath('Google Drive Imports');
    };

    const handleUrlImport = async () => {
        if (!importUrl) return;
        setIsScraping(true);
        try {
            const images = await scrapeImagesFromUrl(importUrl);
            if (images.length > 0) {
                const newAssets: MediaAsset[] = images.map((url, i) => ({
                    id: `url_${Date.now()}_${i}`,
                    filename: `Scraped_${i + 1}.jpg`,
                    fileType: 'image',
                    folderPath: 'Inbox (Unsorted)',
                    stage: 'Raw',
                    url: url,
                    createdAt: new Date().toISOString(),
                    tags: ['scraped'],
                    permissions: { status: 'not_needed' },
                    status: 'draft'
                }));
                addManyAssets(newAssets);
                setAssets(getLibraryAssets());
                setCurrentPath('Inbox (Unsorted)');
                setIsUrlModalOpen(false);
                setImportUrl('');
            } else {
                alert("No images found at that URL.");
            }
        } catch (e) {
            console.error("Scrape failed", e);
            alert("Failed to scrape URL.");
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <div className="flex h-full bg-white dark:bg-gray-900">
            
            {/* Sidebar Tree */}
            <div className="hidden md:flex w-64 border-r border-slate-200 dark:border-gray-700 flex-col h-full bg-slate-50/50 dark:bg-gray-800/50">
                <div className="p-4 border-b border-slate-200 dark:border-gray-700">
                    <button onClick={() => setCurrentPath('All')} className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4 ${currentPath === 'All' ? 'text-pink-600' : 'text-slate-500'}`}>
                        Library <span className="bg-slate-200 text-slate-600 px-1.5 rounded text-[10px]">{assets.length}</span>
                    </button>
                    <div className="space-y-1 mb-4">
                        <button onClick={() => setCurrentPath('Inbox (Unsorted)')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${currentPath === 'Inbox (Unsorted)' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' : 'hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-300'}`}>
                            Inbox
                        </button>
                        <button onClick={() => setCurrentPath('Engine Packs')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${currentPath === 'Engine Packs' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' : 'hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-300'}`}>
                            Engine Packs
                        </button>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Folders</div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {folders.filter(f => !['Inbox (Unsorted)', 'Engine Packs'].includes(f.name)).map(f => (
                        <FolderTreeItem 
                            key={f.id} 
                            folder={f} 
                            currentPath={currentPath}
                            expanded={expandedFolders} 
                            onToggle={toggleFolder} 
                            onSelect={setCurrentPath}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* Header Toolbar */}
                <div className="h-16 border-b border-slate-200 dark:border-gray-700 px-6 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-slate-500 text-sm">Library</span>
                        <ChevronRight size={14} className="text-slate-400"/>
                        <span className="font-bold text-slate-900 dark:text-white truncate">{currentPath}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-64 hidden sm:block">
                            <CCSearchField 
                                placeholder="Search assets..." 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)}
                                onClear={() => setSearchQuery('')}
                            />
                        </div>
                        
                        <div className="h-8 w-px bg-slate-200 dark:bg-gray-700 mx-1"></div>

                        <button 
                            onClick={() => setIsDrivePickerOpen(true)}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Import from Google Drive"
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-5 h-5 grayscale hover:grayscale-0 transition-all" alt="Drive" />
                        </button>

                        <button 
                            onClick={() => setIsUrlModalOpen(true)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Import from URL"
                        >
                            <Globe size={20} />
                        </button>

                        <button onClick={() => fileInputRef.current?.click()} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
                            <UploadCloud size={16}/> Upload
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
                    </div>
                </div>

                {/* Asset Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-gray-900">
                    {filteredAssets.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredAssets.map(asset => (
                                <AssetCard 
                                    key={asset.id} 
                                    asset={asset}
                                    selectedAssetId={selectedAsset?.id}
                                    onSelect={setSelectedAsset}
                                    onDelete={(id) => { deleteAsset(id); setAssets(getLibraryAssets()); }}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <Search size={24} />
                            </div>
                            <p>No assets found in this folder.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Asset Details Drawer */}
            <AssetDrawer 
                asset={selectedAsset}
                onClose={() => setSelectedAsset(null)}
                onUpdate={(id, data) => { updateAsset(id, data); setAssets(getLibraryAssets()); }}
                onDelete={(id) => { deleteAsset(id); setAssets(getLibraryAssets()); setSelectedAsset(null); }}
                onDownload={handleDownload}
                onAttach={onAttach}
                folders={folders}
            />

            {/* Upload Review Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles size={20} className="text-pink-600"/> Review Uploads
                            </h2>
                            <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>

                        {uploadQueue.some(q => q.status === 'pending') && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 text-sm">
                                    <Sparkles size={16}/>
                                    <span>{uploadQueue.filter(q => q.status === 'pending').length} items waiting. Analyze with AI for auto-tags & folders?</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={skipAnalysis} className="px-3 py-1.5 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30">
                                        Just Upload
                                    </button>
                                    <button onClick={startAnalysis} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1">
                                        <Sparkles size={12}/> Analyze
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-gray-900/50">
                            {uploadQueue.map(item => (
                                <div key={item.tempId} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
                                    <div className="w-24 h-24 bg-slate-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                        {item.file.type.startsWith('video') ? (
                                            <video src={item.previewUrl} className="w-full h-full object-cover" muted autoPlay loop />
                                        ) : (
                                            <img src={item.previewUrl} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {item.status === 'analyzing' ? (
                                            <div className="flex items-center gap-2 text-pink-600 text-sm font-medium animate-pulse">
                                                <Loader2 size={16} className="animate-spin"/> Analyzing content...
                                            </div>
                                        ) : item.status === 'pending' ? (
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"/> Waiting for action...
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <CCTextField 
                                                    value={item.assetData?.filename} 
                                                    onChange={e => setUploadQueue(q => q.map(i => i.tempId === item.tempId ? {...i, assetData: {...i.assetData, filename: e.target.value}} : i))}
                                                    className="text-sm font-bold"
                                                />
                                                <div className="flex gap-2">
                                                    <span className="text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded flex items-center gap-1 dark:text-slate-300">
                                                        <FolderInput size={12}/> {item.assetData?.folderPath}
                                                    </span>
                                                    {item.assetData?.tags?.map(t => <span key={t} className="text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded dark:text-slate-300">#{t}</span>)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => setUploadQueue(prev => prev.filter(p => p.tempId !== item.tempId))}
                                        className="text-slate-400 hover:text-red-500 h-fit"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-gray-700 flex justify-end gap-3">
                            <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button 
                                onClick={handleSaveUploads} 
                                disabled={uploadQueue.some(q => q.status === 'analyzing' || q.status === 'pending')}
                                className="px-6 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Check size={18}/> Save All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* URL Import Modal */}
            {isUrlModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Import from URL</h3>
                        <CCTextField 
                            placeholder="https://example.com/image.jpg or website"
                            value={importUrl}
                            onChange={e => setImportUrl(e.target.value)}
                            className="mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsUrlModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button 
                                onClick={handleUrlImport}
                                disabled={!importUrl || isScraping}
                                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isScraping ? <Loader2 size={16} className="animate-spin"/> : <Globe size={16}/>}
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <GoogleDrivePicker 
                isOpen={isDrivePickerOpen} 
                onClose={() => setIsDrivePickerOpen(false)} 
                onImport={handleDriveImport}
            />
        </div>
    );
};

export default Library;
