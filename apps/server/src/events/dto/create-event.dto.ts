import { IsNotEmpty } from "class-validator";

export class CreateEventDto {
    @IsNotEmpty()
    readonly eventname: string;
    @IsNotEmpty()
    readonly eventdescription: string;
    @IsNotEmpty()
    readonly eventURL: string;
    @IsNotEmpty()
    readonly eventLocation: string;
    @IsNotEmpty()
    readonly eventLogo: string;
    @IsNotEmpty()
    startDate: string;
    @IsNotEmpty()
    endDate: string;

    companies?: string[];
}
export class createSponseredDto {
    @IsNotEmpty()
    readonly service: string;

    @IsNotEmpty()
    readonly defaultServiceImage: string;
    readonly sponseredServiceImage: string;
    readonly sponseredServiceLogoImage: string;
    readonly sponseredCompany?: string;
    readonly companyName: string;
    startDate?: string;
    endDate?: string;
    companies?: string;
}

export   enum  SpservicePaths{
    defaultImage = "defaultimages",
    sponseredImage = "sponseredimages",
}
