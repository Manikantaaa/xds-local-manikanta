import { BadRequestException, Injectable } from "@nestjs/common";
import { RegistrationRequestsRepository } from "./registration-request.repository";
import { ConfirmRequest } from "./type";
import { v4 as uuidv4 } from "uuid";
import { APPROVAL_STATUS, Prisma } from "@prisma/client";
import { UsersService } from "src/users/users.service";

@Injectable()
export class RegistrationRequestsService {
  constructor(
    private readonly requestRepository: RegistrationRequestsRepository,
    private readonly usersService: UsersService,
  ) {}

  confirmRequest(confirmRequest: ConfirmRequest) {
    return this.requestRepository.update(confirmRequest);
  }

  generateCompleteSetupToken() {
    return uuidv4();
  }

  async validateOrThrow(token: string) {
    const registrationRequest = await this.requestRepository.findFirst({
      completeSetupToken: token,
    });

    if (!registrationRequest) {
      console.log("Invalid token");
      throw new BadRequestException("Invalid token");
    }

    const user = await this.usersService.findUnique(registrationRequest.userId);
    return user;
  }

  async approve(requestId: number, token: string) {
    try {
      return await this.confirmRequest({
        id: requestId,
        approvalStatus: APPROVAL_STATUS.approved,
        completeSetupToken: token,
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  async reject(requestId: number) {
    try {
      return this.confirmRequest({
        id: requestId,
        approvalStatus: APPROVAL_STATUS.rejected,
        completeSetupToken: null,
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  async getAllRegistrations() {
    const user = await this.requestRepository.findAll();
    return user;
  }

  async getAllRegistrationsByFilter(
    start: number,
    limit: number,
    conditions: Prisma.RegistrationRequestsWhereInput[],
  ) {
    const user = await this.requestRepository.findAllByFilter(
      start,
      limit,
      conditions,
    );
    return user;
  }

  async getCountOfRegistrationByFilter(
    conditions: Prisma.RegistrationRequestsWhereInput[],
  ) {
    const rowCounts: number =
      await this.requestRepository.getCountOfRegistrationByFilter(conditions);
    return rowCounts;
  }

  async deleteRegistration(id: number) {
    try {
      return await this.requestRepository.deleteRegistration(id);
    } catch (err) {
      console.log(err);
      throw new BadRequestException();
    }
  }
}
