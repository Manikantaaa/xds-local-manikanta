import { BadRequestException,Logger,Injectable } from '@nestjs/common';
import { XdsContext } from 'src/common/types/xds-context.type';
import { UsersService } from 'src/users/users.service';
import { SparkPlusRepository } from './spark-plus.repository';
import { UserRequestSpark } from './type';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SparkPlusService {
    constructor(
            private readonly logger: Logger,
            private readonly usersService: UsersService,
            private readonly sparkPlusRepo:SparkPlusRepository
        
    ){}

     async register(xdsContext: XdsContext, user: UserRequestSpark) {
        const existingUser = await this.usersService.findOneByEmail(user.email.toLowerCase());
        const existingSubUser = await this.usersService.findSubUserByEmail(user.email.toLowerCase());
        if (
          (user.firstName && user.firstName.length > 25) ||
          (user.lastName && user.lastName.length > 25) ||
          (user.companyName && user.companyName.length > 25)
        ) {
          const errorMessage = "Invalid input";
          this.logger.error(errorMessage, { xdsContext, email: user.email });
          throw new BadRequestException(errorMessage);
        }
        if (user.firstName) {
          const regex = /^(?!.*(?:https?|ftp):\/\/)(?!.*www\.)(?!.*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?!.*\.)[\s\S]*$/;
          if (!regex.test(user.firstName) || !regex.test(user.lastName)) {
            const errorMessage = "Invalid input";
            this.logger.error(errorMessage, { xdsContext, email: user.email });
            throw new BadRequestException(errorMessage);
          }
        }
        if (existingUser || existingSubUser) {
          const errorMessage = "The email address cannot be used at this time. Please check the address and try again.";
          this.logger.error(errorMessage, { xdsContext, email: user.email });
          return 'email existed';
        }
        return this.sparkPlusRepo.createWithRole(user);
      }

  async findCompanySparkUsers(companyId: number) {
    return await this.sparkPlusRepo.findSparkUsersByCompany(companyId);
  }

  async generateToken(userId: number) {
         const secret = process.env.XDS_JWT_KEY;
         if (!secret) {
          throw new Error('JWT secret key is not defined in environment variables');
          }
         const token = jwt.sign({userId},secret,{ expiresIn: '28d' });
         return this.sparkPlusRepo.generateURLDetail(userId,token);
    }

 async getToken(token: string) {
    try {
      return await this.sparkPlusRepo.getToken(token);
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  
  async updateIsArchieveToTrue(sparkUserId: number,buyerId:number) {
    return await this.sparkPlusRepo.updateIsArchieveToTrue(sparkUserId,buyerId);
  }

  updateIsArchieveToFalse(sparkUserId: number,buyerId:number) {
    return this.sparkPlusRepo.updateIsArchieveToFalse(sparkUserId,buyerId);
  }


    async deleteUser(sparkUserId: number,buyerId:number) {
      return this.sparkPlusRepo.delete(sparkUserId,buyerId);
  }

   async getRegistrationById(id: number) {
    return this.sparkPlusRepo.findAllDetailsByRegistrationId(id);
  }

  
}
