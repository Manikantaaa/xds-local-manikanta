import { Controller, Get, UseGuards } from "@nestjs/common";
import { AppService } from "./app.service";
import { AuthGuard } from "@nestjs/passport";
import { Public } from "./common/decorators/public.decorator";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Public()
  // @Get()
  // noSecure(): string {
  //   return "No secure";
  // }

  // @Get("/secured")
  // @UseGuards(AuthGuard("jwt"))
  // secure(): string {
  //   return "Secured";
  // }
}
