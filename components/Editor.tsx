import React, { useState } from 'react';
import { ArrowLeft, Download, Terminal, Play, FileText, Printer, Check, AlertTriangle } from 'lucide-react';
import { renderAsync } from 'docx-preview';
import html2pdf from 'html2pdf.js';
import { TemplateFile, FormData } from '../types';
import { generateDocx, generateBlob } from '../utils/docxUtils';
import { API_KEY } from '../constants';

interface EditorProps {
  template: TemplateFile;
  onBack: () => void;
}

const Editor: React.FC<EditorProps> = ({ template, onBack }) => {
  const [formData, setFormData] = useState<FormData>(
    template.placeholders.reduce((acc, key) => ({ ...acc, [key]: '' }), {})
  );
  
  // API Simulation State
  const [apiPayload, setApiPayload] = useState('');
  const [apiStatus, setApiStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSimulateApi = () => {
    setApiStatus(null);
    try {
      if (!apiPayload.trim()) {
        setApiStatus({ type: 'error', msg: 'Payload is empty' });
        return;
      }

      const parsed = JSON.parse(apiPayload);

      // 1. Check API Key
      if (parsed.api_key !== API_KEY) {
        setApiStatus({ type: 'error', msg: 'Invalid API Key' });
        return;
      }

      // 2. Check Doc ID (Optional, but good for realism)
      // Note: We use loose equality to allow string/number mismatch "1" vs 1
      if (parsed.docID && parsed.docID != template.id) {
         setApiStatus({ type: 'error', msg: `ID Mismatch. Expected ${template.id}, got ${parsed.docID}` });
         return;
      }

      // 3. Fill Fields
      if (parsed.fields && typeof parsed.fields === 'object') {
        const newFormData = { ...formData };
        let matchCount = 0;
        
        Object.keys(parsed.fields).forEach(key => {
          if (Object.prototype.hasOwnProperty.call(newFormData, key)) {
            newFormData[key] = parsed.fields[key];
            matchCount++;
          }
        });

        setFormData(newFormData);
        setApiStatus({ type: 'success', msg: `Successfully filled ${matchCount} fields.` });
      } else {
        setApiStatus({ type: 'error', msg: 'No "fields" object found in payload.' });
      }

    } catch (e) {
      setApiStatus({ type: 'error', msg: 'Invalid JSON format.' });
    }
  };

  const handleDownload = async () => {
    setIsGeneratingDoc(true);
    setTimeout(() => {
      try {
        generateDocx(template.content, formData, template.name);
      } catch (error) {
        alert("Error generating document");
      } finally {
        setIsGeneratingDoc(false);
      }
    }, 500);
  };

  const handlePdfExport = async () => {
    setIsPreparingPrint(true);
    try {
      // 1. Generate the filled DOCX blob
      const blob = generateBlob(template.content, formData);
      
      // 2. Render it to the hidden print container
      const container = document.getElementById('print-container');
      if (container) {
        container.innerHTML = ''; // Clear previous
        await renderAsync(blob, container);
        
        // 3. Configure PDF options
        // Safely resolve html2pdf function (handling ESM default export quirks)
        const html2pdfFunc = (html2pdf as any).default || html2pdf;

        if (typeof html2pdfFunc !== 'function') {
            console.error("html2pdf library loaded as:", html2pdf);
            throw new Error("PDF generation library failed to initialize correctly.");
        }

        const opt = {
          margin:       10,
          filename:     `filled_${template.name.replace('.docx', '')}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // 4. Generate PDF from the container
        await html2pdfFunc().set(opt).from(container).save();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate PDF. You can try downloading the DOCX instead.");
    } finally {
      setIsPreparingPrint(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col md:flex-row gap-8">
      {/* Left Sidebar: API Simulation */}
      <div className="w-full md:w-1/3 space-y-6">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </button>

        <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-700 p-6 text-white">
          <div className="flex items-center space-x-2 mb-4">
             <div className="p-2 bg-slate-800 rounded-lg border border-slate-600">
                <Terminal className="h-5 w-5 text-green-400" />
             </div>
             <h3 className="font-bold text-white text-lg">Simulate API</h3>
          </div>
          
          <p className="text-slate-400 text-sm mb-4">
            Paste a JSON payload below to simulate an API request. Ensure the <code>api_key</code> matches.
          </p>

          <div className="relative">
            <textarea
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs font-mono text-green-400 min-h-[200px]"
              placeholder={`{\n  "api_key": "...",\n  "docID": "${template.id}",\n  "fields": { ... }\n}`}
              value={apiPayload}
              onChange={(e) => setApiPayload(e.target.value)}
            />
          </div>

          {apiStatus && (
            <div className={`mt-3 p-2 rounded text-xs flex items-center ${apiStatus.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {apiStatus.type === 'success' ? <Check className="h-3 w-3 mr-2" /> : <AlertTriangle className="h-3 w-3 mr-2" />}
              {apiStatus.msg}
            </div>
          )}

          <button
            onClick={handleSimulateApi}
            disabled={!apiPayload.trim()}
            className={`
              mt-4 w-full flex items-center justify-center py-2.5 px-4 rounded-lg font-medium text-slate-900 transition-all
              ${!apiPayload.trim() 
                ? 'bg-slate-700 cursor-not-allowed text-slate-500' 
                : 'bg-green-500 hover:bg-green-400 shadow-lg shadow-green-900/20'
              }
            `}
          >
            <Play className="h-4 w-4 mr-2" />
            Process Request
          </button>
        </div>
        
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h4 className="font-semibold text-blue-900 mb-2">Template Info</h4>
          <p className="text-sm text-blue-800 mb-1">
            <span className="font-medium">File:</span> {template.name}
          </p>
          <p className="text-sm text-blue-800 mb-1">
            <span className="font-medium">Doc ID:</span> {template.id}
          </p>
          <p className="text-sm text-blue-800">
            <span className="font-medium">Fields detected:</span> {template.placeholders.length}
          </p>
        </div>
      </div>

      {/* Right Content: Form & Preview Actions */}
      <div className="w-full md:w-2/3">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex justify-between items-center">
             <h2 className="font-bold text-slate-800 text-lg flex items-center">
               <FileText className="h-5 w-5 mr-2 text-slate-500" />
               Fill Document Details
             </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {template.placeholders.map((key) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={formData[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder={`Enter value for ${key}`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-end">
               <button
                onClick={handlePdfExport}
                disabled={isPreparingPrint}
                className="px-6 py-3 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center disabled:opacity-70"
                title="Save as PDF"
               >
                 {isPreparingPrint ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent" />
                 ) : (
                   <>
                    <Printer className="h-5 w-5 mr-2" />
                    Save as PDF
                   </>
                 )}
               </button>
               
               <button
                onClick={handleDownload}
                disabled={isGeneratingDoc}
                className="flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-xl transition-all disabled:opacity-70"
               >
                 {isGeneratingDoc ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                 ) : (
                   <>
                     <Download className="h-5 w-5 mr-2" />
                     Download DOCX
                   </>
                 )}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
