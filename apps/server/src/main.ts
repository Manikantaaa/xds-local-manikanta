import { NestFactory } from "@nestjs/core";
// import { WinstonModule } from "nest-winston";
import { ConfigService } from "@nestjs/config";
import admin from "firebase-admin";
// import * as firebase from 'firebase/app';
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { FIREBASE_ADMIN_CONFIG } from "./services/firebase/firebase.config";
// import { instance as logger } from "./common/config/logger.config";
import * as express from "express";
import expressBasicAuth from "express-basic-auth";
import helmet from "helmet";
async function bootstrap() {
  const PROJECT_NAME = "XDS-Spark";
  const LATEST_API_VERSION = "1.0";

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    // logger: WinstonModule.createLogger({
    //   instance: logger,
    // }),
  });


  app.use(helmet());

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);


  app.use(
    ['/api/v1/docs', '/api/v1/docs-json'],
    expressBasicAuth({
      users: { 'sparkapi': 'Sparkapi@@123' },
      challenge: true,
    })
  );
  app.enableCors();


  
  // Swagger
  const config = new DocumentBuilder()
    .setTitle(PROJECT_NAME)
    .setVersion(LATEST_API_VERSION)
    .addServer('/api/v1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/v1/docs", app, document, {
    swaggerOptions: {
      supportedSubmitMethods: []
    },
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
    prefix: "api/v",
  });

  app.useGlobalPipes(new ValidationPipe());

  const configService = app.get(ConfigService);
  const port = configService.get("PORT");

  admin.initializeApp(FIREBASE_ADMIN_CONFIG);
  // firebase.initializeApp(FIREBASE_CONFIG);

  await app.listen(port);
}
bootstrap();
