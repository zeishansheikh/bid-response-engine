import React from 'react';
import { AppView } from './types';
import { 
  LayoutDashboard, 
  Briefcase, 
  ShieldCheck, 
  LineChart, 
  Target, 
  FileEdit,
  Settings as SettingsIcon,
  Bell,
  Search,
  LogOut,
  ChevronRight,
  History as LucideHistory
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Workspace } from './components/Workspace';
import { Compliance } from './components/Compliance';
import { Analysis } from './components/Analysis';
import { WinProbability } from './components/WinProbability';
import { Editor } from './components/Editor';
import { Landing } from './components/Landing';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { History } from './components/History';
import { motion, AnimatePresence } from 'motion/react';
import { api, Workspace as WorkspaceType, notificationService, AppNotification } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = React.useState<AppView>('landing');
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);
  const [workspaces, setWorkspaces] = React.useState<WorkspaceType[]>([]);
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Load theme and company parameters from localStorage
  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem('bidengine_theme') || 'dark';
  });
  const [companyName, setCompanyName] = React.useState(() => {
    return localStorage.getItem('bidengine_company_name') || 'Acme Federal Solutions';
  });

  const loadNotifications = () => {
    setNotifications(notificationService.getNotifications());
  };

  React.useEffect(() => {
    loadNotifications();
    window.addEventListener('notifications-updated', loadNotifications);
    
    // Listen for settings-updated events to propagate company name and theme changes instantly
    const handleSettingsUpdate = () => {
      setTheme(localStorage.getItem('bidengine_theme') || 'dark');
      setCompanyName(localStorage.getItem('bidengine_company_name') || 'Acme Federal Solutions');
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('notifications-updated', loadNotifications);
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, []);

  // Update theme class on HTML element
  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
  }, [theme]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const loadWorkspaces = async () => {
    try {
      const list = await api.getWorkspaces();
      setWorkspaces(list);
      
      const savedId = localStorage.getItem('govprop_active_workspace_id');
      if (savedId && list.some(w => w.id === savedId)) {
        setWorkspaceId(savedId);
      } else if (list.length > 0 && !workspaceId) {
        setWorkspaceId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Hash-based routing to support deep-linking and browser back/forward buttons
  const navigateToView = (view: AppView, targetWorkspaceId: string | null = workspaceId) => {
    if (['landing', 'settings', 'history'].includes(view)) {
      window.location.hash = `#/${view}`;
    } else if (targetWorkspaceId) {
      window.location.hash = `#/workspace/${targetWorkspaceId}/${view}`;
    } else {
      window.location.hash = `#/${view}`;
    }
  };

  React.useEffect(() => {
    loadWorkspaces();
  }, [workspaceId]);

  React.useEffect(() => {
    if (workspaceId) {
      localStorage.setItem('govprop_active_workspace_id', workspaceId);
      const hash = window.location.hash.replace('#/', '');
      if (hash && hash.startsWith('workspace/') && !['landing', 'settings', 'history'].includes(currentView)) {
        const parts = hash.split('/');
        if (parts[1] !== workspaceId) {
          window.location.hash = `#/workspace/${workspaceId}/${currentView}`;
        }
      } else if (!['landing', 'settings', 'history'].includes(currentView)) {
        window.location.hash = `#/workspace/${workspaceId}/${currentView}`;
      }
    }
  }, [workspaceId, currentView]);

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (!hash) {
        setCurrentView('landing');
        return;
      }

      if (hash.startsWith('workspace/')) {
        const parts = hash.split('/');
        if (parts.length >= 3) {
          const wsId = parts[1];
          const view = parts[2] as AppView;
          setWorkspaceId(wsId);
          setCurrentView(view);
          return;
        }
      }

      const validViews: AppView[] = [
        'landing', 'dashboard', 'workspace', 'compliance', 
        'analysis', 'win-probability', 'editor', 'reports', 'settings', 'history'
      ];
      if (validViews.includes(hash as AppView)) {
        setCurrentView(hash as AppView);
      } else {
        setCurrentView('landing');
      }
    };

    // Initialize routing on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <Landing onNavigate={navigateToView} />;
      case 'dashboard': return <Dashboard workspaceId={workspaceId} setWorkspaceId={setWorkspaceId} onNavigate={navigateToView} />;
      case 'workspace': return <Workspace workspaceId={workspaceId} setWorkspaceId={setWorkspaceId} onNavigate={navigateToView} />;
      case 'compliance': return <Compliance workspaceId={workspaceId} />;
      case 'analysis': return <Analysis workspaceId={workspaceId} onNavigate={navigateToView} />;
      case 'win-probability': return <WinProbability workspaceId={workspaceId} />;
      case 'editor': return <Editor workspaceId={workspaceId} />;
      case 'reports': return <Reports workspaceId={workspaceId} />;
      case 'settings': return <Settings />;
      case 'history': return <History workspaceId={workspaceId} setWorkspaceId={setWorkspaceId} onNavigate={navigateToView} />;
      default: return <Landing onNavigate={navigateToView} />;
    }
  };

  if (currentView === 'landing') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="min-h-screen bg-background"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    );
  }

  const activeWorkspace = workspaces.find(w => w.id === workspaceId);

  return (
    <div className="flex h-screen bg-[#0B1020] text-gray-200 overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#263042] bg-[#111827] flex flex-col z-20 shrink-0">
        {/* Brand Logo & Subtitle */}
        <div className="h-20 flex items-center px-6 border-b border-[#263042]/50 gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#4F8CFF]/10 border border-[#4F8CFF]/30 flex items-center justify-center shadow-lg shadow-[#4F8CFF]/5">
            <svg className="w-5 h-5 text-[#4F8CFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" fill="rgba(79, 140, 255, 0.1)" stroke="#4F8CFF" />
              <circle cx="12" cy="12" r="4" stroke="#4F8CFF" />
              <circle cx="12" cy="12" r="1.5" fill="#4F8CFF" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">BidEngine</span>
            <span className="text-[9px] text-[#94A3B8] font-medium block mt-0.5 tracking-normal">AI Powered Proposal Intelligence</span>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="flex-1 py-6 flex flex-col gap-1 px-4 overflow-y-auto custom-scrollbar">
          <NavItem 
            icon={<LayoutDashboard size={16} />} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => navigateToView('dashboard')} 
          />
          <NavItem 
            icon={<Briefcase size={16} />} 
            label="Workspaces" 
            active={currentView === 'workspace'} 
            onClick={() => navigateToView('workspace')} 
          />
          <NavItem 
            icon={<ShieldCheck size={16} />} 
            label="Compliance Matrix" 
            active={currentView === 'compliance'} 
            onClick={() => navigateToView('compliance')} 
          />
          <NavItem 
            icon={<LineChart size={16} />} 
            label="RFP Analysis" 
            active={currentView === 'analysis'} 
            onClick={() => navigateToView('analysis')} 
          />
          <NavItem 
            icon={<Target size={16} />} 
            label="Win Probability" 
            active={currentView === 'win-probability'} 
            onClick={() => navigateToView('win-probability')} 
          />
          <NavItem 
            icon={<FileEdit size={16} />} 
            label="Proposal Editor" 
            active={currentView === 'editor'} 
            onClick={() => navigateToView('editor')} 
          />
          <NavItem 
            icon={<LineChart size={16} />} 
            label="Reports" 
            active={currentView === 'reports'} 
            onClick={() => navigateToView('reports')} 
          />
          <NavItem 
            icon={<SettingsIcon size={16} />} 
            label="Settings" 
            active={currentView === 'settings'} 
            onClick={() => navigateToView('settings')} 
          />
          <NavItem 
            icon={<LucideHistory size={16} />} 
            label="History" 
            active={currentView === 'history'} 
            onClick={() => navigateToView('history')} 
          />
        </div>

        {/* Sidebar Footer with Active Workspace dropdown & Profile summary */}
        <div className="border-t border-[#263042]/50 p-4 space-y-4 bg-gray-900/10">
          <div className="space-y-1.5">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block px-1">Active Workspace</span>
            {workspaces.length > 0 && (
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4F8CFF]">
                  <Briefcase size={13} />
                </div>
                <select 
                  value={workspaceId || ''} 
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="w-full bg-gray-950/60 border border-[#263042] text-[11px] font-semibold text-white pl-9 pr-8 py-2.5 rounded-xl focus:outline-none focus:border-[#4F8CFF]/50 transition-all hover:bg-gray-900/40 cursor-pointer appearance-none"
                >
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id} className="bg-[#111827] text-white text-xs">{ws.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#4F8CFF] to-[#7C3AED] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#4F8CFF]/15">
                A
              </div>
              <div>
                <span className="font-semibold text-xs text-white block">Ahsan Maqsood</span>
                <span className="text-[10px] text-gray-500 block mt-0.5 font-medium truncate max-w-[160px]">Proposal Manager @ {companyName}</span>
              </div>
            </div>
            <button className="text-gray-500 hover:text-white transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden z-10">
        {/* Topbar */}
        <header className="h-16 border-b border-[#263042]/50 bg-[#111827]/30 backdrop-blur-md flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center text-xs text-gray-400 font-semibold">
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setCurrentView('dashboard')}>Home</span>
            <ChevronRight size={12} className="mx-2 text-gray-650" />
            <span className="text-[#4F8CFF] capitalize font-bold">
              {currentView.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Dynamic Company Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-gray-900 border border-[#263042] rounded-xl text-xs font-semibold text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF] animate-pulse" />
              {companyName}
            </div>

            {workspaces.length > 0 && (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4F8CFF]">
                  <Briefcase size={13} />
                </div>
                <select 
                  value={workspaceId || ''} 
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="bg-gray-900 border border-[#263042] text-xs font-semibold text-gray-200 pl-9 pr-8 py-2 rounded-xl focus:outline-none focus:border-[#4F8CFF] transition-all hover:bg-gray-800 cursor-pointer appearance-none"
                >
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id} className="bg-[#111827] text-white text-xs">{ws.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-gray-900 border border-[#263042] text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer hover:border-[#4F8CFF]/50"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 flex items-center justify-center bg-[#7C3AED] text-[10px] font-bold text-white rounded-full border border-[#111827]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                  
                  <div className="absolute right-0 mt-3 w-80 bg-[#111827] rounded-2xl border border-[#263042] shadow-2xl z-40 overflow-hidden flex flex-col max-h-[400px]">
                    <div className="p-4 border-b border-[#263042]/50 flex items-center justify-between bg-gray-950/20">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button 
                            onClick={() => notificationService.markAllAsRead()}
                            className="text-[10px] text-[#4F8CFF] hover:underline font-semibold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button 
                            onClick={() => notificationService.clearAll()}
                            className="text-[10px] text-gray-500 hover:text-gray-300 font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#263042]/30 max-h-[300px]">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`p-3.5 hover:bg-gray-900/40 transition-colors text-left flex gap-3 items-start ${!n.read ? 'bg-[#4F8CFF]/5 border-l-2 border-l-[#4F8CFF]' : ''}`}
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className={`text-xs font-bold ${!n.read ? 'text-white' : 'text-gray-300'}`}>{n.title}</h4>
                                <span className="text-[9px] text-gray-500 whitespace-nowrap font-medium">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 leading-normal">{n.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto bg-[#0B1020] p-8 custom-scrollbar relative overflow-x-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-[#4F8CFF]/5 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-indigo-500/3 blur-[130px] rounded-full pointer-events-none" />
          
          <div className="w-full max-w-6xl mx-auto h-full relative z-10">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold w-full text-left cursor-pointer border
        ${active 
          ? 'bg-[#1E293B] text-white border-[#263042] shadow-[0_0_15px_rgba(79,142,255,0.02)]' 
          : 'text-gray-400 border-transparent hover:bg-gray-900/60 hover:text-white'
        }
      `}
    >
      <span className={active ? 'text-[#4F8CFF]' : 'text-gray-400'}>{icon}</span>
      {label}
    </button>
  );
}
