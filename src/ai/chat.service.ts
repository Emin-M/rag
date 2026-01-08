import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
  private readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async generateAnswer(question: string, context: string[]): Promise<string> {
    try {
      const contextText = context.join('\n\n---\n\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that answers questions based on the provided context from PDF documents. 
If the context doesn't contain relevant information to answer the question, say so clearly.
Always be specific and cite information from the context when answering.`,
          },
          {
            role: 'user',
            content: `Context from documents:\n${contextText}\n\nQuestion: ${question}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0].message.content || 'No answer generated';
    } catch (error: any) {
      console.error('OpenAI chat error:', error);
      if (error.code === 'insufficient_quota' || error.status === 429) {
        throw new InternalServerErrorException(
          'OpenAI quota exceeded. Please check your plan.',
        );
      }
      throw new InternalServerErrorException('Failed to generate answer');
    }
  }
}
