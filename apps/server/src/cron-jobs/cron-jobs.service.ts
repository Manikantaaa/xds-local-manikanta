import { Injectable } from '@nestjs/common';
import { USER_TYPE } from '@prisma/client';
import { MailerService } from 'src/mailer/mailer.service';
import { UsersService } from 'src/users/users.service';
import { CronJobsRepository } from './cron-jobs.repository';
import { exec } from 'child_process';
import * as path from 'path';
import { Bucket, Storage } from "@google-cloud/storage";
import { ConfigService } from '@nestjs/config';
import { formatDateIntoString } from 'src/common/methods/common-methods';

@Injectable()
export class CronJobsService {
  // private storage: Storage;
  // private bucketName: Bucket;
  // private readonly gcs = new Storage({
  //   projectId: '<YOUR_PROJECT_ID>',
  //   keyFilename: path.resolve(__dirname, '../../path-to-service-account-key.json'),
  // });
  constructor(
    private readonly userService: UsersService,
    private readonly mailerService: MailerService,
    private readonly cronJobsRepository: CronJobsRepository,
    // private readonly configService: ConfigService
    ) {
    // this.storage = new Storage({
    //   projectId: this.configService.get("XDS_GCS_PROJECT_ID"),
    //   credentials: {
    //     client_email: this.configService.get("XDS_GCS_CLIENT_EMAIL"),
    //     private_key: `${this.configService.get("XDS_GCS_PRIVATE_KEY")}`.replace(
    //       /\\n/g,
    //       "\n",
    //     ),
    //   },
    // });
    // this.bucketName = this.storage.bucket(
    //   this.configService.get("XDS_GCS_BUCKET_NAME") as string,
    // );
  }
  
  async csvBuyersTrailEndToday() {
    await this.userService.csvBuyersTrailEndToday()
  }

  async checkUserAndSendRemainderMail() {
    const conditionMetUsers: any = await this.userService.findUsersWhere();
    if(conditionMetUsers && conditionMetUsers.length > 0){
      for(const item of conditionMetUsers) {
        if(item.isPaidUser && item.userType == USER_TYPE.trial) {
          this.mailerService.sendSubscriptionNotificationMail({
            name: item.firstName,
            email: item.email,
            date: new Date(item.accessExpirationDate),
            userType: item.userRoles[0].roleCode,
          });
        }
      }
    }
    const staticDateString = "2025-10-17";
    const currentDateString = formatDateIntoString(new Date());
    if(staticDateString == currentDateString) {
      const sixMonthsTrialUsers: any = await this.userService.sixMonthTrialUsers();
      if(sixMonthsTrialUsers && sixMonthsTrialUsers.length > 0){
        for(const item of sixMonthsTrialUsers) {
          if(item.isPaidUser && item.userType == USER_TYPE.trial) {
            this.mailerService.sendSubscriptionNotificationMail({
              name: item.firstName,
              email: item.email,
              date: new Date(item.accessExpirationDate),
              userType: item.userRoles[0].roleCode,
            });
          }
        }
      }
    }
  }

  async getExpiringUsers() {
    this.userService.makeEightWeekTrialUsersExpire();
  }

  async sendFollowNotifications() {
   return this.userService.sendFollowNotifications();
  }

  updateExpiredServices(){
    return this.userService.updateExpiredService();
  }

