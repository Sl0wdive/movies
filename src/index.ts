import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/sequelize";
import userRoutes from "./routes/user.routes";
import movieRoutes from "./routes/movie.routes";
import setupAssociations from "./models/setup.associations";
import fs from "fs";
import path from "path";
import cors from "cors";

setupAssociations();

dotenv.config();

const app = express();
app.use(cors());
const port = Number(process.env.APP_PORT) || 8050;

app.use(express.static("public"));

const uploadsDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use("/api/v1", userRoutes);
app.use("/api/v1", movieRoutes);

app.listen(port, "0.0.0.0", async () => {
  console.log(`Server is running on port ${port}`);
  try {
    await sequelize.sync();
    console.log("Database synced");

    await sequelize.query("PRAGMA foreign_keys = ON");
  } catch (err) {
    console.error("Error syncing database:", err);
  }
});
