import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDocument(data: { name: string; path: string }) {
    return this.prisma.document.create({
      data: {
        name: data.name,
        path: data.path,
        status: ProcessStatus.PENDING,
      },
    });
  }
}
