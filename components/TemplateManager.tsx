import React, { useRef, useState, useEffect } from 'react';
import { FileUp, FileText, Trash2, Code, Calendar, CheckCircle, AlertCircle, RefreshCw, Cloud } from 'lucide-react';
import { TemplateFile } from '../types';
import { extractPlaceholders } from '../utils/docxUtils';
import { saveTemplateToStorage, getTemplatesFromStorage, deleteTemplateFromStorage } from '../utils/storageUtils';
import { supabase } from '../utils/supabaseClient';
import { API_KEY } from '../constants';

interface TemplateManagerProps {
  onTemplateSelect: (template: TemplateFile) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onTemplateSelect }) => {
  const [savedTemplates, setSavedTemplates] = useState<TemplateFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewApiId, setViewApiId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const templates = await getTemplatesFromStorage();
      setSavedTemplates(templates);
    } catch (e) {
      console.error(e);
      setError("Failed to load templates.");
    } finally {
      setIsLoading(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    if (!file.name.endsWith('.docx')) {
      setError('Please upload a .docx file');
      setIsLoading(false);
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const placeholders = extractPlaceholders(arrayBuffer);
      
      if (placeholders.length === 0) {
        setError('No placeholders detected. Ensure format is {placeholderName}.');
        setIsLoading(false);
        return;
      }

      // Generate a simple numeric ID 
      const simpleId = Math.floor(Math.random() * 100000).toString();

      const template: TemplateFile = {
        id: simpleId,
        name: file.name,
        content: arrayBuffer,
        placeholders,
        uploadDate: new Date(),
      };

      const success = await saveTemplateToStorage(template);
      if (!success) {
        setError('Template processed but could not be saved. Check connection or storage quota.');
      } else {
        await loadTemplates(); // Refresh list
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this template?')) {
      setIsLoading(true);
      await deleteTemplateFromStorage(id);
      await loadTemplates();
      setIsLoading(false);
    }
  };

  const handleShowApi = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setViewApiId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800">Template Library</h2>
        <p className="text-slate-500 mt-2 flex items-center justify-center gap-2">
          {supabase ? (
            <span className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-full border border-green-200">
              <Cloud className="h-3 w-3 mr-1" /> Cloud Sync Active (Supabase)
            </span>
          ) : (
             <span className="flex items-center text-amber-600 text-sm font-medium bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
              <AlertCircle className="h-3 w-3 mr-1" /> Local Storage Mode
            </span>
          )}
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-10">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Template</h3>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragging 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }
            ${isLoading ? 'opacity-50 cursor-wait' : ''}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".docx"
            onChange={handleFileInput}
            disabled={isLoading}
          />
          
          <div className="flex flex-col items-center pointer-events-none">
            {isLoading ? (
               <div className="h-12 w-12 flex items-center justify-center mb-3">
                 <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
               </div>
            ) : (
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                <FileUp className="h-6 w-6" />
              </div>
            )}
            <p className="text-slate-700 font-medium">
              {isLoading ? "Processing..." : "Click to upload or drag and drop"}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Supports .docx files with {'{placeholders}'}
            </p>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center text-sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
      </div>

      {/* Saved Templates List */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          Saved Templates
          <span className="ml-2 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
            {savedTemplates.length}
          </span>
          {isLoading && <RefreshCw className="h-4 w-4 ml-2 animate-spin text-indigo-500" />}
        </h3>

        {savedTemplates.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">
              {isLoading ? "Loading templates..." : "No templates saved yet. Upload one above!"}
            </p>
            {!supabase && (
               <p className="text-xs text-amber-500 mt-2">
                 Configure Supabase in .env to enable cloud sync across devices.
               </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTemplates.map((template) => (
              <div 
                key={template.id}
                onClick={() => onTemplateSelect(template)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex space-x-1">
                       <button
                        onClick={(e) => handleShowApi(e, template.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="View API Payload Structure"
                      >
                        <Code className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, template.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-slate-800 mb-1 truncate" title={template.name}>
                    {template.name}
                  </h4>
                  
                  <div className="flex items-center text-xs text-slate-500 mb-4">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                      ID: {template.id}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {template.uploadDate.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {template.placeholders.slice(0, 3).map(p => (
                      <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                        {p}
                      </span>
                    ))}
                    {template.placeholders.length > 3 && (
                      <span className="text-xs text-slate-400 px-1 self-center">
                        +{template.placeholders.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 rounded-b-xl flex justify-between items-center group-hover:bg-indigo-50 transition-colors">
                  <span className="text-xs font-medium text-slate-500 group-hover:text-indigo-600">
                    Click to Fill
                  </span>
                  <CheckCircle className="h-4 w-4 text-slate-300 group-hover:text-indigo-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Payload Modal */}
      {viewApiId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewApiId(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">API Payload Example</h3>
              <button onClick={() => setViewApiId(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-3">
                Use this ID to generate documents from your mobile app.
                {supabase ? "" : " (Requires Cloud Config)"}
              </p>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto relative group">
                <pre className="text-xs text-green-400 font-mono">
{JSON.stringify({
  api_key: API_KEY,
  docID: viewApiId,
  data: savedTemplates.find(t => t.id === viewApiId)?.placeholders.reduce((acc, curr) => ({...acc, [curr]: "value"}), {}) || {}
}, null, 2)}
                </pre>
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setViewApiId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
