const app = require("./app");
require("dotenv").config();

const { connectDb } = require("../db");

const PORT = process.env.PORT || 3002;

// Try to connect DB but don't crash server if it fails
(async () => {
  try {
    await connectDb();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
})();
