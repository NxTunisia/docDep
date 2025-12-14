import { TemplateFile } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'smartdoc_templates';
const BUCKET_NAME = 'templates';

// Helper: Convert ArrayBuffer to Base64 (for LocalStorage)
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper: Convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

// --- Storage Interface ---

export const saveTemplateToStorage = async (template: TemplateFile): Promise<boolean> => {
  if (supabase) {
    try {
      // Create a composite filename: ID___Name.docx
      const fileName = `${template.id}___${template.name}`;
      
      // Upload the file to Supabase Storage
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, template.content, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true
        });

      if (error) {
        console.error("Supabase upload error:", error);
        // Add helpful alert for common "Policy" configuration errors
        if (error.message.includes("new row violates row-level security policy") || error.statusCode === '403') {
           alert("Upload Failed: Permission denied. \n\nPlease go to Supabase > Storage > Policies and create a policy to allow 'INSERT/UPDATE' for the 'templates' bucket.");
        }
        throw error;
      }
      
      // Upload metadata
      const metaName = `${template.id}___meta.json`;
      const metaContent = JSON.stringify({
        placeholders: template.placeholders,
        uploadDate: template.uploadDate.toISOString(),
        originalName: template.name
      });
      
      await supabase.storage
        .from(BUCKET_NAME)
        .upload(metaName, new Blob([metaContent], { type: 'application/json' }), { upsert: true });

      return true;
    } catch (e) {
      console.error("Failed to save to Cloud:", e);
      return false;
    }
  } else {
    // LocalStorage Fallback
    try {
      const templates = getLocalTemplatesRaw();
      const storageItem = {
        ...template,
        content: arrayBufferToBase64(template.content),
        uploadDate: template.uploadDate.toISOString()
      };
      templates.push(storageItem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
      return true;
    } catch (e) {
      console.error("Failed to save locally:", e);
      return false;
    }
  }
};

export const getTemplatesFromStorage = async (): Promise<TemplateFile[]> => {
  if (supabase) {
    try {
      // List all files
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list();
      
      if (error) {
        console.error("Supabase list error:", error);
        return [];
      }
      
      if (!data) return [];

      // Filter for metadata files to reconstruct the list
      const metaFiles = data.filter(f => f.name.endsWith('___meta.json'));
      
      const templates: TemplateFile[] = [];

      // Fetch metadata and construct objects
      await Promise.all(metaFiles.map(async (f) => {
        const id = f.name.split('___')[0];
        // Download metadata
        const { data: jsonBlob } = await supabase.storage.from(BUCKET_NAME).download(f.name);
        if (jsonBlob) {
           const text = await jsonBlob.text();
           const meta = JSON.parse(text);
           
           // Download Content
           const docName = `${id}___${meta.originalName}`;
           const { data: docBlob } = await supabase.storage.from(BUCKET_NAME).download(docName);
           
           if (docBlob) {
             templates.push({
               id: id,
               name: meta.originalName,
               content: await docBlob.arrayBuffer(),
               placeholders: meta.placeholders,
               uploadDate: new Date(meta.uploadDate)
             });
           }
        }
      }));

      return templates;
    } catch (e) {
      console.error("Error fetching from cloud:", e);
      return [];
    }
  } else {
    // LocalStorage Fallback
    const raw = getLocalTemplatesRaw();
    return raw.map((item: any) => ({
      ...item,
      content: base64ToArrayBuffer(item.content),
      uploadDate: new Date(item.uploadDate)
    }));
  }
};

export const deleteTemplateFromStorage = async (id: string): Promise<void> => {
  if (supabase) {
    // Find files related to this ID
    const { data } = await supabase.storage.from(BUCKET_NAME).list();
    if (data) {
      const filesToDelete = data
        .filter(f => f.name.startsWith(id + '___'))
        .map(f => f.name);
        
      if (filesToDelete.length > 0) {
        await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
      }
    }
  } else {
    const raw = getLocalTemplatesRaw();
    const filtered = raw.filter((t: any) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};

// Internal LocalStorage Helpers
const getLocalTemplatesRaw = (): any[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};
