import { BadRequestException, Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { CronJobsService } from './cron-jobs.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from "@nestjs/config";
import { http } from 'winston';
import { Prisma } from '@prisma/client';
@Controller('cron-jobs')
@ApiExcludeController()
export class CronJobsController {
  constructor(private readonly cronJobsService: CronJobsService,
    private readonly configService: ConfigService

  ) {

  }

  @Public()
  @Get("check-user-and-logout/:token")
  async checkUsersAndAutoLogout(@Param('token') token: string) {
    try {
      let currentToken = this.configService.get("XDS_CRON_TOKEN");
      if (currentToken == token) {
        await this.cronJobsService.csvBuyersTrailEndToday();
        return "Run success";
      }
      throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST)
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
  @Get("check-user-send-remainder-mail/:token")
  async checkUserAndSendRemainderMail(@Param('token') token: string) {
    try {
      let currentToken = this.configService.get("XDS_CRON_TOKEN")
      if (currentToken == token) {
        await this.cronJobsService.checkUserAndSendRemainderMail();
        return "Run Success";
      }
      throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST)
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
  @Get("trial-users-reset/:token")
  async updateEightWeekTrialUsersStatus(@Param('token') token: string) {
    try {
      let currentToken = this.configService.get("XDS_CRON_TOKEN")
      if (currentToken == token) {
        await this.cronJobsService.getExpiringUsers();
        return "Run Success";
      }
      throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST)

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
  @Get("send-follower-updates/:token")
  async sendFollowNotifications(@Param('token') token: string) {
    try {
      let currentToken = this.configService.get("XDS_CRON_TOKEN")
      if (currentToken == token) {
        return await this.cronJobsService.sendFollowNotifications();
      }
      throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST)
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
  @Get('update-expired-sponsers/:token')
  async updateExpiredSponsers(@Param('token') token: string) {
    try {
      let currentToken = this.configService.get("XDS_CRON_TOKEN");

    //  return {token:{token,type:typeof token}, currentToken: {currentToken,type:typeof currentToken},}
      if (currentToken === token) {
       // await this.cronJobsService.updateExpiredServices();
        return "Run Success";
      }
      throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST)
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
  @Get('delete-old-notifications/:token')
  async deleteOldNotifications(@Param('token') token: string) {
    try {
      let currentToken = this.configService.get("XDS_CRON_TOKEN");
      if (currentToken === token) {
        await this.cronJobsService.deleteOldNotifications();
        return "Run Success";
      }
      throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST)
    } catch(err) {
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
  @Get('send-mail-for-profile-completion/:token')
  async sendMailForProfileCompletion(@Param('token') token: string) {
    try {
      let currentToken = this.configService.get("XDS_CRON_TOKEN");
      if (currentToken === token) {
        await this.cronJobsService.sendMailForProfileCompletion();
        return "Run Success";
      }
      throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST)
    } catch(err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new HttpException('Database request error', HttpStatus.BAD_REQUEST);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        throw new HttpException('Invalid data provided', HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        throw new BadRequestException(err.message);
      }
    }
  }

  // For getting duplicate services companyIds from serviceopt.
  // @Public()
  // @Get('find-duplicate-services-ids/:token')
  // async findDuplicateServices(@Param('token') token: string) {
  //   try {
  //     let currentToken = this.configService.get("XDS_CRON_TOKEN");
  //     if (currentToken === token) {
  //       return await this.cronJobsService.findDuplicateServices();
  //       // return "Run Success";
  //     }
  //     throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST)
  //   } catch(err) {
  //     throw new BadRequestException(err.message);
  //   }
  // }



  // @Public()
  // @Get('database-backup/:token')
  // async databaseBackup (@Param('token') token: string) {
  //   try {
  //     let currentToken = this.configService.get("XDS_CRON_TOKEN");
  //     if (currentToken === token) {
  //       return await this.cronJobsService.getDbBackup();
  //     }
  //     throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST)
  //   } catch(err) {
  //     throw new BadRequestException(err.message);
  //   }

  // }

  // @Public()
  // @Get('database-restore/:token')
  // async databaseRestore (@Param('token') token: string) {
  //   try {
  //     let currentToken = this.configService.get("XDS_CRON_TOKEN");
  //     if (currentToken === token) {
  //       return await this.cronJobsService.getDbRestore();
  //     }
  //     throw new HttpException("Unauthorized Request", HttpStatus.BAD_REQUEST)
  //   } catch(err) {
  //     throw new BadRequestException(err.message);
  //   }
  // }
}
