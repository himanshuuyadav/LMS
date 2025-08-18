import { Router } from "express";
import {
  createEmployee,
  getEmployee,
  listEmployees,
  getLeaveBalanceForEmployee
} from "../controllers/employees.controller.js";

const router = Router();

router.post("/", createEmployee);
router.get("/", listEmployees);
router.get("/:id", getEmployee);
router.get("/:id/leave-balance", getLeaveBalanceForEmployee);

export default router;
