import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  Res,
  HttpStatus,
  ParseIntPipe,
  Query,
  HttpException,
} from "@nestjs/common";
import { MylistService } from "./mylist.service";
import { CreateMylistDto } from "./dto/create-mylist.dto";
import { UpdateMylistDto } from "./dto/update-mylist.dto";
import { Exception } from "handlebars";
import { Public } from "src/common/decorators/public.decorator";
import { AuthAndRolesGuard } from "src/common/guards/auth-and-roles.guard";
import { Response } from "express";
import { Parser } from "json2csv";
import ExcelJS from 'exceljs';
import { CurrentUser } from "src/common/decorators/users.decorator";
import { $Enums, Users,Prisma } from "@prisma/client";
import { LoggedInUser } from "src/companies/dtos/login-user.dto";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { getDaysBetweenTwoDates } from "src/common/methods/common-methods";
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
@ApiBearerAuth()
@ApiTags("Mylist")
@Controller("mylist")
export class MylistController {
  constructor(private readonly mylistService: MylistService) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new list',
    description: 'This endpoint allows users to create a new list by providing the necessary details.'
  })
  create(@Body() createMylistDto: CreateMylistDto, @CurrentUser() user: LoggedInUser) {
    try {
      if (user?.id !== +createMylistDto.userId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      if (!user.isPaidUser  && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.mylistService.create(createMylistDto, user.companies[0].id, user.userRoles[0]?.roleCode);
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
  

  @Get("/archivedmylist/user/:id")
  @ApiOperation({
    summary: 'Get archived list of a user',
    description: 'This endpoint retrieves the archived list associated with a specific user by their ID.'
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user whose archived list is being retrieved',
    example: 101,
  })
  archivedMyList(@Param("id") userId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (user?.id !== +userId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      if (!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.mylistService.getarchivedMyList(+userId);
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

  @Get("user/:id")
  @ApiOperation({
    summary: 'Retrieve all lists for a user',
    description: 'This endpoint retrieves all lists associated with a specific user by their ID.'
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user whose lists are being retrieved',
    example: 101,
  })
  findAll(@Param("id") userId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (user?.id !== +userId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      if (!user.isPaidUser && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.mylistService.findMylist(+userId);
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
  @ApiExcludeEndpoint()
  @Get("public-list-companies")
  async publicGetCompaniesInList(@Query("token") token: string) {
    try {
      if (token && token != "") {
        const getListIdByToken = await this.mylistService.getListIdByToken(token);
        if (getListIdByToken) {
          if (getDaysBetweenTwoDates(new Date(), getListIdByToken.theTokenUpdatedDate) < 29) {
            const companiesInList = await this.mylistService.getCompaniesInList(getListIdByToken.listId);
            return new CustomResponse(HttpStatus.OK, true, companiesInList);
          } else {
            throw new BadRequestException("Link Expired");
          }
        } else {
          throw new BadRequestException("Unauthorized Access");
        }
      } else {
        throw new BadRequestException("Unauthorized Access");
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

  @Get(":id")
  @ApiOperation({
    summary: 'Retrieve a specific list item',
    description: 'This endpoint retrieves details of a specific list item by its ID. Access is restricted for unpaid service providers.'
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the list item to retrieve',
    example: 42,
  })
  findOne(@Param("id") id: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser  && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.mylistService.findOne(+id, +user?.id);
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

  @Get(":id/intrestedlist")
  @ApiOperation({
    summary: 'Retrieve interested list for a specific item',
    description: 'This endpoint retrieves the list of users or companies interested in a specific item by its ID.'
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the item whose interested list is being retrieved',
    example: 42,
  })
  findIntrestedList(@Param("id") id: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser  && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.mylistService.findMyIntrestedList(+id, +user?.id);
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


  @Patch("/archive/:id")
  @ApiOperation({
    summary: 'Archive a specific list item',
    description: 'This endpoint allows the user to archive a specific list item by its ID.'
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the list item to archive',
    example: 42,
  })
  archiveOne(@Param("id") mylistId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser  && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.mylistService.archiveMyList(+mylistId, user.id);
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


  @Patch(":id")
  @ApiOperation({
    summary: 'Update a specific list item',
    description: 'This endpoint allows users to update the details of a specific list item by its ID.'
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the list item to update',
    example: '123',
  })
  update(@Param("id") id: string, @Body() updateMylistDto: UpdateMylistDto, @CurrentUser() user: LoggedInUser) {
    try {
      if (user?.id !== Number(updateMylistDto.userId)) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      if (!user.isPaidUser  && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.mylistService.update(+id, updateMylistDto, user.id, user.companies[0].id);
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


  @Delete("/removecompanyfrommylist/:companyId/:mylistId")
  @ApiOperation({
    summary: 'Remove a company from a user’s list',
    description: 'This endpoint removes a specified company from the user’s list using the company ID and the list ID.'
  })
  @ApiParam({
    name: 'companyId',
    description: 'The ID of the company to remove from the list',
    example: '456',
  })
  @ApiParam({
    name: 'mylistId',
    description: 'The ID of the list from which the company will be removed',
    example: '123',
  })
  removecompany(
    @Param("companyId") companyId: string,
    @Param("mylistId") mylistId: string,
    @CurrentUser() user: LoggedInUser
  ) {
    try {
      if (!user.isPaidUser  && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.mylistService.removeCompanyFromMyList(+companyId, +mylistId, user?.id);
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


  @Delete(":id/delete")
  @ApiOperation({
    summary: 'Delete a specific list item',
    description: 'This endpoint deletes a specific list item by its ID. Only authorized users can perform this action.'
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the list item to delete',
    example: '123',
  })
  remove(@Param("id") id: string, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser  && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.mylistService.remove(+id, user?.id);
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


  @Get("export-list/:id")
  @ApiOperation({
    summary: 'Export list data to CSV',
    description: 'This endpoint exports the data of a specific list identified by its ID to a CSV file for download.'
  })
  async exportDataToCsv(@Res() res: Response, @Param("id") listId: number, @CurrentUser() user: LoggedInUser) {

    try {
      if (!user.isPaidUser  && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      const mylisttIntrests = await this.mylistService.findMyIntrestedList(listId, user?.id, "exportlist");
      try {
        mylisttIntrests.data && await this.mylistService.checkExportLimit(user?.companies[0].id, mylisttIntrests.data?.length, mylisttIntrests.data[0].list.name, 1, "List", "export");
      } catch (error) {
        throw error;
      }
      if (mylisttIntrests && mylisttIntrests?.data && mylisttIntrests?.data?.length > 30) {
        const error = new Error("You may only export a list of up to 30 Service Providers per day.");
        await this.mylistService.createExportReport(user?.companies[0].id, "List", `Reached the limit of 30 companies export per day.</n>List Name: ${mylisttIntrests?.data[0].list.name}</n>Companies: ${mylisttIntrests?.data?.length}.`, $Enums.EXPORT_TYPE.export);
        throw error;
      }
      const workbook = new ExcelJS.Workbook();
      // Add data rows
      if (mylisttIntrests?.data?.length) {
        const worksheet = workbook.addWorksheet(mylisttIntrests?.data[0]?.list.name);

        // Add headers
        const headers = [
          { header: "Company Name", key: "companyName", width: 20 },
          { header: "Core Services", key: "coreServices", width: 40 },
          { header: "Country", key: "country", width: 20 },
          { header: "Employees", key: "employees", width: 15 },
          { header: "Website", key: "website", width: 30 },
          { header: "Contact Name", key: "contactName", width: 20 },
          { header: "Business Title", key: "businessTitle", width: 20 },
          { header: "Email", key: "email", width: 30 }
        ];

        worksheet.columns = headers;


        mylisttIntrests.data.forEach(item => {
          const theServicesArr = item.company.ServicesOpt.map(services => services && services.service && services.service.serviceName).filter(service => service && service != "");
          const uniqueServicesArr = [...new Set(theServicesArr)];
          let theWebsite = item.company.website;
          theWebsite = theWebsite.replace(/https?:\/\//g, '');
          if (!theWebsite.startsWith("www.")) {
            theWebsite = "www." + theWebsite;
          }

          worksheet.addRow({
            companyName: item.company.name,
            coreServices: uniqueServicesArr.join(", "),
            country: item.company.CompanyAddress.map(countries => countries.Country?.name).join(", "),
            employees: item.company.companySizes?.size || "NA",
            website: theWebsite || "NA",
            contactName: item.company.CompanyContacts[0]?.name || "NA",
            businessTitle: item.company.CompanyContacts[0]?.title || "NA",
            email: item.company.CompanyContacts[0]?.email || "NA"
          });
        });

        // Set bold font for header row
        worksheet.getRow(1).font = { bold: true };

        // Prepare response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=mylistInterests.xlsx');

        // Write workbook to response
        await workbook.xlsx.write(res);
        await this.mylistService.createExportCount(user?.companies[0].id, mylisttIntrests?.data?.length, 1, $Enums.EXPORT_TYPE.export);
        return res.end();
      } else {
        throw new BadRequestException("No data found");
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

  @Get(":listId/get-token-for-url")
  @ApiExcludeEndpoint()
  async prepareTheUrlToSend(@Param("listId", ParseIntPipe) listId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser  && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      const listDetails = await this.mylistService.generateToken(listId, user.id, user?.companies[0].id);
      if (listDetails && listDetails.theToken) {
        let frontEndUrl = process.env.XDS_FRONTEND_BASE_URL;
        const sharableUrl = `${frontEndUrl}/shared-list?token=${listDetails.theToken}`
        return new CustomResponse(HttpStatus.OK, true, sharableUrl);
      } else {
        throw new BadRequestException("Unauthorized Access");
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

  @Post("add-list-in-user")
  @ApiOperation({
    summary: 'Add a new list for a user',
    description: 'This endpoint allows users to create a new list from the shared list'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
      },
      required: ['token'],
    },
  })
  async addListInUser(@Body() postData: {token: string}, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser  && !user.isSparkUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      await this.mylistService.addListInUser(postData.token, user.id, user.companies[0].id, user.userRoles[0]?.roleCode);
      return new CustomResponse(HttpStatus.OK, true, "List added successfully");
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
