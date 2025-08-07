import { Controller, Get, HttpException, HttpStatus, Logger } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { Public } from "src/common/decorators/public.decorator";
import { PrismaService } from "src/prisma/prisma.service";
import { GetXdsContext } from "src/common/decorators/xdsContext.decorator";
import { XdsContext } from "src/common/types/xds-context.type";
import { Prisma } from "@prisma/client";
@Controller("health")
export class HealthController {
  constructor(
    private readonly logger: Logger,
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check(@GetXdsContext() xdsContext: XdsContext) {
    try {
    this.logger.log("health check", { xdsContext });
    return this.health.check([
      async () => this.prismaHealth.pingCheck("prisma", this.prisma),
    ]);
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
