import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize";

const MovieActor = sequelize.define(
  "movie_actors",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    MovieId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "movies",
        key: "id",
      },
    },
    ActorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "actors",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["MovieId", "ActorId"],
      },
    ],
  }
);

export default MovieActor;
