import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface ActorAttributes {
  id: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ActorCreationAttributes extends Optional<ActorAttributes, "id"> {}

class Actor
  extends Model<ActorAttributes, ActorCreationAttributes>
  implements ActorAttributes
{
  public id!: number;
  public name!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Actor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "actors",
    timestamps: true,
  }
);

export default Actor;
