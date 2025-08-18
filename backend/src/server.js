import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

(async () => {
  try {
    await connectDB(MONGO_URI);
    app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
