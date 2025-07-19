import express from "express";
import type { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

import { setupSwaggerDocs } from "../../swagger";
setupSwaggerDocs(app);

import userRouter from "../routes";
// app.use("/", (req, res) => {
//   res.redirect("/api-docs");
// });
app.use("/api", userRouter);

export default app;
