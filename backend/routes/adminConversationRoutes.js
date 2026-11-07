
import { Router } from "express";
import { getConversations } from "../controllers/adminConversationController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = Router();

router.get(
    "/conversations",
    verifyToken,
    requireAdmin,
    getConversations
);

export default router;
