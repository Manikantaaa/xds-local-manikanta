import { Bucket, FileMetadata, GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import path, { parse } from "path";
import sharp from 'sharp';
import fs from 'fs';
import axios from 'axios';
import { Readable } from "stream";


@Injectable()
export class GoogleCloudStorageService {
  private storage: Storage;
  private bucket: Bucket;
  constructor(private readonly configService: ConfigService) {


    this.storage = new Storage({
      projectId: this.configService.get("XDS_GCS_PROJECT_ID"),
      credentials: {
        client_email: this.configService.get("XDS_GCS_CLIENT_EMAIL"),
        private_key: `${this.configService.get("XDS_GCS_PRIVATE_KEY")}`.replace(
          /\\n/g,
          "\n",
        ),
      },
    });
    this.bucket = this.storage.bucket(
      this.configService.get("XDS_GCS_BUCKET_NAME") as string,
    );
  }

  private setDestination(destination: string): string {
    let escDestination = "";
    escDestination += destination
      .replace(/^\.+/g, "")
      .replace(/^\/+|\/+$/g, "");
    if (escDestination !== "") escDestination = escDestination + "/";
    return escDestination;
  }

  private setFilename(uploadedFile: Express.Multer.File): string {
    const fileName = parse(uploadedFile.originalname);
    return `${fileName.name}-${Date.now()}${fileName.ext}`
      .replace(/^\.+/g, "")
      .replace(/^\/+/g, "")
      .replace(/\s+/g, "_")
      .replace(/\r|\n/g, "_");
  }

  async uploadFile(
    uploadedFile: Express.Multer.File,
    destination: string,
    iscropping: boolean = false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {

    const fileName =
      this.setDestination(destination) +
      this.setFilename(uploadedFile)

        .replace(/^\.+/g, "")
        .replace(/^\/+/g, "")
        .replace(/\r|\n/g, "_");

    const file = this.bucket.file(fileName);
    try {

      if (uploadedFile.mimetype.startsWith('image/')) {
        var thumbNailName = await this.uploadThumbnailFile(uploadedFile, fileName);
        if (iscropping) {
          const resizedImageBuffer = await sharp(uploadedFile.buffer)
            .resize(750, 422)
            .toBuffer();
          await file.save(resizedImageBuffer, {
            contentType: uploadedFile.mimetype,
          }).then(() =>{
            this.bucket.file(fileName).makePublic();
          });
        } else {
          await file.save(uploadedFile.buffer, {
            contentType: uploadedFile.mimetype,
          }).then(() =>{
            this.bucket.file(fileName).makePublic();
          });
        }

      } else {
        // await file.save(uploadedFile.buffer, {
        //   contentType: uploadedFile.mimetype,
        // }).then(() =>{
        //   this.bucket.file(fileName).makePublic();
        // });
        await new Promise((resolve, reject) => {
          const stream = file.createWriteStream({
            metadata: { contentType: uploadedFile.mimetype },
          });
  
          // Handle errors
          stream.on('error', (err) => {
            console.error('Upload failed:', err);
            reject(new Error('Upload failed'));
          });
  
          // Make file public and fetch metadata
          stream.on('finish', async () => {
            try {
              await file.makePublic();
              const [metadata] = await file.getMetadata(); // Retrieve metadata
              resolve(metadata);
            } catch (error) {
              reject(error);
            }
          });
          Readable.from(uploadedFile.buffer).pipe(stream);
        });
      }
    } catch (error) {
      throw error;
    }

    if (thumbNailName && thumbNailName != '') {
      return {
        ...file.metadata,
        fileUrl: fileName,
        thumbUrl: thumbNailName.fileUrl,
      };
    }
    return {
      ...file.metadata,
      fileUrl: fileName,
    };
  }

  async uploadSponsersLogosFile(
    uploadedFile: Express.Multer.File,
    destination: string,
    formType: string = 'default',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const fileName =
      this.setDestination(destination) +
      this.setFilename(uploadedFile)

        .replace(/^\.+/g, "")
        .replace(/^\/+/g, "")
        .replace(/\r|\n/g, "_");

    const file = this.bucket.file(fileName);

    try {
      if (uploadedFile.mimetype.startsWith('image/') || (formType != "album" && !uploadedFile.mimetype.startsWith('image/gif'))) {
        let resizedImageBuffer: Buffer;
        if (formType == 'album') {

          var thumbNailName = await this.uploadThumbnailFile(uploadedFile, fileName);
          resizedImageBuffer = uploadedFile.buffer;
        } else {
          resizedImageBuffer = await sharp(uploadedFile.buffer)
            .resize(320, 180)
            .toBuffer();
        }

        await file.save(resizedImageBuffer, {
          contentType: uploadedFile.mimetype,
        }).then(() =>{
          this.bucket.file(fileName).makePublic();
        });
      } else {
        await file.save(uploadedFile.buffer, {
          contentType: uploadedFile.mimetype,
        }).then(() =>{
          this.bucket.file(fileName).makePublic();
        });
      }
    } catch (error) {
      throw error;
    }

    if (thumbNailName && thumbNailName != '') {
      return {
        ...file.metadata,
        fileUrl: fileName,
        thumbUrl: thumbNailName.fileUrl,
      };
    }
    return {
      ...file.metadata,
      fileUrl: fileName,
    };
  }

  async uploadLogoFile(
    uploadedFile: Express.Multer.File,
    destination: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const fileName =
      this.setDestination(destination) +
      this.setFilename(uploadedFile)

        .replace(/^\.+/g, "")
        .replace(/^\/+/g, "")
        .replace(/\r|\n/g, "_");

    const file = this.bucket.file(fileName);

    try {

      if (uploadedFile.mimetype.startsWith('image/')) {
        const resizedImageBuffer = await sharp(uploadedFile.buffer)
          .resize(150, 150)
          .toBuffer();
        await file.save(resizedImageBuffer, {
          contentType: uploadedFile.mimetype,
        }).then(() =>{
          this.bucket.file(fileName).makePublic();
        });
      } else {
        await file.save(uploadedFile.buffer, {
          contentType: uploadedFile.mimetype,
        }).then(() =>{
          this.bucket.file(fileName).makePublic();
        });
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }

    return {
      ...file.metadata,
      fileUrl: fileName,
    };
  }

  async uploadBannerFile(
    uploadedFile: Express.Multer.File,
    destination: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const fileName =
      this.setDestination(destination) +
      this.setFilename(uploadedFile)

        .replace(/^\.+/g, "")
        .replace(/^\/+/g, "")
        .replace(/\r|\n/g, "_");

    const file = this.bucket.file(fileName);

    try {

      if (uploadedFile.mimetype.startsWith('image/')) {
        const resizedImageBuffer = await sharp(uploadedFile.buffer)
          .resize(800, 450)
          .toBuffer();
        await file.save(resizedImageBuffer, {
          contentType: uploadedFile.mimetype,
        }).then(() =>{
          this.bucket.file(fileName).makePublic();
        });
      } else {
        await file.save(uploadedFile.buffer, {
          contentType: uploadedFile.mimetype,
        }).then(() =>{
          this.bucket.file(fileName).makePublic();
        });
      }
    } catch (error) {
      throw new BadRequestException(error?.message);
    }

    return {
      ...file.metadata,
      fileUrl: fileName,
    };
  }

  async uploadThumbnailFile(
    uploadedFile: Express.Multer.File,
    fileName: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const lastDotIndex = fileName.lastIndexOf('.');
    const nameWithoutExtension = fileName.substring(0, lastDotIndex);
    const fileExtension = fileName.substring(lastDotIndex);
    const thumbnailFileName = nameWithoutExtension + '_thumbnail' + fileExtension;
    const file = this.bucket.file(thumbnailFileName);
    try {

      const width = 362;
      const height = 204;

      const resizedImageBuffer = await sharp(uploadedFile.buffer)
        .resize(width, height)
        .toBuffer();


      await file.save(resizedImageBuffer, {
        contentType: uploadedFile.mimetype,
      }).then(() =>{
        this.bucket.file(thumbnailFileName).makePublic();
      });
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
    return {
      ...file.metadata,
      fileUrl: thumbnailFileName,
    };
  }

  async removeFile(fileName: string): Promise<void> {
    const file = this.bucket.file(fileName);
    try {
      await file.delete();
    } catch (error) {
      throw new BadRequestException(error?.message);
    }
  }

  async isFilePublic(fileName: string) {
    try {
      const file = this.bucket.file(fileName);

      const [acls]: any = await file.acl.get();
      
      const isPublic = acls.some((acl: { entity: string; role: string; }) => acl.entity === 'allUsers' && acl.role === 'READER');
      return isPublic;
    } catch (error) {
      console.error('Error checking file public status:', error);
    }
  }

  async checkFileExists(fileName: string) {
    try {
      const file = this.bucket.file(fileName);
      await file.getMetadata();
      return true;  // If no error, the file exists
    } catch (error) {
      if (error.code === 404) {
        return false; // File does not exist
      } else {
        console.error('Error checking file metadata:', error);
        return false;
      }
    }
  }

  async makeImageAsPublic(fileName: string) {
    const fileExists = await this.checkFileExists(fileName);
    if (fileExists) {
      const isPublic = await this.isFilePublic(fileName);
      if(!isPublic) {
        await this.bucket.file(fileName).makePublic();
      }
    }
  }

  async getSignedUrl(fileName: string) {

    // const fileExists = await this.checkFileExists(fileName);
    // if (fileExists) {
    //   const isPublic = await this.isFilePublic(fileName);
    //   if(!isPublic) {
    //     await this.bucket.file(fileName).makePublic();
    //   }
    // }
    return this.configService.get("XDS_GCS_BUCKET_URL_PREFIX") + fileName;
  }
  
  async getPublicSignedUrl(fileName: string) {

    
    // const fileExists = await this.checkFileExists(fileName);
    // if (fileExists) {
    //   const isPublic = await this.isFilePublic(fileName);
    //   if(!isPublic) {
    //     await this.bucket.file(fileName).makePublic();
    //   }
    // }
    return this.configService.get("XDS_GCS_BUCKET_URL_PREFIX") + fileName;
  }

  // async resizeImage(
  //   uploadedFile: Express.Multer.File
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // ): Promise<any> {
  //   const fs = require('fs');
  //   const fileName = uploadedFile.originalname;
  //   const lastDotIndex = fileName.lastIndexOf('.');
  //   const nameWithoutExtension = fileName.substring(0, lastDotIndex);
  //   const fileExtension = fileName.substring(lastDotIndex);
  //   const thumbnailFileName = nameWithoutExtension + '_thumbnail' + fileExtension;
  //   const file = this.bucket.file(thumbnailFileName);
  //   const localFilePath = './thumbnails/' + thumbnailFileName;
  //   try {
  //     const width = 362;
  //     const height = 204;

  //     const resizedImageBuffer = await sharp(uploadedFile.buffer)
  //       .resize(width, height)
  //       .toBuffer();

  //     fs.writeFileSync(localFilePath, resizedImageBuffer);
  //     // await file.save(resizedImageBuffer, {
  //     //   contentType: uploadedFile.mimetype,
  //     // }).then(() =>{
          //   this.bucket.file(fileName).makePublic();
          // });
  //   } catch (error) {
  //     throw new BadRequestException(error?.message);
  //   }
  //   return {
  //     ...file.metadata,
  //     fileUrl: thumbnailFileName,
  //   };
  // }

  async videoThumbnail(filename: string, youtubeThumb: string): Promise<any> {
    try {
      const response = await axios.get(youtubeThumb, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const setFilename = `hq720-${Date.now()}.jpg`
      const fileName =
        this.setDestination(filename) +
        (setFilename)
          .replace(/^\.+/g, "")
          .replace(/^\/+/g, "")
          .replace(/\s+/g, "_")
          .replace(/\r|\n/g, "_");;
      var thumbNailName = await this.uploadThumbnailFile({
        buffer: buffer,
        fieldname: "",
        originalname: fileName,
        encoding: "",
        mimetype: "",
        size: 0,
        stream: new Readable,
        destination: "",
        filename: "",
        path: ""
      }, fileName);
      // const localFilePath = './thumbnails/videoThumbnail.png';
      // fs.writeFileSync(localFilePath, buffer);
      return {
        videoThumbnail: thumbNailName.fileUrl,
      }
    } catch (error) {
      console.log(error);
    }

  }

  async uploadFileWithOutCropping(
    uploadedFile: Express.Multer.File,
    destination: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const fileName =
      this.setDestination(destination) +
      this.setFilename(uploadedFile)

        .replace(/^\.+/g, "")
        .replace(/^\/+/g, "")
        .replace(/\r|\n/g, "_");

    const file = this.bucket.file(fileName);

    try {
      await file.save(uploadedFile.buffer, {
        contentType: uploadedFile.mimetype,
      }).then(() =>{
        this.bucket.file(fileName).makePublic();
      });

    } catch (error) {
      throw new BadRequestException(error?.message);
    }

    return {
      ...file.metadata,
      fileUrl: fileName,
    };
  }
}