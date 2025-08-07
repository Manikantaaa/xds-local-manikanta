import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import admin from "firebase-admin";

@Injectable()
export class PasswordsService {
  constructor() {}
  async setupPassword(email: string, password: string) {
    try {
      await admin.auth().createUser({
        email: email,
        password: password,
      });
      console.log("Set up password successfully");
    } catch (error) {
      console.error("Error seting up password:", error);
      throw new HttpException(error.message, HttpStatus.FORBIDDEN, { cause: new Error (error) });
      // throw new BadRequestException(error.message);
    }
  }

  async updatePassword(email: string, password: string) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      if (user) {
        const successMails = await admin.auth().updateUser(user.uid, {
          password: password,
        });
        return {
          status : true,
          successMails: successMails
        }
      }
       else {
         
        const successMails = await admin.auth().createUser({
          email: email,
          password: password,
        });
        return {
          status : true,
          successMails: successMails
        }
       }
      
      // console.log("Set up password successfully");
    } catch (error) {
      if (
        error.errorInfo &&
        error.errorInfo.code &&
        error.errorInfo.code == "auth/user-not-found"
      ) {
        try {
          const successMails = await admin.auth().createUser({
            email: email,
            password: password,
          });
          return {
            status : true,
            successMails: successMails
          }
        } catch (errorIn) {
          return {
            status : false,
            failedMail : email,
          };
          // throw new BadRequestException(error.message);
        }
      } else {
        return {
          status : false,
          failedMail : email,
        };
        // throw new BadRequestException(error.message);
      }
    }
  }

  async changePassword(email: string, password: string) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      return await admin.auth().updateUser(user.uid, {
        password: password,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async checkUserExistInFirebase(email: string) {
    try {
      return await admin.auth().getUserByEmail(email);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