  async deleteOldNotifications() {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 3);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const oldDateToDelete = `${year}-${month}-${day}`;
    await this.cronJobsRepository.deleteOldNotifications(oldDateToDelete);
  }

  async sendMailForProfileCompletion() {
    const newUsers = await this.cronJobsRepository.sendMailForCompanyProfileCompletion();
    const uniqueUsers = Array.from(
      new Map(newUsers.map(user => [user.userId, user])).values()
    );
    for(const company of uniqueUsers) {
      if(company.createdAt) {
        const currentDate: any = new Date();
        const firstLoggedDate: any = new Date(company.createdAt);
        const diff = Math.abs(currentDate - firstLoggedDate);
        const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        console.log(diffInDays+ "<-");
        if(diffInDays == 7) {
          // console.log(diffInDays+ "7");
         this.mailerService.companyProfileCompletion( company.user.email, company.user.firstName+" "+company.user.lastName, company.user.companies[0].name );
        } else if(diffInDays == 14) {
          // console.log(diffInDays+ "14");
          this.mailerService.companyProfileCompletion( company.user.email, company.user.firstName+" "+company.user.lastName, company.user.companies[0].name );
        } else if(diffInDays == 20) {
          // console.log(diffInDays+ "20");
          this.mailerService.companyProfileCompletion( company.user.email, company.user.firstName+" "+company.user.lastName, company.user.companies[0].name );
        }
      }
    }
    return uniqueUsers;
  }

  // async getDbBackup () {
  //   const backupFileName = `backup.sql`;
  //   const backupFilePath = backupFileName;
  //   return new Promise((resolve, reject) => {
  //     const command = `pg_dump -h `+process.env.XDS_PGSQL_HOST+` -p `+process.env.XDS_PGSQL_PORT+` -U `+process.env.XDS_PGSQL_USERNAME+` -d `+process.env.XDS_PGSQL_DBNAME+` -F c -b -v -f ${backupFilePath}`;
      
  //     // Set environment variables for authentication
  //     const env = { ...process.env, PGPASSWORD: process.env.XDS_PGSQL_PASSWORD };

  //     exec(command, { env }, async (error, stdout, stderr) => {
  //       if (error) {
  //         console.error('Error during backup:', stderr);
  //         return reject(`Backup failed: ${stderr}`);
  //       }

  //       console.log('Backup completed successfully:', stdout);

  //       // Upload the file to GCS
  //       try {
  //         const backupFile =  `${Date.now()+'_'+backupFileName}`;
  //         const [uploadedFile] = await this.bucketName.upload(backupFilePath, {
  //           destination: `postgre-backups/${process.env.XDS_RUN_ENVIRONMENT}/${backupFile}`,
  //           resumable: false,
  //         });

  //         console.log(`Backup uploaded to GCS: ${uploadedFile.name}`);
  //         resolve(`gs://${this.bucketName}/postgre-backups/${process.env.XDS_RUN_ENVIRONMENT}/${backupFile}`);
  //       } catch (uploadError) {
  //         console.error('Error uploading to GCS:', uploadError);
  //         reject(`Failed to upload backup to GCS: ${uploadError.message}`);
  //       }
  //     });
  //   });
  // }
  // async getDbRestore () {
  //   const backupFileName = `backup.sql`; // Ensure this file exists in the working directory
  // const backupFilePath = backupFileName;

  // return new Promise((resolve, reject) => {
  //   const command = `pg_restore -h `+process.env.XDS_PGSQL_HOST+` -p `+process.env.XDS_PGSQL_PORT+` -U `+process.env.XDS_PGSQL_USERNAME+` -d `+process.env.XDS_PGSQL_DBNAME+` -v --clean --no-owner ${backupFilePath}`;

  //   // Set environment variables for authentication
  //   const env = { ...process.env, PGPASSWORD: process.env.XDS_PGSQL_PASSWORD };

  //   exec(command, { env }, (error, stdout, stderr) => {
  //     if (error && !stderr.includes('errors ignored on restore')) {
  //       console.error('Error during restore:', stderr);
  //       return reject(`Restore failed: ${stderr}`);
  //     }

  //     if (stderr.includes('errors ignored on restore')) {
  //       console.warn('Warning: Minor errors ignored during restore:', stderr);
  //     }

  //     console.log('Restore completed successfully:', stdout);
  //     resolve('Restore completed successfully.');
  //   });
  // });
  // }

  async findDuplicateServices(){
    const allCompnayIds = await this.cronJobsRepository.findAllCompanyIds();
    const updatedCompanies = [];
    for(const companyId of allCompnayIds) {
      const services = await this.cronJobsRepository.findDuplicateServices(+companyId.id);
      if(services){
        updatedCompanies.push(services);
      }
    }
    return updatedCompanies;
  }

}
