import { Controller, Get, Post, Body, Patch, Param, Delete, Put, HttpException, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, createSponseredDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApiOperation, ApiBearerAuth, ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { LoggedInUser } from 'src/companies/dtos/login-user.dto';
import { CurrentUser } from 'src/common/decorators/users.decorator';
import { sanitizeData } from 'src/common/utility/sanitizedata';
import { $Enums, Prisma} from '@prisma/client';
import { Public } from 'src/common/decorators/public.decorator';

@ApiBearerAuth()
@ApiTags("Events")
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  /****************************************sponsered services starts******************************************* */

  @Post('save-sponsered-service')
  @ApiOperation({
    summary: 'Create a sponsored service',
    description: 'This endpoint allows users to create a new sponsored service by providing the necessary details.'
  })
  async createSponseredService(
    @Body() createSponseredDto: createSponseredDto,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if (user.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
        await this.eventsService.createSponserServicee(sanitizeData(createSponseredDto));
        return {
          success: true,
          StatusCode: 201,
          message: 'successfully created',
        }
      } else {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
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

  @Get('get-sponsered-services-list')
  @ApiOperation({
    summary: 'Retrieve a list of sponsored services',
    description: 'This endpoint retrieves all available sponsored services for users to view.'
  })
  async findSponseredService(
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if (user.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
        const data = await this.eventsService.findAllSponseredService();
        return {
          success: true,
          message: "fetching successful",
          list: data,
        }
      }
      throw new HttpException('access denied', HttpStatus.FORBIDDEN);
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
  

  @Get('get-spservice-byid/:id')
  @ApiOperation({
    summary: 'Retrieve a sponsored service by ID',
    description: 'This endpoint retrieves a specific sponsored service identified by its ID.'
  })
  async getSPserviceById(
    @Param('id') SpserviceId: number,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if (user.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
        const Data = await this.eventsService.getSPserviceById(SpserviceId);
        return {
          success: true,
          list: Data,
          message: "fetching successfull"
        }
      } else {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
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

  @Put('update-spservice/:id')
  @ApiOperation({
    summary: 'Update a sponsored service by ID',
    description: 'This endpoint allows users to update the details of a specific sponsored service identified by its ID.'
  })
  async updateSpserviceId(
    @Param('id', ParseIntPipe) spserviceId: number,
    @Body() createSponseredDto: createSponseredDto,
    @CurrentUser() user: LoggedInUser,
  ) {
    try {
      if (user.userRoles[0].roleCode == $Enums.ROLE_CODE.admin) {
        this.eventsService.updateSpservices(spserviceId, createSponseredDto);
        return {
          success: true,
          statusCode: 201,
          message: 'update successful',
        }
      } else {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
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
  /****************************************sponsered services ends******************************************* */
  @Post()
  @ApiOperation({
    summary: 'Create a new event',
    description: 'This endpoint allows users to create a new event by providing the necessary details.'
  })
  create(@Body() createEventDto: CreateEventDto, @CurrentUser() loggedUser: LoggedInUser) {
    try{
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException('access denied', HttpStatus.FORBIDDEN);
    }
    return this.eventsService.create(sanitizeData(createEventDto));
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
  @ApiOperation({
    summary: 'Retrieve all events',
    description: 'This endpoint retrieves a list of all events accessible to the logged-in user.'
  })
  findAll(@CurrentUser() loggedUser: LoggedInUser) {
    try{
    if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException('access denied', HttpStatus.FORBIDDEN);
    }
    return this.eventsService.findAll();
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

  @Get('get-all-events/:companyId')
  @ApiOperation({
    summary: 'Retrieve all live events for a specific company',
    description: 'This endpoint retrieves a list of all live events associated with the specified company ID.'
  })
  async getAllEvents(@Param('companyId') companyId: number, @CurrentUser() loggedUser: LoggedInUser) {
    try {
      // if (+companyId == 0 && !loggedUser?.isPaidUser) {
      //   throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      // }
      return await this.eventsService.getAllEvents(+companyId, +loggedUser.companies[0].id);
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

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve an event by ID',
    description: 'This endpoint retrieves the details of a specific event identified by its ID.'
  })
  findOne(@Param('id') id: string, @CurrentUser() loggedUser: LoggedInUser) {
    try{
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException('access denied', HttpStatus.FORBIDDEN);
    }
    return this.eventsService.findOne(+id);
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

  @Put(':id')
  @ApiOperation({
    summary: 'Update an event by ID',
    description: 'This endpoint allows users to update the details of a specific event identified by its ID.'
  })
  updateEvent(@Param('id') id: string, @Body() updateEventDto: CreateEventDto, @CurrentUser() loggedUser: LoggedInUser) {
    try{
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException('access denied', HttpStatus.FORBIDDEN);
    }
    return this.eventsService.update(+id, sanitizeData(updateEventDto));
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

  @Put('update-event-meet/:id')
  @ApiOperation({
    summary: 'Update an event meet to link by ID',
    description: 'This endpoint allows users to update the details of a specific event attandee meet to link identified by its ID.'
  })
  updateEventMeetLink(@Param('id') id: string, @Body() updateEventDto: { meetLink: string}, @CurrentUser() loggedUser: LoggedInUser) {
    try{
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
      throw new HttpException('access denied', HttpStatus.FORBIDDEN);
    }
    return this.eventsService.updatingMeetLink(+id, sanitizeData(updateEventDto));
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

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto, @CurrentUser() loggedUser: LoggedInUser) {
  //   if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
  //     throw new HttpException('access denied', HttpStatus.FORBIDDEN);
  //   }
  // //  return this.eventsService.update(+id, updateEventDto);
  // }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an event by ID',
    description: 'This endpoint allows users to delete a specific event identified by its ID.'
  })
  remove(@Param('id') id: string) {
    try{
    return this.eventsService.remove(+id);
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

  @Put(':eventId/add-Aattandee')
  @ApiOperation({
    summary: 'Update event with an attendee',
    description: 'This endpoint allows users to add an attendee to a specific event identified by its event ID.'
  })
  async addAttandee(
    @Param('eventId') eventId: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (!loggedUser?.isPaidUser && !loggedUser.isSparkUser) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      await this.eventsService.addAttandee(+eventId, loggedUser.companies[0].id);
      return {
        success: true,
        message: "successfully Added",
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
  @Delete(':eventId/remove-Aattandee')
  @ApiOperation({
    summary: 'Remove an attendee from an event',
    description: 'This endpoint allows users to remove an attendee from a specific event identified by its event ID.'
  })
  async romevAttandee(
    @Param('eventId') eventId: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (!loggedUser?.isPaidUser && !loggedUser.isSparkUser) {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      await this.eventsService.romevAttandee(+eventId, loggedUser.companies[0].id);
      return {
        success: true,
        message: "Removed successfully",
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

  @Put("update-event-order/:id")
  @ApiOperation({
    summary: 'Update the display order of events',
    description: 'This endpoint allows users to update the display order of events identified by their ID.'
  })
  async updateEventOrder(
    @Param('id') id: number,
    @Body() postData: { qsnData: { id: number, orderId: number } }[],
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }
      if (postData && postData.length > 0) {
        sanitizeData(postData);
        await this.eventsService.updateDisplayOrder(postData);
        return {
          success: true,
          message: "successfully Updated",
        }
      } else {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
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

  @Put('update-event-status/:id')
  @ApiOperation({
    summary: 'Update the status of an event',
    description: 'This endpoint allows users to update the visibility status of an event identified by its ID, toggling it between hidden and displayed.'
  })
  async toggleEventDisplay(
    @Param('id') id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }

      return await this.eventsService.updateEventDisplayStatus(id);

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

  @Delete('delete-event/:id')
  @ApiOperation({
    summary: 'Delete an event',
    description: 'This endpoint allows users to delete a specific event identified by its ID.'
  })
  @ApiOperation({ summary: "Delete Events" })
  async deleteEvents(
    @Param('id') id: number,
    @CurrentUser() loggedUser: LoggedInUser,
  ) {
    try {
      if (loggedUser?.userRoles[0] && loggedUser?.userRoles[0].roleCode !== "admin") {
        throw new HttpException('access denied', HttpStatus.FORBIDDEN);
      }

      return await this.eventsService.deleteEventById(id);

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