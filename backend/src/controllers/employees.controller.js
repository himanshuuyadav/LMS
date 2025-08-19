import { z } from "zod";
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import LeaveLedger from "../models/LeaveLedger.js";
import { parseISODate, formatISODate } from "../utils/dates.js";

import { getBalance } from "../utils/balance.js";

const createEmployeeSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  department: z.string().min(2).max(60),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// HR-only
export const createEmployee = async (req, res, next) => {
  try {
    const payload = createEmployeeSchema.parse(req.body);
    const joiningDate = parseISODate(payload.joiningDate);
    if (!joiningDate) {
      res.status(400);
      throw new Error("Invalid joiningDate. Expected YYYY-MM-DD");
    }

    const employee = await Employee.create({
      name: payload.name.trim(),
      email: payload.email.toLowerCase(),
      department: payload.department.trim(),
      joiningDate
    });

    // Initial grant
    await LeaveLedger.create({
      employeeId: employee._id,
      source: "InitialGrant",
      deltaDays: employee.initialLeaveBalance,
      note: "Initial yearly entitlement"
    });

    const balance = await getBalance(employee._id);
    res.status(201).json({
      id: employee._id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      joiningDate: formatISODate(employee.joiningDate),
      balance
    });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.email) {
      res.status(409);
      return next(new Error("Email already exists"));
    }
    next(err);
  }
};

// HR can view anyone, Employee can view self
export const getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) { res.status(400); throw new Error("Invalid employee id"); }

    // RBAC: Employee can only view self
    if (req.user.role !== "HR" && req.user.employeeId !== id) {
      return res.status(403).json({ message: "Forbidden: can only view your own record" });
    }

    const employee = await Employee.findById(id);
    if (!employee) { res.status(404); throw new Error("Employee not found"); }

    const balance = await getBalance(employee._id);
    res.json({
      id: employee._id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      joiningDate: formatISODate(employee.joiningDate),
      employmentStatus: employee.employmentStatus,
      balance
    });
  } catch (err) { next(err); }
};

// HR-only


export const listEmployees = async (req, res, next) => {
  try {
    let { department, employmentStatus, page = 1, limit = 20 } = req.query;

    // Safe integers
    page = Math.max(parseInt(page), 1);
    limit = Math.min(Math.max(parseInt(limit), 1), 100); // max 100 per page
    const skip = (page - 1) * limit;

    const query = {};

    // HR can filter by department or employmentStatus
    if (req.user.role === "HR") {
      if (department) query.department = department;
      if (employmentStatus) query.employmentStatus = employmentStatus;
    } else {
      // Employees can only view themselves
      query._id = req.user.employeeId;
    }

    const total = await Employee.countDocuments(query);

    const employees = await Employee.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const results = employees.map(e => ({
      id: e._id,
      name: e.name,
      email: e.email,
      department: e.department,
      joiningDate: formatISODate(e.joiningDate),
      employmentStatus: e.employmentStatus
    }));

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      results
    });
  } catch (err) {
    next(err);
  }
};


// HR can view anyone, Employee can view self
export const getLeaveBalanceForEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400);
      throw new Error("Invalid employee id");
    }

    // RBAC: Employee can only view self
    if (req.user.role !== "HR" && req.user.employeeId !== id) {
      return res.status(403).json({ message: "Forbidden: can only view your own balance" });
    }

    const emp = await Employee.findById(id);
    if (!emp) {
      res.status(404);
      throw new Error("Employee not found");
    }

    const balance = await getBalance(emp._id);
    res.json(balance);
  } catch (err) {
    next(err);
  }
};

