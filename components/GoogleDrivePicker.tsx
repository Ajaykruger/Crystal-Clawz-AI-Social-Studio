
import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, ExternalLink, X, Image, Video, FolderPlus, Globe, HelpCircle, ChevronDown, ChevronUp, LayoutGrid, RefreshCw, LogOut } from 'lucide-react';
import { MockFile, MockDrivePicker } from './MockDrivePicker'; 

// ============================================================================
// ⚠️ CONFIGURATION ⚠️
// ============================================================================
const CLIENT_ID = "100149611681-ch6o409kil3tpqsqg9damb066tcuhkdg.apps.googleusercontent.com";
const API_KEY = "AIzaSyCLV8-_QiOt5BUwmHh8znhFN_g9ksJ_LvM";
const APP_ID = "100149611681"; 
// This must match your "Authorized JavaScript origins" exactly
const FIXED_ORIGIN = "https://crystal-clawz-social-studio-v2-100149611681.us-west1.run.app";
// ============================================================================

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';

interface GoogleDrivePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (files: MockFile[]) => void;
}

export const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ isOpen, onClose, onImport }) => {
    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const [isAuthLoaded, setIsAuthLoaded] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [pickerInited, setPickerInited] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTroubleshooting, setShowTroubleshooting] = useState(false);
    const [useMock, setUseMock] = useState(false);

    // Load Google Scripts dynamically
    useEffect(() => {
        if (!isOpen || useMock) return;

        const loadScript = (src: string, onLoad: () => void) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                onLoad();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            script.onload = onLoad;
            document.body.appendChild(script);
        };

        loadScript('https://apis.google.com/js/api.js', () => {
            (window as any).gapi.load('picker', () => setIsApiLoaded(true));
        });

        loadScript('https://accounts.google.com/gsi/client', () => {
            setIsAuthLoaded(true);
        });
    }, [isOpen, useMock]);

    // Initialize Token Client
    useEffect(() => {
        if (isAuthLoaded && !tokenClient && CLIENT_ID && !useMock) {
            try {
                const google = (window as any).google;
                if (google) {
                    const client = google.accounts.oauth2.initTokenClient({
                        client_id: CLIENT_ID,
                        scope: SCOPES,
                        callback: (response: any) => {
                            if (response.error !== undefined) {
                                console.error("Auth error", response);
                                setError(`Auth Error: ${JSON.stringify(response)}`);
                                return;
                            }
                            setAccessToken(response.access_token);
                        },
                    });
                    setTokenClient(client);
                }
            } catch (err: any) {
                setError("Failed to initialize Google Auth. Check Client ID.");
            }
        }
    }, [isAuthLoaded, tokenClient, useMock]);

    // Trigger Picker when Token is ready
    useEffect(() => {
        if (accessToken && isApiLoaded && !pickerInited && !useMock) {
            createPicker();
        }
    }, [accessToken, isApiLoaded, pickerInited, useMock]);

    const handleAuthClick = () => {
        if (!tokenClient) return;
        tokenClient.requestAccessToken({ prompt: 'select_account' });
    };

    const handleSignOut = () => {
        if (typeof window !== 'undefined' && (window as any).google) {
            const google = (window as any).google;
            if (google.accounts && google.accounts.oauth2) {
                google.accounts.oauth2.revoke(accessToken, () => {
                    setAccessToken(null);
                    setPickerInited(false);
                    setError(null);
                });
            }
        } else {
            setAccessToken(null);
            setPickerInited(false);
        }
    };

    const createPicker = () => {
        const google = (window as any).google;
        if (!google || !google.picker) {
            setError("Google Picker API not loaded");
            return;
        }

        try {
            const pickerBuilder = new google.picker.PickerBuilder()
                .addView(google.picker.ViewId.DOCS)
                .addView(google.picker.ViewId.PHOTOS)
                .setOAuthToken(accessToken!)
                .setDeveloperKey(API_KEY)
                .setCallback(pickerCallback);

            // CRITICAL: This must match the Authorized Origin exactly
            // If running on localhost, use dynamic origin. If prod, use the fixed one.
            if (window.location.hostname === 'localhost') {
                 pickerBuilder.setOrigin(window.location.protocol + '//' + window.location.host);
            } else {
                 pickerBuilder.setOrigin(FIXED_ORIGIN);
            }

            if (APP_ID) {
                pickerBuilder.setAppId(APP_ID);
            }

            const picker = pickerBuilder.build();
            picker.setVisible(true);
            setPickerInited(true);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to build picker");
        }
    };

    const pickerCallback = (data: any) => {
        const google = (window as any).google;
        if (!google) return;

        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
            const docs = data[google.picker.Response.DOCUMENTS];
            const mappedFiles: MockFile[] = docs.map((doc: any) => ({
                id: doc[google.picker.Document.ID],
                name: doc[google.picker.Document.NAME],
                type: doc[google.picker.Document.MIME_TYPE].startsWith('video') ? 'video' : 'image',
                thumbnail: doc[google.picker.Document.THUMBNAIL_URL] || (doc[google.picker.Document.MIME_TYPE].startsWith('image') ? 'https://via.placeholder.com/150' : undefined), 
                modifiedTime: new Date(doc[google.picker.Document.LAST_EDITED_UTC]).toLocaleDateString(),
                size: 'Unknown'
            }));
            onImport(mappedFiles);
            onClose();
        } else if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
            onClose();
        } else if (data[google.picker.Response.ACTION] === google.picker.Action.ERROR) {
             console.error("Picker Error Data:", data);
             // Often 403s don't trigger this callback, but just in case
        }
    };

    if (!isOpen) return null;

    if (useMock) {
        return <MockDrivePicker isOpen={isOpen} onClose={() => { setUseMock(false); onClose(); }} onImport={onImport} />;
    }

    // --- STATE: MISSING CONFIG ---
    if (!CLIENT_ID || !API_KEY) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Configuration Required</h3>
                    <p className="text-slate-500 mb-6">Client ID and API Key are missing.</p>
                    <button onClick={onClose} className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // --- STATE: LOADING / AUTH ---
    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center max-h-[90vh] overflow-y-auto">
                {error ? (
                    <>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Connection Error</h3>
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-6 w-full text-left">
                            <p className="text-xs text-red-800 font-mono break-words">{error}</p>
                        </div>
                        
                        <div className="w-full space-y-3">
                            <button 
                                onClick={() => { setError(null); handleAuthClick(); }}
                                className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={14} /> Retry
                            </button>
                            
                            <button 
                                onClick={() => setUseMock(true)}
                                className="w-full py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2"
                            >
                                <LayoutGrid size={14} /> Open Demo Picker
                            </button>

                            <button onClick={onClose} className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs">
                                Cancel
                            </button>
                        </div>
                    </>
                ) : accessToken ? (
                    <>
                        <Loader2 size={48} className="text-green-500 animate-spin mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">Opening Drive...</h3>
                        <p className="text-xs text-slate-500 text-center mt-2 max-w-[200px]">
                            If you see a 403 error here, your API Key restrictions are likely too strict.
                        </p>
                        <button 
                            onClick={handleSignOut}
                            className="mt-6 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                            <LogOut size={12}/> Sign out & Retry
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 p-4">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-full h-full" alt="Drive" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Connect Google Drive</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Sign in to access your media files.
                        </p>
                        
                        <button 
                            onClick={handleAuthClick}
                            disabled={!isApiLoaded || !isAuthLoaded}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all mb-4"
                        >
                            {!isApiLoaded || !isAuthLoaded ? <Loader2 size={18} className="animate-spin"/> : <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 bg-white rounded-full p-0.5" />}
                            Sign in with Google
                        </button>

                        <div className="w-full border-t border-slate-100 pt-4">
                            <button 
                                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                                className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-600 w-full mb-3"
                            >
                                <HelpCircle size={12}/> Troubleshooting
                                {showTroubleshooting ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                            </button>
                            
                            {showTroubleshooting && (
                                <div className="space-y-3 text-left animate-in slide-in-from-top-2">
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                        <p className="text-[10px] text-amber-800 font-bold mb-1">If you see 403 Error:</p>
                                        <ul className="text-[10px] text-amber-700 list-disc list-inside space-y-1">
                                            <li>Go to Google Cloud Console > Credentials.</li>
                                            <li>Edit your API Key ({API_KEY.slice(0, 4)}...).</li>
                                            <li>Set "Website restrictions" to <strong>None</strong> temporarily.</li>
                                            <li>Wait 5 minutes and try again.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => setUseMock(true)}
                            className="text-xs text-slate-400 hover:text-pink-600 underline decoration-dotted"
                        >
                            Use Demo Mode
                        </button>

                        <button onClick={onClose} className="mt-4 text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                    </>
                )}
            </div>
        </div>
    );
};
