import { IsInt, IsString, IsNotEmpty, IsOptional} from 'class-validator';

export class SparkNameUpdateItemDto {
  @IsString()
  @IsOptional() 
  security: string;

  @IsString()
  @IsOptional() 
  nda: string;

  @IsString()
  @IsOptional() 
  msa: string;
  
 @IsString()
  @IsOptional() 
  ss: string;

  @IsString()
  @IsOptional() 
  sows: string;

  @IsString()
  @IsOptional() 
  rates: string;

  @IsString()
  @IsOptional() 
  performance: string;

  @IsString()
  @IsOptional() 
  notes: string;

  @IsInt()
  @IsNotEmpty()
  pageId:number;
}
