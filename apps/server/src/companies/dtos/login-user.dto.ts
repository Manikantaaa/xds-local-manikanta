import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class LoggedInUser{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    linkedInUrl: string;
    approvalStatus: string;
    stripeCustomerId: string;
    stripeSubscriptionId:  string;
    userType:  string;
    accessExpirationDate:  string;
    isPaidUser: boolean;
    isAddedFromCsv: boolean;
    isFlagged: boolean;
    isArchieve: boolean;
    isDelete: boolean;
    status: number;
    createdAt:  string;
    updatedAt:  string;
    userRoles: [
        {
            id: number,
            userId: number,
            roleCode:  string;
            isArchieve: boolean,
            isDelete: boolean,
            status: number,
            createdAt:  string;
            updatedAt:  string;
        }
    ]
    companies: [
        {
            name:  string;
            isTourCompleted: boolean;
            id: number;
            CompanyContacts: [];
        }
    ];
    isCompanyUser: boolean;
    CompanyAdminId: number;
    CompanyAdminEmail: string;
    isSparkUser:boolean;
}



export class ThumbnailRequestDto {
  @ApiProperty({
    description: 'The URL of the video to retrieve the thumbnail from.',
    type: String,
  })
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'The type of video service (VIMEO or YOUTUBE).',
    enum: ['VIMEO', 'YOUTUBE'],
  })
  @IsEnum(['VIMEO', 'YOUTUBE'])
  type: 'VIMEO' | 'YOUTUBE';
}