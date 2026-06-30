import React from 'react';
import { 
  Search, 
  History as HistoryIcon, 
  Calendar, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  ChevronRight, 
  Briefcase, 
  ArrowUpDown, 
  Download,
  AlertCircle,
  FileText
} from 'lucide-react';
import { api, Workspace, notificationService } from '../services/api';
import { AppView } from '../types';
import { WorkspaceContextBanner } from './WorkspaceContextBanner';

interface HistoryProps {
  workspaceId: string | null;
  setWorkspaceId: (id: string | null) => void;
  onNavigate: (view: AppView) => void;
}

interface HistoryItem {
  workspace_id: string;
  workspace_name: string;
  sector: string;
  rfp_name: string;
  upload_date: string | null;
  win_probability: number | null;
  compliance_pct: number | null;
  status: string;
  recommendation: string | null;
  created_at: string;
}

export function History({ workspaceId, setWorkspaceId, onNavigate }: HistoryProps) {
  const [historyItems, setHistoryItems] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  
  // Sorting state
  const [sortBy, setSortBy] = React.useState<keyof HistoryItem>('upload_date');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getHistory();
      setHistoryItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch proposal history');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHistory();
  }, []);

  const handleSelectWorkspace = (id: string, name: string) => {
    setWorkspaceId(id);
    notificationService.addNotification(
      'Workspace Restored',
      `Switched to active workspace: "${name}"`,
      'info'
    );
    // Navigate back to Dashboard with deep link routing
    onNavigate('dashboard');
  };

  const handleSort = (field: keyof HistoryItem) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Date filter helper logic
  const matchDate = (dateStr: string | null, filter: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (filter === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (filter === '7days') {
      return diffDays <= 7;
    }
    if (filter === '30days') {
      return diffDays <= 30;
    }
    if (filter === '90days') {
      return diffDays <= 90;
    }
    if (filter === 'year') {
      return date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Filter items
  const filteredItems = historyItems.filter(item => {
    const matchesSearch = 
      item.workspace_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rfp_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.upload_date && item.upload_date.includes(searchQuery));

    const matchesDate = dateFilter === 'all' || matchDate(item.upload_date || item.created_at, dateFilter);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];

    if (valA === null || valA === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (valB === null || valB === undefined) return sortOrder === 'asc' ? 1 : -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }

    // Numbers
    return sortOrder === 'asc'
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number);
  });

  // Pagination helper
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 pb-20 h-full flex flex-col">
      <WorkspaceContextBanner workspaceId={workspaceId} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-display-sm font-semibold tracking-tight text-white flex items-center gap-2.5">
            <HistoryIcon className="text-[#4F8CFF] w-7 h-7" />
            RFP Proposal History
          </h1>
          <p className="text-on-surface-variant mt-1">Review previously uploaded RFPs, win probabilities, compliance results, and restore workspaces.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
          <input 
            type="text" 
            placeholder="Search workspace or RFP file name..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#111827]/40 border border-[#263042] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#4F8CFF] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Date Filter Selection */}
          <div className="relative w-full sm:w-40">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#111827]/60 border border-[#263042] text-xs font-semibold text-gray-300 px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#4F8CFF] cursor-pointer appearance-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <Calendar size={13} />
            </div>
          </div>

          {/* Status Filter Selection */}
          <div className="relative w-full sm:w-40">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#111827]/60 border border-[#263042] text-xs font-semibold text-gray-300 px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#4F8CFF] cursor-pointer appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <ChevronRight size={13} className="rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Main RFP History Table */}
      <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[350px]">
        {loading ? (
          <div className="h-60 w-full flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#4F8CFF]" size={28} />
            <span className="text-outline text-xs">Loading proposal history...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="h-60 w-full flex flex-col items-center justify-center text-center p-8 gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center border border-[#263042]/50 text-gray-500">
              <HistoryIcon size={24} />
            </div>
            <h3 className="text-sm font-semibold text-white">No historical RFPs found</h3>
            <p className="text-xs text-outline max-w-sm">No proposal records matched your search query or filters. Adjust search or upload a new RFP.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="overflow-auto flex-1 custom-scrollbar border border-[#263042]/30 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#111827] z-10 shadow-sm border-b border-[#263042]/40">
                  <tr className="text-xs text-outline uppercase tracking-wider bg-gray-950/20">
                    <th className="py-4 px-5 font-semibold">Workspace Name</th>
                    <th className="py-4 px-5 font-semibold">RFP File Name</th>
                    <th className="py-4 px-5 font-semibold cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('upload_date')}>
                      <div className="flex items-center gap-1.5">
                        Uploaded Date
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 px-5 font-semibold cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('win_probability')}>
                      <div className="flex items-center gap-1.5">
                        Win Prob
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 px-5 font-semibold cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('compliance_pct')}>
                      <div className="flex items-center gap-1.5">
                        Compliance
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 px-5 font-semibold">Go / No-Go</th>
                    <th className="py-4 px-5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263042]/30">
                  {currentItems.map(item => {
                    const isActive = workspaceId === item.workspace_id;
                    const displayWinProb = item.win_probability !== null ? `${Math.round(item.win_probability)}%` : 'N/A';
                    const displayCompliance = item.compliance_pct !== null ? `${Math.round(item.compliance_pct)}%` : 'N/A';
                    
                    let recColor = 'text-gray-400 bg-gray-900/30 border-gray-800';
                    if (item.recommendation === 'GO') recColor = 'text-green-400 bg-green-500/10 border-green-500/20';
                    if (item.recommendation === 'CONDITIONAL') recColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                    if (item.recommendation === 'NO-GO') recColor = 'text-error bg-error/10 border-error/20';

                    return (
                      <tr key={item.workspace_id} className={`hover:bg-slate-900/30 transition-colors ${isActive ? 'bg-[#4F8CFF]/5 border-l-2 border-l-[#4F8CFF]' : ''}`}>
                        <td className="py-4 px-5">
                          <span className="text-sm font-semibold text-white block">{item.workspace_name}</span>
                          <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{item.sector} Sector</span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-[#4F8CFF] shrink-0" />
                            <span className="text-xs text-gray-300 font-semibold truncate max-w-[200px]" title={item.rfp_name}>
                              {item.rfp_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-xs text-gray-400">
                          {item.upload_date 
                            ? new Date(item.upload_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                            : new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                          }
                        </td>
                        <td className="py-4 px-5 text-sm font-mono font-bold text-white">
                          {displayWinProb}
                        </td>
                        <td className="py-4 px-5 text-sm font-mono font-bold text-[#4F8CFF]">
                          {displayCompliance}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md border capitalize inline-block ${recColor}`}>
                            {item.recommendation || 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          {isActive ? (
                            <span className="text-[10px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1 w-max">
                              <CheckCircle2 size={11} />
                              Active Workspace
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSelectWorkspace(item.workspace_id, item.workspace_name)}
                              className="text-[10px] font-bold text-white bg-slate-900 border border-[#263042] hover:bg-[#4F8CFF] hover:border-[#4F8CFF] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Briefcase size={11} />
                              Open RFP
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#263042]/30 flex items-center justify-between bg-gray-950/20 shrink-0">
                <span className="text-xs text-gray-500">
                  Showing <span className="font-semibold text-gray-300">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-gray-300">{Math.min(indexOfLastItem, sortedItems.length)}</span> of <span className="font-semibold text-gray-300">{sortedItems.length}</span> records
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-[#263042] bg-slate-900 hover:bg-[#1E293B] rounded-lg text-xs font-semibold text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-[#263042] bg-slate-900 hover:bg-[#1E293B] rounded-lg text-xs font-semibold text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
