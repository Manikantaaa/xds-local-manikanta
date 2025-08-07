import { Injectable } from "@nestjs/common";
import { BackupPersonalContactsRepository } from "./backup-personal-contacts.repository";
import { CreateBackupPersonalContactDto } from "./dtos/create-backup-personal-contact.dto";
import { XdsContext } from "src/common/types/xds-context.type";

@Injectable()
export class BackupPersonalContactsService {
  constructor(
    private readonly backupContactsRepo: BackupPersonalContactsRepository,
  ) {}

  async upsert(
    userId: number,
    createBackupPersonalContactDto: CreateBackupPersonalContactDto,
  ) {
    const backupPersonalContact =
      await this.backupContactsRepo.findFirstByUserId(userId);

    if (backupPersonalContact) {
      const res = await this.backupContactsRepo.update(
        backupPersonalContact.id,
        {
          firstName: createBackupPersonalContactDto.firstName,
          lastName: createBackupPersonalContactDto.lastName,
          email: createBackupPersonalContactDto.email,
        },
      );
      return res;
    }
    const res = await this.backupContactsRepo.create({
      firstName: createBackupPersonalContactDto.firstName,
      lastName: createBackupPersonalContactDto.lastName,
      email: createBackupPersonalContactDto.email,
      userId,
    });

    return res;
  }

  findOneByUserId(xdsContext: XdsContext, userId: number) {
    return this.backupContactsRepo.findFirstByUserId(userId);
  }

  findOneByToken(token: string) {
    return this.backupContactsRepo.findFirstByToken(token);
  }

  saveOldEmail(userId: number, oldEmail:string, updatedEmail: string){
    return this.backupContactsRepo.saveOldEmailRepo(userId, oldEmail, updatedEmail)
  }

  findAuthDetailsOfUserById(userId: number) {
    return this.backupContactsRepo.findAuthDetailsOfUserById(userId);
  }

  addTwoFactorDetails(userId: number, isAllowed: boolean) {
    return this.backupContactsRepo.createAuthDetailsForUser(userId, isAllowed);
  }

  updateTwoFactorDetails(userId: number, isAllowed: boolean) {
    return this.backupContactsRepo.updateTwoFactorDetails(userId, isAllowed);
  }

  async saveOrUpdateSubUser2FA(companySubUserId: number, isChecked: boolean) {
    const subUsersOtpDetails = await this.backupContactsRepo.getSubUser2FADetails(companySubUserId);
    if(subUsersOtpDetails && subUsersOtpDetails.id) {
      return this.backupContactsRepo.updateSubUserOtp(subUsersOtpDetails.subUserId, isChecked);
    } else {
      return this.backupContactsRepo.createSubUserOtp(companySubUserId, isChecked)
    }
  }

}
