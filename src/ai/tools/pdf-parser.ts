
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
// pdf-parse is imported dynamically below to prevent build-time errors

export const extractTextFromPdfTool = ai.defineTool(
  {
    name: 'extractTextFromPdfTool',
    description: 'Extracts text content from a PDF file provided as a data URI.',
    inputSchema: z.string().describe("A PDF file encoded as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'."),
    outputSchema: z.string(),
  },
  async (dataUri) => {
    try {
      // Dynamically import pdf-parse only when the tool is executed
      const pdf = (await import('pdf-parse')).default;

      if (!dataUri.startsWith('data:application/pdf;base64,')) {
          throw new Error('Invalid PDF data URI format.');
      }
      const base64Data = dataUri.substring(dataUri.indexOf(',') + 1);
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      const data = await pdf(pdfBuffer);
      // Limit context size to avoid overwhelming the prompt window
      return data.text.substring(0, 15000); 
    } catch (error: any) {
      console.error('Error parsing PDF:', error.message);
      return `Error: Could not parse the PDF file. It might be corrupted or in an unsupported format. Error: ${error.message}`;
    }
  }
);
