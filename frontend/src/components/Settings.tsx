import React from 'react';
import { 
  Building, 
  Cpu, 
  Database, 
  Sliders, 
  Server, 
  Save, 
  Check, 
  Loader2,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export function Settings() {
  // Org Settings State (load from localStorage if exists)
  const [companyName, setCompanyName] = React.useState(() => {
    return localStorage.getItem('bidengine_company_name') || 'Acme Federal Solutions';
  });
  const [companyDesc, setCompanyDesc] = React.useState(() => {
    return localStorage.getItem('bidengine_company_desc') || 'Enterprise cloud migrations, zero-downtime database transitions, and secure federal cybersecurity infrastructure implementation.';
  });

  // AI Preferences
  const [temperature, setTemperature] = React.useState(() => {
    const val = localStorage.getItem('bidengine_temperature');
    return val ? parseFloat(val) : 0.2;
  });
  const [maxTokens, setMaxTokens] = React.useState(() => {
    return localStorage.getItem('bidengine_max_tokens') || '2048';
  });

  // API Status State
  const [backendOnline, setBackendOnline] = React.useState<boolean | null>(null);
  const [dbStatus, setDbStatus] = React.useState<string>('checking...');
  const [loadingHealth, setLoadingHealth] = React.useState(true);

  // Preference Settings
  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem('bidengine_theme') || 'dark';
  });
  const [inAppNotif, setInAppNotif] = React.useState(() => {
    const val = localStorage.getItem('bidengine_in_app_notif');
    return val !== null ? val === 'true' : true;
  });

  // UX States
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    async function checkHealth() {
      try {
        setLoadingHealth(true);
        const health = await api.getHealth();
        if (health && health.status === 'healthy') {
          setBackendOnline(true);
          setDbStatus(health.database || 'connected');
        } else {
          setBackendOnline(false);
          setDbStatus('offline');
        }
      } catch (err) {
        console.error("Health check failed", err);
        setBackendOnline(false);
        setDbStatus('offline');
      } finally {
        setLoadingHealth(false);
      }
    }
    checkHealth();
  }, []);

  const handleSaveSettings = () => {
    setSaving(true);
    setSaveSuccess(false);

    // Save company parameters to localStorage
    localStorage.setItem('bidengine_company_name', companyName);
    localStorage.setItem('bidengine_company_desc', companyDesc);
    localStorage.setItem('bidengine_temperature', temperature.toString());
    localStorage.setItem('bidengine_max_tokens', maxTokens);
    localStorage.setItem('bidengine_theme', theme);
    localStorage.setItem('bidengine_in_app_notif', inAppNotif.toString());

    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      
      // Dispatch custom event to notify other components instantly
      window.dispatchEvent(new Event('settings-updated'));
      
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-900/35 p-5 border border-[#263042]/50 rounded-2xl">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-gray-455">
            Configure organization profiles, AI model thresholds, knowledge bases, and monitor live API health metrics.
          </p>
        </div>
        
        <button 
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#4F8CFF]/15 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={13} />
          ) : saveSuccess ? (
            <Check size={13} />
          ) : (
            <Save size={13} />
          )}
          {saving ? "Saving..." : saveSuccess ? "Settings Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Organization & Preferences */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Organization */}
          <div className="glass-panel border border-[#263042] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#263042]/50 pb-3">
              <Building size={15} className="text-[#4F8CFF]" />
              Organization Profile
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Company Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter organization title"
                  className="w-full bg-gray-950/60 border border-[#263042] text-xs font-semibold text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#4F8CFF] transition-all font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Company Capabilities Description</label>
                <textarea 
                  value={companyDesc}
                  onChange={(e) => setCompanyDesc(e.target.value)}
                  placeholder="Describe core company capabilities to customize AI assistant drafts"
                  className="w-full bg-gray-950/60 border border-[#263042] text-xs font-semibold text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#4F8CFF] transition-all min-h-[100px] resize-y font-sans leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="glass-panel border border-[#263042] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#263042]/50 pb-3">
              <Cpu size={15} className="text-purple-400" />
              AI Proposal Co-Pilot Calibration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Default AI Model</label>
                <div className="w-full bg-gray-900 border border-[#263042] text-xs font-bold text-gray-400 px-4 py-2.5 rounded-xl select-none font-mono">
                  Gemini 1.5 Flash (Workspace Default)
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Max Output Tokens</label>
                <select 
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  className="w-full bg-gray-950/60 border border-[#263042] text-xs font-semibold text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#4F8CFF] transition-all cursor-pointer font-mono"
                >
                  <option value="1024" className="bg-[#111827]">1024 tokens</option>
                  <option value="2048" className="bg-[#111827]">2048 tokens (Standard)</option>
                  <option value="4096" className="bg-[#111827]">4096 tokens (Extended)</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Creativity Temperature: {temperature}</label>
                  <span className="text-[9px] text-gray-500 font-mono">Deterministic (0.0) - Creative (1.0)</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[#4F8CFF] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="glass-panel border border-[#263042] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#263042]/50 pb-3">
              <Sliders size={15} className="text-amber-400" />
              User Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Visual Theme</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${theme === 'dark' ? 'bg-[#1E293B] border-[#4F8CFF]/50 text-white' : 'bg-gray-950/20 border-[#263042] text-gray-400'}`}
                  >
                    Dark Theme
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${theme === 'light' ? 'bg-[#1E293B] border-[#4F8CFF]/50 text-white' : 'bg-gray-950/20 border-[#263042] text-gray-400'}`}
                  >
                    Light Theme
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-950/30 border border-[#263042]/50 rounded-xl mt-3.5">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">In-App Notifications</span>
                  <span className="text-[10px] text-gray-500 block">Deliver capability matching alerts</span>
                </div>
                <input 
                  type="checkbox"
                  checked={inAppNotif}
                  onChange={(e) => setInAppNotif(e.target.checked)}
                  className="w-4 h-4 text-[#4F8CFF] accent-[#4F8CFF] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Knowledge Base & API Health */}
        <div className="space-y-6">
          
          {/* Knowledge Base Info */}
          <div className="glass-panel border border-[#263042] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#263042]/50 pb-3">
              <FileText size={15} className="text-[#ADC6FF]" />
              Knowledge Base Status
            </h2>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Capability Library</span>
                <span className="text-[10px] font-bold uppercase text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Vector Embeddings</span>
                <span className="text-[11px] font-mono text-gray-300 font-bold">15,000 Dimensions</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Matching Pipeline</span>
                <span className="text-[11px] font-mono text-gray-300 font-bold">RAG Enabled</span>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-[#263042]/40 pt-3">
                <span className="text-gray-400">Last Synced</span>
                <span className="text-[11px] font-mono text-gray-400">2026-06-25 18:40</span>
              </div>
            </div>
          </div>

          {/* API Health Monitor */}
          <div className="glass-panel border border-[#263042] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#263042]/50 pb-3">
              <Server size={15} className="text-[#4F8CFF]" />
              API Health Monitor
            </h2>

            {loadingHealth ? (
              <div className="py-4 flex justify-center">
                <Loader2 className="animate-spin text-[#4F8CFF]" size={20} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Backend API Gateway</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${backendOnline ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                    {backendOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">PostgreSQL / Supabase</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${dbStatus === 'connected' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                    {dbStatus === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-[#263042]/40 pt-3">
                  <span className="text-gray-400">Gateway URL</span>
                  <span className="text-[10px] font-mono text-gray-500 select-all">http://localhost:8000</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
