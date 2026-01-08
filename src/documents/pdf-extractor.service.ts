import fs from 'fs/promises';
import path from 'path';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class PdfExtractorService {
  async extractText(filePath: string): Promise<string> {
    try {
      const absolutePath = path.join(process.cwd(), filePath);

      // Dynamically import pdfjs-dist
      const pdfjs = await import('pdfjs-dist');

      // Debug: log what's available
      console.log('pdfjs keys:', Object.keys(pdfjs));
      console.log('pdfjs.getDocument type:', typeof pdfjs.getDocument);
      console.log('pdfjs.default type:', typeof (pdfjs as any).default);

      // Try different ways to access getDocument
      const getDocument =
        pdfjs.getDocument || (pdfjs as any).default?.getDocument;

      if (!getDocument) {
        throw new Error('getDocument function not found in pdfjs-dist');
      }

      // Read the PDF file
      const dataBuffer = await fs.readFile(absolutePath);
      const typedArray = new Uint8Array(dataBuffer);

      // Load the PDF document
      const loadingTask = getDocument({
        data: typedArray,
        useSystemFonts: true,
        disableFontFace: false,
        verbosity: 0,
      });

      const pdfDocument = await loadingTask.promise;

      const textPages: string[] = [];

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map((item: any) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ')
            .trim();

          if (pageText) {
            textPages.push(pageText);
          }
        } catch (pageError) {
          console.error(`Error extracting page ${pageNum}:`, pageError);
        }
      }

      const fullText = textPages.join('\n\n');

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('No text extracted from PDF');
      }

      return fullText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new InternalServerErrorException(
        `Failed to extract text from PDF: ${error.message}`,
      );
    }
  }
}
