import { Router } from "express";
import { contactFormLimiter } from "../middlewares/rateLimiter.js";
import { submitContact } from "../controllers/contactController.js";
 
const router = Router();
 
// POST /api/contacts
router.post("/", contactFormLimiter, submitContact);
 
export default router;