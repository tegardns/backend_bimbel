import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.route";
import { studentsRouter } from "./routes/students.route";
import { tutorsRouter } from "./routes/tutors.route";
import { articlesRouter } from "./routes/articles.route";
import { coverageRouter } from "./routes/coverage.routes";
import { quickRegistrationRouter } from "./routes/quick-registration.routes";
import { aiRouter } from "./routes/ai.route";
import { logicTestRouter } from "./routes/logic-test.route";

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
app.use("/api/coverage", coverageRouter);
app.use("/api/quick-registration", quickRegistrationRouter);
app.use("/api/ai", aiRouter);
app.use("/api/logic-test", logicTestRouter);

export { app };
