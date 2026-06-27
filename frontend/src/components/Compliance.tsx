import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Loader2, 
  Link2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { api, ChecklistItem, notificationService } from '../services/api';

interface ComplianceProps {
  workspaceId: string | null;
}

export function Compliance({ workspaceId }: ComplianceProps) {
  const [checklist, setChecklist] = React.useState<ChecklistItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [matching, setMatching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const loadChecklist = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getChecklist(workspaceId);
      setChecklist(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load compliance checklist');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadChecklist();
  }, [workspaceId]);

  const handleMatchCapabilities = async () => {
    if (!workspaceId) return;
    try {
      setMatching(true);
      setError(null);
      setSuccess(null);
      notificationService.addNotification('Matching capabilities', 'Capability matching and RAG retrieval started...', 'matching');
      await api.matchCapabilities(workspaceId);
      setSuccess('Capability matching and RAG retrieval completed successfully!');
      notificationService.addNotification('Matching completed', 'Capability matching and RAG retrieval completed successfully!', 'matching');
      await loadChecklist();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to match capabilities');
    } finally {
      setMatching(false);
    }
  };

  // Calculate dynamic stats
  const totalCount = checklist.length;
  const compliantCount = checklist.filter(c => c.match_status === 'matched').length;
  const partialCount = checklist.filter(c => c.match_status === 'partial').length;
  const gapCount = checklist.filter(c => c.match_status === 'gap').length;

  if (!workspaceId) {
    return (
      <div className="h-96 w-full flex items-center justify-center flex-col gap-3">
        <AlertTriangle className="text-gray-500" size={32} />
        <span className="text-gray-400 text-sm">Please select a workspace project first.</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#263042]/55 pb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Compliance Matrix</h1>
          <p className="text-sm text-gray-400 mt-1">Review extracted requirements, matching capabilities, and compliance status.</p>
        </div>
        <div className="flex gap-3">
          <button 
            disabled={matching}
            onClick={handleMatchCapabilities}
            className="flex items-center gap-2 bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-[#4F8CFF]/15 hover:shadow-[#4F8CFF]/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50"
          >
            {matching ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Matching Capabilities...
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Run Capability Matching
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          Error: {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatusCard title="Total Requirements" value={totalCount.toString()} icon={<ShieldCheck size={18} className="text-[#4F8CFF]" />} />
        <StatusCard title="Matched" value={compliantCount.toString()} subtext={`${totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0}%`} icon={<CheckCircle size={18} className="text-green-400" />} />
        <StatusCard title="Partial" value={partialCount.toString()} subtext={`${totalCount > 0 ? Math.round((partialCount / totalCount) * 100) : 0}%`} icon={<Clock size={18} className="text-amber-400" />} />
        <StatusCard title="Gap" value={gapCount.toString()} subtext={`${totalCount > 0 ? Math.round((gapCount / totalCount) * 100) : 0}%`} icon={<AlertTriangle size={18} className="text-red-400" />} alert={gapCount > 0} />
      </div>

      <div className="flex-1 flex flex-col min-h-[350px]">
        <div className="pb-4 border-b border-[#263042]/30 mb-4 shrink-0">
          <h2 className="text-base font-semibold text-white">Requirements Traceability Matrix (RTM)</h2>
          <p className="text-xs text-gray-400 mt-1">Click a requirement row to expand audit data and view the matching capability evidence.</p>
        </div>
        
        <div className="overflow-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="h-40 w-full flex items-center justify-center flex-col gap-3">
              <Loader2 className="animate-spin text-[#4F8CFF]" size={28} />
              <span className="text-gray-450 text-xs">Loading RTM checklist...</span>
            </div>
          ) : checklist.length === 0 ? (
            <div className="h-40 w-full flex items-center justify-center text-gray-450 text-xs">
              No compliance checklist items found. Run capability matching first!
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead className="sticky top-0 bg-gray-950 z-10">
                <tr className="border-b border-[#263042]/55 text-xs text-gray-400 uppercase tracking-wider bg-gray-900/40">
                  <th className="py-3 px-6 font-semibold w-20">#</th>
                  <th className="py-3 px-6 font-semibold w-24">Page</th>
                  <th className="py-3 px-6 font-semibold w-36">Category</th>
                  <th className="py-3 px-6 font-semibold">Requirement Statement</th>
                  <th className="py-3 px-6 font-semibold w-40">Status</th>
                  <th className="py-3 px-6 font-semibold w-28">Confidence</th>
                  <th className="py-3 px-6 font-semibold w-40 text-right">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263042]/30">
                {checklist.map((row, index) => (
                  <MatrixRow 
                    key={row.id}
                    number={index + 1}
                    page={row.source_page}
                    category={row.category || 'other'}
                    text={row.requirement_text || ''} 
                    status={row.match_status} 
                    confidence={row.confidence_score}
                    evidenceId={row.evidence_capability_id}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, value, subtext, icon, alert }: { title: string, value: string, subtext?: string, icon: React.ReactNode, alert?: boolean }) {
  return (
    <div className={`glass-panel p-6 rounded-2xl flex items-center justify-between border transition-all duration-300 hover:border-primary/45 ${alert ? 'border-red-500/25 bg-red-500/5' : 'border-[#263042]'}`}>
      <div>
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white font-mono">{value}</span>
          {subtext && <span className={`text-xs font-bold ${alert ? 'text-red-400' : 'text-gray-450'}`}>{subtext}</span>}
        </div>
      </div>
      <div className={`p-2.5 rounded-xl border ${alert ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-gray-900 border-[#263042]'}`}>
        {icon}
      </div>
    </div>
  );
}

interface MatrixRowProps {
  number: number;
  page?: number;
  category: string;
  text: string;
  status: 'matched' | 'partial' | 'gap';
  confidence: number;
  evidenceId: string | null;
}

function MatrixRow({ number, page, category, text, status, confidence, evidenceId }: MatrixRowProps) {
  const [expanded, setExpanded] = React.useState(false);

  const getStatusConfig = (s: string) => {
    switch(s) {
      case 'matched': return { label: 'Compliant', icon: <CheckCircle size={12} />, classes: 'bg-green-500/10 text-green-400 border-green-500/20' };
      case 'partial': return { label: 'Partial Match', icon: <Clock size={12} />, classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'gap': return { label: 'Gap / Missing', icon: <AlertTriangle size={12} />, classes: 'bg-red-500/10 text-red-400 border-red-500/20' };
      default: return { label: 'Unknown', icon: <CheckCircle size={12} />, classes: 'bg-gray-800 text-gray-400 border-[#263042]' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <>
      <tr 
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-gray-900/30 transition-all duration-150 group cursor-pointer border-b border-[#263042]/30"
      >
        <td className="py-4 px-6 font-mono text-xs text-gray-400 align-middle whitespace-nowrap">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            <span className="font-bold text-gray-400 group-hover:text-[#4F8CFF]">{number}</span>
          </div>
        </td>
        <td className="py-4 px-6 font-mono text-xs text-gray-405 align-middle whitespace-nowrap">
          {page || '-'}
        </td>
        <td className="py-4 px-6 text-xs font-semibold text-primary capitalize align-middle whitespace-nowrap">{category}</td>
        <td className="py-4 px-6 text-sm text-gray-300 leading-relaxed font-medium align-middle">{text}</td>
        <td className="py-4 px-6 align-middle whitespace-nowrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.classes}`}>
            {config.icon}
            {config.label}
          </span>
        </td>
        <td className="py-4 px-6 text-sm font-mono font-semibold text-white align-middle whitespace-nowrap">
          {Math.round(confidence * 100)}%
        </td>
        <td className="py-4 px-6 align-middle whitespace-nowrap text-right">
          {evidenceId ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#4F8CFF] bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 px-2.5 py-1 rounded-lg font-mono hover:bg-[#4F8CFF]/20 transition-all">
              <Link2 size={10} />
              {evidenceId.substring(0, 8)}
            </span>
          ) : (
            <span className="text-xs font-mono text-gray-500">—</span>
          )}
        </td>
      </tr>
      
      {expanded && (
        <tr className="bg-gray-900/40 border-b border-[#263042]/40">
          <td colSpan={7} className="py-5 px-8">
            <div className="space-y-4 max-w-4xl">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Requirement Statement</span>
                <p className="text-sm text-gray-200 leading-relaxed">{text}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Audit Metadata</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-gray-400 bg-gray-950 border border-[#263042] px-2.5 py-1 rounded-lg">Page: {page || 'N/A'}</span>
                    <span className="text-[11px] font-semibold text-gray-400 bg-gray-950 border border-[#263042] px-2.5 py-1 rounded-lg">Category: <span className="capitalize text-primary">{category}</span></span>
                    <span className="text-[11px] font-semibold text-gray-400 bg-gray-950 border border-[#263042] px-2.5 py-1 rounded-lg">Confidence Score: <span className="text-white">{Math.round(confidence * 100)}%</span></span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Linked Evidence Chunk</span>
                  <div className="pt-1">
                    {evidenceId ? (
                      <div className="flex items-center gap-2 text-xs text-[#4F8CFF] font-medium bg-[#4F8CFF]/5 border border-[#4F8CFF]/15 px-3 py-2 rounded-xl">
                        <Link2 size={12} className="shrink-0" />
                        <span className="font-mono text-[11px]">ID: {evidenceId}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 bg-gray-950/40 border border-[#263042] px-3 py-2 rounded-xl">
                        No capability evidence linked. This represents a compliance gap.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
