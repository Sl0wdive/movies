import Movie from "./movie.model";
import Actor from "./actors.model";
import MovieActor from "./movie.actor.model";

export default function setupAssociations() {
  Movie.belongsToMany(Actor, {
    through: MovieActor,
    foreignKey: "MovieId",
    otherKey: "ActorId",
    onDelete: "CASCADE",
    hooks: true,
  });

  Actor.belongsToMany(Movie, {
    through: MovieActor,
    foreignKey: "ActorId",
    otherKey: "MovieId",
    onDelete: "CASCADE",
    hooks: true,
  });
}
