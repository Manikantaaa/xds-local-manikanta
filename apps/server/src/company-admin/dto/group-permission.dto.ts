import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class UpdateGroupPermissionDto {
    @ApiProperty()
    @IsNotEmpty()
    pageId: number;
    @ApiProperty()
    @IsNotEmpty()
    canRead: boolean;
    @ApiProperty()
    @IsNotEmpty()
    canWrite: boolean;
    @ApiProperty()
    @IsNotEmpty()
    canDelete: boolean;
    @ApiProperty()
    @IsNotEmpty()
    groupId: number;
}
