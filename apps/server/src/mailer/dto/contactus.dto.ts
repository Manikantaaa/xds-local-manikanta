import { IsNotEmpty, IsOptional } from "class-validator";

export class ContactUsDto {
   
    @IsNotEmpty({ message: "FirstName is required" })
    firstName: string;
    @IsNotEmpty({ message: "LastName is required" })
    lastName: string;
    @IsNotEmpty({ message: "Company is required" })
    company: string;
    @IsNotEmpty({ message: "Email is required" })
    email: string;
    @IsOptional()
    nature: string;
    @IsNotEmpty({ message: "Message is required" })
    message: string;
    @IsNotEmpty({ message: "User Not Available" })
    userId: string;
}
