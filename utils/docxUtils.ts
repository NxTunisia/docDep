import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import FileSaver from 'file-saver';
import { PLACEHOLDER_REGEX } from '../constants';

export const extractPlaceholders = (content: ArrayBuffer): string[] => {
  try {
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const text = zip.file("word/document.xml")?.asText();
    if (!text) return [];

    const matches = new Set<string>();
    let match;
    PLACEHOLDER_REGEX.lastIndex = 0;
    
    while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
      matches.add(match[1]);
    }

    return Array.from(matches);
  } catch (e) {
    console.error("Error parsing DOCX:", e);
    return [];
  }
};

export const generateBlob = (content: ArrayBuffer, data: Record<string, string>): Blob => {
   const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(data);

    return doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
}

export const generateDocx = (
  content: ArrayBuffer,
  data: Record<string, string>,
  filename: string
) => {
  try {
    const blob = generateBlob(content, data);
    
    // Handle possible export variations from esm.sh for file-saver
    const save = (FileSaver as any).saveAs || FileSaver;
    save(blob, `filled_${filename}`);
  } catch (error) {
    console.error("Error generating DOCX:", error);
    throw new Error("Failed to generate document. Please ensure all fields are filled correctly.");
  }
};
