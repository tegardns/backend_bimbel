// import { app } from "./app";
// import { env } from "./config/env";

// app.listen(env.port, () => {
//   console.log(`Backend running on ${env.port}`);
// });

import { app } from "./app";
import { env } from "./config/env";

// Tetap jalankan listen buat kebutuhan development di laptop lo (local)
if (process.env.NODE_ENV !== "production") {
  app.listen(env.port, () => {
    console.log(`Backend running on ${env.port}`);
  });
}

// INI KUNCINYA: Vercel butuh export default ini
export default app;
