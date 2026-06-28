export type AppView = 
  | 'landing'
  | 'dashboard'
  | 'workspace'
  | 'compliance'
  | 'analysis'
  | 'win-probability'
  | 'editor'
  | 'reports'
  | 'settings'
  | 'history';

export interface NavContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
}
