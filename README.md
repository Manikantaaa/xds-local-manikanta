# 1. Prerequisites

Make sure you have the following installed before setting up the project locally:

- Node.js - v16
- npm - v8
- Postgres - v15
- NestJS CLI - v10
- Docker

# 2. Basic Infra Setup
We prepare `docker-compose.yml` for easier set up basic infra on local.  Run docker compose:
```
docker compose up --build -d
```
Current infra local:
-   PostgreSQL

# 3. Development Environment URLs

- **Frontend URL**: `https://bubbly-sandbox-403616.web.app/`
- **Backend URL**: `https://bubbly-sandbox-403616.uc.r.appspot.com/`
- **Swagger URL**: `https://bubbly-sandbox-403616.uc.r.appspot.com/api`


# 4. Backend Setup

1.  Navigate to the `apps/server` directory.
2.  Run `npm install` to install dependencies.
3.  Clone `.env.example` to `.env` and set up your environment variables.

## Firebase
- Download private key following the guideline [here](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments).
- Set the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the downloaded file above: `GOOGLE_APPLICATION_CREDENTIALS="/Users/joe/Downloads/xds-spark-403105-firebase-adminsdk-sv7so-977809630a.json"`

## Database
For the initial setup, use Prisma commands to generate schema, migrate the database, and seed data:

```
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

## Start server
```
npm run dev
```

## Linting
```
npm run lint
```

## Prisma
We're using Prisma as ORM for this project. This section contains guideline using Prisma

**Manage seed data**
1. Create your seed scripts and store in  `seeds`  folder
2. To apply seed `npm run seed:dev .\prisma\seeds\file-name.ts`

**Update database schema**
Whenever you update your Prisma schema, you will have to update your database schema using either `prisma migrate dev` or `prisma db push`. This will keep your database schema in sync with your Prisma schema. The commands will also regenerate Prisma Client.

**Reset database - used for Development environment only**
```
npx prisma migrate reset
```
This command:
1. Drops database/schema if possible
2. Creates a new database/schema with the same name if the database/schema was dropped
3. Applies all migrations
4. Runs seed scripts


**Prisma Documents**
- [Team developer with Prisma Migrate](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/team-development)
- [Prisma CLI reference] (https://www.prisma.io/docs/reference/api-reference/command-reference#installation)


# 5. Frontend Setup

1.  Navigate to the `apps/web` directory.
2.  Run `npm install` to install frontend dependencies.
3.  Clone `.env.example` to `.env` for environment variables.

# 6. Stripe Setup

1. Refer to this Stripe Document on [setting up a local event listener](https://stripe.com/docs/development/dashboard/local-listener).
2. Forward events using this command:
```
stripe listen --forward-to localhost:4000/api/v1/webhook
``` 
3. Retrieve the `XDS_STRIPE_WEBHOOK_SECRET` and store it in your `.env` file.

**Note**: Errors may occur in the registration flow if the webhook is not initiated or fails to start, as certain steps require payment through Stripe.

## Start server
```
npm run dev
```

## Linting
```
npm run lint
``` 

# 6. Summary
Now, your project should be set up locally. If you encounter any issues, feel free to reach out. Happy coding!


