import { SetMetadata } from "@nestjs/common";
import { ROLE_CODE } from "@prisma/client";

export const ROLES_KEY = "roles";
export const Roles = (...roles: ROLE_CODE[]) => SetMetadata(ROLES_KEY, roles);
