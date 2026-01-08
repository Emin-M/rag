import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../ai/embedding.service';
import { ChatService } from '../ai/chat.service';
import { QueryDto } from './dto/query.dto';

export interface RetrievedChunk {
  id: string;
  content: string;
  documentId: string;
  documentName: string;
  similarity: number;
}

export interface QueryResponse {
  answer: string;
  sources: RetrievedChunk[];
  question: string;
}

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly chatService: ChatService,
  ) {}

  async query(queryDto: QueryDto): Promise<QueryResponse> {
    const { question, topK = 3 } = queryDto;

    this.logger.log(`Processing query: "${question}"`);

    try {
      // 1. Generate embedding for the user's question
      const queryEmbedding = await this.embeddingService.embed(question);

      // 2. Search for similar chunks from PDFs
      const similarChunks = await this.searchSimilarChunks(
        queryEmbedding,
        topK,
      );

      if (similarChunks.length === 0) {
        return {
          answer:
            'No relevant information found in the uploaded PDF documents.',
          sources: [],
          question,
        };
      }

      // 3. Extract context from retrieved chunks
      const context = similarChunks.map((chunk) => chunk.content);

      // 4. Generate answer using GPT with PDF context
      const answer = await this.chatService.generateAnswer(question, context);

      this.logger.log(`Query processed successfully`);

      return {
        answer,
        sources: similarChunks,
        question,
      };
    } catch (error) {
      this.logger.error('Failed to process query', error);
      throw error;
    }
  }

  private async searchSimilarChunks(
    queryEmbedding: number[],
    topK: number,
  ): Promise<RetrievedChunk[]> {
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Search using vector similarity
    const results = await this.prisma.$queryRaw<
      Array<{
        id: string;
        content: string;
        documentId: string;
        documentName: string;
        distance: number;
      }>
    >`
      SELECT
        dc.id,
        dc.content,
        dc."documentId",
        d.name as "documentName",
        dc.embedding <=> ${embeddingString}::vector as distance
      FROM document_chunks dc
        JOIN documents d ON dc."documentId" = d.id
      WHERE d.status = 'COMPLETED'
      ORDER BY dc.embedding <=> ${embeddingString}::vector
        LIMIT ${topK}
    `;

    return results.map((row) => ({
      id: row.id,
      content: row.content,
      documentId: row.documentId,
      documentName: row.documentName,
      similarity: 1 - row.distance,
    }));
  }
}
