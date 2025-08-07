import { Logger, Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { PrismaModule } from "src/prisma/prisma.module";

import { HealthController } from "./health.controller";

@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
  providers: [Logger],
})
export class HealthModule {}
