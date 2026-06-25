export type AppView = 
  | 'landing'
  | 'dashboard'
  | 'workspace'
  | 'compliance'
  | 'analysis'
  | 'win-probability'
  | 'editor';

export interface NavContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
}
