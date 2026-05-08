import { app } from "./app";
import { env } from "./config/env";

if (process.env.NODE_ENV !== "production") {
  app.listen(env.port, () => {
    console.log(`Backend running on ${env.port}`);
  });
}

export default app;
