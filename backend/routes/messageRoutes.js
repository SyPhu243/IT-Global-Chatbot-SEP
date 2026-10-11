import { Router } from "express";
import { sendMessage, getHistory } from "../controllers/messageController.js";

// mergeParams để đọc được :sessionId từ router cha
const router = Router({ mergeParams: true });

router.post("/", sendMessage);
router.get("/", getHistory);

export default router;