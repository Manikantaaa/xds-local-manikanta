import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { REQUEST_HEADER } from "src/common/constants/request.constant";
import { XdsContext } from "../types/xds-context.type";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const xdsContext: XdsContext = {
      requestId: uuidv4(),
    };
    req.headers[REQUEST_HEADER.XDS_CONTEXT] = JSON.stringify(xdsContext);

    next();
  }
}
