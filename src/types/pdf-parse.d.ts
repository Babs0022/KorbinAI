
declare module 'pdf-parse' {
    interface PDFInfo {
      PDFFormatVersion: string;
      IsAcroForm: boolean;
      IsXFAPresent: boolean;
      [key: string]: any; // Allow other properties
    }
  
    interface PDFMetadata {
      _metadata: {
        [key: string]: any;
      };
      [key: string]: any;
    }
  
    interface PDFRenderResult {
      (page: any): string;
    }
  
    interface PDFParseData {
      numpages: number;
      numrender: number;
      info: PDFInfo;
      metadata: PDFMetadata;
      text: string;
      version: string;
    }
  
    interface PDFParseOptions {
      pagerender?: PDFRenderResult;
      max?: number;
      version?: 'default' | 'v1.10.100' | 'v1.9.426' | 'v2.0.550';
      [key: string]: any;
    }
  
    function pdf(dataBuffer: Buffer, options?: PDFParseOptions): Promise<PDFParseData>;
  
    export default pdf;
}
