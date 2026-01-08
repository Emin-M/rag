import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

@Injectable()
export class TextChunkerService {
  private splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  async chunkText(text: string): Promise<string[]> {
    if (!text?.length) return [];

    const docs = await this.splitter.createDocuments([text]);
    return docs.map((doc) => doc.pageContent);
  }
}
