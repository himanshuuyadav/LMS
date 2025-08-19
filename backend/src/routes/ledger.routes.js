import { Router } from "express";
import { listLedger } from "../controllers/ledger.controller.js";
import { requireAuth } from "../middleware/auth.js"; // only requireAuth now

const router = Router();

// HR can see all; Employee sees only their own (handled inside controller)
router.get("/", requireAuth, listLedger);

export default router;
