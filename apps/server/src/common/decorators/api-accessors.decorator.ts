import { SetMetadata } from "@nestjs/common";

export const IS_API_ACCESSOR = "apiAccessor";
export const ApiAccessor = () => SetMetadata(IS_API_ACCESSOR, true);