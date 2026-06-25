const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Workspace {
  id: string;
  name: string;
  sector: string;
  status: string;
  created_at?: string;
}

export interface Requirement {
  id: string;
  workspace_id: string;
  requirement_text: string;
  category: string;
  source_page?: number;
}

export interface ChecklistItem {
  id: string;
  workspace_id: string;
  requirement_id: string;
  match_status: 'matched' | 'partial' | 'gap';
  confidence_score: number;
  evidence_capability_id: string | null;
  manager_override: boolean;
  requirement_text?: string;
  category?: string;
  source_page?: number;
}

export interface ScoreData {
  win_probability: number;
  budget_alignment_score: number;
  past_win_rate_score: number;
  compliance_pass_rate: number;
  competitor_score: number;
  go_no_go: 'GO' | 'CONDITIONAL' | 'NO-GO';
  rationale: string;
}

export interface DashboardData {
  score: ScoreData | null;
  checklist_summary: {
    total: number;
    matched: number;
    partial: number;
    gap: number;
  };
}

export const api = {
  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    const res = await fetch(`${API_BASE_URL}/workspaces`);
    if (!res.ok) throw new Error('Failed to fetch workspaces');
    return res.json();
  },

  async createWorkspace(name: string, sector: string): Promise<Workspace> {
    const res = await fetch(`${API_BASE_URL}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sector })
    });
    if (!res.ok) throw new Error('Failed to create workspace');
    return res.json();
  },

  // Upload RFP Document
  async uploadRfp(workspaceId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload RFP document');
    }
    return res.json();
  },

  // Trigger Extraction
  async extractRfp(workspaceId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/extract`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to extract RFP structure');
    }
    return res.json();
  },

  // Get Requirements
  async getRequirements(workspaceId: string): Promise<Requirement[]> {
    const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/requirements`);
    if (!res.ok) throw new Error('Failed to fetch requirements');
    return res.json();
  },

  // Match Capabilities
  async matchCapabilities(workspaceId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/match-capabilities`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to match capabilities');
    }
    return res.json();
  },

  // Get Compliance Checklist
  async getChecklist(workspaceId: string): Promise<ChecklistItem[]> {
    const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/checklist`);
    if (!res.ok) throw new Error('Failed to fetch checklist');
    return res.json();
  },

  // Calculate Scores
  async calculateScore(workspaceId: string, rfpBudget: number, competitorCount: number): Promise<ScoreData> {
    const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfp_budget: rfpBudget, competitor_count: competitorCount })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to calculate win probability score');
    }
    return res.json();
  },

  // Get Dashboard Data
  async getDashboard(workspaceId: string): Promise<DashboardData> {
    const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  }
};

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: 'upload' | 'extraction' | 'matching' | 'scoring' | 'info';
}

export const notificationService = {
  getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem('govprop_notifications');
      if (!data) {
        // Seed default notification list
        const defaultNotifications: AppNotification[] = [
          {
            id: 'seed-1',
            title: 'Welcome to GovProp.ai',
            message: 'Your AI Proposal Assistant is ready. Upload RFP docs to begin.',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            read: false,
            type: 'info'
          },
          {
            id: 'seed-2',
            title: 'Database Synced',
            message: 'Capability library loaded with 50 internal credentials.',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
            read: true,
            type: 'info'
          }
        ];
        localStorage.setItem('govprop_notifications', JSON.stringify(defaultNotifications));
        return defaultNotifications;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  addNotification(title: string, message: string, type?: AppNotification['type']) {
    try {
      const list = this.getNotifications();
      const newNotif: AppNotification = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        type
      };
      list.unshift(newNotif);
      localStorage.setItem('govprop_notifications', JSON.stringify(list));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) {
      console.error(e);
    }
  },

  markAllAsRead() {
    try {
      const list = this.getNotifications().map(n => ({ ...n, read: true }));
      localStorage.setItem('govprop_notifications', JSON.stringify(list));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) {
      console.error(e);
    }
  },

  clearAll() {
    try {
      localStorage.setItem('govprop_notifications', JSON.stringify([]));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) {
      console.error(e);
    }
  }
};

