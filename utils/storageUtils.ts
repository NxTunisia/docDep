import { TemplateFile } from '../types';

const STORAGE_KEY = 'smartdoc_templates';

// Helper to convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper to convert Base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

export const saveTemplateToStorage = (template: TemplateFile): boolean => {
  try {
    const templates = getTemplatesFromStorageRaw();
    
    // Convert content to base64 for storage
    const storageItem = {
      ...template,
      content: arrayBufferToBase64(template.content),
      uploadDate: template.uploadDate.toISOString() // Store date as string
    };
    
    templates.push(storageItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    return true;
  } catch (e) {
    console.error("Failed to save template (likely storage quota exceeded):", e);
    return false;
  }
};

// Internal helper to get raw objects
const getTemplatesFromStorageRaw = (): any[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const getTemplatesFromStorage = (): TemplateFile[] => {
  const raw = getTemplatesFromStorageRaw();
  return raw.map((item: any) => ({
    ...item,
    content: base64ToArrayBuffer(item.content),
    uploadDate: new Date(item.uploadDate)
  }));
};

export const deleteTemplateFromStorage = (id: string): void => {
  const raw = getTemplatesFromStorageRaw();
  const filtered = raw.filter((t: any) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
