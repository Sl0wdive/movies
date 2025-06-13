import sequelize from "../config/sequelize";
import {
  createMovie,
  deleteMovie,
  getMovieById,
  listMovies,
  updateMovie,
  importMoviesService,
} from "../services/movie.service";
import fs from "fs";

export async function create(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const result = await createMovie(req.body, transaction);
    if ("error" in result) {
      await transaction.rollback();
      return res.status(409).json({ message: result.error, status: 0 });
    }
    await transaction.commit();
    return res.status(201).json({ data: result, status: 1 });
  } catch (err) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Error creating movie.", status: 0 });
  }
}

export async function getById(req, res) {
  try {
    const movie = await getMovieById(req.params.id);
    if (!movie)
      return res.status(404).json({ message: "Movie not found.", status: 0 });
    return res.status(200).json({ data: movie, status: 1 });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching movie.", status: 0 });
  }
}

export async function list(req, res) {
  try {
    const { count, rows } = await listMovies(req.query);
    return res
      .status(200)
      .json({ data: rows, meta: { total: count }, status: 1 });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching movies.", status: 0 });
  }
}

export async function remove(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const success = await deleteMovie(req.params.id, transaction);
    if (!success) {
      await transaction.rollback();
      return res.status(404).json({ message: "Movie not found.", status: 0 });
    }

    await transaction.commit();
    return res.status(200).json({ status: 1 });
  } catch (err) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Error deleting movie.", status: 0 });
  }
}

export async function update(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const updated = await updateMovie(req.params.id, req.body, transaction);
    if (!updated) {
      await transaction.rollback();
      return res.status(404).json({ message: "Movie not found.", status: 0 });
    }

    await transaction.commit();
    return res.status(200).json({ data: updated, status: 1 });
  } catch (err) {
    await transaction.rollback();
    return res
      .status(500)
      .json({ message: "Error updating movie.", status: 0 });
  }
}

export async function importMovies(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const result = await importMoviesService(
      req.movieFileContent,
      req.file.path,
      transaction
    );
    await transaction.commit();
    return res.status(200).json({ ...result, status: 1 });
  } catch (err) {
    await transaction.rollback();
    if (req.file) fs.unlinkSync(req.file.path);
    return res
      .status(500)
      .json({ message: "Error importing movie.", status: 0 });
  }
}
