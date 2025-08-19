import mongoose from "mongoose";
import LeaveLedger from "../models/LeaveLedger.js";
import Employee from "../models/Employee.js";

export const listLedger = async (req, res, next) => {
  try {
    const { employeeId: queryEmployeeId, page = 1, limit = 20 } = req.query;
    const query = {};

    // RBAC: Employees can only see their own ledger
    let employeeId = queryEmployeeId;
    if (req.user.role === "Employee") {
      if (!req.user.employeeId) {
        return res.status(403).json({ message: "User not linked to an employee record" });
      }
      employeeId = req.user.employeeId;
    }

    if (employeeId) {
      if (!mongoose.isValidObjectId(employeeId)) {
        return res.status(400).json({ message: "Invalid employeeId" });
      }
      query.employeeId = employeeId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const docs = await LeaveLedger.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("employeeId", "name email department");

    const total = await LeaveLedger.countDocuments(query);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      results: docs.map(d => ({
        id: d._id,
        employee: d.employeeId
          ? {
              id: d.employeeId._id,
              name: d.employeeId.name,
              email: d.employeeId.email,
              department: d.employeeId.department
            }
          : null,
        source: d.source,
        leaveRequestId: d.leaveRequestId,
        deltaDays: d.deltaDays,
        note: d.note,
        createdAt: d.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
};
