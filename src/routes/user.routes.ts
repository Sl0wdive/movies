import express from "express";
import { userCreate, sessionCreate } from "../controllers/user.controller";
import { loginValidation, registerValidation } from "../utils/validation";
import handleValidationErrors from "../utils/handle.validation.errors";

const router = express.Router();

router.post("/users", registerValidation, handleValidationErrors, userCreate);
router.post("/sessions", loginValidation, handleValidationErrors, sessionCreate);

export default router;
