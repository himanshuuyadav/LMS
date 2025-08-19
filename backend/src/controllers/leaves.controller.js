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



export const listLeaves = async (req, res, next) => {
  try {
    let { employeeId, department, status, from, to, page = 1, limit = 20 } = req.query;

    // Ensure safe integers
    page = Math.max(parseInt(page), 1);
    limit = Math.min(Math.max(parseInt(limit), 1), 100); // max 100 per page
    const skip = (page - 1) * limit;

    const query = {};

    // RBAC: Employees see only their own leaves
    if (req.user.role === "Employee") {
      employeeId = req.user.employeeId;
    }

    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;

    // Date filtering
    if (from || to) {
      query.startDate = {};
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate)) return res.status(400).json({ message: "Invalid from date" });
        query.startDate.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate)) return res.status(400).json({ message: "Invalid to date" });
        query.startDate.$lte = toDate;
      }
    }

    let leaves = [], total = 0;

    if (department) {
      // Aggregate for department filtering
      const pipeline = [
        { $lookup: { from: "employees", localField: "employeeId", foreignField: "_id", as: "emp" } },
        { $unwind: "$emp" },
        { $match: { "emp.department": department, ...query } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ];
      leaves = await LeaveRequest.aggregate(pipeline);

      const countPipeline = [
        { $lookup: { from: "employees", localField: "employeeId", foreignField: "_id", as: "emp" } },
        { $unwind: "$emp" },
        { $match: { "emp.department": department, ...query } },
        { $count: "count" }
      ];
      total = (await LeaveRequest.aggregate(countPipeline))[0]?.count || 0;

    } else {
      // Normal query
      total = await LeaveRequest.countDocuments(query);
      leaves = await LeaveRequest.find(query)
        .populate(req.user.role === "HR" ? "employeeId" : "") // populate employee only for HR
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    // Map results
    const results = leaves.map(l => ({
      id: l._id,
      employee: l.employeeId ? {
        id: l.employeeId._id,
        name: l.employeeId.name,
        email: l.employeeId.email,
        department: l.employeeId.department
      } : null,
      startDate: l.startDate,
      endDate: l.endDate,
      daysRequested: l.daysRequested,
      status: l.status,
      reason: l.reason,
      decidedBy: l.decidedBy,
      decidedAt: l.decidedAt,
      decisionNote: l.decisionNote
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
