import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Users } from "@prisma/client";

export const CurrentUser = createParamDecorator(
  (data: Users, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
