import { Router } from "express";
import { startSession } from "../controllers/sessionController.js";
import messageRoutes from "./messageRoutes.js";

const router = Router();

router.post("/", startSession);
router.use("/:sessionId/messages", messageRoutes);

export default router;