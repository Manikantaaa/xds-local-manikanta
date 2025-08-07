/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient, ROLE_CODE } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = [
  {
    id: 1,
    email: "user1@gmail.com",
    firstName: "John",
    lastName: "Doe",
    companyName: "ABC",
    companyWebUrl: "web.com",
    linkedInUrl: "linkedin.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    email: "user2@gmail.com",
    firstName: "Jane",
    lastName: "Smith",
    companyName: "ABC",
    companyWebUrl: "web.com",
    linkedInUrl: "linkedin.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    email: "user3@gmail.com",
    firstName: "Tom",
    lastName: "James",
    companyName: "ABC",
    companyWebUrl: "web.com",
    linkedInUrl: "linkedin.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const USER_ROLES = [
  {
    id: 1,
    userId: 1,
    roleCode: "admin" as ROLE_CODE,
  },
  {
    id: 2,
    userId: 1,
    roleCode: "service_provider" as ROLE_CODE,
  },
  {
    id: 3,
    userId: 3,
    roleCode: "buyer" as ROLE_CODE,
  },
];
async function seedData() {
  try {
    await prisma.$transaction([
      prisma.users.createMany({ data: USERS, skipDuplicates: true }),
      prisma.userRoles.createMany({ data: USER_ROLES, skipDuplicates: true }),
    ]);

    console.log("Seed users and user roles successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData().catch((error) => {
  console.error(error);
  process.exit(1);
});
