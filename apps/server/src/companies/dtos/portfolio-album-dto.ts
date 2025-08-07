import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class portfolioAlbumDto {
  @ApiProperty({
    description: 'The name of the album',
    example: 'Company Portfolio 2024',
  })
  @IsNotEmpty()
  albumName: string;

  @ApiProperty({
    description: 'The unique ID of the album (optional)',
    example: 'album123',
    required: false,
  })
  albumId?: string;

  @ApiProperty({
    description: 'ID of the associated company (optional)',
    example: 101,
    required: false,
  })
  companyId?: number;

  @ApiProperty({
    description: 'Array of album files with their metadata',
    example: [
      {
        signedUrl: 'https://example.com/file1.jpg',
        filename: 'file1.jpg',
        indexId: '123',
        selectedFile: true,
        thumnnail: 'https://example.com/thumbnail1.jpg',
      },
    ],
    type: 'array',
    items: {
      type: 'object',
      properties: {
        signedUrl: { type: 'string', example: 'https://example.com/file1.jpg' },
        filename: { type: 'string', example: 'file1.jpg' },
        indexId: { type: 'string', example: '123' },
        selectedFile: { type: 'boolean', example: true },
        thumnnail: { type: 'string', example: 'https://example.com/thumbnail1.jpg' },
      },
    },
  })
  albumFiles: {
    signedUrl: string;
    filename: string;
    indexId: string;
    selectedFile: boolean;
    thumnnail: string;
  }[];

  @ApiProperty({
    description: 'List of file paths to be deleted',
    example: ['path/to/file1.jpg', 'path/to/file2.jpg'],
  })
  deletedFilePaths: string[];

  @ApiProperty({
    description: 'ID of the form used to submit the album',
    example: 'form456',
  })
  @IsNotEmpty()
  formid: string;
}
