import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Application } from "express";

const contact = {
  name: "Ravi Ranjan",
  email: "Ravi848101mnb@gmail.com",
  phone: "+91 9608527421",
};

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bitespeed Backend Task: Identity Reconciliation",
      version: "1.0.0",
      description: `This API allows you to identify contacts based on email or phone number. If no contact is found, a new one is created. The API uses Redis for caching and Prisma for database operations.
        
      Contact: ${contact.name}, Email: ${contact.email}, Phone: ${contact.phone}`,
    },
    servers: [
      {
        url: "http://localhost:3000/",
      },
    ],
  },
  apis: ["./src/routes/index.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwaggerDocs = (app: Application) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
