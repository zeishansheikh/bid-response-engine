import React from 'react';
import { Search, FileText, Upload, RefreshCw, CheckCircle, AlertCircle, Loader2, X, Play } from 'lucide-react';
import { api, Requirement, notificationService } from '../services/api';

interface WorkspaceProps {
  workspaceId: string | null;
  setWorkspaceId?: (id: string | null) => void;
  onNavigate?: (view: any, targetId?: string | null) => void;
}

export function Workspace({ workspaceId, setWorkspaceId, onNavigate }: WorkspaceProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [requirements, setRequirements] = React.useState<Requirement[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const [workspaceDetails, setWorkspaceDetails] = React.useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Pipeline execution state
  const [pipelineStep, setPipelineStep] = React.useState<number | null>(null);
  const [pipelineError, setPipelineError] = React.useState<string | null>(null);
  const [pipelineFailedStage, setPipelineFailedStage] = React.useState<string | null>(null);
  const [pipelineWorkspaceId, setPipelineWorkspaceId] = React.useState<string | null>(null);

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

  const loadRequirements = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      setError(null);
      
      // Fetch active document details
      try {
        const docDetails = await api.getWorkspaceDocument(workspaceId);
        if (docDetails) {
          setUploadedFileName(docDetails.original_filename);
        } else {
          setUploadedFileName(null);
        }
      } catch (docErr) {
        console.error("Failed to load workspace document info:", docErr);
        setUploadedFileName(null);
      }

      const reqs = await api.getRequirements(workspaceId);
      setRequirements(reqs);
    } catch (err: any) {
      console.error(err);
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceDetails = async () => {
    if (!workspaceId) return;
    try {
      const list = await api.getWorkspaces();
      const currentWs = list.find(w => w.id === workspaceId);
      setWorkspaceDetails(currentWs || null);
    } catch (err) {
      console.error("Failed to load workspace details:", err);
    }
  };

  React.useEffect(() => {
    loadRequirements();
    loadWorkspaceDetails();
  }, [workspaceId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccessMsg(null);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const runFullPipeline = async (wsId: string, docFile: File | null, startFromStep = 1) => {
    setPipelineError(null);
    setPipelineFailedStage(null);
    setPipelineWorkspaceId(wsId);
    
    let currentStep = startFromStep;
    try {
      if (currentStep <= 1 && docFile) {
        setPipelineStep(1);
        notificationService.addNotification('Uploading document', `Uploading "${docFile.name}"...`, 'upload');
        await api.uploadRfp(wsId, docFile);
        currentStep = 2;
      }
      
      if (currentStep <= 2) {
        setPipelineStep(2);
        notificationService.addNotification('Analysis started', 'Extracting RFP structure and requirements...', 'extraction');
        await api.extractRfp(wsId);
        currentStep = 3;
      }
      
      if (currentStep <= 3) {
        setPipelineStep(3);
        notificationService.addNotification('Compliance matching', 'Matching evidence from capability library...', 'matching');
        await api.matchCapabilities(wsId);
        currentStep = 4;
      }
      
      if (currentStep <= 4) {
        setPipelineStep(4);
        notificationService.addNotification('Scoring workspace', 'Calculating win probability score...', 'scoring');
        const defaultBudget = Number(localStorage.getItem('govprop_default_budget')) || 45000000;
        const defaultCompetitors = Number(localStorage.getItem('govprop_default_competitor_count')) || 3;
        await api.calculateScore(wsId, defaultBudget, defaultCompetitors);
        currentStep = 5;
      }
      
      setPipelineStep(5);
      notificationService.addNotification('Workspace ready', 'The workspace has been fully initialized and is ready for use.', 'info');
      
      await new Promise(r => setTimeout(r, 1000));
      
      setPipelineStep(null);
      setPipelineWorkspaceId(null);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (setWorkspaceId) {
        setWorkspaceId(wsId);
      }
      if (onNavigate) {
        onNavigate('dashboard', wsId);
      }
    } catch (err: any) {
      console.error('Pipeline failed:', err);
      const errMsg = err.message || 'Error occurred';
      setPipelineError(errMsg);
      
      let failedStageName = 'Uploading';
      if (currentStep === 2) failedStageName = 'Extraction';
      if (currentStep === 3) failedStageName = 'Matching';
      if (currentStep === 4) failedStageName = 'Scoring';
      setPipelineFailedStage(failedStageName);
      
      notificationService.addNotification('Pipeline failed', `Failed during ${failedStageName}: ${errMsg}`, 'info');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    try {
      const workspaceName = `RFP - ${file.name.replace(/\.[^/.]+$/, "")}`;
      const defaultSector = localStorage.getItem('govprop_default_sector') || 'Cloud Infrastructure';
      
      setPipelineStep(0);
      setPipelineError(null);
      setPipelineFailedStage(null);
      
      const newWs = await api.createWorkspace(workspaceName, defaultSector);
      await runFullPipeline(newWs.id, file, 1);
    } catch (err: any) {
      console.error(err);
      setPipelineError(err.message || 'Failed to create workspace');
      setPipelineFailedStage('Creation');
    }
  };

  const handleResume = async () => {
    if (!workspaceId || !workspaceDetails) return;
    
    let resumeStep = 2;
    if (workspaceDetails.status === 'Matching Failed') resumeStep = 3;
    if (workspaceDetails.status === 'Scoring Failed') resumeStep = 4;
    
    await runFullPipeline(workspaceId, null, resumeStep);
  };

  const handleExtract = async () => {
    if (!workspaceId) return;

    try {
      setExtracting(true);
      setError(null);
      setSuccessMsg(null);
      notificationService.addNotification('Analysis started', 'RFP AI Extraction & structure analysis started...', 'extraction');
      await api.extractRfp(workspaceId);
      setSuccessMsg('RFP processed and structure extracted successfully!');
      notificationService.addNotification('Analysis completed', 'RFP processed and structure extracted successfully! (Doc analyzed)', 'extraction');
      await loadRequirements();
      await loadWorkspaceDetails();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Extraction failed');
      notificationService.addNotification('Analysis failed', `RFP extraction failed: ${err.message || 'Error'}`, 'extraction');
    } finally {
      setExtracting(false);
    }
  };

  const filteredRequirements = requirements.filter(req => 
    req.requirement_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const meta = getSectorMeta(workspaceDetails?.sector);
  const isFailed = workspaceDetails?.status?.endsWith('Failed');
  const failedStage = meta.failed_stage || workspaceDetails?.status;
  const errMsg = meta.error_message || 'Unknown error occurred.';

  if (!workspaceId) {
    return (
      <div className="h-96 w-full flex items-center justify-center flex-col gap-3">
        <AlertCircle className="text-outline" size={32} />
        <span className="text-outline text-sm">Please select a workspace project first.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-display-sm font-semibold tracking-tight">RFP Documents & Requirements</h1>
          <p className="text-on-surface-variant mt-1">Upload tender documents, extract mandatory requirements, and review compliance scope.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-400/10 border border-green-400/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pipeline Recovery Banner */}
      {isFailed && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-error flex items-center gap-1.5">
              <AlertCircle size={16} />
              Analysis Pipeline Failed during {failedStage}
            </h4>
            <p className="text-xs text-gray-300 font-semibold">{errMsg}</p>
          </div>
          <button
            onClick={handleResume}
            className="flex items-center gap-1.5 bg-error hover:bg-error/90 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
          >
            <Play size={12} fill="white" />
            Resume Pipeline
          </button>
        </div>
      )}

      {/* Active Document Banner */}
      {uploadedFileName && (
        <div className="p-3.5 bg-[#4F8CFF]/8 border border-[#4F8CFF]/20 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center text-[#4F8CFF] shrink-0">
            <FileText size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-[#4F8CFF] font-bold uppercase tracking-wider block">Active RFP Document</span>
            <span className="text-xs text-white font-semibold truncate block">{uploadedFileName}</span>
          </div>
          <div className="shrink-0">
            {extracting ? (
              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                Extracting...
              </span>
            ) : requirements.length > 0 ? (
              <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                <CheckCircle size={12} />
                {requirements.length} requirements extracted
              </span>
            ) : (
              <span className="text-[10px] text-gray-500 font-bold">Pending extraction</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start shrink-0">
        {/* Document Upload Area */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 relative">
          {file && (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-900/80 hover:bg-[#EF4444] border border-slate-800 hover:border-[#EF4444] text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-105 z-30 cursor-pointer"
              title="Remove selected file"
            >
              <X size={14} />
            </button>
          )}

          <h3 className="text-title-md font-semibold flex items-center gap-2">
            <Upload size={18} className="text-[#4F8CFF]" />
            Upload RFP Document
          </h3>
          
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 relative overflow-hidden group ${file ? 'border-[#4F8CFF]/50 bg-[#4F8CFF]/5' : 'border-outline-variant hover:border-[#4F8CFF]/50'}`}>
              <input 
                type="file"
                ref={fileInputRef}
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              {file ? (
                <div className="flex flex-col items-center py-2 relative z-20">
                  <div className="w-12 h-12 rounded-xl bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center text-[#4F8CFF] mb-3 shadow-[0_0_15px_rgba(79,142,255,0.15)]">
                    <FileText size={22} />
                  </div>
                  <span className="text-sm font-bold text-white block max-w-[200px] truncate mb-1">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold block">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <FileText size={32} className="text-outline mx-auto mb-2 group-hover:text-[#4F8CFF] transition-colors duration-200" />
                  <span className="text-sm font-medium block">
                    Select PDF or DOCX file
                  </span>
                  <span className="text-xs text-outline block mt-1">Max file size 20MB</span>
                </div>
              )}
            </div>

            {file && (
              <button 
                type="submit"
                className="w-full bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                Upload Document
              </button>
            )}
          </form>
        </div>

        {/* Processing Actions */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-2">
          <h3 className="text-title-md font-semibold flex items-center gap-2">
            <RefreshCw size={18} className="text-[#10B981]" />
            Process Document
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Extract requirements clauses, evaluation criteria, and QA sections from the uploaded RFP. BidEngine parses the document structure in the background.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={handleExtract}
              disabled={extracting}
              className="flex items-center gap-2 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
            >
              {extracting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Running AI Extraction...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Run RFP AI Extraction
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Extracted Requirements List */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-[300px] mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
          <h2 className="text-title-md font-semibold text-white">Extracted Requirements ({requirements.length})</h2>
          
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input 
              type="text" 
              placeholder="Search requirements..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111827]/40 border border-[#263042] rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-[#4F8CFF] text-xs text-white"
            />
          </div>
        </div>

        <div className="overflow-hidden flex-1 flex flex-col">
          {loading ? (
            <div className="h-40 w-full flex items-center justify-center flex-col gap-2">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="text-outline text-xs">Loading requirements...</span>
            </div>
          ) : filteredRequirements.length === 0 ? (
            <div className="h-40 w-full flex items-center justify-center text-outline text-sm">
              No extracted requirements found. Run RFP extraction first!
            </div>
          ) : (
            <div className="space-y-0 overflow-y-auto flex-1 custom-scrollbar pr-1 divide-y divide-[#263042]/30">
              {filteredRequirements.map((req, idx) => (
                <div 
                  key={req.id} 
                  className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="w-6 h-6 rounded-md bg-[#4F8CFF]/10 text-[#4F8CFF] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-sm font-medium text-gray-200 leading-relaxed">
                      {req.requirement_text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 select-none text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF]/60" />
                        Page {req.source_page || '-'}
                      </span>
                      <span className="text-gray-650">•</span>
                      <span className="text-[#4F8CFF]">{req.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Premium Pipeline Progress Modal */}
      {pipelineStep !== null && (
        <div className="fixed inset-0 bg-[#0B1020]/90 backdrop-blur-md flex items-center justify-center z-50">
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full space-y-6 text-center border border-[#263042]/50 shadow-[0_0_50px_rgba(79,142,255,0.15)] animate-in fade-in zoom-in duration-300">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#263042] border-t-[#4F8CFF] animate-spin" />
              <FileText className="text-[#4F8CFF] animate-pulse" size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">AI Proposal Pipeline</h3>
              <p className="text-xs text-gray-400">Please wait while we initialize and process your RFP workspace.</p>
            </div>
            
            <div className="space-y-3.5 text-left border-t border-[#263042]/50 pt-5">
              <PipelineStepItem step={0} current={pipelineStep} label="Create Workspace & Settings" />
              <PipelineStepItem step={1} current={pipelineStep} label="Upload RFP Document" />
              <PipelineStepItem step={2} current={pipelineStep} label="AI Requirements Extraction" />
              <PipelineStepItem step={3} current={pipelineStep} label="Capability Library Matching" />
              <PipelineStepItem step={4} current={pipelineStep} label="Win Probability Scoring" />
            </div>
            
            {pipelineError && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-xs text-left space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  Failed at stage: {pipelineFailedStage}
                </div>
                <p className="leading-relaxed font-semibold opacity-90">{pipelineError}</p>
                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={() => {
                      let stepToRun = pipelineStep;
                      if (pipelineFailedStage === 'Creation') {
                        setPipelineStep(null);
                      } else {
                        runFullPipeline(pipelineWorkspaceId!, null, stepToRun);
                      }
                    }}
                    className="bg-error hover:bg-error/95 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                  >
                    Retry Stage
                  </button>
                  <button 
                    onClick={() => {
                      setPipelineStep(null);
                      setPipelineError(null);
                      loadWorkspaceDetails();
                      loadRequirements();
                    }}
                    className="border border-[#263042] hover:bg-[#263042]/30 text-gray-300 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineStepItem({ step, current, label }: { step: number; current: number; label: string }) {
  const isCompleted = current > step;
  const isCurrent = current === step;
  return (
    <div className={`flex items-center gap-3 transition-colors duration-200 ${isCompleted ? 'text-green-400' : isCurrent ? 'text-white' : 'text-gray-500'}`}>
      <div className="shrink-0">
        {isCompleted ? (
          <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
            <CheckCircle size={12} />
          </div>
        ) : isCurrent ? (
          <div className="w-5 h-5 rounded-full bg-[#4F8CFF]/10 border border-[#4F8CFF] flex items-center justify-center text-[#4F8CFF]">
            <Loader2 size={12} className="animate-spin" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-[#111827] border border-[#263042] flex items-center justify-center text-[10px] font-bold">
            {step + 1}
          </div>
        )}
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

