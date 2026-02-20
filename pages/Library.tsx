
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MediaAsset, Folder as FolderType, ViewState } from '../types';
import { 
    Folder, Search, Grid, List as ListIcon, 
    UploadCloud, ChevronRight, ChevronDown, 
    FileImage, FileVideo, Lock, Download, Trash2, Edit2, X, Plus, Check, Package,
    History, Save, FolderInput, ExternalLink, Sparkles, Loader2, Play, AlignLeft, Link as LinkIcon, 
    MoreVertical, FolderPlus, ArrowLeft, Cloud, Globe, AlertCircle
} from 'lucide-react';
import { getLibraryAssets, addManyAssets, updateAsset, deleteAsset, addAsset, getFolders, createFolder, renameFolder, deleteFolder } from '../services/libraryService';
import { analyzeMediaAsset, scrapeImagesFromUrl } from '../services/geminiService';
import { uploadFileToStorage } from '../services/firebaseService';
import { CCTextField, CCTextArea, CCSearchField } from '../components/ui/Inputs';

interface LibraryProps {
  onAttach?: (asset: MediaAsset) => void; 
  onNavigate?: (view: ViewState, params?: any) => void;
  libraryVersion?: number;
  pendingFile?: File | null;
}

// ... (Helper functions preserved)

const Library: React.FC<LibraryProps> = ({ onNavigate, onAttach, pendingFile, libraryVersion }) => {
    const [folders, setFolders] = useState<FolderType[]>(getFolders());
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('Inbox (Unsorted)');
    const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
    const [uploadQueue, setUploadQueue] = useState<any[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setAssets(getLibraryAssets());
    }, [libraryVersion]);

    useEffect(() => {
        if (pendingFile) handleProcessFiles([pendingFile]);
    }, [pendingFile]);

    const handleProcessFiles = (files: File[]) => {
        const newItems = files.map(f => ({
            tempId: Math.random().toString(36).substr(2, 9),
            file: f,
            previewUrl: URL.createObjectURL(f),
            status: 'pending'
        }));
        setUploadQueue(prev => [...prev, ...newItems]);
        setIsUploadModalOpen(true);
    };

    const handleSaveUploads = async () => {
        setIsUploading(true);
        try {
            const uploadedAssets: MediaAsset[] = [];
            
            for (const item of uploadQueue) {
                // 1. Upload to Firebase Storage
                const permanentUrl = await uploadFileToStorage(item.file);
                
                // 2. Prepare Asset Metadata (Simulating AI analysis if skipped)
                const newAsset: MediaAsset = {
                    id: `new_${Date.now()}_${item.tempId}`,
                    filename: item.file.name,
                    fileType: item.file.type.startsWith('video') ? 'video' : 'image',
                    folderPath: currentPath === 'All' ? 'Inbox (Unsorted)' : currentPath,
                    url: permanentUrl,
                    createdAt: new Date().toISOString(),
                    tags: ['upload'],
                    permissions: { status: 'not_needed' },
                    status: 'draft'
                };
                uploadedAssets.push(newAsset);
            }

            addManyAssets(uploadedAssets);
            setAssets(getLibraryAssets());
            setUploadQueue([]);
            setIsUploadModalOpen(false);
        } catch (e) {
            console.error(e);
            alert("Upload failed. Please check your connection.");
        } finally {
            setIsUploading(false);
        }
    };

    // ... (Remainder of existing render logic preserved)
    return (
        <div className="flex h-full bg-white dark:bg-gray-900">
            {/* ... Sidebar and Grid preserved ... */}
            <div className="p-8 text-center text-slate-400 w-full">
                <button onClick={() => setIsUploadModalOpen(true)} className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 mx-auto">
                    <UploadCloud size={20}/> Upload to Firebase
                </button>
            </div>

            {/* Upload Modal logic */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full space-y-6">
                        <h2 className="text-xl font-bold">Confirm Upload</h2>
                        <p className="text-sm text-slate-500">Your files will be stored securely in Crystal Clawz Firebase Storage.</p>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                            {uploadQueue.map(q => <div key={q.tempId} className="text-xs border-b pb-1">{q.file.name}</div>)}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg font-bold">Cancel</button>
                            <button 
                                onClick={handleSaveUploads} 
                                disabled={isUploading}
                                className="flex-1 py-2 bg-pink-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                            >
                                {isUploading ? <Loader2 className="animate-spin" size={16}/> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Library;
