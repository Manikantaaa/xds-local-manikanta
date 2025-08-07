import { IsNotEmpty } from "class-validator";
export class CreateArticleDto {

    
    @IsNotEmpty()
    categoryId: number;
    @IsNotEmpty()
    readonly title: string;
    @IsNotEmpty()
    readonly postName: string;
    @IsNotEmpty()
    readonly logoPath: string;
    @IsNotEmpty()
    readonly webUrl: string;;
    // @IsNotEmpty()
    startDate: string;
    // @IsNotEmpty()
    endDate: string;
    description?: string;
}
