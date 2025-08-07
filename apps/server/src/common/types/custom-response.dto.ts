import { HttpStatus } from "@nestjs/common";

export class CustomResponse<T> {
  constructor(
    public statusCode = HttpStatus.OK,
    public success = true,
    public data: T,
  ) {}
}
