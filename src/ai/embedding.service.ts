import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  /**
   * Generates an embedding for a single text input
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (_error) {
      throw new InternalServerErrorException('Failed to generate embedding');
    }
  }

  /**
   * Batch embedding (FASTER + CHEAPER)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];

    const batchSize = 50; // adjust to avoid rate limits
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      try {
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
        });

        allEmbeddings.push(...response.data.map((d) => d.embedding));
      } catch (error: any) {
        console.error('OpenAI embedding error:', error);
        if (error.code === 'insufficient_quota' || error.status === 429) {
          throw new InternalServerErrorException(
            'OpenAI quota exceeded. Please check your plan.',
          );
        }
        throw new InternalServerErrorException(
          'Failed to generate embeddings batch',
        );
      }
    }

    return allEmbeddings;
  }
}
