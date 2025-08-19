import { Router } from "express";
import {
  createEmployee,
  getEmployee,
  listEmployees,
  getLeaveBalanceForEmployee
} from "../controllers/employees.controller.js";
import { requireAuth, requireHR } from "../middleware/auth.js";

const router = Router();

// HR-only routes
router.post("/", requireAuth, requireHR, createEmployee);

// List employees: HR can see all with filters & pagination, Employee sees self only
router.get("/", requireAuth, listEmployees);

// HR or self routes
router.get("/:id", requireAuth, getEmployee); // Get employee details
router.get("/:id/balance", requireAuth, getLeaveBalanceForEmployee); // Get leave balance

export default router;
