import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const { DB_USER, DB_PASS } = process.env;

if (!DB_PASS) {
  throw new Error("Missing required environment variables for DB connection.");
}

const sequelize = new Sequelize('movies', DB_USER, DB_PASS, {
  host: './dev.sqlite',
  dialect: 'sqlite',
  logging: false,
  dialectOptions: {
    foreign_keys: 'ON',
  },
});

export default sequelize;
