import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  topK?: number = 3;
}
