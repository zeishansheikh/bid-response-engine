import React from 'react';
import { Search, FileText, Upload, RefreshCw, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { api, Requirement, notificationService } from '../services/api';

interface WorkspaceProps {
  workspaceId: string | null;
}

export function Workspace({ workspaceId }: WorkspaceProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [requirements, setRequirements] = React.useState<Requirement[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const loadRequirements = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      setError(null);
      const reqs = await api.getRequirements(workspaceId);
      setRequirements(reqs);
    } catch (err: any) {
      console.error(err);
      // Reqs might not be extracted yet, so don't show scary error
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadRequirements();
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !file) return;

    const fileName = file.name;
    try {
      setUploading(true);
      setError(null);
      setSuccessMsg(null);
      notificationService.addNotification('Uploading document', `Uploading "${fileName}" to workspace...`, 'upload');
      await api.uploadRfp(workspaceId, file);
      setSuccessMsg(`File "${fileName}" uploaded successfully!`);
      notificationService.addNotification('Document uploaded', `File "${fileName}" uploaded successfully! (Doc ready)`, 'upload');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload document');
      notificationService.addNotification('Upload failed', `Failed to upload "${fileName}": ${err.message || 'Error'}`, 'upload');
    } finally {
      setUploading(false);
    }
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
            <Upload size={18} className="text-primary" />
            Upload RFP Document
          </h3>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 relative overflow-hidden group ${file ? 'border-[#4F8CFF]/50 bg-[#4F8CFF]/5' : 'border-outline-variant hover:border-primary/50'}`}>
              <input 
                type="file"
                ref={fileInputRef}
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              {file ? (
                <div className="flex flex-col items-center py-2 relative z-20">
                  <div className="w-12 h-12 rounded-xl bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center text-[#4F8CFF] mb-3 shadow-[0_0_15px_rgba(79,142,255,0.1)]">
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
                disabled={uploading}
                className="w-full bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Uploading...
                  </>
                ) : (
                  'Upload Document'
                )}
              </button>
            )}
          </form>
        </div>

        {/* Processing Actions */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-2">
          <h3 className="text-title-md font-semibold flex items-center gap-2">
            <RefreshCw size={18} className="text-secondary-container" />
            Process Document
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Extract requirements clauses, evaluation criteria, and QA sections from the uploaded RFP. BidEngine parses the document structure in the background.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={handleExtract}
              disabled={extracting}
              className="flex items-center gap-2 bg-secondary-container text-on-secondary px-5 py-3 rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-50"
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
      <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col overflow-hidden min-h-[300px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
          <h2 className="text-title-md font-semibold">Extracted Requirements ({requirements.length})</h2>
          
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input 
              type="text" 
              placeholder="Search requirements..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:border-primary text-xs"
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 custom-scrollbar border border-outline-variant rounded-xl">
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
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface z-10 shadow-sm">
                <tr className="border-b border-outline-variant text-xs text-outline uppercase tracking-wider bg-surface-container-lowest">
                  <th className="py-3 px-4 font-semibold w-16">Page</th>
                  <th className="py-3 px-4 font-semibold w-32">Category</th>
                  <th className="py-3 px-4 font-semibold">Requirement Text</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filteredRequirements.map(req => (
                  <tr key={req.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="py-3.5 px-4 text-sm font-mono text-outline">{req.source_page || '-'}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-primary capitalize">{req.category}</td>
                    <td className="py-3.5 px-4 text-sm text-on-surface-variant leading-relaxed">{req.requirement_text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
