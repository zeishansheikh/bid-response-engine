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
  Bookmark,
  Loader2,
  ChevronDown,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface EditorProps {
  workspaceId: string | null;
}

interface SavedDraft {
  id: string;
  timestamp: string;
  preview: string;
  content: string;
  exportedDocx: boolean;
  exportedPdf: boolean;
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  draft?: string;
  citations?: string[];
  sources?: string[];
  isError?: boolean;
}

export function Editor({ workspaceId }: EditorProps) {
  const [content, setContent] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(true);
  const [lastAutoSavedTime, setLastAutoSavedTime] = React.useState<string>('');
  const [showStyleGuide, setShowStyleGuide] = React.useState(false);
  const [showCopilot, setShowCopilot] = React.useState(true);

  // Dynamic Chat State
  const [chatMessages, setChatMessages] = React.useState<ChatMessageItem[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: "Hello! I am your AI Proposal Co-Pilot. I have analyzed your workspace, extracted RFP requirements, and RAG capabilities. How can I help you write, refine, or verify your proposal today?"
    }
  ]);
  const [chatInput, setChatInput] = React.useState('');
  const [loadingAi, setLoadingAi] = React.useState(false);

  const chatContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat container to bottom without scrolling the parent page
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, loadingAi]);

  const handleSendChat = async (textToSend?: string) => {
    const prompt = textToSend !== undefined ? textToSend.trim() : chatInput.trim();
    if (!prompt || loadingAi) return;

    const userMsg: ChatMessageItem = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: prompt
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (textToSend === undefined) {
      setChatInput('');
    }
    setLoadingAi(true);

    try {
      if (!workspaceId) {
        throw new Error("No active workspace selected.");
      }
      const data = await api.sendCopilotMessage(workspaceId, prompt);
      const aiMsg: ChatMessageItem = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: data.response || "Here is your generated response:",
        draft: data.draft || undefined,
        citations: data.citations || undefined,
        sources: data.sources || undefined
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("Co-Pilot request failed:", err);
      const errorMsg: ChatMessageItem = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content: `Error communicating with AI Proposal Co-Pilot: ${err.message || 'Unknown error'}.`,
        isError: true
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        id: 'msg-init',
        role: 'assistant',
        content: "Hello! I am your AI Proposal Co-Pilot. I have analyzed your workspace, extracted RFP requirements, and RAG capabilities. How can I help you write, refine, or verify your proposal today?"
      }
    ]);
    setChatInput('');
    setLoadingAi(false);
  };

  const handleInsertDraft = (draftText: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = draftText.replace(/\n/g, '<br />');
        
        const frag = document.createDocumentFragment();
        let node;
        while ((node = tempDiv.firstChild)) {
          frag.appendChild(node);
        }
        
        range.insertNode(frag);
        selection.removeAllRanges();
      } else {
        editorRef.current.innerHTML += `<p>${draftText.replace(/\n/g, '<br />')}</p>`;
      }
    } else {
      editorRef.current.innerHTML += `<p>${draftText.replace(/\n/g, '<br />')}</p>`;
    }
    
    setContent(editorRef.current.innerHTML);
    setSaveSuccess(false);
  };
  const [drafts, setDrafts] = React.useState<SavedDraft[]>([
    {
      id: 'draft-1',
      timestamp: '12:10:15 PM',
      preview: 'Our team brings over 15 years of experience...',
      content: `<h2>3.1 Technical Approach</h2><p>Our team brings over 15 years of experience delivering secure, scalable cloud infrastructure for federal agencies. We understand the unique challenges of modernizing legacy systems while maintaining 99.99% uptime.</p>`,
      exportedDocx: true,
      exportedPdf: false
    },
    {
      id: 'draft-2',
      timestamp: '11:45:00 AM',
      preview: 'Initial draft structure with outlines...',
      content: `<h2>3.1 Technical Approach</h2><p>Initial draft structure with outlines for Phase 1, Phase 2, and Phase 3.</p>`,
      exportedDocx: false,
      exportedPdf: true
    }
  ]);

  const editorRef = React.useRef<HTMLDivElement | null>(null);

  // Load initial content on mount
  React.useEffect(() => {
    const initialHtml = `<h2>3.1 Technical Approach</h2>
<p>Our team brings over 15 years of experience delivering secure, scalable cloud infrastructure for federal agencies. We understand the unique challenges of modernizing legacy systems while maintaining 99.99% uptime.</p>

<h2>3.1.1 Phase 1: Assessment and Discovery</h2>
<p>During the first 30 days, our engineers will conduct a comprehensive audit of the existing on-premise architecture. This includes mapping all data flows, identifying security vulnerabilities, and documenting inter-system dependencies.</p>

<h2>3.1.2 Phase 2: Migration Strategy</h2>
<p>Following the discovery phase, we will implement a phased migration approach utilizing AWS GovCloud...</p>`;
    
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml;
    }
    setContent(initialHtml);
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setContent(e.currentTarget.innerHTML);
    setSaveSuccess(false);
  };

  // Formatting helper using document.execCommand
  const applyFormatting = (formatType: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (formatType === 'bold') {
      document.execCommand('bold', false);
    } else if (formatType === 'italic') {
      document.execCommand('italic', false);
    } else if (formatType === 'underline') {
      document.execCommand('underline', false);
    } else if (formatType === 'h1') {
      document.execCommand('formatBlock', false, '<h1>');
    } else if (formatType === 'h2') {
      document.execCommand('formatBlock', false, '<h2>');
    } else if (formatType === 'normal') {
      document.execCommand('formatBlock', false, '<p>');
    } else if (formatType === 'cardblock') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-block-el';
        cardDiv.style.backgroundColor = '#F8FAFC';
        cardDiv.style.border = '1px solid #E2E8F0';
        cardDiv.style.borderRadius = '12px';
        cardDiv.style.padding = '16px';
        cardDiv.style.marginTop = '16px';
        cardDiv.style.marginBottom = '16px';
        cardDiv.style.color = '#334155';
        cardDiv.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
        
        cardDiv.innerHTML = range.toString() || 'Card block content';
        range.deleteContents();
        range.insertNode(cardDiv);
      }
    }
    
    // Update content state
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      setSaveSuccess(false);
    }
  };

  // Save manual draft handler
  const handleSave = () => {
    setSaving(true);
    setSaveSuccess(false);
    
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      const plainText = editorRef.current?.innerText || '';
      
      const newDraft: SavedDraft = {
        id: `draft-${Date.now()}`,
        timestamp: timeStr,
        preview: plainText.substring(0, 50).replace(/\n/g, ' ') + (plainText.length > 50 ? '...' : ''),
        content: content,
        exportedDocx: false,
        exportedPdf: false
      };
      
      setDrafts(prev => [newDraft, ...prev]);
      setSaving(false);
      setSaveSuccess(true);
      setLastAutoSavedTime(timeStr);
    }, 800);
  };

  // Restore draft handler
  const handleRestoreDraft = (draft: SavedDraft) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = draft.content;
      editorRef.current.focus();
    }
    setContent(draft.content);
    setSaveSuccess(true);
  };

  // Helper to extract plain text preview
  const getPlainTextPreview = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.innerText || temp.textContent || '';
    return text.substring(0, 50).replace(/\n/g, ' ') + (text.length > 50 ? '...' : '');
  };

  // Export DOCX handler
  const handleExportDocx = () => {
    // 1. Trigger simulated file download
    const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'technical_proposal.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 2. Mark current draft in list as exported as DOCX
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    
    setDrafts(prev => {
      if (prev.length > 0 && prev[0].content === content) {
        return prev.map((d, idx) => idx === 0 ? { ...d, exportedDocx: true } : d);
      } else {
        const newDraft: SavedDraft = {
          id: `draft-${Date.now()}`,
          timestamp: timeStr,
          preview: getPlainTextPreview(content),
          content: content,
          exportedDocx: true,
          exportedPdf: false
        };
        return [newDraft, ...prev];
      }
    });
    setSaveSuccess(true);
  };

  // Export PDF handler
  const handleExportPdf = () => {
    // 1. Trigger simulated file download
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'technical_proposal.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 2. Mark current draft as exported as PDF
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

    setDrafts(prev => {
      if (prev.length > 0 && prev[0].content === content) {
        return prev.map((d, idx) => idx === 0 ? { ...d, exportedPdf: true } : d);
      } else {
        const newDraft: SavedDraft = {
          id: `draft-${Date.now()}`,
          timestamp: timeStr,
          preview: getPlainTextPreview(content),
          content: content,
          exportedDocx: false,
          exportedPdf: true
        };
        return [newDraft, ...prev];
      }
    });
    setSaveSuccess(true);
  };

  // Autosave interval timer (every 10 seconds)
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (!saveSuccess) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
        
        const autoDraft: SavedDraft = {
          id: `draft-auto-${Date.now()}`,
          timestamp: timeStr,
          preview: `[Auto-saved] ` + getPlainTextPreview(content),
          content: content,
          exportedDocx: false,
          exportedPdf: false
        };
        
        setDrafts(prev => [autoDraft, ...prev]);
        setSaveSuccess(true);
        setLastAutoSavedTime(timeStr);
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [content, saveSuccess]);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 pb-6 items-stretch relative">
      {/* CSS stylesheet block for proper MS Word editor formatting inside the canvas */}
      <style>{`
        .word-editor-canvas h1 {
          font-size: 26px !important;
          font-weight: 700 !important;
          color: #0F172A !important;
          margin-top: 24px !important;
          margin-bottom: 12px !important;
          line-height: 1.3 !important;
          border-bottom: 1px solid #E2E8F0 !important;
          padding-bottom: 6px !important;
        }
        .word-editor-canvas h2 {
          font-size: 20px !important;
          font-weight: 600 !important;
          color: #1E293B !important;
          margin-top: 18px !important;
          margin-bottom: 8px !important;
          line-height: 1.4 !important;
        }
        .word-editor-canvas p {
          font-size: 14px !important;
          color: #334155 !important;
          margin-bottom: 14px !important;
          line-height: 1.65 !important;
        }
        .word-editor-canvas u {
          text-decoration: underline !important;
        }
        .word-editor-canvas strong {
          font-weight: 700 !important;
        }
        .word-editor-canvas em {
          font-style: italic !important;
        }
        .word-editor-canvas .card-block-el {
          background-color: #F8FAFC !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 12px !important;
          padding: 16px !important;
          margin-top: 16px !important;
          margin-bottom: 16px !important;
          color: #334155 !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05) !important;
        }
      `}</style>

      {/* Column 1: Editor & Drafts */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
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
                    <CheckSquare size={14} className="text-green-400 animate-pulse" /> 
                    <span>All changes saved to draft {lastAutoSavedTime && `(${lastAutoSavedTime})`}</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Unsaved changes</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="p-2.5 text-gray-450 hover:text-white hover:bg-gray-800 rounded-xl transition-all cursor-pointer border border-transparent"
                title="Version History"
              >
                <History size={15} />
              </button>
              <button 
                onClick={() => setShowCopilot(!showCopilot)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${showCopilot ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/20' : 'bg-gray-850 hover:bg-gray-800 text-gray-300 border border-[#263042]'}`}
                title="Toggle AI Co-Pilot / Reopen"
              >
                <Sparkles size={14} />
                <span className="text-xs font-semibold">AI Co-Pilot</span>
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-850 hover:bg-gray-800 border border-[#263042] text-xs font-semibold text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin text-[#4F8CFF]" size={12} /> : <Save size={12} />} 
                Save as Draft
              </button>
              <button 
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#EF4444] hover:bg-[#EF4444]/90 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#EF4444]/15 transition-all cursor-pointer"
              >
                <Download size={12} /> 
                Export PDF
              </button>
              <button 
                onClick={handleExportDocx}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#4F8CFF]/15 transition-all cursor-pointer"
              >
                <Download size={12} /> 
                Export DOCX
              </button>
            </div>
          </div>
          
          {/* Toolbar */}
          <div className="h-12 border-b border-[#263042]/40 bg-gray-900/30 flex items-center px-6 gap-3 shrink-0 relative">
            <select 
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'h1') applyFormatting('h1');
                else if (val === 'h2') applyFormatting('h2');
                else if (val === 'normal') applyFormatting('normal');
                else if (val === 'card') applyFormatting('cardblock');
                e.target.value = 'default'; // Reset
              }}
              className="bg-transparent border-none text-xs font-semibold text-gray-300 focus:ring-0 cursor-pointer hover:text-white transition-colors"
              defaultValue="default"
            >
              <option value="default" disabled hidden>Heading 2</option>
              <option value="h1" className="bg-gray-950 text-white">Heading 1</option>
              <option value="h2" className="bg-gray-950 text-white">Heading 2</option>
              <option value="normal" className="bg-gray-950 text-white">Normal Text</option>
              <option value="card" className="bg-gray-950 text-white">Card Block</option>
            </select>
            <div className="w-px h-4 bg-[#263042] mx-1" />
            <button 
              onClick={() => applyFormatting('bold')}
              className="p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded text-xs font-bold w-7 transition-all cursor-pointer"
              title="Bold"
            >
              B
            </button>
            <button 
              onClick={() => applyFormatting('italic')}
              className="p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded text-xs italic w-7 transition-all cursor-pointer"
              title="Italic"
            >
              I
            </button>
            <button 
              onClick={() => applyFormatting('underline')}
              className="p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded text-xs underline w-7 transition-all cursor-pointer"
              title="Underline"
            >
              U
            </button>
            <div className="w-px h-4 bg-[#263042] mx-1" />
            <button 
              onClick={() => setShowStyleGuide(!showStyleGuide)}
              className={`p-1.5 rounded flex items-center gap-1 text-[11px] px-2.5 transition-all cursor-pointer ${showStyleGuide ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] font-semibold' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              <PenTool size={11} /> 
              <span>Style Guide</span>
            </button>

            {/* Style Guide Popover */}
            {showStyleGuide && (
              <div className="absolute left-64 top-10 w-72 bg-[#111827] border border-[#263042] rounded-xl shadow-2xl p-4 z-40 space-y-3.5 text-left">
                <div className="flex items-center justify-between border-b border-[#263042]/50 pb-2">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Style Guidelines Checklist</span>
                  <button onClick={() => setShowStyleGuide(false)} className="text-[9px] text-gray-450 hover:text-white cursor-pointer">Close</button>
                </div>
                <div className="space-y-2.5 text-[11px]">
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Active Voice Focus</span>
                    <span className="text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded font-mono font-bold">92% Checked</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Max Sentence Length (25 words)</span>
                    <span className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono font-bold">85% Match</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Jargon Suppression Index</span>
                    <span className="text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded font-mono font-bold">Passed</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Tender Consistency Check</span>
                    <span className="text-[#4F8CFF] bg-[#4F8CFF]/10 px-1.5 py-0.5 rounded font-mono font-bold">Optimized</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Editor Canvas with MS Word white page container layout */}
          <div className="flex-1 overflow-y-auto bg-gray-950/20 p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto bg-white border border-slate-300 shadow-[0_15px_40px_rgba(0,0,0,0.4)] rounded-sm p-16 min-h-[580px] text-gray-900 relative">
              <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="w-full h-full min-h-[480px] focus:outline-none text-gray-950 font-sans leading-relaxed text-sm text-left word-editor-canvas"
                style={{ minHeight: '480px' }}
                spellCheck="false"
              />
            </div>
          </div>

        </div>

        {/* Saved Drafts Footer - Outside of the main editor card block */}
        <div className="px-2 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={14} className="text-[#4F8CFF]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Saved Drafts & Versions</h3>
            </div>
            <span className="text-[10px] text-gray-500 font-semibold">{drafts.length} drafts saved</span>
          </div>

          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {drafts.map((d, index) => (
              <div 
                key={d.id} 
                className="flex items-center justify-between py-2 border-b border-[#263042]/30 text-left gap-4 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono font-bold text-gray-500 w-5 shrink-0 text-right">{index + 1}.</span>
                  <span className="text-[9px] font-bold text-[#4F8CFF] bg-[#4F8CFF]/10 border border-[#4F8CFF]/20 px-1.5 py-0.5 rounded uppercase shrink-0">
                    Draft
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium font-mono shrink-0">{d.timestamp}</span>
                  <span className="text-gray-400 shrink-0">|</span>
                  <p className="text-gray-300 truncate font-sans min-w-0 flex-1">{d.preview || '[Empty content]'}</p>
                  
                  {/* Export indicators */}
                  <div className="flex gap-2.5 shrink-0">
                    {d.exportedDocx && (
                      <span className="text-[8.5px] font-bold text-green-400 bg-green-500/5 border border-green-500/10 px-1 rounded">
                        Exported as DOCX
                      </span>
                    )}
                    {d.exportedPdf && (
                      <span className="text-[8.5px] font-bold text-red-400 bg-red-500/5 border border-red-500/10 px-1 rounded">
                        Exported as PDF
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => handleRestoreDraft(d)}
                  className="shrink-0 text-[10px] font-bold text-gray-450 hover:text-white bg-gray-900 border border-[#263042] hover:border-gray-700 px-3 py-1 rounded-lg transition-all opacity-80 hover:opacity-100 cursor-pointer"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* AI Assistant Sidebar */}
      {showCopilot && (
        <div className="w-80 glass-panel rounded-2xl flex flex-col shrink-0 border border-[#263042] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4F8CFF] to-[#ADC6FF]" />
          
          <div className="p-4 border-b border-[#263042]/50 flex items-center justify-between bg-gray-900/30 shrink-0">
            <div className="flex items-center gap-2.5 font-bold text-sm text-[#4F8CFF]">
              <Sparkles size={15} className="text-[#ADC6FF]" />
              AI Proposal Co-Pilot
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClearChat();
                }}
                className="text-xs text-gray-400 hover:text-white hover:bg-gray-800 px-2 py-1 rounded transition-all cursor-pointer font-medium"
                title="Clear Chat / New Chat"
              >
                Clear
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setChatMessages(prev => [
                    ...prev, 
                    {
                      id: `history-info-${Date.now()}`,
                      role: 'assistant',
                      content: "Workspace Chat History Context:\nAll co-pilot interactions and drafts are linked to this workspace's SQL RAG index."
                    }
                  ]);
                }}
                className="text-gray-405 hover:text-white transition-all cursor-pointer p-1 rounded hover:bg-gray-800 flex items-center justify-center"
                title="View Chat History"
              >
                <History size={13} />
              </button>
              <button 
                type="button"
                onClick={() => setShowCopilot(false)}
                className="text-gray-400 hover:text-white transition-all cursor-pointer p-1 rounded hover:bg-gray-800 flex items-center justify-center"
                title="Hide Co-Pilot"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat History */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-950/15"
          >
            {chatMessages.map(msg => (
              <ChatMessage 
                key={msg.id}
                role={msg.role} 
                content={msg.content}
                draft={msg.draft}
                isError={msg.isError}
                onInsert={handleInsertDraft}
                onRetry={() => {
                  const lastUser = [...chatMessages].reverse().find(m => m.role === 'user');
                  if (lastUser) {
                    setChatMessages(prev => prev.filter(m => m.id !== msg.id));
                    handleSendChat(lastUser.content);
                  }
                }}
              />
            ))}
            {loadingAi && (
              <div className="flex justify-start items-center gap-2 text-gray-450 text-xs p-1">
                <Loader2 className="animate-spin text-[#4F8CFF]" size={14} />
                <span>Co-Pilot is thinking...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[#263042]/50 bg-gray-900/50 shrink-0">
            <div className="relative rounded-xl overflow-hidden bg-gray-950 border border-[#263042] focus-within:border-[#4F8CFF]/60 transition-all">
              <textarea 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loadingAi}
                placeholder="Ask AI to generate, rewrite, or find facts..."
                className="w-full bg-transparent border-none resize-none p-3 text-xs placeholder-gray-500 focus:outline-none focus:ring-0 max-h-24 min-h-[50px] text-gray-200"
                rows={2}
              />
              <div className="flex justify-between items-center px-3 pb-2">
                <div className="flex gap-1.5">
                  <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all cursor-pointer" title="Reference Documents">
                    <Search size={13} />
                  </button>
                  <button 
                    onClick={() => {
                      const lastUser = [...chatMessages].reverse().find(m => m.role === 'user');
                      if (lastUser) {
                        handleSendChat(lastUser.content);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-all cursor-pointer" 
                    title="Regenerate"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
                <button 
                  onClick={() => handleSendChat()}
                  disabled={loadingAi || !chatInput.trim()}
                  className="bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 disabled:opacity-50 text-white p-1.5 rounded-lg shadow transition-all cursor-pointer"
                >
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reopen AI Co-Pilot Floating Tab */}
      {!showCopilot && (
        <button 
          type="button"
          onClick={() => setShowCopilot(true)}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-[#4F8CFF]/15 hover:bg-[#4F8CFF]/25 border-l border-y border-[#4F8CFF]/30 text-[#4F8CFF] px-2 py-6 rounded-l-xl shadow-2xl flex flex-col items-center gap-2 cursor-pointer z-50 transition-all hover:translate-x-[-2px] active:scale-95"
          title="Reopen AI Co-Pilot"
        >
          <Sparkles size={14} className="animate-pulse" />
          <span className="text-[9px] font-bold tracking-widest uppercase [writing-mode:vertical-lr] mt-1.5 select-none">AI Co-Pilot</span>
        </button>
      )}
    </div>
  );
}

function ChatMessage({ 
  role, 
  content, 
  draft, 
  isError, 
  onInsert, 
  onRetry 
}: { 
  role: 'user' | 'assistant', 
  content: string, 
  draft?: string, 
  isError?: boolean, 
  onInsert?: (text: string) => void, 
  onRetry?: () => void,
  key?: string
}) {
  return (
    <div className={`flex flex-col ${role === 'user' ? 'items-end' : 'items-start'}`}>
      <div className={`
        max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed
        ${role === 'user' 
          ? 'bg-gray-800 text-gray-200 rounded-br-sm border border-[#263042]/35' 
          : isError 
            ? 'bg-red-500/10 border border-red-500/20 text-red-200 rounded-bl-sm'
            : 'bg-[#4F8CFF]/5 border border-[#4F8CFF]/15 text-gray-200 rounded-bl-sm'}
      `}>
        <p className="whitespace-pre-wrap">{content}</p>
        
        {isError && onRetry && (
          <button 
            onClick={onRetry}
            className="mt-3 text-[10px] font-bold bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer w-fit"
          >
            <RefreshCw size={10} className="animate-spin-once" />
            Retry Request
          </button>
        )}

        {draft && onInsert && (
          <div className="mt-3 bg-gray-950/80 p-3.5 rounded-xl border border-[#263042] text-[11px] text-gray-400 font-sans leading-relaxed">
            <span className="text-[10px] text-[#4F8CFF] font-bold uppercase tracking-wider block mb-1">Generated Draft</span>
            <div className="whitespace-pre-wrap select-all">{draft}</div>
            <div className="mt-3 flex gap-2 justify-end pt-2 border-t border-[#263042]/40">
              <button className="text-[10px] font-semibold text-gray-450 hover:text-white transition-all cursor-pointer">Discard</button>
              <button 
                onClick={() => onInsert(draft)}
                className="text-[10px] font-semibold bg-[#4F8CFF]/15 hover:bg-[#4F8CFF]/25 text-[#4F8CFF] px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer"
              >
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
