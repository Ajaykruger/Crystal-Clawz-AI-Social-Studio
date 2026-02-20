import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Link2, Zap, History, ScrollText, 
  Check, AlertCircle, RefreshCw, LogOut, Shield, 
  Instagram, Facebook, Youtube, AlertTriangle, FileText,
  BarChart, Plus, ChevronRight, Download, PlayCircle, Calendar, ArrowLeft,
  CheckCircle, ArrowRight, Sparkles, Users, Lock, HardDrive, Cloud, X, Loader2, Image as ImageIcon, FileVideo, FolderPlus, Upload, Trash2, Eye,
  // Added Info to imports to fix "Cannot find name 'Info'"
  ExternalLink, Mail, ShieldCheck, Database, Globe, Sliders, Palette, Info
} from 'lucide-react';
import { Platform, ViewState, User, UserRole, ModerationConfig } from '../types';
import { CCTextArea, CCTextField } from '../components/ui/Inputs';
import { CCCheckbox } from '../components/ui/Checkbox';
import { userService } from '../services/userService';
import { logout } from '../services/firebaseService';

type SettingsTab = 'general' | 'team' | 'connections' | 'brand' | 'moderation' | 'reports' | 'history' | 'logs';

interface SettingsProps {
    initialParams?: any;
    onNavigate: (view: ViewState, params?: any) => void;
    currentUser?: User;
    onUpdateUser?: (user: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ initialParams, onNavigate, currentUser: propUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [localUser, setLocalUser] = useState(userService.getCurrentUser());
  
  const currentUser = propUser || localUser;

  useEffect(() => {
      if (initialParams?.tab) {
          setActiveTab(initialParams.tab);
      }
  }, [initialParams]);

  const handleUserUpdate = (updatedUser: User) => {
      if (onUpdateUser) onUpdateUser(updatedUser);
      else setLocalUser(updatedUser);
  };

  const handleSignOut = async () => {
    try {
        await logout();
        window.location.reload();
    } catch (e) {
        console.error(e);
    }
  };

  const navItems: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <UserIcon size={18} /> },
    { id: 'team', label: 'Team & Roles', icon: <Users size={18} /> },
    { id: 'connections', label: 'Connections', icon: <Link2 size={18} /> },
    { id: 'brand', label: 'Brand Voice', icon: <Zap size={18} /> },
    { id: 'moderation', label: 'Moderation', icon: <Shield size={18} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart size={18} /> },
    { id: 'history', label: 'History', icon: <History size={18} /> },
    { id: 'logs', label: 'System Logs', icon: <ScrollText size={18} /> },
  ];

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 flex flex-col shrink-0">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Settings</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest font-bold">Manage studio preferences</p>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === item.id 
                            ? 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 shadow-sm border border-pink-100/50 dark:border-pink-800/50' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                 <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                 >
                     <LogOut size={18} />
                     Sign Out
                 </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                {activeTab === 'general' && <GeneralSettings currentUser={currentUser} onUpdateUser={handleUserUpdate}/>}
                {activeTab === 'team' && <TeamSettings />}
                {activeTab === 'connections' && <ConnectionsSettings />}
                {activeTab === 'brand' && <BrandSettings />}
                {activeTab === 'moderation' && <ModerationSettings />}
                {activeTab === 'reports' && <ReportsSettings />}
                {activeTab === 'history' && <HistorySettings />}
                {activeTab === 'logs' && <LogsSettings />}
            </div>
        </div>
    </div>
  );
};

