import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.route";
import { studentsRouter } from "./routes/students.route";
import { tutorsRouter } from "./routes/tutors.route";
import { articlesRouter } from "./routes/articles.route";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use("/api/health", healthRouter);
app.use("/api/students", studentsRouter);
app.use("/api/tutors", tutorsRouter);
app.use("/api/articles", articlesRouter);

export { app };
