import {
  Model,
  DataTypes,
  Optional,
  BelongsToManySetAssociationsMixin,
} from "sequelize";
import sequelize from "../config/sequelize";
import Actor from "./actors.model";

interface MovieAttributes {
  id: number;
  title: string;
  normalizedTitle: string;
  year: number;
  format: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MovieCreationAttributes extends Optional<MovieAttributes, "id"> {}

class Movie
  extends Model<MovieAttributes, MovieCreationAttributes>
  implements MovieAttributes
{
  public id!: number;
  public title!: string;
  public normalizedTitle!: string;
  public year!: number;
  public format!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public setActors!: BelongsToManySetAssociationsMixin<Actor, number>;
}

Movie.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    normalizedTitle: {
      type: new DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    year: {
      type: new DataTypes.INTEGER(),
      allowNull: false,
    },
    format: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "movies",
    defaultScope: {
      attributes: { exclude: ["normalizedTitle"] },
    },
    timestamps: true,
  }
);

export default Movie;
