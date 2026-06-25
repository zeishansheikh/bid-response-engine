import React from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Save, 
  History, 
  Play, 
  StopCircle, 
  RefreshCw, 
  PenTool, 
  CheckSquare, 
  Search, 
  ArrowRight,
  Download,
  Check,
  Bookmark
} from 'lucide-react';

interface EditorProps {
  workspaceId: string | null;
}

export function Editor({ workspaceId }: EditorProps) {
  const [content, setContent] = React.useState(`3.1 Technical Approach
Our team brings over 15 years of experience delivering secure, scalable cloud infrastructure for federal agencies. We understand the unique challenges of modernizing legacy systems while maintaining 99.99% uptime.

3.1.1 Phase 1: Assessment and Discovery
During the first 30 days, our engineers will conduct a comprehensive audit of the existing on-premise architecture. This includes mapping all data flows, identifying security vulnerabilities, and documenting inter-system dependencies.

3.1.2 Phase 2: Migration Strategy
Following the discovery phase, we will implement a phased migration approach utilizing AWS GovCloud...`);

  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(true);

  const handleSave = () => {
    setSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
    }, 800);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 pb-6 items-stretch">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden min-w-0 border border-[#263042]">
        
        {/* Editor Header */}
        <div className="h-16 border-b border-[#263042]/50 bg-gray-900/60 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bookmark size={16} className="text-[#4F8CFF]" />
              <h2 className="text-sm font-semibold text-white">Technical Proposal Volume v2.1</h2>
            </div>
            <span className="h-4 w-px bg-[#263042]/65" />
            <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
              {saveSuccess ? (
                <>
                  <CheckSquare size={14} className="text-green-400" /> 
                  <span>Auto-saved to cloud</span>
                </>
              ) : (
                <span>Unsaved changes</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-gray-450 hover:text-white hover:bg-gray-800 rounded-xl transition-all cursor-pointer" title="Version History">
              <History size={15} />
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-850 hover:bg-gray-800 border border-[#263042] text-xs font-semibold text-white rounded-xl transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />} 
              Save
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#4F8CFF]/15 transition-all cursor-pointer">
              <Download size={12} /> 
              Export DOCX
            </button>
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="h-12 border-b border-[#263042]/40 bg-gray-900/30 flex items-center px-6 gap-3 shrink-0">
          <select className="bg-transparent border-none text-xs font-semibold text-gray-300 focus:ring-0 cursor-pointer">
            <option className="bg-gray-950">Heading 2</option>
            <option className="bg-gray-950">Normal Text</option>
            <option className="bg-gray-950">Code Block</option>
          </select>
          <div className="w-px h-4 bg-[#263042] mx-1" />
          <button className="p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded text-xs font-bold w-7 transition-all cursor-pointer">B</button>
          <button className="p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded text-xs italic w-7 transition-all cursor-pointer">I</button>
          <button className="p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded text-xs underline w-7 transition-all cursor-pointer">U</button>
          <div className="w-px h-4 bg-[#263042] mx-1" />
          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded flex items-center gap-1 text-[11px] px-2.5 transition-all cursor-pointer">
            <PenTool size={11} /> 
            <span>Style Guide</span>
          </button>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-y-auto bg-gray-950/20 p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto bg-gray-900/40 border border-[#263042]/40 shadow-2xl rounded-2xl p-10 min-h-[500px]">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSaveSuccess(false);
              }}
              className="w-full h-full min-h-[450px] resize-none border-none focus:outline-none focus:ring-0 text-gray-100 font-serif leading-relaxed text-sm bg-transparent"
              spellCheck="false"
            />
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="w-80 glass-panel rounded-2xl flex flex-col shrink-0 border border-[#263042] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4F8CFF] to-[#ADC6FF]" />
        
        <div className="p-4 border-b border-[#263042]/50 flex items-center justify-between bg-gray-900/30 shrink-0">
          <div className="flex items-center gap-2.5 font-bold text-sm text-[#4F8CFF]">
            <Sparkles size={15} className="text-[#ADC6FF]" />
            AI Proposal Co-Pilot
          </div>
          <button className="text-xs text-gray-400 hover:text-white transition-all cursor-pointer">Clear</button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-950/15">
          <ChatMessage 
            role="assistant" 
            content="I notice you're working on the Migration Strategy. Do you want me to pull past performance data from the 'Project CloudMigrate' to strengthen this section?"
          />
          <ChatMessage 
            role="user" 
            content="Yes, please draft a paragraph about our zero-downtime migration approach based on that project."
          />
          <ChatMessage 
            role="assistant" 
            content="Here is a draft based on Project CloudMigrate:"
            draft="Leveraging our proprietary Zero-Impact Migration (ZIM) framework utilized in Project CloudMigrate, we ensure continuous operational capability during the transition. By establishing parallel staging environments and utilizing automated data synchronization, we achieved zero unplanned downtime for 45,000 active users, completing the migration 2 weeks ahead of schedule."
          />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#263042]/50 bg-gray-900/50 shrink-0">
          <div className="relative rounded-xl overflow-hidden bg-gray-950 border border-[#263042] focus-within:border-[#4F8CFF]/60 transition-all">
            <textarea 
              placeholder="Ask AI to generate, rewrite, or find facts..."
              className="w-full bg-transparent border-none resize-none p-3 text-xs placeholder-gray-500 focus:outline-none focus:ring-0 max-h-24 min-h-[50px] text-gray-200"
              rows={2}
            />
            <div className="flex justify-between items-center px-3 pb-2">
              <div className="flex gap-1.5">
                <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all cursor-pointer" title="Reference Documents">
                  <Search size={13} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all cursor-pointer" title="Regenerate">
                  <RefreshCw size={13} />
                </button>
              </div>
              <button className="bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white p-1.5 rounded-lg shadow transition-all cursor-pointer">
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ role, content, draft }: { role: 'user' | 'assistant', content: string, draft?: string }) {
  return (
    <div className={`flex flex-col ${role === 'user' ? 'items-end' : 'items-start'}`}>
      <div className={`
        max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed
        ${role === 'user' 
          ? 'bg-gray-800 text-gray-200 rounded-br-sm border border-[#263042]/35' 
          : 'bg-[#4F8CFF]/5 border border-[#4F8CFF]/15 text-gray-200 rounded-bl-sm'}
      `}>
        <p>{content}</p>
        
        {draft && (
          <div className="mt-3 bg-gray-950/80 p-3.5 rounded-xl border border-[#263042] text-[11px] text-gray-400 font-sans leading-relaxed">
            <span className="text-[10px] text-[#4F8CFF] font-bold uppercase tracking-wider block mb-1">Generated Draft</span>
            {draft}
            <div className="mt-3 flex gap-2 justify-end pt-2 border-t border-[#263042]/40">
              <button className="text-[10px] font-semibold text-gray-400 hover:text-white transition-all cursor-pointer">Discard</button>
              <button className="text-[10px] font-semibold bg-[#4F8CFF]/15 hover:bg-[#4F8CFF]/25 text-[#4F8CFF] px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer">
                <Check size={10} />
                Insert Draft
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