const GeneralSettings = ({ currentUser, onUpdateUser }: { currentUser: User, onUpdateUser: (user: User) => void }) => {
    const [name, setName] = useState(currentUser.name);
    const [isKeyActive, setIsKeyActive] = useState<boolean | null>(null);

    const checkKeyStatus = async () => {
        try {
            if ((window as any).aistudio?.hasSelectedApiKey) {
                const active = await (window as any).aistudio.hasSelectedApiKey();
                setIsKeyActive(active);
            }
        } catch (e) {
            console.error("Key status check failed", e);
        }
    };

    useEffect(() => {
        checkKeyStatus();
    }, []);

    const handleRotateKey = async () => {
        if ((window as any).aistudio?.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            setTimeout(checkKeyStatus, 1000);
        } else {
            alert("API rotation is only available in the AI Studio environment.");
        }
    };

    return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h3>
            <div className="flex items-center gap-8 mb-8">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden shadow-lg border-4 border-white dark:border-gray-800">
                        {currentUser.avatarUrl ? (
                            <img src={currentUser.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-gray-400 text-3xl">
                                {currentUser.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-pink-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={14} />
                    </button>
                </div>
                <div className="space-y-1">
                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">{currentUser.name}</h4>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Mail size={14} /> {currentUser.email}
                    </p>
                    <div className="mt-2 flex gap-2">
                        <span className="bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{currentUser.role}</span>
                        <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Active</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CCTextField label="Full Name" value={name} onChange={e => setName(e.target.value)} />
                <CCTextField label="Email Address" value={currentUser.email} readOnly disabled />
            </div>
            <div className="mt-8 flex justify-end">
                <button className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-md">
                    Update Profile
                </button>
            </div>
        </div>

        {/* API KEY ROTATION SECTION */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-2xl shadow-inner"><Lock size={24}/></div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Credentials & AI</h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Manage your Google Gemini API access.</p>
                    </div>
                </div>
                {isKeyActive === true ? (
                    <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800">
                        <CheckCircle size={14} />
                        <span className="text-xs font-black uppercase tracking-widest">Active</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 text-gray-400 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest">Checking...</span>
                    </div>
                )}
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="max-w-md">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Gemini API Key</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Your Studio uses Gemini for content analysis, visual generation, and strategic insights. Rotate your key if it’s compromised or if you switch accounts.</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-xs text-gray-500 tracking-widest">
                             •••• •••• •••• 4251
                         </div>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={handleRotateKey}
                        className="flex-1 min-w-[200px] py-4 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-white rounded-2xl font-black text-lg hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all flex items-center justify-center gap-3 shadow-lg"
                    >
                        <RefreshCw size={20} /> Rotate API Key
                    </button>
                    <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Billing Docs <ExternalLink size={16}/>
                    </a>
                </div>
                
                <div className="flex items-start gap-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>Gemini 2.5/3 Pro models require a paid Google Cloud project with billing enabled. High usage tiers may incur costs.</span>
                </div>
            </div>
        </div>
    </div>
)};

const TeamSettings = () => {
    const members = [
        { name: 'Andre Kruger', email: 'esellerandre@gmail.com', role: 'Admin', avatar: null },
        { name: 'Johanni Claassens', email: 'johanni@crystalclawz.co.za', role: 'Editor', avatar: null },
        { name: 'Riaana Smith', email: 'riaana@example.com', role: 'Reviewer', avatar: null },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Team & Roles</h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Invite team members and manage permissions.</p>
                    </div>
                    <button className="px-5 py-2.5 bg-pink-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-pink-700 transition-all shadow-lg shadow-pink-100 dark:shadow-none">
                        <Plus size={18} /> Invite Member
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <div className="col-span-5">Member</div>
                        <div className="col-span-3">Role</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
                        {members.map((m, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 px-4 py-4 items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center font-black text-pink-600 dark:text-pink-400">
                                        {m.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{m.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{m.email}</p>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit">
                                        <ShieldCheck size={12} className="text-gray-400"/>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{m.role}</span>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Active
                                    </span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-400 transition-colors">
                                        <Sliders size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex gap-4 items-start">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-xl text-indigo-600 dark:text-indigo-200 shadow-sm"><Info size={20}/></div>
                <div>
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Role Permissions</h4>
                    <p className="text-xs text-indigo-800/80 dark:text-indigo-300 leading-relaxed mt-1">Editors can create and edit content but cannot push to production. Reviewers can approve content but cannot edit. Admins have full access to all features.</p>
                </div>
            </div>
        </div>
    );
};

const ConnectionsSettings = () => {
    const channels = [
        { platform: Platform.Instagram, status: 'Connected', account: '@crystalclawz_sa', icon: Instagram, color: 'text-pink-600' },
        { platform: Platform.Facebook, status: 'Connected', account: 'Crystal Clawz SA', icon: Facebook, color: 'text-blue-600' },
        { platform: Platform.TikTok, status: 'Expired', account: '@crystalclawz', icon: Cloud, color: 'text-gray-900 dark:text-white' },
        { platform: Platform.YouTube, status: 'Disconnected', account: null, icon: Youtube, color: 'text-red-600' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Channel Connections</h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">Manage integrations for auto-publishing and social listening.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {channels.map((c, i) => (
                        <div key={i} className="p-6 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform ${c.color}`}>
                                    <c.icon size={24}/>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    c.status === 'Connected' ? 'bg-emerald-100 text-emerald-700' : 
                                    c.status === 'Expired' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {c.status}
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white">{c.platform}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.account || 'No account linked'}</p>
                            
                            <div className="mt-6">
                                {c.status === 'Disconnected' ? (
                                    <button className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-bold">Connect Channel</button>
                                ) : (
                                    <button className="w-full py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800">
                                        {c.status === 'Expired' ? 'Reconnect' : 'Settings'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="p-8 bg-gray-900 rounded-3xl text-white flex justify-between items-center overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Database size={100}/></div>
                <div className="relative z-10">
                    <h4 className="text-lg font-bold">External Storage (n8n)</h4>
                    <p className="text-xs text-gray-400 mt-1">Webhook for scheduled post delivery.</p>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-mono text-emerald-400">https://n8n.crystalclawz.co.za/social-api</span>
                    </div>
                </div>
                <button className="relative z-10 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">
                    <Sliders size={20}/>
                </button>
            </div>
        </div>
    );
};

const BrandSettings = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Brand Voice Profile</h3>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Tone of Voice</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['Supportive', 'Hype', 'Playful', 'Professional', 'Educational', 'Premium'].map(t => (
                            <button key={t} className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-pink-300 transition-all flex items-center gap-2">
                                <Check size={14} className="text-emerald-500" /> {t}
                            </button>
                        ))}
                        <button className="px-4 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-400 hover:text-pink-600 hover:border-pink-300 transition-all">
                            + Custom
                        </button>
                    </div>
                </div>
                
                <CCTextArea 
                    label="Brand Summary for AI" 
                    rows={4}
                    defaultValue="Crystal Clawz is the leading South African brand for professional nail technicians. We focus on high-quality products without gatekeeping knowledge. Our voice is energetic, like a 'Work Bestie'. We use emojis and South African colloquialisms where appropriate (baddies, slay, glow-up)."
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CCTextField label="Target Audience" defaultValue="Nail Technicians in South Africa" />
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Visual DNA</label>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-full bg-pink-600 border-4 border-white dark:border-gray-800 shadow-sm" />
                            <button className="w-10 h-10 rounded-full bg-gray-900 border-4 border-white dark:border-gray-800 shadow-sm" />
                            <button className="w-10 h-10 rounded-full bg-purple-600 border-4 border-white dark:border-gray-800 shadow-sm" />
                            <button className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 dark:border-gray-700 shadow-sm" />
                            <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-pink-600 transition-colors"><Palette size={20}/></button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button className="px-8 py-3 bg-pink-600 text-white rounded-2xl font-black shadow-xl shadow-pink-100 dark:shadow-none hover:bg-pink-700 transition-all">Save Brand Voice</button>
            </div>
        </div>
    </div>
);

const ModerationSettings = () => {
    const [config, setConfig] = useState<ModerationConfig>(userService.getModerationConfig());
    
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Guardrails & Moderation</h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">Configure AI safety checks and compliance standards.</p>
                
                <div className="space-y-4">
                    <div className="p-5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-xl"><Zap size={20}/></div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Strict Tone Enforcement</h4>
                                <p className="text-xs text-gray-500">AI will flag content that deviates from Brand Voice.</p>
                            </div>
                        </div>
                        <CCCheckbox checked={config.checkBrandVoice} onChange={(val) => setConfig({...config, checkBrandVoice: val})} />
                    </div>

                    <div className="p-5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl"><ShieldCheck size={20}/></div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Medical Claims Shield</h4>
                                <p className="text-xs text-gray-500">Auto-flag words like "cure", "heal", or health promises.</p>
                            </div>
                        </div>
                        <CCCheckbox checked={config.checkCompliance} onChange={(val) => setConfig({...config, checkCompliance: val})} />
                    </div>

                    <div className="p-5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl"><ImageIcon size={20}/></div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Media Validation</h4>
                                <p className="text-xs text-gray-500">Require media attachments for all Feed and Reel posts.</p>
                            </div>
                        </div>
                        <CCCheckbox checked={config.checkMediaPresence} onChange={(val) => setConfig({...config, checkMediaPresence: val})} />
                    </div>

                    <div className="p-5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl"><Sliders size={20}/></div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Hashtag Limits</h4>
                                <p className="text-xs text-gray-500">Enforce maximum 30 hashtags as per platform best practices.</p>
                            </div>
                        </div>
                        <CCCheckbox checked={config.checkHashtagLimit} onChange={(val) => setConfig({...config, checkHashtagLimit: val})} />
                    </div>
                </div>
                
                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4">
                    <button className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold">Restore Defaults</button>
                    <button className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg">Save Guardrails</button>
                </div>
            </div>
        </div>
    );
};

const ReportsSettings = () => {
    const savedReports = [
        { name: 'Weekly Performance Overview', nextRun: 'Monday 9:00 AM', status: 'Active' },
        { name: 'Monthly Stock vs Content Mapping', nextRun: '1st of Month', status: 'Paused' },
        { name: 'Influencer Reach Report', nextRun: 'Every Friday', status: 'Active' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Scheduled Reports</h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Automated analytics delivered to your team.</p>
                    </div>
                    <button className="p-3 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl hover:bg-pink-100 transition-colors shadow-sm">
                        <Plus size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {savedReports.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-pink-200 transition-all cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl text-blue-500 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:bg-blue-50 transition-colors"><BarChart size={20}/></div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{r.name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Next: {r.nextRun}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${r.status === 'Active' ? 'text-emerald-600' : 'text-gray-400'}`}>{r.status}</span>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Sparkles size={120}/></div>
                <div className="max-w-md relative z-10">
                    <h4 className="text-xl font-black">AI Custom Reporting</h4>
                    <p className="text-sm text-indigo-100 mt-2 leading-relaxed font-medium">Need a specific data cutout? Chat with our Reports AI to generate custom visualization and insight packs instantly.</p>
                    <button className="mt-6 px-6 py-3 bg-white text-indigo-700 rounded-2xl font-black text-sm hover:scale-[1.05] transition-transform shadow-lg">
                        Open Reports Chat
                    </button>
                </div>
            </div>
        </div>
    );
};

const HistorySettings = () => {
    const activities = [
        { action: 'Post Published', details: 'Riaana Leaf Art set live on Instagram', time: '10 mins ago', user: 'System' },
        { action: 'Draft Created', details: 'New "Summer Glow" Reel draft', time: '2 hours ago', user: 'Johanni' },
        { action: 'Team Invite', details: 'Invitation sent to Riaana Smith', time: '5 hours ago', user: 'Andre' },
        { action: 'Connection Updated', details: 'Facebook Token Refreshed', time: 'Yesterday', user: 'Andre' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Activity History</h3>
                <div className="relative">
                    <div className="absolute top-0 left-5 bottom-0 w-px bg-gray-100 dark:bg-gray-700" />
                    <div className="space-y-10">
                        {activities.map((a, i) => (
                            <div key={i} className="relative pl-12">
                                <div className="absolute left-3.5 top-1.5 w-3 h-3 rounded-full bg-pink-600 border-2 border-white dark:border-gray-800 shadow-sm" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{a.time} • By {a.user}</p>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1">{a.action}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{a.details}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <button className="mt-12 w-full py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-500 hover:text-pink-600 transition-colors rounded-xl">
                    Load Full History
                </button>
            </div>
        </div>
    );
};

const LogsSettings = () => {
    const logs = [
        '[INFO] [2025-01-29 10:25:01] - Auth initialized for user esellerandre@gmail.com',
        '[WARN] [2025-01-29 10:20:45] - TikTok API token expiring in 48 hours',
        '[SUCCESS] [2025-01-29 09:15:22] - Generated image variant gen_4251_A',
        '[ERROR] [2025-01-29 08:30:11] - Veo operation timed out after 5 minutes',
        '[INFO] [2025-01-28 23:59:59] - Daily cleanup worker completed',
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">System Logs</h3>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400"><Download size={18}/></button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400"><RefreshCw size={18}/></button>
                    </div>
                </div>
                
                <div className="bg-gray-900 dark:bg-black rounded-2xl p-6 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[500px]">
                    {logs.map((log, i) => {
                        const isError = log.includes('[ERROR]');
                        const isWarn = log.includes('[WARN]');
                        return (
                            <div key={i} className={`mb-1 whitespace-nowrap ${isError ? 'text-red-400' : i === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {log}
                            </div>
                        );
                    })}
                    <div className="mt-4 text-gray-600 animate-pulse">_</div>
                </div>
                
                <div className="mt-8 flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl"><Globe size={20}/></div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Technical Support</h4>
                        <p className="text-xs text-gray-500">Having technical issues? Send these logs to support@crystalclawz.co.za</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;