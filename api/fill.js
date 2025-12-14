import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

// Hardcoded API Key as requested
const API_KEY = "TEST";

export default function handler(request, response) {
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
    const { api_key, template, data } = request.body;

    // 1. Validate API Key
    if (api_key !== API_KEY) {
      return response.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    // 2. Validate Payload
    if (!template || !data) {
      return response.status(400).json({ 
        error: 'Missing parameters', 
        message: 'Please provide "template" (base64 string) and "data" (json object).' 
      });
    }

    // 3. Process Document
    // Convert base64 string back to binary buffer
    const content = Buffer.from(template, 'base64');
    
    const zip = new PizZip(content);
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
