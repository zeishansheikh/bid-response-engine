import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Calculator, 
  Loader2,
  TrendingDown,
  Layers,
  DollarSign,
  Users
} from 'lucide-react';
import { api, ScoreData, ChecklistItem, notificationService } from '../services/api';
import { WorkspaceContextBanner } from './WorkspaceContextBanner';

interface WinProbabilityProps {
  workspaceId: string | null;
}

export function WinProbability({ workspaceId }: WinProbabilityProps) {
  const [scoreData, setScoreData] = React.useState<ScoreData | null>(null);
  const [checklist, setChecklist] = React.useState<ChecklistItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [scoring, setScoring] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Scoring parameters inputs
  const [rfpBudget, setRfpBudget] = React.useState<number>(45000000);
  const [competitorCount, setCompetitorCount] = React.useState<number>(3);

  const loadData = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      setError(null);
      
      const [dash, list, wsList] = await Promise.all([
        api.getDashboard(workspaceId),
        api.getChecklist(workspaceId),
        api.getWorkspaces()
      ]);
      
      setScoreData(dash.score);
      setChecklist(list);
      
      const currentWs = wsList.find(w => w.id === workspaceId);
      if (currentWs) {
        const sectorRaw = currentWs.sector;
        let budgetVal = Number(localStorage.getItem('govprop_default_budget')) || 45000000;
        let competitorsVal = Number(localStorage.getItem('govprop_default_competitor_count')) || 3;
        
        if (sectorRaw && sectorRaw.trim().startsWith('{') && sectorRaw.trim().endsWith('}')) {
          try {
            const meta = JSON.parse(sectorRaw);
            if (meta.budget) budgetVal = Number(meta.budget);
            if (meta.competitor_count) competitorsVal = Number(meta.competitor_count);
          } catch (e) {
            console.error("Failed to parse workspace sector JSON metadata:", e);
          }
        }
        
        setRfpBudget(budgetVal);
        setCompetitorCount(competitorsVal);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load win probability data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleRunScoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    try {
      setScoring(true);
      setError(null);
      notificationService.addNotification('Calculating scores', 'Win probability calculation triggered...', 'scoring');
      const newScore = await api.calculateScore(workspaceId, rfpBudget, competitorCount);
      setScoreData(newScore);
      notificationService.addNotification('Scores calculated', `Win probability calculated successfully! Score: ${Math.round(newScore.win_probability * 100)}% (${newScore.go_no_go})`, 'scoring');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to run scoring algorithm');
      notificationService.addNotification('Scoring failed', `Failed to calculate scores: ${err.message || 'Error'}`, 'scoring');
    } finally {
      setScoring(false);
    }
  };

  // Prepare chart data from sub-scores
  const chartData = scoreData ? [
    { name: 'Budget Alignment', score: Math.round(scoreData.budget_alignment_score * 100) },
    { name: 'Past Win Rate', score: Math.round(scoreData.past_win_rate_score * 100) },
    { name: 'Compliance Rate', score: Math.round(scoreData.compliance_pass_rate * 100) },
    { name: 'Competitor Score', score: Math.round(scoreData.competitor_score * 100) }
  ] : [];

  // Generate dynamic insights based on checklist gaps and scores
  const getInsights = () => {
    const insights = [];
    
    // Check for critical gaps (legal/certification)
    const criticalGaps = checklist.filter(c => c.match_status === 'gap' && c.category && ['legal', 'certification'].includes(c.category));
    if (criticalGaps.length > 0) {
      insights.push({
        type: 'weakness',
        title: `${criticalGaps.length} Critical Gaps detected in Legal/Certification`,
        impact: 'FORCED NO-GO',
        action: `Unresolved gaps in categories: ${Array.from(new Set(criticalGaps.map(g => g.category))).join(', ')}. Please add credentials in the capability library.`
      });
    }

    // Check for general gaps
    const generalGaps = checklist.filter(c => c.match_status === 'gap');
    if (generalGaps.length > criticalGaps.length) {
      insights.push({
        type: 'weakness',
        title: `${generalGaps.length - criticalGaps.length} Technical/Other compliance gaps detected`,
        impact: 'Reduces PWin',
        action: 'Review partial matches or find alternative project proof chunks in the library.'
      });
    }

    // Add budget insight
    if (scoreData) {
      if (scoreData.budget_alignment_score < 0.6) {
        insights.push({
          type: 'opportunity',
          title: 'Budget is not fully aligned with past project size',
          impact: '+10% PWin Potential',
          action: 'Adjust the RFP budget estimation or review if higher-tier projects could be added to capability proof.'
        });
      } else {
        insights.push({
          type: 'strength',
          title: 'Strong Budget Alignment score',
          impact: 'Optimal Score',
          action: 'RFP value is well within the typical scope of completed projects.'
        });
      }
    }

    return insights;
  };

  const insights = getInsights();

  if (!workspaceId) {
    return (
      <div className="h-96 w-full flex items-center justify-center flex-col gap-3">
        <AlertCircle className="text-gray-500" size={32} />
        <span className="text-gray-400 text-sm">Please select a workspace project first.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-96 w-full flex items-center justify-center flex-col gap-2">
        <Loader2 className="animate-spin text-[#4F8CFF]" size={28} />
        <span className="text-gray-450 text-xs">Loading win probability dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <WorkspaceContextBanner workspaceId={workspaceId} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#263042]/55 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Win Probability</h1>
          <p className="text-sm text-gray-400 mt-1">Run V1 weighted scoring models to evaluate project viability and capture PWin.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          Error: {error}
        </div>
      )}

      {/* Main Score Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* SVG Gauge Donut Chart */}
        <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden border border-[#263042]">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-amber-400 to-green-500" />
          
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Current PWin Score</h2>
          
          {scoreData ? (
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="84" fill="none" stroke="#1F2937" strokeWidth="12" />
                <circle 
                  cx="96" 
                  cy="96" 
                  r="84" 
                  fill="none" 
                  stroke={scoreData.win_probability >= 0.6 ? '#22C55E' : scoreData.win_probability >= 0.35 ? '#F59E0B' : '#EF4444'} 
                  strokeWidth="12" 
                  strokeDasharray="527.7" 
                  strokeDashoffset={527.7 - (527.7 * scoreData.win_probability)} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-out" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold tracking-tight text-white font-mono">
                  {Math.round(scoreData.win_probability * 100)}
                  <span className="text-xl text-gray-450 ml-0.5">%</span>
                </span>
                <span className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">PWin Probability</span>
              </div>
            </div>
          ) : (
            <div className="w-48 h-48 rounded-full border border-[#263042]/80 bg-gray-900/50 flex items-center justify-center text-gray-500 text-xs text-center p-6 font-medium">
              Scoring Model Not Run Yet
            </div>
          )}

          {scoreData && (
            <div className="mt-8 text-center space-y-4">
              <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border tracking-wider uppercase ${
                scoreData.go_no_go === 'GO' 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                  : scoreData.go_no_go === 'NO-GO'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  scoreData.go_no_go === 'GO' ? 'bg-green-500' : scoreData.go_no_go === 'NO-GO' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
                Decision: {scoreData.go_no_go}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed px-2 font-medium">
                {scoreData.rationale}
              </p>
            </div>
          )}
        </div>

        {/* Input Parameters Form & Recharts Bar Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-[#263042] flex flex-col justify-between">
          <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-[#263042]/50 pb-6 mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Scoring Parameters</h2>
              <p className="text-xs text-gray-400 mt-0.5">Input RFP metrics to execute decision models</p>
            </div>
            
            <form onSubmit={handleRunScoring} className="flex flex-wrap gap-4 items-end flex-1 justify-end">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">RFP Budget (PKR)</label>
                <input 
                  type="number"
                  value={rfpBudget}
                  onChange={(e) => setRfpBudget(Number(e.target.value))}
                  className="bg-gray-950 border border-[#263042] text-white px-3 py-2 rounded-xl text-xs w-36 focus:outline-none focus:border-[#4F8CFF] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Competitors</label>
                <input 
                  type="number"
                  min="1"
                  value={competitorCount}
                  onChange={(e) => setCompetitorCount(Number(e.target.value))}
                  className="bg-gray-950 border border-[#263042] text-white px-3 py-2 rounded-xl text-xs w-24 focus:outline-none focus:border-[#4F8CFF] font-mono"
                />
              </div>

              <button 
                type="submit"
                disabled={scoring}
                className="flex items-center gap-1.5 bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:brightness-105 active:translate-y-0 hover:-translate-y-0.5 transition-all shadow-md shadow-[#4F8CFF]/15 cursor-pointer disabled:opacity-50"
              >
                {scoring ? (
                  <>
                    <Loader2 className="animate-spin" size={12} />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator size={14} />
                    Calculate PWin
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="h-60 w-full">
            {scoreData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F8CFF" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#4F8CFF" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263042" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(79, 140, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #263042', borderRadius: '12px', color: '#F3F4F6', fontSize: '12px' }}
                  />
                  <Bar dataKey="score" fill="url(#scoreGrad)" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                Fill in parameters and calculate PWin to view sub-score breakdowns.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      {scoreData && (
        <div className="glass-panel rounded-2xl p-6 border border-[#263042]">
          <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
            <Target size={18} className="text-[#4F8CFF]" />
            Actionable Insights to Improve PWin
          </h2>
          
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="p-4 bg-green-500/5 border border-green-500/20 text-green-400 rounded-xl text-xs flex items-center gap-2.5 font-medium">
                <CheckCircle size={16} />
                No negative gaps found. Win probability is optimized for this RFP.
              </div>
            ) : (
              insights.map((insight, idx) => (
                <InsightRow 
                  key={idx}
                  type={insight.type as any}
                  title={insight.title}
                  impact={insight.impact}
                  action={insight.action}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InsightRow({ type, title, impact, action }: { type: 'weakness' | 'strength' | 'opportunity', title: string, impact: string, action: string, key?: any }) {
  const getConfig = () => {
    switch(type) {
      case 'weakness': return { icon: <AlertCircle size={16} className="text-red-400" />, border: 'border-l-red-500 bg-red-500/5' };
      case 'strength': return { icon: <CheckCircle size={16} className="text-green-400" />, border: 'border-l-green-500 bg-green-500/5' };
      case 'opportunity': return { icon: <TrendingUp size={16} className="text-[#4F8CFF]" />, border: 'border-l-[#4F8CFF] bg-[#4F8CFF]/5' };
    }
  };

  const config = getConfig();

  return (
    <div className={`rounded-r-xl border-y border-r border-[#263042] p-4.5 border-l-4 ${config.border} flex flex-col md:flex-row gap-4 justify-between md:items-center`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{config.icon}</div>
        <div>
          <h4 className="font-semibold text-gray-200 text-sm leading-relaxed">{title}</h4>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed font-medium">{action}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-7 md:ml-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-900 border border-[#263042] px-2.5 py-1.5 rounded-lg">
          Impact: <span className={type === 'weakness' ? 'text-red-400 font-extrabold' : 'text-[#4F8CFF] font-extrabold'}>{impact}</span>
        </div>
      </div>
    </div>
  );
}
