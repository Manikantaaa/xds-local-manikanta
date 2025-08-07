import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { CompanyReportsService } from './company-reports.service';
import { CreateCompanyReportDto } from './dto/create-company-report.dto';
import { UpdateCompanyReportDto } from './dto/update-company-report.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/users.decorator';
import { LoggedInUser } from 'src/companies/dtos/login-user.dto';
import { $Enums,Prisma } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("Company-reports")
@Controller('company-reports')
export class CompanyReportsController {
  constructor(private readonly companyReportsService: CompanyReportsService) { }


  @Get('dashboard')
  getDashboardStats(@CurrentUser() User: LoggedInUser) {
    try {
      if (User.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
      return this.companyReportsService.findAll();
    } else {
      throw new HttpException("access denied", HttpStatus.UNAUTHORIZED)
    }
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

  @Get('dashboard/statistics')
  getStatisticsForPieChart(@CurrentUser() User: LoggedInUser) {
    try {
    if (User.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
      return this.companyReportsService.findStatistics();
    } else {
      throw new HttpException("access denied", HttpStatus.UNAUTHORIZED)
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

  @Get('dashboard/listdata')
  getListdata(@CurrentUser() User: LoggedInUser) {
    try{
      if (User.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
      return this.companyReportsService.findListsData();
    } else {
      throw new HttpException("access denied", HttpStatus.UNAUTHORIZED)
      } 
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
  @Get('dashboard/stripedata')
  getStripeData(@CurrentUser() User: LoggedInUser) {
    try{
      if (User.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
      return this.companyReportsService.getStripeData();
    } else {
      throw new HttpException("access denied", HttpStatus.UNAUTHORIZED)
    } 
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
  @Get('dashboard/mailchimp/:type')
  getMailchimpData(@Param() type: {type : "listCount" | "listPercent" | "listsData"}, @CurrentUser() User: LoggedInUser) {
    try{
      if (User.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
      return this.companyReportsService.getMailchimpData(type.type);
    } else {
      throw new HttpException("access denied", HttpStatus.UNAUTHORIZED)
    } 
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

  @Post()
  create(@Body() createCompanyReportDto: CreateCompanyReportDto) {
    try{
      return this.companyReportsService.create(createCompanyReportDto);
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

  @Get()
  findAll() {
    try{
    return this.companyReportsService.findAll();
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
  

  @Get(':id')
  findOne(@Param('id') id: string) {
    try{
    return this.companyReportsService.findOne(+id);
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompanyReportDto: UpdateCompanyReportDto) {
    try{
      return this.companyReportsService.update(+id, updateCompanyReportDto);
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    try{
      return this.companyReportsService.remove(+id);
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
}
