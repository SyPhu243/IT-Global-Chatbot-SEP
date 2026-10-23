import { Router } from "express";
import { rateMessage } from "../controllers/messageController.js";

const router = Router();

router.patch("/:id/rate", rateMessage);

export default router;