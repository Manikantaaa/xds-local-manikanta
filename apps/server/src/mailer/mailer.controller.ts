import { Body, Controller, HttpException, HttpStatus, InternalServerErrorException, Post } from "@nestjs/common";
import { MailerService } from "./mailer.service";
import { ContactUsDto } from "./dto/contactus.dto";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { User } from "mailtrap/dist/types/api/accounts";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { ApiExcludeController } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";

@Controller("mailer")
@ApiExcludeController()
export class MailerController {
  constructor(private readonly mailerService: MailerService) { }

  @Post('contactUs')
  async contactUs(@Body() params: ContactUsDto, @CurrentUser() user: User) {
    try {
      if (user.id == Number(params.userId)) {
        await this.mailerService.sendContactUsMail({ ...params });
        return {
          success: true,
          message: `Mail sent Succefully`,
          statusCode: HttpStatus.ACCEPTED,
        }
      }
      else{
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
      }
    } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
  }

  @Post('consultation')
  async consultation(@Body() params: ContactUsDto, @CurrentUser() user: User) {
    try {
      if (user.id == Number(params.userId)) {
        await this.mailerService.sendContactUsMail({ ...params }, 'consultation');
        return {
          success: true,
          message: `Mail sent Succefully`,
          statusCode: HttpStatus.ACCEPTED,
        }
      }
      else{
        throw new HttpException('access denied',HttpStatus.FORBIDDEN);
      }
    } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }

  }

}
