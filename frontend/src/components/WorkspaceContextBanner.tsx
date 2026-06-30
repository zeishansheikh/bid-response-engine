import React from 'react';
import { Briefcase, Calendar, Clock, FileText } from 'lucide-react';
import { api } from '../services/api';

interface BannerProps {
  workspaceId: string | null;
}

export function WorkspaceContextBanner({ workspaceId }: BannerProps) {
  const [docDetails, setDocDetails] = React.useState<any>(null);
  const [workspace, setWorkspace] = React.useState<any>(null);

  React.useEffect(() => {
    if (!workspaceId) return;
    const fetchDetails = async () => {
      try {
        const doc = await api.getWorkspaceDocument(workspaceId);
        setDocDetails(doc || null);
      } catch {
        setDocDetails(null);
      }
      try {
        const list = await api.getWorkspaces();
        const currentWs = list.find(w => w.id === workspaceId);
        setWorkspace(currentWs || null);
      } catch {
        setWorkspace(null);
      }
    };
    fetchDetails();
  }, [workspaceId]);

  if (!workspaceId || !workspace) {
    return (
      <div className="p-4 bg-[#111827]/40 border border-[#263042]/50 rounded-xl text-gray-400 text-xs flex items-center gap-2">
        <Briefcase size={14} className="text-[#4F8CFF]" />
        <span>No active workspace context loaded. Please upload a document or select an active project.</span>
      </div>
    );
  }

  const getSectorMeta = (sectorStr: string | undefined) => {
    if (!sectorStr) return {};
    if (sectorStr.trim().startsWith('{') && sectorStr.trim().endsWith('}')) {
      try {
        return JSON.parse(sectorStr);
      } catch (e) {
        return { sector: sectorStr };
      }
    }
    return { sector: sectorStr };
  };

  const meta = getSectorMeta(workspace.sector);
  const uploadDate = docDetails?.uploaded_at ? new Date(docDetails.uploaded_at).toLocaleDateString() : 'N/A';
  const lastUpdated = workspace.created_at ? new Date(workspace.created_at).toLocaleDateString() : 'N/A';

  return (
    <div className="p-4 bg-[#111827]/80 border border-[#263042]/80 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center text-[#4F8CFF] shadow-[0_0_15px_rgba(79,142,255,0.1)]">
          <Briefcase size={18} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            {workspace.name}
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              workspace.status?.endsWith('Failed') 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : workspace.status === 'Ready' || workspace.status === 'Proposal Generated'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {workspace.status}
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400 font-semibold mt-1">
            <span className="flex items-center gap-1">
              <FileText size={11} className="text-gray-500" />
              Doc: <span className="text-gray-200">{docDetails?.original_filename || 'No document uploaded'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-gray-500" />
              Uploaded: <span className="text-gray-200">{uploadDate}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-gray-500" />
              Created: <span className="text-gray-200">{lastUpdated}</span>
            </span>
          </div>
        </div>
      </div>
      
      {meta.budget && (
        <div className="flex gap-4">
          <div className="text-right">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">RFP Budget</span>
            <span className="text-xs text-[#4F8CFF] font-bold block">PKR {Number(meta.budget).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}