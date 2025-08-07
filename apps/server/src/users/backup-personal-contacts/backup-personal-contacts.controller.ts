import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UnauthorizedException,
  Logger,
  Query,
  BadRequestException,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";
import { BackupPersonalContactsService } from "./backup-personal-contacts.service";
import { Roles } from "src/common/decorators/roles.decorator";
import { ROLE_CODE, Users,Prisma } from "@prisma/client";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { XdsContext } from "src/common/types/xds-context.type";
import { GetXdsContext } from "src/common/decorators/xdsContext.decorator";
import { Public } from "src/common/decorators/public.decorator";
import { CustomResponse } from "src/common/types/custom-response.dto";

@ApiTags("users")
@Controller()
export class BackupPersonalContactsController {
  constructor(
    private readonly logger: Logger,
    private readonly backupPersonalContactsService: BackupPersonalContactsService,
  ) {}

  @Roles(ROLE_CODE.service_provider)
  @Get("users/:userId/backup-personal-contacts")
  @ApiOperation({
    summary: "Get backup personal contacts",
  })
  @ApiOkResponse()
  async getBackupPersonalContact(
    @GetXdsContext() xdsContext: XdsContext,
    @CurrentUser() user: Users,
    @Param("userId", ParseIntPipe) userId: number,
  ) {
    try{
      if (userId !== user.id) {
      this.logger.error("Access Denied", xdsContext);
      throw new UnauthorizedException("Access Denied");
    }
    const res = await this.backupPersonalContactsService.findOneByUserId(
      xdsContext,
      user.id,
    );
    return res;
  }catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
          throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
        } else if (err instanceof Prisma.PrismaClientValidationError) {
          throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
        } else {
          throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
   }

  @Public()
  @Get("users/backup-personal-contacts/get-user")
  async getUserDetailsFromToken(@Query("token") token: string) {
    try {
      if(token && token != "") {
        const theUser = await this.backupPersonalContactsService.findOneByToken(token);
        return new CustomResponse(HttpStatus.OK, true, theUser);
      } else {
        throw new BadRequestException();
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
