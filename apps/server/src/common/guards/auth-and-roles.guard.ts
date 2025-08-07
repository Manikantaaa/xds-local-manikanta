import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "src/auth/auth.service";
import { APPROVAL_STATUS, ROLE_CODE, UserRoles } from "@prisma/client";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { UsersService } from "src/users/users.service";
// import { IS_API_ACCESSOR } from "../decorators/api-accessors.decorator";

@Injectable()
export class AuthAndRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // const requiredRoles = this.reflector.getAllAndOverride<ROLE_CODE[]>(
    //   ROLES_KEY,
    //   [context.getHandler(), context.getClass()],
    // );

    // if (!requiredRoles) {
    //   console.log("Access Denied");
    //   throw new ForbiddenException();
    // }

    const request = context.switchToHttp().getRequest();

    const idToken = this.extractTokenFromHeader(request);
    if (!idToken) {
      console.log("Missing token");
      throw new UnauthorizedException();
    }

    const decodedToken = await this.authService.verifyFirebaseToken(
      idToken as string,
    );

    const user = await this.usersService.findOneByEmailOrThrow(
      decodedToken.email as string,
    );

    if (!user) {
      console.log("Access Denied");
      throw new UnauthorizedException();
    }

    // const isApiAccessor = this.reflector.getAllAndOverride<boolean>(IS_API_ACCESSOR, [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);

    request["user"] = user;

    if (user.approvalStatus !== APPROVAL_STATUS.completed) {
      const errorMessage = `This account ${user.email} has approval status ${user.approvalStatus} is not completed yet`;
      console.log(errorMessage);
      throw new UnauthorizedException(errorMessage);
    }

    if(user.twoFactorDetails?.isActive && !user.twoFactorDetails.isVerified){
      throw new UnauthorizedException('Access denied to the requested API');
    }

    // if (user.accessExpirationDate && user?.accessExpirationDate < new Date()) {
    //   const errorMessage = `This account ${user.email} has expired on ${user.accessExpirationDate}`;
    //   console.log(errorMessage);
    //   throw new UnauthorizedException(errorMessage);
    // }

    // const userRoleCodes = user.userRoles.map(
    //   (role: UserRoles) => role.roleCode,
    // );

    // const hasRequiredRoles = requiredRoles.some((role: ROLE_CODE) =>
    //   userRoleCodes?.includes(role),
    // );

    // if (!hasRequiredRoles) {
    //   console.log("Access Denied");
    //   throw new UnauthorizedException();
    // }

    // Permission checking
    if(user.isCompanyUser){
      const requestedUrl = request.url;
      const hasAccess = await this.authService.checkApiAccess(user.CompanyAdminId, requestedUrl);

      if ((!hasAccess && user.isPaidUser) || !user.isPaidUser) {
        if(!user.isPaidUser){
          throw new UnauthorizedException('Access denied to the requested API');
        }else{
          throw new ForbiddenException('Access denied to the requested API');
        }
      }
    }
    if(request.url.includes('/company-admin') && !user.isPaidUser) {
      throw new ForbiddenException('Access denied to the requested API');
    }
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractTokenFromHeader(request: any): string | undefined {
    if (!request.headers.authorization) {
      return undefined;
    }
    const [type, token] = request.headers.authorization.split(" ");
    return type === "Bearer" ? token : undefined;
  }
}
