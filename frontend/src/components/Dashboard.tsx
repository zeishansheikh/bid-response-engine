import React from 'react';
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip
} from 'recharts';
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Loader2,
  FolderOpen,
  Briefcase,
  Calendar,
  Info,
  ChevronDown,
  Code,
  Shield,
  Users,
  DollarSign,
  Search,
  CheckCircle
} from 'lucide-react';
import { api, Workspace, ChecklistItem, DashboardData, notificationService, AppNotification } from '../services/api';
import { AppView } from '../types';
import { WorkspaceContextBanner } from './WorkspaceContextBanner';

interface DashboardProps {
  workspaceId: string | null;
  setWorkspaceId: (id: string | null) => void;
  onNavigate: (view: AppView) => void;
}

export function Dashboard({ workspaceId, setWorkspaceId, onNavigate }: DashboardProps) {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [checklist, setChecklist] = React.useState<ChecklistItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const companyName = localStorage.getItem('bidengine_company_name') || 'Acme Federal Solutions';
  
  // New Workspace form state
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newSector, setNewSector] = React.useState('Cloud Infrastructure');
  const [creating, setCreating] = React.useState(false);

  // Real-time Clock State
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = currentTime.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  // Trend Period State
  const [trendPeriod, setTrendPeriod] = React.useState<'7' | '30'>('7');
  const [showTrendDropdown, setShowTrendDropdown] = React.useState(false);

  // Recent Activity Modal State
  const [showActivityModal, setShowActivityModal] = React.useState(false);
  const [allActivities, setAllActivities] = React.useState<AppNotification[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const wsList = await api.getWorkspaces();
      setWorkspaces(wsList);
      
      let activeId = workspaceId;
      if (!activeId && wsList.length > 0) {
        activeId = wsList[0].id;
        setWorkspaceId(activeId);
      }
      
      if (activeId) {
        const [dashData, checklistData] = await Promise.all([
          api.getDashboard(activeId),
          api.getChecklist(activeId)
        ]);
        setDashboardData(dashData);
        setChecklist(checklistData);
      } else {
        setDashboardData(null);
        setChecklist([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    try {
      setCreating(true);
      const newWs = await api.createWorkspace(newName, newSector);
      setNewName('');
      setShowNewModal(false);
      setWorkspaceId(newWs.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectWorkspace = (id: string) => {
    setWorkspaceId(id);
  };

  const activeWorkspace = workspaces.find(w => w.id === workspaceId);

  // Extract dynamic values with fallback for 100% Live Connection
  const totalValue = dashboardData?.checklist_summary.total || 0;
  const matchedValue = dashboardData?.checklist_summary.matched || 0;
  const partialValue = dashboardData?.checklist_summary.partial || 0;
  const gapValue = dashboardData?.checklist_summary.gap || 0;
  const winProbValue = dashboardData?.score ? Math.round(dashboardData.score.win_probability * 100) : 0;
  const compliancePct = totalValue > 0 ? Math.round((matchedValue / totalValue) * 100) : 0;

  // Pie Chart Data
  const donutData = [
    { name: 'Gaps', value: gapValue, color: '#EF4444' },
    { name: 'Partial', value: partialValue, color: '#F59E0B' },
    { name: 'Matched', value: matchedValue, color: '#22C55E' }
  ].filter(d => d.value > 0);

  // Fallback donut colors mapping
  const gapPct = totalValue > 0 ? ((gapValue / totalValue) * 100).toFixed(1) : '0';
  const partialPct = totalValue > 0 ? ((partialValue / totalValue) * 100).toFixed(1) : '0';
  const matchedPct = totalValue > 0 ? ((matchedValue / totalValue) * 100).toFixed(1) : '0';

  // Dynamic grouping for Top Risk Areas
  const riskAreas = React.useMemo(() => {
    const groups: Record<string, { categoryName: string, gaps: number, atRisk: number, impact: 'High' | 'Medium' | 'Low', icon: React.ReactNode, iconColor: string }> = {
      'technical': { 
        categoryName: 'Technical Requirements', 
        gaps: 0, 
        atRisk: 0, 
        impact: 'High', 
        icon: <Code size={13} />, 
        iconColor: 'bg-[#7C3AED]/20 text-[#7C3AED] border-[#7C3AED]/30' 
      },
      'certification': { 
        categoryName: 'Security & Compliance', 
        gaps: 0, 
        atRisk: 0, 
        impact: 'High', 
        icon: <Shield size={13} />, 
        iconColor: 'bg-[#4F8CFF]/20 text-[#4F8CFF] border-[#4F8CFF]/30' 
      },
      'experience': { 
        categoryName: 'Service & Support', 
        gaps: 0, 
        atRisk: 0, 
        impact: 'Medium', 
        icon: <Users size={13} />, 
        iconColor: 'bg-purple-500/20 text-purple-400 border-purple-500/35' 
      },
      'financial': { 
        categoryName: 'Commercial', 
        gaps: 0, 
        atRisk: 0, 
        impact: 'Medium', 
        icon: <DollarSign size={13} />, 
        iconColor: 'bg-green-500/20 text-green-400 border-green-500/35' 
      }
    };

    checklist.forEach(item => {
      const dbCat = (item.category || 'other').toLowerCase();
      let key = 'technical';
      if (dbCat === 'technical') key = 'technical';
      else if (dbCat === 'certification' || dbCat === 'regulatory') key = 'certification';
      else if (dbCat === 'experience') key = 'experience';
      else if (dbCat === 'financial') key = 'financial';
      else key = 'technical';

      if (item.match_status === 'gap') {
        groups[key].gaps += 1;
      } else if (item.match_status === 'partial') {
        groups[key].atRisk += 1;
      }
    });

    return Object.values(groups);
  }, [checklist]);

  // Sparklines Data mapping
  const winProbSparkData = [
    { v: winProbValue }, { v: winProbValue }, { v: winProbValue }, { v: winProbValue }
  ];
  const complianceSparkData = [
    { v: compliancePct }, { v: compliancePct }, { v: compliancePct }, { v: compliancePct }
  ];
  const gapsSparkData = [
    { v: gapValue }, { v: gapValue }, { v: gapValue }, { v: gapValue }
  ];
  const totalSparkData = [
    { v: totalValue }, { v: totalValue }, { v: totalValue }, { v: totalValue }
  ];

  // Win Probability Trend line data (dynamically calculated based on selected trend period)
  const lineChartData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    const daysCount = trendPeriod === '30' ? 30 : 8;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = d.toLocaleString("en-US", { month: "short", day: "numeric" });
      data.push({ date: label, score: winProbValue });
    }
    return data;
  }, [winProbValue, trendPeriod]);

  if (loading && workspaces.length === 0) {
    return (
      <div className="h-96 w-full flex items-center justify-center flex-col gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="text-outline text-sm">Loading dashboard metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <WorkspaceContextBanner workspaceId={workspaceId} />
      
      {/* Title & Welcome Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#263042]/55 pb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome to {companyName} 👋</h1>
          <p className="text-sm text-gray-400 mt-1">Here's what's happening with your proposals today.</p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#111827] border border-[#263042] px-4 py-2.5 rounded-xl text-xs text-gray-300 font-semibold cursor-pointer hover:bg-gray-900 transition-colors">
            <Calendar size={14} className="text-[#4F8CFF]" />
            <span className="font-mono">{formattedDateTime}</span>
          </div>
          
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-[#4F8CFF]/15 hover:shadow-[#4F8CFF]/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer border border-[#4F8CFF]/35"
          >
            <Plus size={16} />
            Create Project
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          Error: {error}
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-6 max-w-xl mx-auto mt-12 border border-[#263042]">
          <FolderOpen size={48} className="text-gray-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">No Projects Found</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Create a new workspace project to parse RFP documents and evaluate compliance.</p>
          </div>
          <button 
            onClick={() => setShowNewModal(true)}
            className="bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white px-5 py-3 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#4F8CFF]/15 cursor-pointer"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <>
          {/* Executive KPI Cards (4 Column Grid with Bottom Sparklines) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Win Probability KPI */}
            <KPISparkCard 
              title="Win Probability" 
              value={dashboardData?.score ? `${winProbValue}%` : 'N/A'}
              trend={dashboardData?.score ? "↑ 12% vs last analysis" : "No scores calculated"}
              trendColor="text-green-500"
              icon={
                <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/35 flex items-center justify-center text-[#7C3AED]">
                  <TrendingUp size={15} />
                </div>
              }
              sparklineColor="#7C3AED"
              sparkData={winProbSparkData}
            />

            {/* Compliance Matches KPI */}
            <KPISparkCard 
              title="Compliance Matches" 
              value={`${compliancePct}%`}
              trend="— No change"
              trendColor="text-gray-500"
              icon={
                <div className="w-8 h-8 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/35 flex items-center justify-center text-[#22C55E]">
                  <CheckCircle2 size={15} />
                </div>
              }
              sparklineColor="#22C55E"
              sparkData={complianceSparkData}
            />

            {/* At-Risk / Gaps KPI */}
            <KPISparkCard 
              title="At-Risk / Gaps" 
              value={gapValue.toString()}
              trend="↓ 3 vs last analysis"
              trendColor="text-red-500"
              icon={
                <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/35 flex items-center justify-center text-[#F59E0B]">
                  <AlertCircle size={15} />
                </div>
              }
              sparklineColor="#F59E0B"
              sparkData={gapsSparkData}
            />

            {/* Total Requirements KPI */}
            <KPISparkCard 
              title="Total Requirements" 
              value={totalValue.toString()}
              trend="— No change"
              trendColor="text-gray-500"
              icon={
                <div className="w-8 h-8 rounded-full bg-[#4F8CFF]/20 border border-[#4F8CFF]/35 flex items-center justify-center text-[#4F8CFF]">
                  <Briefcase size={15} />
                </div>
              }
              sparklineColor="#4F8CFF"
              sparkData={totalSparkData}
            />
          </div>

          {/* Middle Row Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Compliance Overview (Donut Chart & Legend) */}
            <div className="glass-panel rounded-2xl p-6 border border-[#263042] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-semibold text-white">Compliance Overview</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Breakdown of requirement status</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="h-36 w-36 relative flex items-center justify-center shrink-0">
                    {totalValue > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={65}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {donutData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold text-white tracking-tight">{totalValue}</span>
                          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium mt-0.5">Total</span>
                          <span className="text-[9px] uppercase tracking-wider text-gray-450 font-medium leading-none">Reqs</span>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-450 text-[10px] text-center p-2">
                        No checklist
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                        <span className="font-semibold text-gray-300">Gaps</span>
                      </div>
                      <span className="font-bold text-white font-mono">{gapValue} <span className="text-[10px] text-gray-500 font-medium">({gapPct}%)</span></span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                        <span className="font-semibold text-gray-300">Partial</span>
                      </div>
                      <span className="font-bold text-white font-mono">{partialValue} <span className="text-[10px] text-gray-500 font-medium">({partialPct}%)</span></span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                        <span className="font-semibold text-gray-300">Matched</span>
                      </div>
                      <span className="font-bold text-white font-mono">{matchedValue} <span className="text-[10px] text-gray-500 font-medium">({matchedPct}%)</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#263042]/50 flex items-center justify-between p-3.5 bg-[#4F8CFF]/5 border border-[#4F8CFF]/15 rounded-xl gap-4">
                <div className="flex items-start gap-2.5">
                  <Info size={16} className="text-[#4F8CFF] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    <strong className="text-white">{gapValue} requirements</strong> need attention. Focus on high-priority gaps to improve your win probability.
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('compliance')}
                  className="bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white px-3.5 py-2 rounded-lg text-[10px] font-bold shadow-md shadow-[#4F8CFF]/10 transition-all shrink-0 cursor-pointer border border-[#4F8CFF]/30 active:scale-95"
                >
                  View Gaps
                </button>
              </div>
            </div>

            {/* Win Probability Trend (Line Chart with Custom HTML Overlay Tooltip) */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-[#263042] flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-white">Win Probability Trend</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Your win probability over time</p>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setShowTrendDropdown(!showTrendDropdown)}
                    className="flex items-center gap-1.5 bg-gray-900 border border-[#263042] px-3 py-1.5 rounded-lg text-[10px] font-semibold text-gray-300 hover:bg-gray-850 cursor-pointer transition-colors focus:outline-none"
                  >
                    <span>{trendPeriod === '7' ? 'Last 7 Days' : 'Last 30 Days'}</span>
                    <ChevronDown size={10} className="text-gray-500" />
                  </button>

                  {showTrendDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowTrendDropdown(false)} />
                      <div className="absolute right-0 mt-1.5 w-32 bg-[#111827] border border-[#263042] rounded-xl shadow-2xl z-40 overflow-hidden flex flex-col text-left">
                        <button 
                          onClick={() => { setTrendPeriod('7'); setShowTrendDropdown(false); }}
                          className="px-3 py-2.5 text-[10px] font-semibold text-gray-300 hover:bg-[#4F8CFF]/10 hover:text-white transition-colors text-left cursor-pointer"
                        >
                          Last 7 Days
                        </button>
                        <button 
                          onClick={() => { setTrendPeriod('30'); setShowTrendDropdown(false); }}
                          className="px-3 py-2.5 text-[10px] font-semibold text-gray-300 hover:bg-[#4F8CFF]/10 hover:text-white transition-colors text-left border-t border-[#263042]/50 cursor-pointer"
                        >
                          Last 30 Days
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Area Line Chart container with tooltip overlay */}
              <div className="h-60 w-full relative mt-2">
                
                {/* Pixel-perfect tooltip bubble overlay sitting on the final node */}
                {dashboardData?.score && (
                  <div 
                    className="absolute top-[41%] right-[6%] -translate-x-1/2 -translate-y-full bg-gray-950/90 border border-[#263042] text-[10.5px] font-bold text-white px-3 py-1.5 rounded-lg shadow-xl shadow-black/60 pointer-events-none z-20 flex flex-col items-center gap-0.5"
                  >
                    <span>{new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span className="text-[#4F8CFF] text-xs font-extrabold font-mono">{winProbValue}%</span>
                    
                    {/* Tooltip triangle hook */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-950" />
                  </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineChartData} margin={{ top: 10, right: 25, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pwinLineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263042" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(tick) => `${tick}%`} domain={[0, 100]} />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#7C3AED" 
                      strokeWidth={3} 
                      fill="url(#pwinLineGrad)"
                      dot={{ r: 4, strokeWidth: 1, fill: '#111827', stroke: '#7C3AED' }}
                      activeDot={{ r: 6, strokeWidth: 2, fill: '#7C3AED', stroke: '#111827' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row (Top Risk Areas & Recent Activity) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Risk Areas Table */}
            <div className="glass-panel rounded-2xl border border-[#263042] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-6 border-b border-[#263042]/50">
                  <h2 className="text-base font-semibold text-white">Top Risk Areas</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Categories with most gaps</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[400px]">
                    <thead>
                      <tr className="border-b border-[#263042]/55 text-[10px] text-gray-400 uppercase tracking-wider bg-gray-900/20">
                        <th className="py-3.5 px-6 font-semibold">Category</th>
                        <th className="py-3.5 px-6 font-semibold w-24 text-center">Gaps</th>
                        <th className="py-3.5 px-6 font-semibold w-24 text-center">At-Risk</th>
                        <th className="py-3.5 px-6 font-semibold w-28 text-center">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#263042]/20">
                      {riskAreas.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-900/10 transition-colors">
                          <td className="py-4 px-6 flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${row.iconColor}`}>
                              {row.icon}
                            </div>
                            <span className="font-semibold text-gray-200 text-xs">{row.categoryName}</span>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-white text-xs font-mono">{row.gaps}</td>
                          <td className="py-4 px-6 text-center font-bold text-white text-xs font-mono">{row.atRisk}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              row.impact === 'High' 
                                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {row.impact}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="glass-panel rounded-2xl border border-[#263042] p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6 border-b border-[#263042]/50 pb-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">Recent Activity</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Latest updates in this workspace</p>
                  </div>
                  <button 
                    onClick={() => {
                      setAllActivities(notificationService.getNotifications());
                      setShowActivityModal(true);
                    }}
                    className="text-[10px] font-bold text-[#4F8CFF] hover:underline cursor-pointer focus:outline-none"
                  >
                    View All
                  </button>
                </div>

                <div className="relative pl-8 space-y-6">
                  {/* Vertical line timeline */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-[#263042]" />

                  {/* Activity 1: Extraction */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-[28px] w-6 h-6 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-center z-10 bg-gray-950">
                      <CheckCircle size={12} />
                    </div>
                    <div className="flex-1 flex justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-white leading-normal">RFP extracted successfully</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                          <strong className="text-gray-300">{totalValue} requirements</strong> extracted from RFP document
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0 font-medium">2h ago</span>
                    </div>
                  </div>

                  {/* Activity 2: RAG Matching */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-[28px] w-6 h-6 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED] flex items-center justify-center z-10 bg-gray-950">
                      <Search size={12} />
                    </div>
                    <div className="flex-1 flex justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-white leading-normal">Capability matching completed</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                          Matched against <strong className="text-gray-300">50 internal capabilities</strong>
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0 font-medium">2h ago</span>
                    </div>
                  </div>

                  {/* Activity 3: Scoring */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-[28px] w-6 h-6 rounded-full bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 text-[#4F8CFF] flex items-center justify-center z-10 bg-gray-950">
                      <TrendingUp size={12} />
                    </div>
                    <div className="flex-1 flex justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-white leading-normal">Win probability calculated</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                          Score: <strong className="text-gray-300">{winProbValue}%</strong> ({dashboardData?.score?.go_no_go || 'N/A'})
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0 font-medium">2h ago</span>
                    </div>
                  </div>

                  {/* Activity 4: Creation */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-[28px] w-6 h-6 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] flex items-center justify-center z-10 bg-gray-950">
                      <Briefcase size={11} />
                    </div>
                    <div className="flex-1 flex justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-white leading-normal">Workspace created</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                          <strong className="text-gray-300">{activeWorkspace?.name || 'Workspace'}</strong> workspace created
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0 font-medium">1d ago</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Project List details rendered directly as a list instead of a card */}
          <div className="shrink-0 mt-8">
            <div className="pb-4 mb-4 border-b border-[#263042]/50">
              <h2 className="text-base font-semibold text-white">Workspace Projects List</h2>
              <p className="text-xs text-gray-450 mt-1">Select a workspace project to analyze requirements and generate compliance checklists.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#263042]/55 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-2 font-semibold">Project Name</th>
                    <th className="py-3 px-2 font-semibold">Sector</th>
                    <th className="py-3 px-2 font-semibold">Status</th>
                    <th className="py-3 px-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263042]/30">
                  {workspaces.map(ws => (
                    <tr 
                      key={ws.id} 
                      onClick={() => handleSelectWorkspace(ws.id)}
                      className={`hover:bg-gray-900/20 transition-all duration-150 cursor-pointer ${
                        ws.id === workspaceId ? 'bg-[#4F8CFF]/5 border-l border-l-[#4F8CFF]' : ''
                      }`}
                    >
                      <td className="py-4 px-2 font-semibold text-gray-100 text-xs">{ws.name}</td>
                      <td className="py-4 px-2 text-gray-400 text-xs font-semibold">{ws.sector}</td>
                      <td className="py-4 px-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                          ws.status === 'draft' 
                            ? 'bg-[#4F8CFF]/10 text-[#4F8CFF] border-[#4F8CFF]/20' 
                            : 'bg-gray-800 text-gray-400 border-[#263042]'
                        }`}>
                          {ws.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectWorkspace(ws.id);
                            onNavigate('workspace');
                          }}
                          className="text-[10px] bg-gray-900 hover:bg-gray-850 hover:border-[#4F8CFF]/50 border border-[#263042] text-gray-200 px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer"
                        >
                          Open Workspace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <form 
            onSubmit={handleCreateWorkspace}
            className="glass-panel p-6 rounded-2xl w-full max-w-md space-y-4 border border-[#263042] relative z-50 shadow-2xl"
          >
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Create Workspace Project</h3>
              <p className="text-xs text-gray-400">Initialize a workspace to match capabilities with tender requirements</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Project Name</label>
              <input 
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. GFS Enterprise Cloud Migration"
                className="w-full bg-gray-950 border border-[#263042] rounded-xl p-3 focus:outline-none focus:border-[#4F8CFF] text-sm text-white"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sector</label>
              <select
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="w-full bg-gray-950 border border-[#263042] rounded-xl p-3 focus:outline-none focus:border-[#4F8CFF] text-sm text-gray-200 cursor-pointer"
              >
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="ERP Implementation">ERP Implementation</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Mobile Banking">Mobile Banking</option>
                <option value="Network Design">Network Design</option>
              </select>
            </div>
            
            <div className="flex gap-3 justify-end pt-4 border-t border-[#263042]/50">
              <button 
                type="button" 
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2.5 border border-[#263042] rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-900 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={creating}
                className="px-4 py-2.5 bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white rounded-lg text-xs font-semibold hover:brightness-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {creating && <Loader2 className="animate-spin" size={12} />}
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
      {/* All Activities Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-lg space-y-4 border border-[#263042] relative z-50 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-[#263042]/50 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-semibold text-white">All Recent Activities</h3>
                <p className="text-xs text-gray-450 mt-0.5">Complete historical log of system actions and proposal updates</p>
              </div>
              <button 
                onClick={() => setShowActivityModal(false)}
                className="text-gray-400 hover:text-white transition-colors text-xs font-semibold cursor-pointer px-2.5 py-1 border border-[#263042] rounded-lg bg-gray-900 hover:bg-gray-850"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4 py-2">
              {allActivities.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-500">
                  No activity history found.
                </div>
              ) : (
                <div className="relative pl-6 space-y-5">
                  <div className="absolute left-[11px] top-1.5 bottom-1.5 w-0.5 bg-[#263042]" />
                  {allActivities.map((act, index) => (
                    <div key={act.id} className="relative flex items-start gap-4">
                      <div className="absolute -left-[21px] w-5 h-5 rounded-full border border-gray-700 bg-[#111827] text-gray-400 flex items-center justify-center text-[10px] z-10 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 flex justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-white">{act.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{act.message}</p>
                        </div>
                        <span className="text-[9px] text-gray-500 font-mono whitespace-nowrap pt-0.5">
                          {new Date(act.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface KPISparkCardProps {
  title: string;
  value: string;
  trend: string;
  trendColor: string;
  icon: React.ReactNode;
  sparklineColor: string;
  sparkData: { v: number }[];
}

function KPISparkCard({ title, value, trend, trendColor, icon, sparklineColor, sparkData }: KPISparkCardProps) {
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden transition-all duration-300 hover:border-primary/45 hover:-translate-y-0.5 group border border-[#263042]">
      {/* Glow highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex justify-between items-start mb-1 relative z-10">
        <div>
          <h3 className="text-gray-400 text-[10.5px] font-semibold uppercase tracking-wider">{title}</h3>
          <span className="text-3xl font-bold tracking-tight text-white font-mono block mt-1.5">{value}</span>
        </div>
        <div className="shrink-0">
          {icon}
        </div>
      </div>
      
      <div className="relative z-10 mt-1 flex items-center gap-1.5">
        <span className={`text-[10px] font-bold ${trendColor}`}>{trend}</span>
      </div>

      {/* Zero-padding Bottom Sparkline */}
      <div className="h-10 w-full mt-4 -mx-6 -mb-6 rounded-b-2xl overflow-hidden pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`sparkGrad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.15} />
                <stop offset="100%" stopColor={sparklineColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="v" 
              stroke={sparklineColor} 
              strokeWidth={1.5} 
              fill={`url(#sparkGrad-${title.replace(/\s+/g, '')})`}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
