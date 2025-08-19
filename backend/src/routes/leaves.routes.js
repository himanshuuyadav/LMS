import { Router } from "express";
import {
  applyLeave,
  approveLeave,
  rejectLeave,
  listLeaves
} from "../controllers/leaves.controller.js";
import { requireAuth, requireHR } from "../middleware/auth.js";

const router = Router();

// Any authenticated user can apply for leave
router.post("/apply", requireAuth, applyLeave);

// HR-only actions
router.patch("/:id/approve", requireAuth, requireHR, approveLeave);
router.patch("/:id/reject", requireAuth, requireHR, rejectLeave);

// HR-only reporting
router.get("/", requireAuth, requireHR, listLeaves);

export default router;
