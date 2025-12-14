import React, { useState } from 'react';
import { AppView, TemplateFile } from './types';
import Auth from './components/Auth';
import TemplateManager from './components/TemplateManager';
import Editor from './components/Editor';
import ApiDocs from './components/ApiDocs';
import { Book } from 'lucide-react';

const App: React.FC = () => {
  // Initialize state from localStorage to persist login across reloads
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const isAuthenticated = localStorage.getItem('smartdoc_auth') === 'true';
    return isAuthenticated ? AppView.DASHBOARD : AppView.LOGIN;
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateFile | null>(null);

  const handleLogin = () => {
    localStorage.setItem('smartdoc_auth', 'true');
    setCurrentView(AppView.DASHBOARD);
  };

  const handleTemplateSelect = (template: TemplateFile) => {
    setSelectedTemplate(template);
    setCurrentView(AppView.EDITOR);
  };

  const handleBackToDashboard = () => {
    setSelectedTemplate(null);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('smartdoc_auth');
    setCurrentView(AppView.LOGIN);
    setSelectedTemplate(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header (only show if logged in) */}
      {currentView !== AppView.LOGIN && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={handleBackToDashboard}
            >
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                 <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">SmartDoc</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setCurrentView(AppView.API_DOCS)}
                className={`flex items-center text-sm font-medium transition-colors ${currentView === AppView.API_DOCS ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Book className="h-4 w-4 mr-1.5" />
                API Docs
              </button>
              <div className="h-4 w-px bg-slate-300"></div>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="py-6">
        {currentView === AppView.LOGIN && (
          <Auth onLogin={handleLogin} />
        )}

        {currentView === AppView.DASHBOARD && (
          <TemplateManager onTemplateSelect={handleTemplateSelect} />
        )}

        {currentView === AppView.API_DOCS && (
          <ApiDocs onBack={handleBackToDashboard} />
        )}

        {currentView === AppView.EDITOR && selectedTemplate && (
          <Editor 
            template={selectedTemplate} 
            onBack={handleBackToDashboard} 
          />
        )}
      </main>
    </div>
  );
};

export default App;