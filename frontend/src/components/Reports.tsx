import React from 'react';
import { 
  LineChart, 
  BarChart, 
  PieChart, 
  Award, 
  CheckSquare, 
  AlertTriangle, 
  Layers, 
  FileText,
  TrendingUp,
  Download,
  Calendar,
  Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { api, Workspace, DashboardData, ChecklistItem } from '../services/api';
import { WorkspaceContextBanner } from './WorkspaceContextBanner';

interface ReportsProps {
  workspaceId: string | null;
}

export function Reports({ workspaceId }: ReportsProps) {
  const [loading, setLoading] = React.useState(true);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [checklist, setChecklist] = React.useState<ChecklistItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [exportStatus, setExportStatus] = React.useState<{ show: boolean; msg: string } | null>(null);

  React.useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        setError(null);
        
        const wsList = await api.getWorkspaces();
        setWorkspaces(wsList);

        if (workspaceId) {
          try {
            const dash = await api.getDashboard(workspaceId);
            setDashboardData(dash);
            
            const check = await api.getChecklist(workspaceId);
            setChecklist(check);
          } catch (wsErr) {
            console.warn("Failed to load workspace specific metrics", wsErr);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load reports data");
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#4F8CFF]" size={32} />
        <p className="text-gray-400 text-sm font-medium">Analyzing BidEngine data & metrics...</p>
      </div>
    );
  }

  const activeWorkspace = workspaces.find(w => w.id === workspaceId);

  // If no workspace data is loaded
  if (!workspaceId || workspaces.length === 0) {
    return (
      <div className="glass-panel border border-[#263042] rounded-2xl p-12 text-center max-w-xl mx-auto my-12 space-y-4">
        <Layers className="mx-auto text-gray-500" size={48} />
        <h3 className="text-white font-bold text-lg">No reports have been generated yet</h3>
        <p className="text-gray-400 text-xs leading-relaxed">
          Please select or initialize an active workspace with uploaded RFP documents and requirements to view executive summaries, win probabilities, and compliance distribution metrics.
        </p>
      </div>
    );
  }

  const summary = dashboardData?.checklist_summary;
  const score = dashboardData?.score;

  const formatWinProbability = (val: number) => {
    if (val <= 1) {
      return `${Math.round(val * 100)}%`;
    }
    return `${Math.round(val)}%`;
  };

  const formatScoreValue = (val: number) => {
    if (val <= 1) {
      const pct = val * 100;
      return pct % 1 === 0 ? pct.toString() : pct.toFixed(1);
    }
    return Math.round(val).toString();
  };

  const handleExportReport = async (format: 'pdf' | 'docx') => {
    if (!workspaceId || !activeWorkspace) return;
    
    const suggestedName = `Executive_Report_${activeWorkspace.name.replace(/\s+/g, '_')}.${format}`;
    const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    let fileBlob: Blob;
    let rawData: any;

    if (format === 'pdf') {
      // Create binary PDF via jsPDF
      const doc = new jsPDF();
      
      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("BIDENGINE EXECUTIVE PROPOSAL INTELLIGENCE REPORT", 14, 20);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 24, 196, 24);
      
      // Metadata
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Workspace Name: ${activeWorkspace.name}`, 14, 32);
      doc.text(`Industry Sector: ${activeWorkspace.sector.toUpperCase()}`, 14, 38);
      doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 44);
      
      doc.line(14, 48, 196, 48);
      
      // Executive Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("EXECUTIVE SUMMARY", 14, 56);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let y = 64;
      if (score) {
        doc.text(`Win Probability Score: ${formatWinProbability(score.win_probability)}`, 14, y);
        y += 6;
        doc.text(`Pursuit Decision: ${score.go_no_go}`, 14, y);
        y += 6;
        
        const rationaleLines = doc.splitTextToSize(`Decision Rationale: ${score.rationale}`, 180);
        doc.text(rationaleLines, 14, y);
        y += rationaleLines.length * 5 + 4;
      } else {
        doc.text("Win Probability: N/A (Scoring not calculated)", 14, y);
        y += 10;
      }
      
      doc.line(14, y, 196, y);
      y += 8;
      
      // Compliance Metrics
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("COMPLIANCE & CHECKLIST METRICS", 14, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total RFP Requirements: ${totalReq}`, 14, y);
      y += 6;
      doc.text(`Fully Matched Capabilities: ${matched} (${matchPct}%)`, 14, y);
      y += 6;
      doc.text(`Partially Matched Capabilities: ${partial} (${partialPct}%)`, 14, y);
      y += 6;
      doc.text(`Compliance Gaps Identified: ${gap} (${gapPct}%)`, 14, y);
      y += 10;
      
      doc.line(14, y, 196, y);
      y += 8;
      
      // Win Probability Breakdown
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("WIN PROBABILITY DISTRIBUTION BREAKDOWN", 14, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (score) {
        doc.text(`Budget Alignment Rating: ${formatScoreValue(score.budget_alignment_score)}/100`, 14, y);
        y += 6;
        doc.text(`Past Sector Win Rate: ${formatScoreValue(score.past_win_rate_score)}/100`, 14, y);
        y += 6;
        doc.text(`Compliance Pass Rate: ${formatScoreValue(score.compliance_pass_rate)}/100`, 14, y);
        y += 6;
        doc.text(`Competitor Intensity Score: ${formatScoreValue(score.competitor_score)}/100`, 14, y);
        y += 10;
      } else {
        doc.text("Metrics not available.", 14, y);
        y += 10;
      }
      
      // Checklist Items
      if (checklist.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("RFP COMPLIANCE ITEMS CHECKLIST", 14, y);
        y += 8;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        checklist.forEach((item, idx) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const itemHeader = `${idx + 1}. [${item.match_status.toUpperCase()}] Category: ${item.category} | Page: ${item.source_page || 'N/A'}`;
          doc.setFont("helvetica", "bold");
          doc.text(itemHeader, 14, y);
          y += 5;
          
          doc.setFont("helvetica", "normal");
          const reqLines = doc.splitTextToSize(`Req: ${item.requirement_text}`, 180);
          doc.text(reqLines, 14, y);
          y += reqLines.length * 4.5 + 4;
        });
      }
      
      const arrayBuffer = doc.output('arraybuffer');
      fileBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      rawData = arrayBuffer;
    } else {
      // DOCX - formatted text content compatible with Word
      let reportText = `==================================================\n`;
      reportText += `BIDENGINE EXECUTIVE PROPOSAL INTELLIGENCE REPORT\n`;
      reportText += `==================================================\n\n`;
      reportText += `Workspace Name: ${activeWorkspace.name}\n`;
      reportText += `Industry Sector: ${activeWorkspace.sector.toUpperCase()}\n`;
      reportText += `Generated Date: ${new Date().toLocaleString()}\n\n`;
      
      reportText += `--------------------------------------------------\n`;
      reportText += `EXECUTIVE SUMMARY\n`;
      reportText += `--------------------------------------------------\n`;
      if (score) {
        reportText += `Win Probability Score: ${formatWinProbability(score.win_probability)}\n`;
        reportText += `Pursuit Decision: ${score.go_no_go}\n`;
        reportText += `Decision Rationale: ${score.rationale}\n\n`;
      } else {
        reportText += `Win Probability: N/A (Scoring not calculated)\n\n`;
      }
      
      reportText += `--------------------------------------------------\n`;
      reportText += `COMPLIANCE & CHECKLIST METRICS\n`;
      reportText += `--------------------------------------------------\n`;
      reportText += `Total RFP Requirements: ${totalReq}\n`;
      reportText += `Fully Matched Capabilities: ${matched} (${matchPct}%)\n`;
      reportText += `Partially Matched Capabilities: ${partial} (${partialPct}%)\n`;
      reportText += `Compliance Gaps Identified: ${gap} (${gapPct}%)\n\n`;
      
      reportText += `--------------------------------------------------\n`;
      reportText += `WIN PROBABILITY DISTRIBUTION BREAKDOWN\n`;
      reportText += `--------------------------------------------------\n`;
      if (score) {
        reportText += `Budget Alignment Rating: ${formatScoreValue(score.budget_alignment_score)}/100\n`;
        reportText += `Past Sector Win Rate: ${formatScoreValue(score.past_win_rate_score)}/100\n`;
        reportText += `Compliance Pass Rate: ${formatScoreValue(score.compliance_pass_rate)}/100\n`;
        reportText += `Competitor Intensity Score: ${formatScoreValue(score.competitor_score)}/100\n\n`;
      } else {
        reportText += `Metrics not available.\n\n`;
      }
      
      reportText += `--------------------------------------------------\n`;
      reportText += `RFP COMPLIANCE ITEMS CHECKLIST\n`;
      reportText += `--------------------------------------------------\n`;
      if (checklist.length > 0) {
        checklist.forEach((item, idx) => {
          reportText += `${idx + 1}. [${item.match_status.toUpperCase()}] Req: ${item.requirement_text}\n`;
          reportText += `   Category: ${item.category} | Page: ${item.source_page || 'N/A'}\n\n`;
        });
      } else {
        reportText += `No checklist items available.\n`;
      }
      
      fileBlob = new Blob([reportText], { type: mimeType });
      rawData = fileBlob;
    }

    // 1. Try File System Access API for custom path selection
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: suggestedName,
          types: [{
            description: format === 'pdf' ? 'PDF Document' : 'Word Document',
            accept: { [mimeType]: [`.${format}`] }
          }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(rawData);
        await writable.close();
        
        // Show success toast
        setExportStatus({ show: true, msg: `${format.toUpperCase()} Report Saved Successfully!` });
        setTimeout(() => setExportStatus(null), 3000);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return; // Cancelled
        }
        console.warn("showSaveFilePicker aborted or failed, falling back", err);
      }
    }
    
    // 2. Fallback to default downloads folder
    const url = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success toast
    setExportStatus({ show: true, msg: `${format.toUpperCase()} Report Saved Successfully!` });
    setTimeout(() => setExportStatus(null), 3000);
  };

  // Calculate percentages
  const totalReq = summary?.total || 0;
  const matched = summary?.matched || 0;
  const partial = summary?.partial || 0;
  const gap = summary?.gap || 0;

  const matchPct = totalReq > 0 ? Math.round((matched / totalReq) * 100) : 0;
  const partialPct = totalReq > 0 ? Math.round((partial / totalReq) * 100) : 0;
  const gapPct = totalReq > 0 ? Math.round((gap / totalReq) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceContextBanner workspaceId={workspaceId} />
      
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-900/35 p-5 border border-[#263042]/50 rounded-2xl">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white tracking-tight">Bid Proposal Executive Reports</h1>
          <p className="text-xs text-gray-450">
            Consolidated analytics, win probability scores, and compliance metrics for workspace <span className="text-[#4F8CFF] font-semibold">{activeWorkspace?.name}</span>.
          </p>
        </div>
        
        <div className="flex gap-2.5">
          <button 
            onClick={() => handleExportReport('pdf')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-850 hover:bg-gray-800 border border-[#263042] hover:border-gray-700 text-xs font-semibold text-white rounded-xl transition-all cursor-pointer"
          >
            <Download size={13} className="text-[#4F8CFF]" />
            Export PDF
          </button>
          <button 
            onClick={() => handleExportReport('docx')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-850 hover:bg-gray-800 border border-[#263042] hover:border-gray-700 text-xs font-semibold text-white rounded-xl transition-all cursor-pointer"
          >
            <Download size={13} className="text-green-400" />
            Export DOCX
          </button>
        </div>
      </div>

      {/* Grid: Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-panel border border-[#263042] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4F8CFF]/5 rounded-bl-full pointer-events-none" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Active Workspaces</span>
          <p className="text-3xl font-bold text-white mt-2">{workspaces.length}</p>
          <span className="text-[9px] text-[#4F8CFF] block mt-1">Cross-referenced library</span>
        </div>

        <div className="glass-panel border border-[#263042] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-bl-full pointer-events-none" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total RFP Requirements</span>
          <p className="text-3xl font-bold text-white mt-2">{totalReq}</p>
          <span className="text-[9px] text-green-400 block mt-1">{matchPct}% Matched / Verified</span>
        </div>

        <div className="glass-panel border border-[#263042] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Win Probability Score</span>
          <p className="text-3xl font-bold text-white mt-2">{score ? formatWinProbability(score.win_probability) : "N/A"}</p>
          <span className="text-[9px] text-purple-400 block mt-1">
            {score ? `Decision: ${score.go_no_go}` : "Scoring pending"}
          </span>
        </div>

        <div className="glass-panel border border-[#263042] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Unresolved Gap Count</span>
          <p className="text-3xl font-bold text-white mt-2">{gap}</p>
          <span className="text-[9px] text-red-400 block mt-1">{gapPct}% of checklist</span>
        </div>
      </div>

      {/* Grid: Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Executive Summary & Decisions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Executive Summary */}
          <div className="glass-panel border border-[#263042] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#263042]/50 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={15} className="text-[#4F8CFF]" />
                Executive Summary
              </h2>
              <span className="text-[10px] text-gray-400 font-medium font-mono">
                Generated: {new Date().toLocaleDateString()}
              </span>
            </div>

            <div className="text-xs text-gray-300 leading-relaxed space-y-3 font-sans">
              {score ? (
                <>
                  <p>
                    Based on our AI evaluation of the <span className="font-bold text-white">{activeWorkspace?.name}</span> against our capability library, BidEngine has computed a win probability score of <span className="font-bold text-[#4F8CFF]">{formatWinProbability(score.win_probability)}</span>, leading to a <span className="font-bold text-green-400">{score.go_no_go}</span> decision for this pursuit.
                  </p>
                  <p className="bg-gray-950/40 border border-[#263042]/50 p-3.5 rounded-xl text-gray-400 italic">
                    "Rationale: {score.rationale}"
                  </p>
                  <p>
                    Compliance evaluation matches indicate that out of {totalReq} total RFP requirements parsed, {matched} are fully covered by company capabilities, {partial} are partially covered, and {gap} gaps remain. We recommend prioritizing editor drafting for identified gaps to maximize compliance.
                  </p>
                </>
              ) : (
                <p className="text-gray-500 py-4 text-center">
                  Configure win probability scores in the Dashboard and run capability matching to auto-generate a comprehensive executive summary.
                </p>
              )}
            </div>
          </div>

          {/* Win Probability Distribution */}
          <div className="glass-panel border border-[#263042] rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#263042]/50 pb-3">
              <TrendingUp size={15} className="text-purple-400" />
              Win Probability Distribution
            </h2>

            {score ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-950/30 border border-[#263042]/40 rounded-xl text-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Budget Rating</span>
                    <p className="text-lg font-bold text-[#4F8CFF] mt-1">{formatScoreValue(score.budget_alignment_score)}/100</p>
                  </div>
                  <div className="p-3 bg-gray-950/30 border border-[#263042]/40 rounded-xl text-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Past Win Rate</span>
                    <p className="text-lg font-bold text-[#4F8CFF] mt-1">{formatScoreValue(score.past_win_rate_score)}/100</p>
                  </div>
                  <div className="p-3 bg-gray-950/30 border border-[#263042]/40 rounded-xl text-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Compliance</span>
                    <p className="text-lg font-bold text-[#4F8CFF] mt-1">{formatScoreValue(score.compliance_pass_rate)}/100</p>
                  </div>
                  <div className="p-3 bg-gray-950/30 border border-[#263042]/40 rounded-xl text-center">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Competition</span>
                    <p className="text-lg font-bold text-[#4F8CFF] mt-1">{formatScoreValue(score.competitor_score)}/100</p>
                  </div>
                </div>

                {/* Custom SVG Distribution Chart */}
                <div className="h-40 w-full bg-gray-950/20 border border-[#263042]/30 rounded-xl p-4 flex items-end justify-between gap-6 relative">
                  <div className="absolute top-2 left-3 text-[9px] text-gray-500 uppercase font-bold">Distribution Graph</div>
                  
                  {/* Gridlines */}
                  <div className="absolute inset-x-0 top-[25%] border-t border-[#263042]/10" />
                  <div className="absolute inset-x-0 top-[50%] border-t border-[#263042]/10" />
                  <div className="absolute inset-x-0 top-[75%] border-t border-[#263042]/10" />

                  {/* Bars */}
                  {[
                    { label: 'Budget', val: parseFloat(formatScoreValue(score.budget_alignment_score)), color: '#4F8CFF' },
                    { label: 'Past Win Rate', val: parseFloat(formatScoreValue(score.past_win_rate_score)), color: '#10B981' },
                    { label: 'Compliance', val: parseFloat(formatScoreValue(score.compliance_pass_rate)), color: '#8B5CF6' },
                    { label: 'Competition', val: parseFloat(formatScoreValue(score.competitor_score)), color: '#F59E0B' }
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
                      <div className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity absolute top-[-20px] font-mono">
                        {bar.val}%
                      </div>
                      <div className="w-12 bg-gray-900 rounded-t-lg border border-[#263042]/55 overflow-hidden h-24 flex items-end">
                        <div 
                          className="w-full rounded-t-lg transition-all duration-1000"
                          style={{ 
                            height: `${bar.val}%`, 
                            backgroundColor: bar.color,
                            boxShadow: `0 0 10px ${bar.color}25`
                          }} 
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 py-6 text-center text-xs">
                No scoring metrics loaded. Use the main Dashboard to calculate Win Probability.
              </p>
            )}
          </div>

        </div>

        {/* Right Column: Compliance Statistics */}
        <div className="space-y-6">
          
          {/* Compliance Chart Panel */}
          <div className="glass-panel border border-[#263042] rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#263042]/50 pb-3">
              <Award size={15} className="text-[#4F8CFF]" />
              Compliance Statistics
            </h2>

            {totalReq > 0 ? (
              <div className="space-y-6">
                {/* Custom SVG Pie/Donut Chart */}
                <div className="flex justify-center py-3">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      {/* Gap Circle */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#EF4444" strokeWidth="2.8" />
                      {/* Partial Circle */}
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="2.8" 
                        strokeDasharray={`${partialPct + matchPct} 100`}
                      />
                      {/* Matched Circle */}
                      <circle 
                        cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="2.8" 
                        strokeDasharray={`${matchPct} 100`}
                      />
                      {/* Center hole */}
                      <circle cx="18" cy="18" r="13" fill="#111827" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-extrabold text-white font-mono">{matchPct}%</span>
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wide">Matched</span>
                    </div>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-[#10B981]" />
                      <span className="text-gray-300 font-medium">Fully Matched</span>
                    </div>
                    <span className="font-mono text-gray-400 font-bold">{matched} ({matchPct}%)</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-[#F59E0B]" />
                      <span className="text-gray-300 font-medium">Partial Match</span>
                    </div>
                    <span className="font-mono text-gray-400 font-bold">{partial} ({partialPct}%)</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-[#EF4444]" />
                      <span className="text-gray-300 font-medium">Compliance Gaps</span>
                    </div>
                    <span className="font-mono text-gray-400 font-bold">{gap} ({gapPct}%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 py-6 text-center text-xs">
                No requirement items parsed yet. Upload and extract an RFP document.
              </p>
            )}
          </div>

          {/* Proposal Success Metrics */}
          <div className="glass-panel border border-[#263042] rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#263042]/50 pb-3">
              <Layers size={15} className="text-[#ADC6FF]" />
              Success Checklist
            </h2>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5 p-2 rounded bg-gray-950/20 border border-[#263042]/30">
                <CheckSquare className="text-green-400 shrink-0 mt-0.5" size={14} />
                <div>
                  <span className="font-bold text-gray-300 block">Workspace Linked</span>
                  <span className="text-gray-500 text-[10px]">Connected to postgREST and RAG</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded bg-gray-950/20 border border-[#263042]/30">
                {totalReq > 0 ? (
                  <CheckSquare className="text-green-400 shrink-0 mt-0.5" size={14} />
                ) : (
                  <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={14} />
                )}
                <div>
                  <span className="font-bold text-gray-300 block">RFP Documents Parsed</span>
                  <span className="text-gray-500 text-[10px]">{totalReq > 0 ? `${totalReq} requirements loaded` : 'No rfp requirements detected'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded bg-gray-950/20 border border-[#263042]/30">
                {score ? (
                  <CheckSquare className="text-green-400 shrink-0 mt-0.5" size={14} />
                ) : (
                  <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={14} />
                )}
                <div>
                  <span className="font-bold text-gray-300 block">Win Probability Synced</span>
                  <span className="text-gray-500 text-[10px]">{score ? `Current probability is ${score.win_probability}%` : 'Calculate win likelihood to resolve'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Recent Analyses list */}
      <div className="glass-panel border border-[#263042] rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#263042]/50 pb-3">
          <Calendar size={15} className="text-gray-400" />
          Recent Workspaces Analyses
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#263042]/40 text-gray-500 uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3">Workspace Name</th>
                <th className="py-2.5 px-3">Industry Sector</th>
                <th className="py-2.5 px-3">Creation Date</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263042]/20">
              {workspaces.map(ws => (
                <tr key={ws.id} className="hover:bg-gray-900/30 text-gray-300">
                  <td className="py-3 px-3 font-semibold text-white">{ws.name}</td>
                  <td className="py-3 px-3 capitalize font-mono text-[11px] text-[#4F8CFF]">{ws.sector}</td>
                  <td className="py-3 px-3 font-mono text-gray-400">{ws.created_at ? new Date(ws.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full uppercase">
                      {ws.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {exportStatus?.show && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-[9999] border border-emerald-400/20 animate-fade-in-up">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <CheckSquare size={13} className="text-white" />
          </div>
          <span className="text-xs font-bold tracking-wide">{exportStatus.msg}</span>
        </div>
      )}
    </div>
  );
}
