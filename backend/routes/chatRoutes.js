import { Router } from "express";
import { sendChatMessage, getChatHistory } from "../controllers/chatController.js";

const router = Router();

router.post("/message", sendChatMessage);
router.get("/history/:sessionId", getChatHistory);

export default router;