import { Router } from "express";
import { applyLeave, approveLeave, rejectLeave } from "../controllers/leaves.controller.js";

const router = Router();

router.post("/apply", applyLeave);
router.patch("/:id/approve", approveLeave);
router.patch("/:id/reject", rejectLeave);

export default router;
