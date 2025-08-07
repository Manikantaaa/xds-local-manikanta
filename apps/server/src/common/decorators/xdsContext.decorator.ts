import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { XdsContext } from "../types/xds-context.type";
import { REQUEST_HEADER } from "../constants/request.constant";

export const GetXdsContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers[REQUEST_HEADER.XDS_CONTEXT] as XdsContext;
  },
);
