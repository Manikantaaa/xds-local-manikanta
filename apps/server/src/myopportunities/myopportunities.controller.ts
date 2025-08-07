import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Post,
  Body,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { MyopportunitiesService } from "./myopportunities.service";
import { Exception } from "handlebars";
import { CreateMyopportunityDto } from "./dto/create-myopportunity.dto";
import { CurrentUser } from "src/common/decorators/users.decorator";
import { CustomResponse } from "src/common/types/custom-response.dto";
import { UsersService } from "src/users/users.service";
import { LoggedInUser } from "src/companies/dtos/login-user.dto";
import { Prisma } from "@prisma/client";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from "@nestjs/swagger";
@ApiBearerAuth()
@ApiTags("Myopportunities")
@Controller("myopportunities")
export class MyopportunitiesController {
  constructor(
    private readonly myopportunitiesService: MyopportunitiesService,
    private readonly usersService: UsersService
  ) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new opportunity',
    description: 
      'This endpoint allows users to create a new opportunity by providing the necessary details.'})
  create(@Body() createMyopportunityDto: CreateMyopportunityDto, @CurrentUser() user: LoggedInUser) {
    try {
      // if(!user.isPaidUser && user.userRoles[0].roleCode === "service_provider") {
      //   return new CustomResponse(HttpStatus.FORBIDDEN, false,'User Not Allowed');
      // }
      if( user.userRoles[0].roleCode != "buyer") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false,'User Not Allowed');
      }
      if (user.companies[0].id == Number(createMyopportunityDto.companyId)) {
        return this.myopportunitiesService.create(createMyopportunityDto, user.userRoles[0].roleCode);
      } else {
        throw new Error("User Not Allowed");
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

  @Get("/get-count-new-intrests")
  @ApiOperation({
    summary: 'Get count of new interests',
    description: 'This endpoint retrieves the count of new interests associated with the user’s opportunities.'
  })
  async getCountOfNewIntrests(@CurrentUser() user: LoggedInUser) {
    if(user) {
      try{
        // if (user?.userRoles[0] && user?.userRoles[0].roleCode !== "admin") {
        //   throw new HttpException('access denied', HttpStatus.FORBIDDEN);
        // }
        const theUser = await this.usersService.findFirstByUserId(user.id);
        if(theUser && theUser.userRoles[0].roleCode !== 'admin') {
          const count: number = await this.myopportunitiesService.getCountOfNewIntrests(theUser.companies[0].id);
          return new CustomResponse(HttpStatus.OK, true, count);
        } else {
          return new CustomResponse(HttpStatus.FORBIDDEN, false,'access denied');
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
    } else {
      return new CustomResponse(HttpStatus.FORBIDDEN, false,'access denied');
    }
  }

  @Get("/userId/:id")
  @ApiOperation({
    summary: 'Retrieve all opportunities for a user by ID',
    description: 'This endpoint retrieves all opportunities associated with a specific user ID.'
  })
  findAll(@Param("id") companyId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if(user?.companies[0].id === Number(companyId)){
        if (user.isPaidUser || user.userRoles[0].roleCode == "buyer")
        {
          return this.myopportunitiesService.findAll(+companyId);
        } 
        else {
          return new CustomResponse(HttpStatus.FORBIDDEN, false,'User Not Allowed');
        }       
      } else {
        return new CustomResponse(HttpStatus.FORBIDDEN, false,'User Not Allowed');
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

  @Get(":id/intrestedlist")
  @ApiOperation({
    summary: 'Retrieve interested list by ID',
    description: 'This endpoint retrieves the list of items that the user is interested in, associated with a specific ID.'
  })
 async  findIntrestedList(@Param("id") id: number, @CurrentUser() user:LoggedInUser) {
    try {
      if(!user.isPaidUser && user.userRoles[0].roleCode === "service_provider") {
        return new CustomResponse(HttpStatus.FORBIDDEN, false,'User Not Allowed');
      }
      const checkOpp = await this.myopportunitiesService.checkOpportunityByCompanyId(user?.companies[0].id,id);
      if(checkOpp){
        return await this.myopportunitiesService.findIntrestedListservice(id, user?.companies[0].id);
      }else{
        throw new Error('Not Allowed')
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

  @Patch("/archivemyopportunity/:id/:companyId")
  @ApiOperation({
    summary: 'Archive an opportunity by ID',
    description: 'This endpoint allows users to archive a specific opportunity identified by its ID and associated with a specific company ID.'
  })
  archiveOpportunity(@Param("id") id: number, @Param('companyId') companyId: number, @CurrentUser() user: LoggedInUser) {
    try {
      if (Number(user?.companies[0].id) === Number(companyId)) {
        return this.myopportunitiesService.archiveOpportunityservice(+id, +companyId);
      } else {
        throw new Error("Not Allowed");
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

  @Patch("/updatemyopportunitystatus/:id")
  @ApiOperation({
    summary: 'Update the status of an opportunity by ID',
    description: 'This endpoint allows users to change the status of a specific opportunity identified by its ID, either to draft or published state.'
  })
  draftOrPublishOpportunity(@Param("id") id: string) {
    try{
      return this.myopportunitiesService.draftOrPublishOpportunityService(+id);
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

  @Get("/archivedlist/companyId/:id")
  @ApiOperation({
    summary: 'Retrieve archived opportunities by company ID',
    description: 'This endpoint retrieves a list of archived opportunities associated with a specific company ID.'
  })
  async findArchivedList(@Param("id") companyId: number,  @CurrentUser() user: LoggedInUser) {
    try {
      if(user?.companies[0].id == companyId){
        return await this.myopportunitiesService.findArchivedListService(+companyId);
      }else{
        throw new Error('Not Allowed');
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

  @Delete("/deleteopportunity/:id")
  @ApiOperation({
    summary: 'Delete an opportunity by ID',
    description: 'This endpoint allows users to delete a specific opportunity identified by its ID.'
  })
  deleteMyOpportunity(@Param("id") id: number) {
    try{
      return this.myopportunitiesService.deleteMyOpportunityService(+id);
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

  
  @Get("/getindustries")
  @ApiExcludeEndpoint()
  findIndustries() {
    try {
      return this.myopportunitiesService.findIndustriesService();
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
    summary: 'Retrieve an opportunity by ID',
    description: 'This endpoint retrieves a specific opportunity identified by its ID.'
  })
  findOne(@Param("id") id: string, @CurrentUser() user : LoggedInUser) {
    try{
      if(!user.isPaidUser && user.userRoles[0].roleCode === "service_provider") {
      return new CustomResponse(HttpStatus.FORBIDDEN, false,'User Not Allowed');
    }
    return this.myopportunitiesService.findOne(+id, user.companies[0].id);
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

  @Patch("/updateopportunity")
  @ApiOperation({
    summary: 'Update an existing opportunity',
    description: 'This endpoint allows users to update the details of an existing opportunity by providing the updated information in the request body.'
  })
  updateOpportunity(@Body() createMyopportunityDto: CreateMyopportunityDto, @CurrentUser() user: LoggedInUser) {
    try {
      // if(!user.isPaidUser && user.userRoles[0].roleCode === "service_provider") {
      //   return new CustomResponse(HttpStatus.FORBIDDEN, false,'User Not Allowed');
      // }
      if (user.companies[0].id === Number(createMyopportunityDto.companyId)) {
        return this.myopportunitiesService.updateOpportunityService(
          createMyopportunityDto,
        );
      } else {
        throw new Error("User Not Allowed");
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

  // @Patch(":id")
  // update(
  //   @Param("id") id: string,
  //   @Body() updateMyopportunityDto: UpdateMyopportunityDto,
  // ) {
  //   return this.myopportunitiesService.update(+id, updateMyopportunityDto);
  // }

  @Get("admin/getAllOpportunities")
  async getAllOpportunities( @CurrentUser() user: LoggedInUser){
    try {
      if( user.userRoles[0].roleCode != "admin") {
          return new CustomResponse(HttpStatus.FORBIDDEN, false,'User Not Allowed');
        }
      return await this.myopportunitiesService.getAllOpportunites();
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
