import sequelize from "../config/sequelize";
import { Op } from "sequelize";
import Movie from "../models/movie.model";
import Actor from "../models/actors.model";
import MovieActor from "../models/movie.actor.model";
import fs from "fs";

function parseMovieFile(content) {
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.substring(1);
  }

  return content
    .split(/\r?\n\s*\r?\n/)
    .filter((block) => block.trim() !== "")
    .map((block) => {
      const lines = block.split("\n").filter((line) => line.trim() !== "");

      const movie = {
        title: "",
        releaseYear: null,
        format: "",
        stars: [],
      };

      lines.forEach((line) => {
        const lowerLine = line.toLowerCase();

        if (lowerLine.startsWith("title:")) {
          movie.title = line.replace(/^title:\s*/i, "").trim();
        } else if (lowerLine.startsWith("release year:")) {
          const yearStr = line.replace(/^release year:\s*/i, "").trim();
          movie.releaseYear = parseInt(yearStr) || null;
        } else if (lowerLine.startsWith("format:")) {
          movie.format = line.replace(/^format:\s*/i, "").trim();
        } else if (lowerLine.startsWith("stars:")) {
          movie.stars = line
            .replace(/^stars:\s*/i, "")
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "");
        }
      });

      return movie;
    })
    .filter((movie) => movie.title);
}

async function processMovieImport(moviesData, transaction) {
  const importedMovies = [];

  for (const movieData of moviesData) {
    const rawTitle = movieData.title.trim();
    const normalizedTitle = rawTitle.toLowerCase();

    const [movie] = await Movie.findOrCreate({
      where: {
        normalizedTitle,
      },
      defaults: {
        title: rawTitle,
        normalizedTitle,
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

  const rawTitle = title.trim();
  const normalizedTitle = rawTitle.toLowerCase();

  const existingMovie = await Movie.findOne({
    where: { normalizedTitle },
    transaction,
  });

  if (existingMovie) {
    return { error: "Movie already exists." };
  }

  const newMovie = await Movie.create(
    {
      title,
      normalizedTitle,
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
    const normalizedTitle = title.trim().toLowerCase();
    where.normalizedTitle = { [Op.like]: `%${normalizedTitle}%` };
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

  const { count, rows: unsortedRows } = await Movie.findAndCountAll({
    where,
    include,
    order: sort === "title" ? [] : [[sort, order]],
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true,
  });

  let rows = unsortedRows;
  if (sort === "title") {
    rows = [...unsortedRows].sort((a, b) => {
      return (
        a.title.localeCompare(b.title, "uk-UA", { sensitivity: "base" }) *
        (order === "ASC" ? 1 : -1)
      );
    });
  }

  return {
    count,
    rows,
  };
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

  const rawTitle = title.trim();
  const normalizedTitle = rawTitle.toLowerCase();

  await movie.update({ title, normalizedTitle, year, format }, { transaction });

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