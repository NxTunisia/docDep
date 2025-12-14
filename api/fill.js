import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { createClient } from '@supabase/supabase-js';

// Use environment variable if available, otherwise default to "TEST"
const API_KEY = process.env.API_KEY || "TEST";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY; // Using Anon Key is enough if bucket is public/authenticated, ideally use Service Role Key for backend

export default async function handler(request, response) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { api_key, template, docID, data } = request.body;

    // 1. Validate API Key
    if (api_key !== API_KEY) {
      return response.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    // 2. Resolve Template Content
    let contentBuffer = null;

    if (template) {
      // Case A: Base64 template provided directly (Stateless)
      contentBuffer = Buffer.from(template, 'base64');
    } else if (docID) {
      // Case B: Fetch from Supabase using docID (Stateful/Cloud)
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        return response.status(503).json({ error: 'Server misconfiguration: Supabase keys missing.' });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      // We need to find the full filename. Since we don't have a DB, we search the bucket list
      // This is inefficient but works for a "storage only" solution.
      const { data: files, error: listError } = await supabase.storage.from('templates').list();
      
      if (listError || !files) {
         throw new Error("Could not access template storage.");
      }

      // Find file starting with ID___ and ending with .docx
      const targetFile = files.find(f => f.name.startsWith(docID + '___') && f.name.endsWith('.docx'));

      if (!targetFile) {
        return response.status(404).json({ error: `Template with ID ${docID} not found.` });
      }

      const { data: fileBlob, error: downError } = await supabase.storage
        .from('templates')
        .download(targetFile.name);

      if (downError || !fileBlob) {
        throw new Error("Failed to download template file.");
      }

      const arrayBuffer = await fileBlob.arrayBuffer();
      contentBuffer = Buffer.from(arrayBuffer);

    } else {
      return response.status(400).json({ 
        error: 'Missing parameters', 
        message: 'Please provide either "template" (base64) OR "docID" (saved ID), and "data".' 
      });
    }

    if (!data) {
       return response.status(400).json({ error: 'Missing "data" object.' });
    }

    // 3. Process Document
    const zip = new PizZip(contentBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Render the data
    doc.render(data);

    // Generate output buffer
    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    // 4. Return File
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    response.setHeader('Content-Disposition', 'attachment; filename=generated.docx');
    response.send(buf);

  } catch (error) {
    console.error("API Generation Error:", error);
    response.status(500).json({ 
      error: 'Generation failed', 
      details: error.message 
    });
  }
}
