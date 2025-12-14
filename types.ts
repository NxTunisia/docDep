
export interface TemplateFile {
  id: string;
  name: string;
  content: ArrayBuffer;
  placeholders: string[];
  uploadDate: Date;
}

export interface FormData {
  [key: string]: string;
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  API_DOCS = 'API_DOCS'
}
