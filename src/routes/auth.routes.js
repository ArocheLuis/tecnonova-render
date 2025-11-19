import { Router } from "express";
import { login, register, verify2FA } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-2fa", verify2FA); 

export default router;