
import { Router } from "express";

import {
    getFaqs,
    createFaq,
    updateFaq,
    deleteFaq
} from "../controllers/faqController.js";

import { verifyToken } from "../middlewares/verifyToken.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = Router();

// Chỉ Admin có quyền truy cập CRUD FAQs
router.use(verifyToken, requireAdmin);

router.get("/", getFaqs);
router.post("/", createFaq);
router.put("/:id", updateFaq);
router.delete("/:id", deleteFaq);

export default router;
