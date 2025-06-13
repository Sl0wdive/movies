import sequelize from "../config/sequelize";
import { Op } from "sequelize";
import Movie from "../models/movie.model";
import Actor from "../models/actors.model";
import MovieActor from "../models/movie.actor.model";
import fs from "fs";

function parseMovieFile(content) {
  return content
    .split("\n\n")
    .filter((block) => block.trim() !== "")
    .map((block) => {
      const lines = block.split("\n");
      return {
        title: lines
          .find((l) => l.startsWith("Title:"))
          .replace("Title:", "")
          .trim(),
        releaseYear: parseInt(
          lines
            .find((l) => l.startsWith("Release Year:"))
            .replace("Release Year:", "")
            .trim()
        ),
        format: lines
          .find((l) => l.startsWith("Format:"))
          .replace("Format:", "")
          .trim(),
        stars: lines
          .find((l) => l.startsWith("Stars:"))
          .replace("Stars:", "")
          .split(",")
          .map((s) => s.trim()),
      };
    });
}

async function processMovieImport(moviesData, transaction) {
  const importedMovies = [];

  for (const movieData of moviesData) {
    const [movie] = await Movie.findOrCreate({
      where: {
        title: movieData.title,
        year: movieData.releaseYear,
        format: movieData.format,
      },
      transaction,
    });

    await Promise.all(
      movieData.stars.map(async (actorName) => {
        const [actor] = await Actor.findOrCreate({
          where: { name: actorName },
          transaction,
        });

        await MovieActor.findOrCreate({
          where: { MovieId: movie.id, ActorId: actor.id },
          transaction,
        });
      })
    );

    importedMovies.push(movie);
  }

  return {
    data: importedMovies,
    meta: { imported: importedMovies.length, total: moviesData.length },
  };
}

export const createMovie = async (
  data,
  transaction
): Promise<Movie | { error: string }> => {
  const { title, year, format, actors } = data;

  const existingMovie = await Movie.findOne({
    where: { title },
    transaction,
  });

  if (existingMovie) {
    await transaction.rollback();
    return { error: "Movie already exists." };
  }

  const newMovie = await Movie.create(
    {
      title,
      year,
      format,
    },
    { transaction }
  );

  const actorInstances = await Promise.all(
    actors.map(async (name) => {
      const [actor] = await Actor.findOrCreate({
        where: { name },
        defaults: { name },
        transaction,
      });
      return actor;
    })
  );

  await newMovie.setActors(actorInstances, {
    transaction,
  });
  return await Movie.findByPk(newMovie.id, {
    include: [{ model: Actor, through: { attributes: [] } }],
    transaction,
  });
};

export const getMovieById = async (id) => {
  return await Movie.findByPk(id, {
    include: [{ model: Actor, through: { attributes: [] } }],
  });
};

export const listMovies = async (query) => {
  const {
    sort = "id",
    order = "ASC",
    limit = 20,
    offset = 0,
    actor,
    title,
    search,
  } = query;

  const where: any = {};
  const include: any = [];

  if (title) {
    where.title = { [Op.like]: `%${title}%` };
  }

  if (actor) {
    include.push({
      model: Actor,
      where: { name: { [Op.like]: `%${actor}%` } },
      through: { attributes: [] },
      required: true,
    });
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { "$actors.name$": { [Op.like]: `%${search}%` } },
    ];
    include.push({
      model: Actor,
      through: { attributes: [] },
      required: false,
    });
  }

  return await Movie.findAndCountAll({
    where,
    include,
    order: [[sort, order]],
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true,
  });
};

export const deleteMovie = async (id, transaction) => {
  await MovieActor.destroy({ where: { MovieId: id }, transaction });
  const movie = await Movie.findByPk(id, { transaction });
  if (!movie) return null;

  await movie.destroy({ transaction });
  return true;
};

export const updateMovie = async (id, data, transaction) => {
  const { title, year, format, actors } = data;

  const movie = await Movie.findByPk(id, { transaction });
  if (!movie) return null;

  await movie.update({ title, year, format }, { transaction });

  if (Array.isArray(actors)) {
    await MovieActor.destroy({ where: { MovieId: id }, transaction });

    const actorInstances = await Promise.all(
      actors.map(async (name) => {
        const [actor] = await Actor.findOrCreate({
          where: { name },
          transaction,
        });
        return actor;
      })
    );

    await movie.setActors(actorInstances, { transaction });
  }

  return await Movie.findByPk(id, {
    include: [{ model: Actor, through: { attributes: [] } }],
    transaction,
  });
};

export const importMoviesService = async (content, filePath, transaction) => {
  const moviesData = parseMovieFile(content);
  const results = await processMovieImport(moviesData, transaction);
  fs.unlinkSync(filePath);
  return results;
};
