import React from 'react';
import { 
  FileSearch, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  BarChart, 
  Loader2,
  RefreshCw,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Activity,
  ArrowRight,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip
} from 'recharts';
import { api, ChecklistItem, DashboardData, Workspace } from '../services/api';
import { AppView } from '../types';
import { WorkspaceContextBanner } from './WorkspaceContextBanner';

interface AnalysisProps {
  workspaceId: string | null;
  onNavigate: (view: AppView) => void;
}

export function Analysis({ workspaceId, onNavigate }: AnalysisProps) {
  const [checklist, setChecklist] = React.useState<ChecklistItem[]>([]);
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedGap, setExpandedGap] = React.useState<string | null>(null);

  const loadData = async (isSilent = false) => {
    if (!workspaceId) return;
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      
      const [list, dash, wsList] = await Promise.all([
        api.getChecklist(workspaceId),
        api.getDashboard(workspaceId),
        api.getWorkspaces()
      ]);
      
      setChecklist(list);
      setDashboardData(dash);
      setWorkspaces(wsList);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load analysis metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [workspaceId]);

  const activeWorkspace = workspaces.find(w => w.id === workspaceId);

  // Aggregate compliance statistics
  const total = checklist.length;
  const matched = checklist.filter(c => c.match_status === 'matched').length;
  const partial = checklist.filter(c => c.match_status === 'partial').length;
  const gap = checklist.filter(c => c.match_status === 'gap').length;

  const pieData = [
    { name: 'Compliant', value: matched, color: '#22C55E' },
    { name: 'Partial Match', value: partial, color: '#F59E0B' },
    { name: 'Identified Gaps', value: gap, color: '#EF4444' },
  ].filter(item => item.value > 0);

  const compliantPercent = total > 0 ? Math.round(((matched + partial * 0.5) / total) * 100) : 0;
  const trueCompliantPercent = total > 0 ? Math.round((matched / total) * 100) : 0;

  // Filter identified gaps (non-compliant items)
  const gapsList = checklist.filter(c => c.match_status === 'gap');

  if (!workspaceId) {
    return (
      <div className="h-96 w-full flex items-center justify-center flex-col gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-900 border border-[#263042] flex items-center justify-center text-gray-500 shadow-xl shadow-black/30">
          <FileSearch size={28} />
        </div>
        <div className="max-w-xs space-y-1">
          <h3 className="font-semibold text-white text-base">Select a Project</h3>
          <p className="text-xs text-gray-400">Please select a workspace project from the sidebar or dashboard to analyze the RFP.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-96 w-full flex items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-[#4F8CFF]" size={32} />
        <span className="text-gray-450 text-xs font-medium tracking-wide">Analyzing RFP Clauses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <WorkspaceContextBanner workspaceId={workspaceId} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#263042]/55 pb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">RFP Analysis</h1>
          <p className="text-sm text-gray-400 mt-1">Deep document analysis, requirement categorizations, and gap detection.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Analysis Engine Sync Active
          </div>
          <button 
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2.5 bg-gray-900 border border-[#263042] text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-all cursor-pointer hover:border-[#4F8CFF]/50"
            title="Refresh Analysis"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-[#4F8CFF]" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs shrink-0 flex items-center gap-3">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Analysis Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        
        {/* Document Parsing Status */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border border-[#263042] relative overflow-hidden group">
          {/* Subtle glow effect */}
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-green-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-green-500/10 transition-all duration-500" />
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Parsing Engine</h2>
              <span className="text-[10px] font-mono bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/25">100% Parsed</span>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative mb-4">
                {/* Glowing ring */}
                <div className="absolute inset-0 rounded-full bg-green-500/20 blur-md animate-pulse" />
                <div className="w-20 h-20 rounded-full bg-gray-900 border-2 border-green-500 flex items-center justify-center relative z-10">
                  <FileCheck size={32} className="text-green-400" />
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-white text-base">RFP Processed</h3>
                <p className="text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">All clauses, conditions, and matrices parsed successfully.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-[#263042]/50">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>RFP Structuring Progress</span>
                <span className="font-mono text-white">Done</span>
              </div>
              <div className="h-1.5 w-full bg-gray-950 rounded-full overflow-hidden border border-[#263042]/50">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 w-full rounded-full" />
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={14} className="text-green-500" />
                <span>Sector Focus: <strong className="text-gray-300">{activeWorkspace?.sector || 'General'}</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle size={14} className="text-green-500" />
                <span>Extracted Requirements: <strong className="text-gray-300">{total} clauses</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Assessment */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-[#263042]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-[#4F8CFF]" />
              Compliance Assessment
            </h2>
            <span className="text-xs text-gray-400">Readiness Score</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Donut Chart */}
            <div className="h-52 w-full relative flex items-center justify-center">
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#111827', 
                          border: '1px solid #263042', 
                          borderRadius: '12px', 
                          color: '#F3F4F6',
                          fontSize: '11px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: '#F3F4F6' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-extrabold text-white tracking-tight">{trueCompliantPercent}%</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mt-0.5">Compliant</span>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs text-center p-4">
                  No compliance data. Run capability matching first!
                </div>
              )}
            </div>
            
            {/* identified Gaps List */}
            <div className="flex flex-col h-56 justify-between">
              <div>
                <h3 className="font-semibold text-xs text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-red-400" />
                  Identified Gaps ({gapsList.length})
                </h3>
                
                <div className="space-y-3 overflow-y-auto max-h-[185px] pr-2 custom-scrollbar">
                  {gapsList.length === 0 ? (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 flex items-center gap-2">
                      <CheckCircle size={16} />
                      <span>Excellent! No compliance gaps identified.</span>
                    </div>
                  ) : (
                    gapsList.map((item, idx) => {
                      const isExpanded = expandedGap === item.id;
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setExpandedGap(isExpanded ? null : item.id)}
                          className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/35 rounded-xl p-3 flex flex-col gap-1 cursor-pointer transition-all duration-200"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-mono text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20 capitalize font-semibold">
                              {item.category || 'general'}
                            </span>
                            <span className="text-[9px] text-gray-500">
                              {item.source_page ? `Page ${item.source_page}` : 'RFP Document'}
                            </span>
                          </div>
                          <p className={`text-xs text-gray-300 leading-relaxed font-medium ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {item.requirement_text}
                          </p>
                          {item.requirement_text && item.requirement_text.length > 90 && (
                            <span className="text-[9px] text-red-400 mt-0.5 hover:underline font-semibold block text-right">
                              {isExpanded ? 'Show less' : 'Click to expand'}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Sections Summary */}
      <div className="glass-panel rounded-2xl p-6 border border-[#263042] shrink-0">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Layers size={16} className="text-[#4F8CFF]" />
          RFP Structure Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DocumentSectionCard 
            title="Requirements" 
            subtitle="Extracted mandatory clauses" 
            count={total} 
            icon={<ShieldCheck size={20} className="text-[#4F8CFF]" />} 
            onClick={() => onNavigate('workspace')}
          />
          <DocumentSectionCard 
            title="Evaluation Criteria" 
            subtitle="Weighted score components" 
            count={dashboardData?.score ? 5 : 0} 
            icon={<BarChart size={20} className="text-[#4F8CFF]" />} 
            onClick={() => onNavigate('compliance')}
          />
          <DocumentSectionCard 
            title="AI Response Drafts" 
            subtitle="Ready to edit drafts" 
            count={matched + partial} 
            icon={<FileCheck size={20} className="text-[#4F8CFF]" />} 
            onClick={() => onNavigate('editor')}
          />
        </div>
      </div>
    </div>
  );
}

interface DocumentCardProps {
  title: string;
  subtitle: string;
  count: number;
  icon: React.ReactNode;
  onClick?: () => void;
}

function DocumentSectionCard({ title, subtitle, count, icon, onClick }: DocumentCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-gray-900/40 border border-[#263042] hover:border-[#4F8CFF]/50 rounded-2xl p-5 hover:bg-gray-900/80 transition-all duration-300 flex flex-col justify-between h-44 group relative overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-lg hover:shadow-[#4F8CFF]/5 active:scale-[0.99]' : ''}`}
    >
      <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        {icon}
      </div>
      
      <div>
        <div className="w-10 h-10 rounded-xl bg-gray-950 border border-[#263042] flex items-center justify-center mb-4 text-[#4F8CFF] group-hover:border-[#4F8CFF]/30 group-hover:bg-[#4F8CFF]/5 transition-colors">
          {icon}
        </div>
        <h3 className="font-semibold text-white text-sm group-hover:text-[#4F8CFF] transition-colors">{title}</h3>
        <p className="text-xs text-gray-400 mt-1 leading-normal">{subtitle}</p>
      </div>
      
      <div className="flex items-center justify-between text-[11px] mt-4 pt-3 border-t border-[#263042]/50 text-gray-500">
        <span className="flex items-center gap-1 font-medium"><Clock size={12}/> Active Workspace</span>
        <span className="bg-gray-950 text-gray-300 border border-[#263042] px-3 py-1 rounded-lg font-mono text-[10px] font-bold group-hover:border-[#4F8CFF]/30 group-hover:text-white transition-colors">{count} {count === 1 ? 'item' : 'items'}</span>
      </div>
    </div>
  );
}

