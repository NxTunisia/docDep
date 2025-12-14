import React, { useState } from 'react';
import { ArrowLeft, Key, Code, Terminal, Globe, AlertTriangle } from 'lucide-react';
import { API_KEY } from '../constants';

interface ApiDocsProps {
  onBack: () => void;
}

const ApiDocs: React.FC<ApiDocsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'remote'>('local');

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-8 py-8 text-white">
          <h1 className="text-3xl font-bold flex items-center">
            <Terminal className="mr-3 h-8 w-8 text-green-400" />
            API Documentation
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            You can interact with SmartDoc in two ways: via the internal <strong>Simulator</strong> (for testing stored templates) or the <strong>Remote API</strong> (for programmatic access via Postman/cURL).
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'local' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Browser Simulator (Stored Templates)
          </button>
          <button
            onClick={() => setActiveTab('remote')}
            className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'remote' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Remote API Endpoint (Real HTTP Requests)
          </button>
        </div>

        <div className="p-8">
          
          {/* Common Auth Section */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Key className="mr-2 h-5 w-5 text-indigo-600" />
              Authentication Key
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between max-w-md">
              <code className="text-lg font-mono text-slate-900 font-bold">{API_KEY}</code>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Hardcoded System Key</span>
            </div>
          </section>

          {activeTab === 'local' ? (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">Internal Simulator</h3>
                 <p className="text-slate-600 mb-4">
                   Use this to fill templates you have uploaded to the Dashboard. This runs entirely in your browser.
                 </p>
                 <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex items-start">
                   <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                   Note: External tools (like Postman) cannot access this method because your templates are stored in your browser's LocalStorage, not on a server.
                 </div>
               </div>

               <div>
                <h4 className="font-semibold text-slate-900 mb-3">Payload Structure</h4>
                <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
                  <pre className="text-sm font-mono text-green-400">
{`{
  "api_key": "${API_KEY}",
  "docID": 12345,  // The ID of the template in your dashboard
  "fields": {
    "name": "John Doe",
    "date": "2024-01-01"
  }
}`}
                  </pre>
                </div>
               </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                   <Globe className="mr-2 h-5 w-5 text-indigo-500" />
                   Remote Endpoint (Stateless)
                 </h3>
                 <p className="text-slate-600 mb-4">
                   Use this endpoint to generate documents programmatically from any server or tool (Postman, Node.js, Python).
                 </p>
                 
                 <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 font-mono text-sm mb-4 inline-block">
                   POST /api/fill
                 </div>
                 
                 <p className="text-sm text-slate-500 italic">
                   * If deployed to Vercel, the full URL is <code>https://your-project.vercel.app/api/fill</code>
                 </p>
               </div>

               <div>
                 <h4 className="font-semibold text-slate-900 mb-3">Requirements</h4>
                 <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
                   <li>Method: <strong>POST</strong></li>
                   <li>Header: <code>Content-Type: application/json</code></li>
                   <li>Because the server cannot see your browser storage, you <strong>must send the template file</strong> in the request body as a Base64 string.</li>
                 </ul>
               </div>

               <div>
                <h4 className="font-semibold text-slate-900 mb-3">Request Body</h4>
                <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
                  <pre className="text-sm font-mono text-green-400">
{`{
  "api_key": "${API_KEY}",
  "template": "UEsDBBQABgAIAAAAIQA...", // Base64 encoded DOCX file string
  "data": {
    "name": "Jane Doe",
    "invoice_id": "999"
  }
}`}
                  </pre>
                </div>
               </div>

               <div>
                 <h4 className="font-semibold text-slate-900 mb-3">Response</h4>
                 <p className="text-slate-600 text-sm mb-2">Returns a binary <code>.docx</code> file.</p>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ApiDocs;