import express from 'express';
import checkAuth from '../utils/checkAuth';
import { create, getById, list, remove, update, importMovies } from '../controllers/movie.controller';
import { movieValidation, validateMovieFile } from '../utils/validation';
import { movieUpload } from '../utils/upload.middleware';
import handleValidationErrors from '../utils/handle.validation.errors';

const router = express.Router();

router.post('/movies', movieValidation, handleValidationErrors, checkAuth, create);
router.get('/movies/:id', checkAuth, getById);
router.get('/movies/', checkAuth, list);
router.delete('/movies/:id', checkAuth, remove);
router.patch('/movies/:id', movieValidation, handleValidationErrors, checkAuth, update);
router.post('/movies/import', checkAuth, movieUpload, validateMovieFile, importMovies)

export default router;