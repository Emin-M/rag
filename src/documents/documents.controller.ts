import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentsService } from './documents.service';
import { DocumentProcessorService } from './document-processor.service';
import { QueryDto } from './dto/query.dto';
import { QueryService } from './query.service';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentProcessor: DocumentProcessorService,
    private readonly queryService: QueryService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
      fileFilter: (_, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          cb(new BadRequestException('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.documentsService.createDocument({
      name: file.originalname,
      path: file.path,
    });
  }

  @Post(':id/process')
  async processDocument(@Param('id') id: string) {
    await this.documentProcessor.processDocument(id);
    return {
      message: 'Document processing started',
      documentId: id,
      status: 'PROCESSING',
    };
  }

  @Post('query')
  async query(@Body() queryDto: QueryDto) {
    return this.queryService.query(queryDto);
  }
}
