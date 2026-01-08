import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfExtractorService } from './pdf-extractor.service';
import { TextChunkerService } from './text-chunker.service';
import { EmbeddingService } from '../ai/embedding.service';

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfExtractor: PdfExtractorService,
    private readonly textChunker: TextChunkerService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Full document processing pipeline
   */
  async processDocument(documentId: string): Promise<void> {
    this.logger.log(`Processing document ${documentId}`);

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' }, // treat enum as string
    });

    try {
      const document = await this.prisma.document.findUniqueOrThrow({
        where: { id: documentId },
      });

      // 1️⃣ Extract text from PDF
      const rawText = await this.pdfExtractor.extractText(document.path);

      // 2️⃣ Chunk text
      const chunks = await this.textChunker.chunkText(rawText);

      if (chunks.length === 0) {
        throw new Error('No text chunks generated');
      }

      // 3️⃣ Generate embeddings (BATCHED)
      const embeddings = await this.embeddingService.embedBatch(chunks);

      // 4️⃣ Store chunks + embeddings using raw SQL
      for (let i = 0; i < chunks.length; i++) {
        await this.prisma.$executeRaw`
          INSERT INTO document_chunks ("id", "documentId", "content", "embedding", "position", "createdAt")
          VALUES (
            gen_random_uuid(),
            ${documentId},
            ${chunks[i]},
            ${`[${embeddings[i].join(',')}]`}::vector,
            ${i},
            NOW()
          )
        `;
      }

      // 5️⃣ Mark document completed
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'COMPLETED' },
      });

      this.logger.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process document ${documentId}`, error);

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }
}
