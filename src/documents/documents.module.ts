import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentProcessorService } from './document-processor.service';
import { PdfExtractorService } from './pdf-extractor.service';
import { TextChunkerService } from './text-chunker.service';
import { QueryService } from './query.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../ai/embedding.service';
import { ChatService } from '../ai/chat.service';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentProcessorService,
    PdfExtractorService,
    TextChunkerService,
    QueryService,
    PrismaService,
    EmbeddingService,
    ChatService,
  ],
})
export class DocumentsModule {}
