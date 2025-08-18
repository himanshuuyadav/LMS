import mongoose from "mongoose";
import { z } from "zod";
import Employee from "../models/Employee.js";
import LeaveRequest from "../models/LeaveRequest.js";
import LeaveLedger from "../models/LeaveLedger.js";
import { parseISODate, diffDaysInclusive, sameYear, todayUTCDateOnly, formatISODate } from "../utils/dates.js";
import { getBalance } from "../utils/balance.js";

const applySchema = z.object({
  employeeId: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).optional()
});

export const applyLeave = async (req, res, next) => {
  try {
    const payload = applySchema.parse(req.body);
    if (!mongoose.isValidObjectId(payload.employeeId)) { res.status(400); throw new Error("Invalid employeeId"); }

    const employee = await Employee.findById(payload.employeeId);
    if (!employee || employee.employmentStatus !== "Active") {
      res.status(404); throw new Error("Employee not found or inactive");
    }

    const start = parseISODate(payload.startDate);
    const end = parseISODate(payload.endDate);
    if (!start || !end) { res.status(400); throw new Error("Invalid date(s). Use YYYY-MM-DD"); }
    if (end < start) { res.status(422); throw new Error("End date cannot be before start date"); }
    if (!sameYear(start, end)) { res.status(422); throw new Error("Cross-year requests not allowed in MVP"); }

    // Backdated policy: disallow
    const today = todayUTCDateOnly();
    if (start < today) { res.status(422); throw new Error("Backdated requests are not allowed"); }

    // Joining date policy
    if (start < employee.joiningDate) { res.status(422); throw new Error("Cannot apply before joining date"); }

    // Overlap with Pending/Approved
    const overlap = await LeaveRequest.exists({
      employeeId: employee._id,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: end },
      endDate: { $gte: start }
    });
    if (overlap) { res.status(409); throw new Error("Overlapping leave request exists"); }

    const daysRequested = diffDaysInclusive(start, end);

    // Conservative balance check (includes other pendings)
    const balance = await getBalance(employee._id, "conservative");
    if (balance.available < daysRequested) {
      res.status(422); throw new Error(`Insufficient balance. Available: ${balance.available}, Requested: ${daysRequested}`);
    }

    const reqDoc = await LeaveRequest.create({
      employeeId: employee._id,
      startDate: start,
      endDate: end,
      daysRequested,
      reason: payload.reason,
      status: "Pending"
    });

    res.status(201).json({
      id: reqDoc._id,
      employeeId: employee._id,
      startDate: formatISODate(reqDoc.startDate),
      endDate: formatISODate(reqDoc.endDate),
      daysRequested: reqDoc.daysRequested,
      status: reqDoc.status
    });
  } catch (err) { next(err); }
};

export const approveLeave = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { decidedBy, decisionNote } = req.body || {};

    const request = await LeaveRequest.findById(id).session(session);
    if (!request) { res.status(404); throw new Error("Leave request not found"); }
    if (request.status !== "Pending") { res.status(409); throw new Error("Request already decided"); }

    const employee = await Employee.findById(request.employeeId).session(session);
    if (!employee || employee.employmentStatus !== "Active") { res.status(404); throw new Error("Employee not found or inactive"); }

    // Re-check overlap with other (not this) pending/approved
    const overlap = await LeaveRequest.exists({
      _id: { $ne: request._id },
      employeeId: employee._id,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: request.endDate },
      endDate: { $gte: request.startDate }
    }).session(session);
    if (overlap) { res.status(409); throw new Error("Overlap detected on approval"); }

    // Re-check balance at approval time
    const balance = await getBalance(employee._id, "conservative");
    if (balance.available < request.daysRequested) {
      res.status(422); throw new Error(`Insufficient balance on approval. Available: ${balance.available}, Requested: ${request.daysRequested}`);
    }

    // Approve + deduct via ledger
    request.status = "Approved";
    request.decidedBy = decidedBy || "HR";
    request.decisionNote = decisionNote;
    request.decidedAt = new Date();
    await request.save({ session });

    await LeaveLedger.create([{
      employeeId: employee._id,
      source: "Approval",
      leaveRequestId: request._id,
      deltaDays: -request.daysRequested,
      note: "Deduct on approval"
    }], { session });

    await session.commitTransaction();
    res.json({
      id: request._id,
      status: request.status,
      daysRequested: request.daysRequested
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

export const rejectLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decidedBy, decisionNote } = req.body || {};

    const request = await LeaveRequest.findById(id);
    if (!request) { res.status(404); throw new Error("Leave request not found"); }
    if (request.status !== "Pending") { res.status(409); throw new Error("Request already decided"); }

    request.status = "Rejected";
    request.decidedBy = decidedBy || "HR";
    request.decisionNote = decisionNote;
    request.decidedAt = new Date();
    await request.save();

    res.json({ id: request._id, status: request.status });
  } catch (err) { next(err); }
};
