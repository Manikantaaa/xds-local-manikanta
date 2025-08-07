import { Controller, Get, Put, Param, Body, ParseIntPipe, HttpException, HttpStatus, BadRequestException, Query } from '@nestjs/common';
import { MySparkNamesService } from './my-spark-names.service';
import { SparkNameUpdateItemDto } from './dto/update-my-spark-name.dto';
import { CurrentUser } from 'src/common/decorators/users.decorator';
import { CustomResponse } from 'src/common/types/custom-response.dto';
import { Prisma } from '@prisma/client';
import { LoggedInCompanyUser } from './dto/login-comapny-user.dto';

@Controller('my-spark-names') 
export class MySparkNamesController {
  constructor(private readonly mySparkNamesService: MySparkNamesService) {}


  @Get(':companyId')
  async getSparkNames(@Param('companyId', ParseIntPipe) companyId: number,
                      @CurrentUser() loggedUser:LoggedInCompanyUser) {
      try{
      if(loggedUser && (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode == "admin")||companyId!==loggedUser.id || !loggedUser.isPaidUser) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
        }
        return this.mySparkNamesService.getSparkNamesByCompanyId(companyId);
      }
     catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
          } else if (err instanceof Prisma.PrismaClientValidationError) {
            throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
          } else {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
          }
      }
  }

  @Put(':companyId')
  async updateSparkNames(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() updateItem: SparkNameUpdateItemDto,
    @CurrentUser() loggedUser:LoggedInCompanyUser
  ) {
     try{
      const hasWriteAccess = loggedUser?.pagePermissions?.some(
      (perm) => perm.pageId === updateItem.pageId && perm.canWrite === true
      );

      if(loggedUser && (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode == "admin")|| !loggedUser.isPaidUser 
       ||(loggedUser.isCompanyUser&&!hasWriteAccess)||companyId!==loggedUser.id) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
        }
        return this.mySparkNamesService.updateSparkNames(companyId, updateItem);
        }
      catch (err) {
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