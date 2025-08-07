import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  BadRequestException,
  HttpStatus,
  ParseIntPipe,
  Query,
  HttpException,
} from "@nestjs/common";
import { MyprojectService } from "./myproject.service";
import { CreateMyprojectDto } from "./dto/create-myproject.dto";
import { UpdateMyprojectDto } from "./dto/update-myproject.dto";
import { Public } from "src/common/decorators/public.decorator";
import { Exception } from "handlebars";
import { Parser } from "json2csv";
import { Response } from "express";
import ExcelJS from 'exceljs';
import { CurrentUser } from "src/common/decorators/users.decorator";
import { $Enums, Users,Prisma } from "@prisma/client";
import { LoggedInUser } from "src/companies/dtos/login-user.dto";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { getDaysBetweenTwoDates } from "src/common/methods/common-methods";
import { MylistService } from "src/mylist/mylist.service";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from "@nestjs/swagger";
@ApiBearerAuth()
@ApiTags("Myproject")
@Controller("myproject")
export class MyprojectController {
  constructor(private readonly myprojectService: MyprojectService, private readonly myListService: MylistService) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new project',
    description: 
      'This endpoint allows users to create a new project by providing necessary details.'
  })
  create(@Body() createMyprojectDto: CreateMyprojectDto, @CurrentUser() user: LoggedInUser) {
    try {
      if (user?.id !== +createMyprojectDto.userId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      if (!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.myprojectService.create(createMyprojectDto, user.companies[0].id, user.userRoles[0].roleCode);
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

  @Get("/archivedmyprojects/userId/:id")
  @ApiOperation({
    summary: 'Retrieve archived projects for a user',
    description: 'This endpoint retrieves all archived projects associated with a specific user, identified by their user ID.'
  })
  archivedMyList(@Param("id") userId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (user?.id !== +userId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      if (!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.myprojectService.getarchivedMyProjects(+userId);
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

  @Get("/userId/:id")
  @ApiOperation({
    summary: 'Retrieve all projects for a specific user',
    description: 'This endpoint retrieves all projects associated with a specific user, identified by their user ID.'
  })
  findAll(@Param("id") userId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (user?.id !== +userId) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      if (!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.myprojectService.findMyProjects(+userId);
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

  @Public()
  @ApiExcludeEndpoint()
  @Get("public-project-lists")
  async publicGetListsInProject(@Query("token") token: string) {
    try {
      if (token && token != "") {
        const getProjectIdByToken = await this.myprojectService.getProjectIdByToken(token);
        if (getProjectIdByToken) {
          if (getDaysBetweenTwoDates(new Date(), getProjectIdByToken.tokenCreatedDate) < 29) {
            const listsInProject = await this.myprojectService.getListsInProject(getProjectIdByToken.projectId);
            if(listsInProject && listsInProject.id) {
              return new CustomResponse(HttpStatus.OK, true, listsInProject);
            } else {
              throw new BadRequestException("Project Deleted");
            }
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

  @Public()
  @ApiExcludeEndpoint()
  @Get("public-get-list-companies")
  async publicGetCompaniesInList(@Query("token") token: string, @Query("listId", ParseIntPipe) listId: number) {
    try {
      if (token && token != "") {
        const getProjectIdByToken = await this.myprojectService.checkTokenAndList(token, +listId);
        if (getProjectIdByToken && !getProjectIdByToken.myProjects.isDelete) {
          if (getDaysBetweenTwoDates(new Date(), getProjectIdByToken.tokenCreatedDate) < 29) {
            const listsInProject = await this.myListService.getCompaniesInList(+listId);
            return new CustomResponse(HttpStatus.OK, true, listsInProject);
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
    summary: 'Retrieve a specific project by ID',
    description: 'This endpoint retrieves the details of a specific project identified by its ID.'
  })
  findOne(@Param("id") id: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.myprojectService.findOne(+id, user?.id);
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

  @Get(":id/intrestedprojects")
  @ApiOperation({
    summary: 'Retrieve interested projects for a specific user',
    description: 'This endpoint retrieves a list of projects that the user, identified by the given ID, has shown interest in.'
  })
  findIntrestedList(@Param("id") id: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.myprojectService.findMyIntrestedProject(+id, user?.id);
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

  @Patch("/archive/:id")
  @ApiOperation({
    summary: 'Archive a specific project',
    description: 'This endpoint allows a user to archive a specific project, identified by its ID.'
  })
  archiveOne(@Param("id") mylistId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.myprojectService.archiveMyProject(+mylistId, user?.id);
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

  @Patch(":id")
  @ApiOperation({
    summary: 'Update a specific project',
    description: 'This endpoint allows a user to update the details of a specific project, identified by its ID.'
  })
  update(
    @Param("id") id: string,
    @Body() updateMyprojectDto: UpdateMyprojectDto,
    @CurrentUser() user: LoggedInUser
  ) {
    try {
      if (user?.id !== Number(updateMyprojectDto.userId)) {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'access denied');
      }
      if (!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.myprojectService.update(+id, updateMyprojectDto, user.companies[0].id);
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

  @Delete("/removecompanyfrommyproject/:companyId/:myProject")
  @ApiOperation({
    summary: 'Remove a company from a specific project',
    description: 'This endpoint removes a company from a specified project, identified by their respective IDs.'
  })
  removecompany(
    @Param("companyId") companyId: string,
    @Param("myProject") myProject: string,
    @CurrentUser() user: LoggedInUser
  ) {
    try {
      if (!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.myprojectService.removeCompanyFromMyProject(
        +companyId,
        +myProject,
        user?.id
      );
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

  @Delete(":id")
  @ApiOperation({
    summary: 'Delete a specific project',
    description: 'This endpoint allows a user to delete a specific project, identified by its ID.'
  })
  remove(@Param("id") id: string, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.myprojectService.remove(+id, user?.id);
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

  @Patch("/shortlistcompany/:id")
  @ApiOperation({
    summary: 'Shortlist a company for a specific project or list',
    description: 'This endpoint allows a user to shortlist a company for a specific list, identified by its ID.'
  })
  shortListCompany(@Param("id") mylistId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      return this.myprojectService.shortListCompany(+mylistId);
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

  @Get("export-project/:id")
  @ApiOperation({
    summary: 'Export project data as a CSV',
    description: 'This endpoint allows a user to export the data of a specific project, identified by its ID, in CSV format.'
  })
  async exportDataToCsv(@Res() res: Response, @Param("id") projectId: number, @CurrentUser() user: LoggedInUser) {
    const workbook = new ExcelJS.Workbook();
    const myprojectIntrests = await this.myprojectService.findMyIntrestedProject(projectId, user?.id);
    try {
      if (!user.isPaidUser&& !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
      }
      if (myprojectIntrests.data && myprojectIntrests.data?.length > 0) {

        let companiesCount = 0;
        await Promise.all(myprojectIntrests?.data?.map(async (item, index) => {
          const myIntrestedLists = await this.myprojectService.findMyIntrestedList(item.list.id);
          companiesCount += (myIntrestedLists && myIntrestedLists.data) ? myIntrestedLists.data?.length : 0;
        }));

        try{
          await this.myListService.checkExportLimit(user.companies[0].id, companiesCount, myprojectIntrests?.data[0].project.name, myprojectIntrests.data?.length, "Project", $Enums.EXPORT_TYPE.export)
        }catch(error){
          throw error;
        }

        if (myprojectIntrests.data?.length > 3) {
          await this.myListService.createExportReport(user?.companies[0].id, "Project", `Exporting a project with more than 3 lists</n>Project Name: ${myprojectIntrests.data[0].project.name}</n>Lists Count: ${myprojectIntrests.data?.length} </n>Companies: ${companiesCount}`, $Enums.EXPORT_TYPE.export);
          const error = new Error("You may only export up to 3 lists of Service Providers per day.");
          throw error;
        }
      
        if (companiesCount > 30) {
          await this.myListService.createExportReport(user?.companies[0].id, "Project", `Exporting a project with more than 30 companies</n>Project Name: ${myprojectIntrests.data[0].project.name}</n>Lists: ${myprojectIntrests.data?.length}</n>Companies: ${companiesCount}.`,$Enums.EXPORT_TYPE.export);
          const error = new Error("You may only export a list of up to 30 Service Providers per day.");
          throw error;
        }
        await Promise.all(myprojectIntrests?.data?.map(async (item, index) => {
          const myIntrestedLists = await this.myprojectService.findMyIntrestedList(item.list.id)
          if (myIntrestedLists?.data) {
            const worksheet = workbook.addWorksheet(item.list.name);

            worksheet.columns = [
              { header: 'Company Name', key: 'companyName', width: 20 },
              { header: 'Core Services', key: 'coreServices', width: 40 },
              { header: 'Country', key: 'country', width: 20 },
              { header: 'Employees', key: 'employees', width: 15 },
              { header: 'Website', key: 'website', width: 30 },
              { header: 'Contact Name', key: 'contactName', width: 20 },
              { header: 'Business Title', key: 'businessTitle', width: 20 },
              { header: 'Email', key: 'email', width: 30 }
            ];

            worksheet.getRow(1).eachCell((cell) => {
              cell.font = { bold: true };
            });

            myIntrestedLists?.data?.forEach((item) => {
              const theServicesArr = item.company.ServicesOpt.map(
                (services) => services && services.service && services.service.serviceName
              );

              let theWebsite = item.company.website;
              theWebsite = theWebsite.replace(/https?:\/\//g, '');
              if (!theWebsite.startsWith("www.")) {
                theWebsite = "www." + theWebsite;
              }

              worksheet.addRow({
                companyName: item.company.name,
                coreServices: theServicesArr.filter((service) => service && service != "").join(", "),
                country: item.company.CompanyAddress.map((countries) => countries.Country?.name || "NA").join(", "),
                employees: item.company.companySizes?.size || "NA",
                website: theWebsite || "NA",
                contactName: item.company.CompanyContacts[0]?.name || "NA",
                businessTitle: item.company.CompanyContacts[0]?.title || "NA",
                email: item.company.CompanyContacts[0]?.email || "NA",
              });
            });
          }
        }));
        await this.myListService.createExportCount(user?.companies[0].id, companiesCount,myprojectIntrests.data?.length, $Enums.EXPORT_TYPE.export);
      }

      if (workbook.worksheets.length > 0) {
        const buffer = await workbook.xlsx.writeBuffer();
        if (!res) {
          throw new BadRequestException();
        }
        res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.attachment("myporjectintrests.xlsx");
        
        return res.send(buffer);
      } else {
        throw new BadRequestException();
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

  @Get("getcompanies/:seachValue")
  @ApiOperation({
    summary: 'Retrieve companies based on search criteria',
    description: 'This endpoint retrieves a list of companies that match the provided search value.'
  })
  async getcompanies(@Param("seachValue") seachValue: string, @CurrentUser() user: LoggedInUser) {
    try{
      const companies =await this.myprojectService.getSearchCompanies(seachValue);
    return companies;
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

  @Get("getMylists/:seachValue")
  @ApiOperation({
    summary: 'Retrieve user lists based on search criteria',
    description: 'This endpoint retrieves all user lists that match the provided search value.'
  })
  async getMylists(@Param("seachValue") seachValue: string, @CurrentUser() user: LoggedInUser,) {
    try{
      if (!user.isPaidUser&& !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider") {
      return new CustomResponse(HttpStatus.FORBIDDEN, false, 'acess denied');
    }
    const myLists =await this.myprojectService.getSearchLists(seachValue, user.id);
    return myLists;
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

  @Get(":projectId/get-token-for-url")
  @ApiOperation({
    summary: 'Generate a token for accessing a project URL',
    description: 'This endpoint generates a token that can be used to access a specific project URL, identified by its project ID.'
  })
  async prepareTheUrlToSend(@Param("projectId", ParseIntPipe) projectId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if(!user.isPaidUser && !user.isSparkUser && user?.userRoles[0].roleCode === "service_provider"){
        return new CustomResponse(HttpStatus.FORBIDDEN, false,'acess denied');
      }

      const listcount = await this.myprojectService.findMyIntrestedProject(projectId, user?.id);
      if((listcount && listcount.data && listcount.data?.length <= 0) || !listcount){
        throw new BadRequestException("No lists found in this project");
      }
      let companiesCount = 0;
      listcount && listcount?.data && await Promise.all(listcount?.data?.map(async (item, index) => {
        const myIntrestedLists = await this.myprojectService.findMyIntrestedList(item.list.id);
        companiesCount += (myIntrestedLists && myIntrestedLists.data) ? myIntrestedLists.data?.length : 0;
      }));

      await this.myListService.checkExportLimit(user?.companies[0].id, companiesCount, listcount && listcount.data && listcount.data[0]?.list.name || "", listcount.data?.length || 0,"Project", $Enums.EXPORT_TYPE.sharelink )

      const projectDetails = await this.myprojectService.generateToken(projectId, user.id);
      if (projectDetails && projectDetails.theToken) {
        let frontEndUrl = process.env.XDS_FRONTEND_BASE_URL;
        const sharableUrl = `${frontEndUrl}/shared-project?token=${projectDetails.theToken}`
      await this.myListService.createExportCount(user?.companies[0].id, companiesCount,listcount.data?.length, $Enums.EXPORT_TYPE.sharelink);
        return new CustomResponse(HttpStatus.OK, true, sharableUrl);
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

}
